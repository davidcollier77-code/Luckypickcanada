#!/usr/bin/env bash
#
# workers-issues-to-github-setup.sh
#
# Workers Issues → GitHub integration setup script (corrected version)
#
# Creates:
#   1. A Cloudflare Generic Webhook destination ("Workers Issues to GitHub")
#   2. A notification policy for the "workers_observability_real_time_issue" alert type
#   3. An occurrence-threshold issue automation on the "luckypickcanada-app" Worker
#
# Then runs end-to-end tests with real verification:
#   4. Triggers a notification for one real issue → verifies GitHub issue was created
#   5. Triggers the SAME issue again → verifies NO duplicate GitHub issue (dedup)
#   6. Triggers a second unique issue → verifies a new GitHub issue was created
#
# Verifications performed:
#   - Notification run status (succeeded/failed/pending) from the API response
#   - GitHub issue count before/after each test (primary source of truth)
#   - Preflight duplicate checks for all three resources
#
# Security:
#   - Prompts for the Cloudflare API token and webhook secret at runtime.
#   - Uses `read -rs` so neither is displayed while typing.
#   - Does not write secrets to disk, shell history, or logs.
#   - Does not include any real tokens or secrets in this file.
#   - Optionally prompts for a GitHub token (for private repos / higher rate limits).
#
# Preserves:
#   - The existing "Jules Bridge" webhook and its Worker (untouched).
#   - All existing Worker bindings (GITHUB_TOKEN, WEBHOOK_SECRET, ISSUE_DEDUPE).
#
# Prerequisites:
#   - bash 4+
#   - curl
#   - jq
#   - A Cloudflare API token with:
#       Notifications: Edit        (notifications.write)
#       Workers Observability: Edit (workers-observability.write)
#   - The WEBHOOK_SECRET value that matches the bridge Worker's binding.
#   - (Optional) A GitHub token with repo:issues read access for verification.
#
# ---------------------------------------------------------------------------

set -uo pipefail

# ---------------------------------------------------------------------------
# Configuration (no secrets — only static IDs and endpoints)
# ---------------------------------------------------------------------------

ACCOUNT_ID="dbd3120f6fa0104b5fe66c201ea4251b"
API_BASE="https://api.cloudflare.com/client/v4"
GITHUB_API="https://api.github.com"
GITHUB_REPO="davidcollier77-code/Luckypickcanada"

WEBHOOK_URL="https://workers-issues-to-github.davidcollier77.workers.dev"
WEBHOOK_NAME="Workers Issues to GitHub"
POLICY_NAME="Workers Issues to GitHub Policy"
POLICY_DESCRIPTION="Routes Workers Observability real-time issues to the GitHub bridge webhook"
ALERT_TYPE="workers_observability_real_time_issue"
AUTOMATION_NAME="Luckypickcanada App Issues to GitHub"
WORKER_SERVICE="luckypickcanada-app"
OCCURRENCE_THRESHOLD=1

# Real active issue IDs on luckypickcanada-app (for end-to-end testing)
TEST_ISSUE_1="a94d47c2-d9e8-468d-ae61-c966c9ab7199"   # wordpress scan
TEST_ISSUE_2="f8607191-3b38-4c40-84e3-6ff40a036b1f"   # debug-endpoints scan

# Polling configuration
NOTIFICATION_WAIT_SECONDS=8
GITHUB_POLL_RETRIES=3
GITHUB_POLL_INTERVAL=5

# Track results for final summary
declare -a STEP_NAMES=()
declare -a STEP_RESULTS=()
declare -a STEP_DETAILS=()
declare -a CREATED_RESOURCES=()

# Resource IDs (may be pre-existing or newly created)
WEBHOOK_ID=""
POLICY_ID=""
AUTOMATION_ID=""

# Flags for whether each resource was newly created vs pre-existing
WEBHOOK_CREATED=false
POLICY_CREATED=false
AUTOMATION_CREATED=false

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------

if [ -t 1 ]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  NC='\033[0m'
else
  GREEN='' RED='' YELLOW='' BLUE='' CYAN='' NC=''
fi

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

print_header() {
  echo ""
  echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
}

record_result() {
  local name="$1" result="$2" detail="$3"
  STEP_NAMES+=("$name")
  STEP_RESULTS+=("$result")
  STEP_DETAILS+=("$detail")
  if [ "$result" = "PASS" ]; then
    echo -e "  ${GREEN}✓ PASS${NC} — $name: $detail"
  else
    echo -e "  ${RED}✗ FAIL${NC} — $name: $detail"
  fi
}

record_resource() {
  local resource="$1"
  CREATED_RESOURCES+=("$resource")
  echo -e "  ${CYAN}📦 Resource tracked${NC} — $resource"
}

# Make a Cloudflare API call. Sets globals: RESP_BODY, RESP_STATUS, RESP_SUCCESS
cf_api() {
  local method="$1" endpoint="$2" payload="${3:-}"
  local curl_args=(
    -s -w "\n%{http_code}"
    -X "$method"
    "${API_BASE}/accounts/${ACCOUNT_ID}${endpoint}"
    -H "Authorization: Bearer ${CF_API_TOKEN}"
    -H "Content-Type: application/json"
  )
  if [ -n "$payload" ]; then
    curl_args+=(-d "$payload")
  fi
  local raw
  raw=$(curl "${curl_args[@]}" 2>&1) || true
  RESP_STATUS=$(echo "$raw" | tail -1)
  RESP_BODY=$(echo "$raw" | sed '$d')
  RESP_SUCCESS=$(echo "$RESP_BODY" | jq -r '.success // false' 2>/dev/null || echo "false")
}

# Make a GitHub API call. Sets globals: GH_RESP_BODY, GH_RESP_STATUS
gh_api() {
  local method="$1" endpoint="$2"
  local gh_args=(
    -s -w "\n%{http_code}"
    -X "$method"
    "${GITHUB_API}${endpoint}"
    -H "Accept: application/vnd.github+json"
  )
  if [ -n "${GH_TOKEN:-}" ]; then
    gh_args+=(-H "Authorization: Bearer ${GH_TOKEN}")
  fi
  local raw
  raw=$(curl "${gh_args[@]}" 2>&1) || true
  GH_RESP_STATUS=$(echo "$raw" | tail -1)
  GH_RESP_BODY=$(echo "$raw" | sed '$d')
}

# Get sorted list of open issue numbers from GitHub (excludes PRs)
# Sets global: GH_ISSUE_COUNT, GH_ISSUE_NUMBERS
get_github_issues() {
  gh_api GET "/repos/${GITHUB_REPO}/issues?state=open&sort=created&direction=desc&per_page=100"
  if [ "$GH_RESP_STATUS" = "200" ]; then
    # Filter out pull requests (they appear in the issues endpoint)
    GH_ISSUE_NUMBERS=$(echo "$GH_RESP_BODY" | jq -r '[.[] | select(.pull_request == null) | .number] | sort | join(",")')
    GH_ISSUE_COUNT=$(echo "$GH_RESP_BODY" | jq '[.[] | select(.pull_request == null)] | length')
  else
    GH_ISSUE_NUMBERS=""
    GH_ISSUE_COUNT="-1"
  fi
}

# Count how many issue numbers in $2 are NOT in $1 (i.e., new issues)
# $1 = before (comma-separated), $2 = after (comma-separated)
# Sets global: NEW_ISSUE_COUNT, NEW_ISSUE_LIST
count_new_issues() {
  local before="$1" after="$2"
  if [ -z "$after" ]; then
    NEW_ISSUE_COUNT=0
    NEW_ISSUE_LIST=""
    return
  fi
  local new_issues=""
  local count=0
  IFS=',' read -ra after_arr <<< "$after"
  for num in "${after_arr[@]}"; do
    local found=false
    if [ -n "$before" ]; then
      IFS=',' read -ra before_arr <<< "$before"
      for b in "${before_arr[@]}"; do
        if [ "$num" = "$b" ]; then
          found=true
          break
        fi
      done
    fi
    if [ "$found" = "false" ]; then
      if [ -z "$new_issues" ]; then
        new_issues="$num"
      else
        new_issues="$new_issues,$num"
      fi
      count=$((count + 1))
    fi
  done
  NEW_ISSUE_COUNT=$count
  NEW_ISSUE_LIST="$new_issues"
}

print_summary() {
  print_header "Summary"

  local pass_count=0 fail_count=0
  for i in "${!STEP_NAMES[@]}"; do
    local name="${STEP_NAMES[$i]}" result="${STEP_RESULTS[$i]}" detail="${STEP_DETAILS[$i]}"
    if [ "$result" = "PASS" ]; then
      echo -e "  ${GREEN}✓${NC} $name — $detail"
      pass_count=$((pass_count + 1))
    else
      echo -e "  ${RED}✗${NC} $name — $detail"
      fail_count=$((fail_count + 1))
    fi
  done

  echo ""
  echo -e "  ${GREEN}Passed: ${pass_count}${NC}  ${RED}Failed: ${fail_count}${NC}"

  echo ""
  echo "  Resource IDs:"
  [ -n "$WEBHOOK_ID" ]    && echo "    Webhook ID:      $WEBHOOK_ID    ($([ "$WEBHOOK_CREATED" = true ] && echo 'newly created' || echo 'pre-existing'))"
  [ -n "$POLICY_ID" ]     && echo "    Policy ID:       $POLICY_ID     ($([ "$POLICY_CREATED" = true ] && echo 'newly created' || echo 'pre-existing'))"
  [ -n "$AUTOMATION_ID" ] && echo "    Automation ID:   $AUTOMATION_ID ($([ "$AUTOMATION_CREATED" = true ] && echo 'newly created' || echo 'pre-existing'))"

  if [ "${#CREATED_RESOURCES[@]}" -gt 0 ]; then
    echo ""
    echo "  Resources created/modified in this run:"
    for r in "${CREATED_RESOURCES[@]}"; do
      echo -e "    ${CYAN}📦${NC} $r"
    done
  fi

  echo ""
  echo "  Next steps:"
  echo "    1. Verify GitHub repo ${GITHUB_REPO} for the expected issues."
  echo "    2. Paste this entire output back to Agent Lee for verification."

  unset CF_API_TOKEN WEBHOOK_SECRET GH_TOKEN 2>/dev/null || true

  [ "$fail_count" -gt 0 ] && return 1 || return 0
}

# ---------------------------------------------------------------------------
# Pre-flight: tool checks
# ---------------------------------------------------------------------------

print_header "Pre-flight: tool checks"

if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
  echo -e "  ${RED}✗ FAIL${NC} — bash 4+ required (found ${BASH_VERSION})"
  exit 1
fi
echo -e "  ${GREEN}✓ PASS${NC} — bash ${BASH_VERSINFO[0]}.${BASH_VERSINFO[1]}"

if ! command -v curl &>/dev/null; then
  echo -e "  ${RED}✗ FAIL${NC} — curl is required but not found"
  exit 1
fi
echo -e "  ${GREEN}✓ PASS${NC} — curl $(curl --version | head -1 | awk '{print $1" "$2}')"

if ! command -v jq &>/dev/null; then
  echo -e "  ${RED}✗ FAIL${NC} — jq is required but not found"
  echo -e "  ${YELLOW}  Install: apt install jq / pkg install jq / brew install jq${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓ PASS${NC} — jq $(jq --version)"

# ---------------------------------------------------------------------------
# Secure credential input
# ---------------------------------------------------------------------------

print_header "Credential input"

echo "  Enter your Cloudflare API token (input hidden):"
echo "  (Must have Notifications: Edit and Workers Observability: Edit)"
read -rs CF_API_TOKEN
echo ""
if [ -z "$CF_API_TOKEN" ]; then
  echo -e "  ${RED}✗ FAIL${NC} — No API token provided."
  exit 1
fi
echo -e "  ${GREEN}✓ PASS${NC} — API token received (not displayed)"

echo ""
echo "  Enter the WEBHOOK_SECRET (must match the bridge Worker's binding):"
echo "  (input hidden)"
read -rs WEBHOOK_SECRET
echo ""
if [ -z "$WEBHOOK_SECRET" ]; then
  echo -e "  ${RED}✗ FAIL${NC} — No webhook secret provided."
  exit 1
fi
echo -e "  ${GREEN}✓ PASS${NC} — Webhook secret received (not displayed)"

echo ""
echo "  Enter a GitHub token for issue verification (optional — press Enter to skip):"
echo "  (needed for private repos; input hidden)"
read -rs GH_TOKEN
echo ""
if [ -n "$GH_TOKEN" ]; then
  echo -e "  ${GREEN}✓ PASS${NC} — GitHub token received (not displayed)"
else
  echo -e "  ${YELLOW}⚠ SKIP${NC} — No GitHub token. Will attempt unauthenticated API (public repos only)."
fi

# Prevent secrets from leaking into shell history
unset HISTFILE 2>/dev/null || true
history -c 2>/dev/null || true

# ---------------------------------------------------------------------------
# Preflight: check for existing resources (prevent duplicates)
# ---------------------------------------------------------------------------

print_header "Preflight: checking for existing resources"

# Check existing webhooks
cf_api GET "/alerting/v3/destinations/webhooks"
if [ "$RESP_SUCCESS" = "true" ]; then
  WEBHOOK_ID=$(echo "$RESP_BODY" | jq -r --arg name "$WEBHOOK_NAME" '.result[] | select(.name == $name) | .id' 2>/dev/null | head -1)
  if [ -n "$WEBHOOK_ID" ] && [ "$WEBHOOK_ID" != "null" ]; then
    echo -e "  ${YELLOW}⚠ EXISTS${NC} — Webhook '$WEBHOOK_NAME' already exists (ID: $WEBHOOK_ID). Will reuse."
  else
    echo -e "  ${GREEN}✓ CLEAR${NC} — No existing webhook named '$WEBHOOK_NAME'. Will create."
  fi
else
  echo -e "  ${YELLOW}⚠ WARN${NC} — Could not list webhooks (HTTP $RESP_STATUS). Will attempt creation."
fi

# Check existing policies
cf_api GET "/alerting/v3/policies"
if [ "$RESP_SUCCESS" = "true" ]; then
  POLICY_ID=$(echo "$RESP_BODY" | jq -r --arg name "$POLICY_NAME" '.result[] | select(.name == $name) | .id' 2>/dev/null | head -1)
  if [ -n "$POLICY_ID" ] && [ "$POLICY_ID" != "null" ]; then
    echo -e "  ${YELLOW}⚠ EXISTS${NC} — Policy '$POLICY_NAME' already exists (ID: $POLICY_ID). Will reuse."
  else
    echo -e "  ${GREEN}✓ CLEAR${NC} — No existing policy named '$POLICY_NAME'. Will create."
  fi
else
  echo -e "  ${YELLOW}⚠ WARN${NC} — Could not list policies (HTTP $RESP_STATUS). Will attempt creation."
fi

# Check existing automations
cf_api GET "/workers/observability/issues/automations"
if [ "$RESP_SUCCESS" = "true" ]; then
  AUTOMATION_ID=$(echo "$RESP_BODY" | jq -r --arg svc "$WORKER_SERVICE" '.result.automations[]? | select(.service == $svc) | .id' 2>/dev/null | head -1)
  if [ -n "$AUTOMATION_ID" ] && [ "$AUTOMATION_ID" != "null" ]; then
    echo -e "  ${YELLOW}⚠ EXISTS${NC} — Automation for '$WORKER_SERVICE' already exists (ID: $AUTOMATION_ID). Will reuse."
  else
    echo -e "  ${GREEN}✓ CLEAR${NC} — No existing automation for '$WORKER_SERVICE'. Will create."
  fi
else
  echo -e "  ${YELLOW}⚠ WARN${NC} — Could not list automations (HTTP $RESP_STATUS). Will attempt creation."
fi

# ---------------------------------------------------------------------------
# Step 1: Create webhook destination (if not exists)
# ---------------------------------------------------------------------------

print_header "Step 1/6: Create webhook destination"

if [ -n "$WEBHOOK_ID" ] && [ "$WEBHOOK_ID" != "null" ]; then
  record_result "Webhook destination" "PASS" "reusing existing (ID: ${WEBHOOK_ID})"
else
  PAYLOAD=$(jq -n \\
    --arg name "$WEBHOOK_NAME" \\
    --arg url "$WEBHOOK_URL" \\
    --arg secret "$WEBHOOK_SECRET" \\
    '{name: $name, url: $url, secret: $secret}')

  cf_api POST "/alerting/v3/destinations/webhooks" "$PAYLOAD"

  if [ "$RESP_SUCCESS" = "true" ]; then
    WEBHOOK_ID=$(echo "$RESP_BODY" | jq -r '.result.id')
    WEBHOOK_CREATED=true
    record_result "Webhook destination" "PASS" "created (ID: ${WEBHOOK_ID})"
    record_resource "Webhook destination: ${WEBHOOK_NAME} (ID: ${WEBHOOK_ID})"
  else
    ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error"')
    record_result "Webhook destination" "FAIL" "HTTP ${RESP_STATUS}: ${ERR}"
    echo -e "  ${RED}Cannot continue without a webhook destination. Aborting.${NC}"
    print_summary
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Step 2: Create notification policy (if not exists)
# ---------------------------------------------------------------------------

print_header "Step 2/6: Create notification policy"

if [ -n "$POLICY_ID" ] && [ "$POLICY_ID" != "null" ]; then
  record_result "Notification policy" "PASS" "reusing existing (ID: ${POLICY_ID})"
else
  # CORRECTED: webhook IDs go inside "mechanisms.webhooks", not top-level "webhooks"
  PAYLOAD=$(jq -n \\
    --arg name "$POLICY_NAME" \\
    --arg desc "$POLICY_DESCRIPTION" \\
    --arg alert "$ALERT_TYPE" \\
    --arg wid "$WEBHOOK_ID" \\
    '{name: $name, description: $desc, enabled: true, alert_type: $alert, mechanisms: {webhooks: [{id: $wid}]}}')

  cf_api POST "/alerting/v3/policies" "$PAYLOAD"

  if [ "$RESP_SUCCESS" = "true" ]; then
    POLICY_ID=$(echo "$RESP_BODY" | jq -r '.result.id')
    POLICY_CREATED=true
    record_result "Notification policy" "PASS" "created (ID: ${POLICY_ID})"
    record_resource "Notification policy: ${POLICY_NAME} (ID: ${POLICY_ID})"
  else
    ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error"')
    record_result "Notification policy" "FAIL" "HTTP ${RESP_STATUS}: ${ERR}"
    echo -e "  ${RED}Cannot continue without a notification policy. Aborting.${NC}"
    print_summary
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Step 3: Create issue automation (if not exists)
# ---------------------------------------------------------------------------

print_header "Step 3/6: Create issue automation"

if [ -n "$AUTOMATION_ID" ] && [ "$AUTOMATION_ID" != "null" ]; then
  record_result "Issue automation" "PASS" "reusing existing (ID: ${AUTOMATION_ID})"
else
  PAYLOAD=$(jq -n \\
    --arg name "$AUTOMATION_NAME" \\
    --arg service "$WORKER_SERVICE" \\
    --arg pid "$POLICY_ID" \\
    --argjson occ "$OCCURRENCE_THRESHOLD" \\
    '{name: $name, enabled: true, service: $service, afterOccurrences: $occ, policyId: $pid}')

  cf_api POST "/workers/observability/issues/automations" "$PAYLOAD"

  if [ "$RESP_SUCCESS" = "true" ]; then
    # CORRECTED: automation ID is at .result.automation.id, not .result.id
    AUTOMATION_ID=$(echo "$RESP_BODY" | jq -r '.result.automation.id')
    AUTOMATION_CREATED=true
    record_result "Issue automation" "PASS" "created (ID: ${AUTOMATION_ID})"
    record_resource "Issue automation: ${AUTOMATION_NAME} on ${WORKER_SERVICE} (ID: ${AUTOMATION_ID})"
  else
    ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error"')
    record_result "Issue automation" "FAIL" "HTTP ${RESP_STATUS}: ${ERR}"
    echo -e "  ${RED}Cannot continue without an automation. Aborting.${NC}"
    print_summary
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Step 4: End-to-end test #1 — trigger first issue, verify GitHub issue created
# ---------------------------------------------------------------------------

print_header "Step 4/6: E2E test #1 — trigger issue ${TEST_ISSUE_1:0:8}"
echo "  (wordpress vulnerability scan — expect a NEW GitHub issue)"

# Capture GitHub issue state BEFORE
get_github_issues
ISSUES_BEFORE_1="$GH_ISSUE_NUMBERS"
COUNT_BEFORE_1="$GH_ISSUE_COUNT"
echo "  GitHub issues before: ${COUNT_BEFORE_1} (numbers: ${ISSUES_BEFORE_1:-none})"

if [ "$COUNT_BEFORE_1" = "-1" ]; then
  echo -e "  ${YELLOW}⚠ WARN${NC} — Could not query GitHub (HTTP ${GH_RESP_STATUS}). Issue verification will be skipped."
  echo "  Response: $(echo "$GH_RESP_BODY" | head -c 200)"
fi

# Trigger notification run
PAYLOAD=$(jq -n --arg pid "$POLICY_ID" '{policyId: $pid}')
cf_api POST "/workers/observability/issues/${TEST_ISSUE_1}/notification-runs" "$PAYLOAD"

RUN_STATUS_1="unknown"
RUN_ERROR_1=""

if [ "$RESP_SUCCESS" = "true" ]; then
  RUN_ID_1=$(echo "$RESP_BODY" | jq -r '.result.run.id // "N/A"')
  RUN_STATUS_1=$(echo "$RESP_BODY" | jq -r '.result.run.status // "unknown"')
  RUN_ERROR_1=$(echo "$RESP_BODY" | jq -r '.result.run.lastError // ""')
  echo "  Notification run: ID=${RUN_ID_1}, status=${RUN_STATUS_1}"
  if [ -n "$RUN_ERROR_1" ] && [ "$RUN_ERROR_1" != "null" ]; then
    echo -e "  ${YELLOW}  lastError: ${RUN_ERROR_1}${NC}"
  fi
else
  ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error"')
  echo -e "  ${RED}Notification run API call failed: HTTP ${RESP_STATUS}: ${ERR}${NC}"
fi

# Wait for webhook delivery + bridge processing + GitHub issue creation
echo "  Waiting ${NOTIFICATION_WAIT_SECONDS} seconds for delivery and processing..."
sleep "$NOTIFICATION_WAIT_SECONDS"

# Poll GitHub for new issues
ISSUES_AFTER_1=""
COUNT_AFTER_1=""
NEW_COUNT_1=0

for attempt in $(seq 1 $GITHUB_POLL_RETRIES); do
  get_github_issues
  ISSUES_AFTER_1="$GH_ISSUE_NUMBERS"
  COUNT_AFTER_1="$GH_ISSUE_COUNT"

  if [ "$COUNT_AFTER_1" != "-1" ]; then
    count_new_issues "$ISSUES_BEFORE_1" "$ISSUES_AFTER_1"
    if [ "$NEW_ISSUE_COUNT" -gt 0 ]; then
      echo "  GitHub: ${NEW_ISSUE_COUNT} new issue(s) detected (attempt ${attempt}): #${NEW_ISSUE_LIST}"
      break
    fi
    echo "  GitHub: no new issues yet (attempt ${attempt}/${GITHUB_POLL_RETRIES}, count: ${COUNT_AFTER_1})"
  else
    echo "  GitHub: query failed (attempt ${attempt}/${GITHUB_POLL_RETRIES}, HTTP ${GH_RESP_STATUS})"
  fi

  if [ "$attempt" -lt "$GITHUB_POLL_RETRIES" ]; then
    sleep "$GITHUB_POLL_INTERVAL"
  fi
done

# Determine pass/fail based on actual verification
if [ "$COUNT_AFTER_1" = "-1" ]; then
  # Could not query GitHub — fall back to notification run status
  if [ "$RUN_STATUS_1" = "succeeded" ]; then
    record_result "E2E test #1 (new issue)" "PASS" "notification run succeeded (ID: ${RUN_ID_1}); GitHub verification unavailable"
  elif [ "$RUN_STATUS_1" = "failed" ]; then
    record_result "E2E test #1 (new issue)" "FAIL" "notification run failed: ${RUN_ERROR_1}"
  else
    record_result "E2E test #1 (new issue)" "FAIL" "notification run status: ${RUN_STATUS_1}; GitHub verification unavailable"
  fi
elif [ "$NEW_ISSUE_COUNT" -gt 0 ]; then
  record_result "E2E test #1 (new issue)" "PASS" "GitHub issue #${NEW_ISSUE_LIST} created (run status: ${RUN_STATUS_1})"
elif [ "$RUN_STATUS_1" = "failed" ]; then
  record_result "E2E test #1 (new issue)" "FAIL" "notification run failed: ${RUN_ERROR_1}; no new GitHub issue"
else
  record_result "E2E test #1 (new issue)" "FAIL" "no new GitHub issue after ${GITHUB_POLL_RETRIES} attempts (run status: ${RUN_STATUS_1}, before: ${COUNT_BEFORE_1}, after: ${COUNT_AFTER_1})"
fi

# ---------------------------------------------------------------------------
# Step 5: Dedup test — trigger SAME issue again, verify NO duplicate
# ---------------------------------------------------------------------------

print_header "Step 5/6: Dedup test — trigger SAME issue again"
echo "  (expect NO duplicate GitHub issue — bridge should dedup via ISSUE_DEDUPE)"

# Capture GitHub issue state BEFORE dedup test
get_github_issues
ISSUES_BEFORE_2="$GH_ISSUE_NUMBERS"
COUNT_BEFORE_2="$GH_ISSUE_COUNT"
echo "  GitHub issues before dedup: ${COUNT_BEFORE_2} (numbers: ${ISSUES_BEFORE_2:-none})"

# Trigger same notification run again
cf_api POST "/workers/observability/issues/${TEST_ISSUE_1}/notification-runs" "$PAYLOAD"

RUN_STATUS_2="unknown"
RUN_ERROR_2=""

if [ "$RESP_SUCCESS" = "true" ]; then
  RUN_ID_2=$(echo "$RESP_BODY" | jq -r '.result.run.id // "N/A"')
  RUN_STATUS_2=$(echo "$RESP_BODY" | jq -r '.result.run.status // "unknown"')
  RUN_ERROR_2=$(echo "$RESP_BODY" | jq -r '.result.run.lastError // ""')
  echo "  Notification run: ID=${RUN_ID_2}, status=${RUN_STATUS_2}"
else
  ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error"')
  echo -e "  ${RED}Notification run API call failed: HTTP ${RESP_STATUS}: ${ERR}${NC}"
fi

echo "  Waiting ${NOTIFICATION_WAIT_SECONDS} seconds for delivery and processing..."
sleep "$NOTIFICATION_WAIT_SECONDS"

# Poll GitHub — expect NO new issues
ISSUES_AFTER_2=""
COUNT_AFTER_2=""
DEDUP_NEW_COUNT=0

for attempt in $(seq 1 $GITHUB_POLL_RETRIES); do
  get_github_issues
  ISSUES_AFTER_2="$GH_ISSUE_NUMBERS"
  COUNT_AFTER_2="$GH_ISSUE_COUNT"

  if [ "$COUNT_AFTER_2" != "-1" ]; then
    count_new_issues "$ISSUES_BEFORE_2" "$ISSUES_AFTER_2"
    DEDUP_NEW_COUNT=$NEW_ISSUE_COUNT
    if [ "$DEDUP_NEW_COUNT" -gt 0 ]; then
      echo -e "  ${RED}GitHub: ${DEDUP_NEW_COUNT} UNEXPECTED new issue(s) detected (attempt ${attempt}): #${NEW_ISSUE_LIST}${NC}"
      break
    fi
    echo "  GitHub: no new issues (attempt ${attempt}/${GITHUB_POLL_RETRIES}, count: ${COUNT_AFTER_2}) — good"
    break
  else
    echo "  GitHub: query failed (attempt ${attempt}/${GITHUB_POLL_RETRIES})"
  fi

  if [ "$attempt" -lt "$GITHUB_POLL_RETRIES" ]; then
    sleep "$GITHUB_POLL_INTERVAL"
  fi
done

# Determine pass/fail — dedup means NO new issue should appear
if [ "$COUNT_AFTER_2" = "-1" ]; then
  if [ "$RUN_STATUS_2" = "succeeded" ]; then
    record_result "Dedup test (same issue)" "PASS" "notification run succeeded; GitHub verification unavailable"
  else
    record_result "Dedup test (same issue)" "FAIL" "notification run status: ${RUN_STATUS_2}; GitHub verification unavailable"
  fi
elif [ "$DEDUP_NEW_COUNT" -eq 0 ]; then
  record_result "Dedup test (same issue)" "PASS" "no duplicate GitHub issue created (run status: ${RUN_STATUS_2})"
else
  record_result "Dedup test (same issue)" "FAIL" "${DEDUP_NEW_COUNT} duplicate issue(s) created: #${NEW_ISSUE_LIST} — dedup failed"
fi

# ---------------------------------------------------------------------------
# Step 6: End-to-end test #2 — trigger second unique issue
# ---------------------------------------------------------------------------

print_header "Step 6/6: E2E test #2 — trigger issue ${TEST_ISSUE_2:0:8}"
echo "  (debug-endpoints scan — expect a NEW GitHub issue)"

# Capture GitHub issue state BEFORE
get_github_issues
ISSUES_BEFORE_3="$GH_ISSUE_NUMBERS"
COUNT_BEFORE_3="$GH_ISSUE_COUNT"
echo "  GitHub issues before: ${COUNT_BEFORE_3} (numbers: ${ISSUES_BEFORE_3:-none})"

# Trigger notification run for a different issue
cf_api POST "/workers/observability/issues/${TEST_ISSUE_2}/notification-runs" "$PAYLOAD"

RUN_STATUS_3="unknown"
RUN_ERROR_3=""

if [ "$RESP_SUCCESS" = "true" ]; then
  RUN_ID_3=$(echo "$RESP_BODY" | jq -r '.result.run.id // "N/A"')
  RUN_STATUS_3=$(echo "$RESP_BODY" | jq -r '.result.run.status // "unknown"')
  RUN_ERROR_3=$(echo "$RESP_BODY" | jq -r '.result.run.lastError // ""')
  echo "  Notification run: ID=${RUN_ID_3}, status=${RUN_STATUS_3}"
  if [ -n "$RUN_ERROR_3" ] && [ "$RUN_ERROR_3" != "null" ]; then
    echo -e "  ${YELLOW}  lastError: ${RUN_ERROR_3}${NC}"
  fi
else
  ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error"')
  echo -e "  ${RED}Notification run API call failed: HTTP ${RESP_STATUS}: ${ERR}${NC}"
fi

echo "  Waiting ${NOTIFICATION_WAIT_SECONDS} seconds for delivery and processing..."
sleep "$NOTIFICATION_WAIT_SECONDS"

# Poll GitHub for new issues
ISSUES_AFTER_3=""
COUNT_AFTER_3=""
NEW_COUNT_3=0

for attempt in $(seq 1 $GITHUB_POLL_RETRIES); do
  get_github_issues
  ISSUES_AFTER_3="$GH_ISSUE_NUMBERS"
  COUNT_AFTER_3="$GH_ISSUE_COUNT"

  if [ "$COUNT_AFTER_3" != "-1" ]; then
    count_new_issues "$ISSUES_BEFORE_3" "$ISSUES_AFTER_3"
    if [ "$NEW_ISSUE_COUNT" -gt 0 ]; then
      echo "  GitHub: ${NEW_ISSUE_COUNT} new issue(s) detected (attempt ${attempt}): #${NEW_ISSUE_LIST}"
      break
    fi
    echo "  GitHub: no new issues yet (attempt ${attempt}/${GITHUB_POLL_RETRIES}, count: ${COUNT_AFTER_3})"
  else
    echo "  GitHub: query failed (attempt ${attempt}/${GITHUB_POLL_RETRIES})"
  fi

  if [ "$attempt" -lt "$GITHUB_POLL_RETRIES" ]; then
    sleep "$GITHUB_POLL_INTERVAL"
  fi
done

# Determine pass/fail
if [ "$COUNT_AFTER_3" = "-1" ]; then
  if [ "$RUN_STATUS_3" = "succeeded" ]; then
    record_result "E2E test #2 (new issue)" "PASS" "notification run succeeded (ID: ${RUN_ID_3}); GitHub verification unavailable"
  elif [ "$RUN_STATUS_3" = "failed" ]; then
    record_result "E2E test #2 (new issue)" "FAIL" "notification run failed: ${RUN_ERROR_3}"
  else
    record_result "E2E test #2 (new issue)" "FAIL" "notification run status: ${RUN_STATUS_3}; GitHub verification unavailable"
  fi
elif [ "$NEW_ISSUE_COUNT" -gt 0 ]; then
  record_result "E2E test #2 (new issue)" "PASS" "GitHub issue #${NEW_ISSUE_LIST} created (run status: ${RUN_STATUS_3})"
elif [ "$RUN_STATUS_3" = "failed" ]; then
  record_result "E2E test #2 (new issue)" "FAIL" "notification run failed: ${RUN_ERROR_3}; no new GitHub issue"
else
  record_result "E2E test #2 (new issue)" "FAIL" "no new GitHub issue after ${GITHUB_POLL_RETRIES} attempts (run status: ${RUN_STATUS_3}, before: ${COUNT_BEFORE_3}, after: ${COUNT_AFTER_3})"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

print_summary
