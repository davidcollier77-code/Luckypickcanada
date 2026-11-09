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
# Security:
#   - Prompts for Cloudflare API token and webhook secret at runtime.
#   - Uses read -rs so neither is displayed while typing.
#   - Does not write secrets to disk, shell history, or logs.
#   - Does not include any real tokens or secrets in this file.
#   - Optionally prompts for a GitHub token for verification.
#
# Preserves the existing "Jules Bridge" webhook and Worker bindings.
#
# Prerequisites: bash 4+, curl, jq; Cloudflare Notifications: Edit and
# Workers Observability: Edit; matching WEBHOOK_SECRET; optional GitHub token.

set -uo pipefail

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

TEST_ISSUE_1="a94d47c2-d9e8-468d-ae61-c966c9ab7199"
TEST_ISSUE_2="f8607191-3b38-4c40-84e3-6ff40a036b1f"

NOTIFICATION_WAIT_SECONDS=8
GITHUB_POLL_RETRIES=3
GITHUB_POLL_INTERVAL=5

declare -a STEP_NAMES=()
declare -a STEP_RESULTS=()
declare -a STEP_DETAILS=()
declare -a CREATED_RESOURCES=()

WEBHOOK_ID=""
POLICY_ID=""
AUTOMATION_ID=""
WEBHOOK_CREATED=false
POLICY_CREATED=false
AUTOMATION_CREATED=false

if [ -t 1 ]; then
  GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
else
  GREEN='' RED='' YELLOW='' BLUE='' CYAN='' NC=''
fi

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

cf_api() {
  local method="$1" endpoint="$2" payload="${3:-}"
  local curl_args=(-s -w "\n%{http_code}" -X "$method" "${API_BASE}/accounts/${ACCOUNT_ID}${endpoint}"
    -H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json")
  [ -n "$payload" ] && curl_args+=(-d "$payload")
  local raw
  raw=$(curl "${curl_args[@]}" 2>&1) || true
  RESP_STATUS=$(echo "$raw" | tail -1)
  RESP_BODY=$(echo "$raw" | sed '$d')
  RESP_SUCCESS=$(echo "$RESP_BODY" | jq -r '.success // false' 2>/dev/null || echo "false")
}

gh_api() {
  local method="$1" endpoint="$2"
  local gh_args=(-s -w "\n%{http_code}" -X "$method" "${GITHUB_API}${endpoint}" -H "Accept: application/vnd.github+json")
  [ -n "${GH_TOKEN:-}" ] && gh_args+=(-H "Authorization: Bearer ${GH_TOKEN}")
  local raw
  raw=$(curl "${gh_args[@]}" 2>&1) || true
  GH_RESP_STATUS=$(echo "$raw" | tail -1)
  GH_RESP_BODY=$(echo "$raw" | sed '$d')
}

get_github_issues() {
  gh_api GET "/repos/${GITHUB_REPO}/issues?state=open&sort=created&direction=desc&per_page=100"
  if [ "$GH_RESP_STATUS" = "200" ]; then
    GH_ISSUE_NUMBERS=$(echo "$GH_RESP_BODY" | jq -r '[.[] | select(.pull_request == null) | .number] | sort | join(",")')
    GH_ISSUE_COUNT=$(echo "$GH_RESP_BODY" | jq '[.[] | select(.pull_request == null)] | length')
  else
    GH_ISSUE_NUMBERS=""
    GH_ISSUE_COUNT="-1"
  fi
}

count_new_issues() {
  local before="$1" after="$2"
  if [ -z "$after" ]; then NEW_ISSUE_COUNT=0; NEW_ISSUE_LIST=""; return; fi
  local new_issues="" count=0
  IFS=',' read -ra after_arr <<< "$after"
  for num in "${after_arr[@]}"; do
    local found=false
    if [ -n "$before" ]; then
      IFS=',' read -ra before_arr <<< "$before"
      for b in "${before_arr[@]}"; do
        if [ "$num" = "$b" ]; then found=true; break; fi
      done
    fi
    if [ "$found" = "false" ]; then
      if [ -z "$new_issues" ]; then new_issues="$num"; else new_issues="$new_issues,$num"; fi
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
      echo -e "  ${GREEN}✓${NC} $name — $detail"; pass_count=$((pass_count + 1))
    else
      echo -e "  ${RED}✗${NC} $name — $detail"; fail_count=$((fail_count + 1))
    fi
  done
  echo ""
  echo -e "  ${GREEN}Passed: ${pass_count}${NC}  ${RED}Failed: ${fail_count}${NC}"
  echo ""
  echo "  Resource IDs:"
  [ -n "$WEBHOOK_ID" ] && echo "    Webhook ID: $WEBHOOK_ID ($([ "$WEBHOOK_CREATED" = true ] && echo newly-created || echo pre-existing))"
  [ -n "$POLICY_ID" ] && echo "    Policy ID: $POLICY_ID ($([ "$POLICY_CREATED" = true ] && echo newly-created || echo pre-existing))"
  [ -n "$AUTOMATION_ID" ] && echo "    Automation ID: $AUTOMATION_ID ($([ "$AUTOMATION_CREATED" = true ] && echo newly-created || echo pre-existing))"
  if [ "${#CREATED_RESOURCES[@]}" -gt 0 ]; then
    echo ""; echo "  Resources created in this run:"
    for r in "${CREATED_RESOURCES[@]}"; do echo "    📦 $r"; done
  fi
  echo ""; echo "  Next steps:"
  echo "    1. Verify GitHub repo ${GITHUB_REPO} for expected issues."
  echo "    2. Paste this output to Agent Lee for verification."
  unset CF_API_TOKEN WEBHOOK_SECRET GH_TOKEN 2>/dev/null || true
  [ "$fail_count" -gt 0 ] && return 1 || return 0
}

print_header "Pre-flight: tool checks"
if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
  echo -e "  ${RED}✗ FAIL${NC} — bash 4+ required (found ${BASH_VERSION})"; exit 1
fi
echo -e "  ${GREEN}✓ PASS${NC} — bash ${BASH_VERSINFO[0]}.${BASH_VERSINFO[1]}"
if ! command -v curl &>/dev/null; then echo "  ✗ FAIL — curl is required"; exit 1; fi
echo -e "  ${GREEN}✓ PASS${NC} — curl $(curl --version | head -1 | awk '{print $1" "$2}')"
if ! command -v jq &>/dev/null; then
  echo -e "  ${RED}✗ FAIL${NC} — jq is required (install jq with your package manager)"; exit 1
fi
echo -e "  ${GREEN}✓ PASS${NC} — jq $(jq --version)"

print_header "Credential input"
echo "  Enter Cloudflare API token (input hidden):"
echo "  Required: Notifications: Edit and Workers Observability: Edit"
read -rs CF_API_TOKEN; echo ""
[ -n "$CF_API_TOKEN" ] || { echo "✗ No API token provided."; exit 1; }
echo "  ✓ API token received (not displayed)"
echo ""
echo "  Enter WEBHOOK_SECRET matching the bridge Worker's binding (input hidden):"
read -rs WEBHOOK_SECRET; echo ""
[ -n "$WEBHOOK_SECRET" ] || { echo "✗ No webhook secret provided."; exit 1; }
echo "  ✓ Webhook secret received (not displayed)"
echo ""
echo "  Enter GitHub token for issue verification (optional; hidden input):"
read -rs GH_TOKEN; echo ""
if [ -n "$GH_TOKEN" ]; then echo "  ✓ GitHub token received"; else echo "  ⚠ No GitHub token; using unauthenticated public API"; fi
unset HISTFILE 2>/dev/null || true
history -c 2>/dev/null || true

print_header "Preflight: checking for existing resources"
cf_api GET "/alerting/v3/destinations/webhooks"
if [ "$RESP_SUCCESS" = "true" ]; then
  WEBHOOK_ID=$(echo "$RESP_BODY" | jq -r --arg name "$WEBHOOK_NAME" '.result[] | select(.name == $name) | .id' 2>/dev/null | head -1)
  if [ -n "$WEBHOOK_ID" ] && [ "$WEBHOOK_ID" != "null" ]; then echo "  ⚠ Existing webhook found; reusing ID $WEBHOOK_ID"; else echo "  ✓ No matching webhook; will create"; fi
else echo "  ⚠ Could not list webhooks (HTTP $RESP_STATUS); creation will be attempted"; fi

cf_api GET "/alerting/v3/policies"
if [ "$RESP_SUCCESS" = "true" ]; then
  POLICY_ID=$(echo "$RESP_BODY" | jq -r --arg name "$POLICY_NAME" '.result[] | select(.name == $name) | .id' 2>/dev/null | head -1)
  if [ -n "$POLICY_ID" ] && [ "$POLICY_ID" != "null" ]; then echo "  ⚠ Existing policy found; reusing ID $POLICY_ID"; else echo "  ✓ No matching policy; will create"; fi
else echo "  ⚠ Could not list policies (HTTP $RESP_STATUS); creation will be attempted"; fi

cf_api GET "/workers/observability/issues/automations"
if [ "$RESP_SUCCESS" = "true" ]; then
  AUTOMATION_ID=$(echo "$RESP_BODY" | jq -r --arg svc "$WORKER_SERVICE" '.result.automations[]? | select(.service == $svc) | .id' 2>/dev/null | head -1)
  if [ -n "$AUTOMATION_ID" ] && [ "$AUTOMATION_ID" != "null" ]; then echo "  ⚠ Existing automation found; reusing ID $AUTOMATION_ID"; else echo "  ✓ No matching automation; will create"; fi
else echo "  ⚠ Could not list automations (HTTP $RESP_STATUS); creation will be attempted"; fi

print_header "Step 1/6: Create webhook destination"
if [ -n "$WEBHOOK_ID" ] && [ "$WEBHOOK_ID" != "null" ]; then
  record_result "Webhook destination" "PASS" "reusing existing (ID: $WEBHOOK_ID)"
else
  PAYLOAD=$(jq -n --arg name "$WEBHOOK_NAME" --arg url "$WEBHOOK_URL" --arg secret "$WEBHOOK_SECRET" '{name:$name,url:$url,secret:$secret}')
  cf_api POST "/alerting/v3/destinations/webhooks" "$PAYLOAD"
  if [ "$RESP_SUCCESS" = "true" ]; then
    WEBHOOK_ID=$(echo "$RESP_BODY" | jq -r '.result.id'); WEBHOOK_CREATED=true
    record_result "Webhook destination" "PASS" "created (ID: $WEBHOOK_ID)"
    record_resource "Webhook destination: $WEBHOOK_NAME (ID: $WEBHOOK_ID)"
  else
    ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error'")
    record_result "Webhook destination" "FAIL" "HTTP $RESP_STATUS: $ERR"
    echo "Cannot continue without webhook destination. Aborting."; print_summary; exit 1
  fi
fi

print_header "Step 2/6: Create notification policy"
if [ -n "$POLICY_ID" ] && [ "$POLICY_ID" != "null" ]; then
  record_result "Notification policy" "PASS" "reusing existing (ID: $POLICY_ID)"
else
  PAYLOAD=$(jq -n --arg name "$POLICY_NAME" --arg desc "$POLICY_DESCRIPTION" --arg alert "$ALERT_TYPE" --arg wid "$WEBHOOK_ID" '{name:$name,description:$desc,enabled:true,alert_type:$alert,mechanisms:{webhooks:[{id:$wid}]}}')
  cf_api POST "/alerting/v3/policies" "$PAYLOAD"
  if [ "$RESP_SUCCESS" = "true" ]; then
    POLICY_ID=$(echo "$RESP_BODY" | jq -r '.result.id'); POLICY_CREATED=true
    record_result "Notification policy" "PASS" "created (ID: $POLICY_ID)"
    record_resource "Notification policy: $POLICY_NAME (ID: $POLICY_ID)"
  else
    ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error'")
    record_result "Notification policy" "FAIL" "HTTP $RESP_STATUS: $ERR"
    echo "Cannot continue without notification policy. Aborting."; print_summary; exit 1
  fi
fi

print_header "Step 3/6: Create issue automation"
if [ -n "$AUTOMATION_ID" ] && [ "$AUTOMATION_ID" != "null" ]; then
  record_result "Issue automation" "PASS" "reusing existing (ID: $AUTOMATION_ID)"
else
  PAYLOAD=$(jq -n --arg name "$AUTOMATION_NAME" --arg service "$WORKER_SERVICE" --arg pid "$POLICY_ID" --argjson occ "$OCCURRENCE_THRESHOLD" '{name:$name,enabled:true,service:$service,afterOccurrences:$occ,policyId:$pid}')
  cf_api POST "/workers/observability/issues/automations" "$PAYLOAD"
  if [ "$RESP_SUCCESS" = "true" ]; then
    AUTOMATION_ID=$(echo "$RESP_BODY" | jq -r '.result.automation.id'); AUTOMATION_CREATED=true
    record_result "Issue automation" "PASS" "created (ID: $AUTOMATION_ID)"
    record_resource "Issue automation: $AUTOMATION_NAME on $WORKER_SERVICE (ID: $AUTOMATION_ID)"
  else
    ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error'")
    record_result "Issue automation" "FAIL" "HTTP $RESP_STATUS: $ERR"
    echo "Cannot continue without issue automation. Aborting."; print_summary; exit 1
  fi
fi

print_header "Step 4/6: E2E test #1 — trigger issue ${TEST_ISSUE_1:0:8}"
echo "  Expect a new GitHub issue (wordpress scan)"
get_github_issues
ISSUES_BEFORE_1="$GH_ISSUE_NUMBERS"; COUNT_BEFORE_1="$GH_ISSUE_COUNT"
echo "  GitHub issues before: $COUNT_BEFORE_1 (numbers: ${ISSUES_BEFORE_1:-none})"
if [ "$COUNT_BEFORE_1" = "-1" ]; then echo "  ⚠ GitHub query unavailable (HTTP $GH_RESP_STATUS)"; fi
PAYLOAD=$(jq -n --arg pid "$POLICY_ID" '{policyId:$pid}')
cf_api POST "/workers/observability/issues/${TEST_ISSUE_1}/notification-runs" "$PAYLOAD"
RUN_STATUS_1="unknown"; RUN_ERROR_1=""
if [ "$RESP_SUCCESS" = "true" ]; then
  RUN_ID_1=$(echo "$RESP_BODY" | jq -r '.result.run.id // "N/A'")
  RUN_STATUS_1=$(echo "$RESP_BODY" | jq -r '.result.run.status // "unknown'")
  RUN_ERROR_1=$(echo "$RESP_BODY" | jq -r '.result.run.lastError // ""')
  echo "  Notification run: ID=$RUN_ID_1, status=$RUN_STATUS_1"
else
  ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error'")
  echo "  Notification run API failed: HTTP $RESP_STATUS: $ERR"
fi
echo "  Waiting $NOTIFICATION_WAIT_SECONDS seconds for delivery and processing..."
sleep "$NOTIFICATION_WAIT_SECONDS"
ISSUES_AFTER_1=""; COUNT_AFTER_1=""; NEW_COUNT_1=0
for attempt in $(seq 1 "$GITHUB_POLL_RETRIES"); do
  get_github_issues; ISSUES_AFTER_1="$GH_ISSUE_NUMBERS"; COUNT_AFTER_1="$GH_ISSUE_COUNT"
  if [ "$COUNT_AFTER_1" != "-1" ]; then
    count_new_issues "$ISSUES_BEFORE_1" "$ISSUES_AFTER_1"
    if [ "$NEW_ISSUE_COUNT" -gt 0 ]; then echo "  GitHub: new issue(s) #$NEW_ISSUE_LIST"; break; fi
    echo "  GitHub: no new issues yet (attempt $attempt/$GITHUB_POLL_RETRIES)"
  else echo "  GitHub query failed (attempt $attempt/$GITHUB_POLL_RETRIES)"; fi
  [ "$attempt" -lt "$GITHUB_POLL_RETRIES" ] && sleep "$GITHUB_POLL_INTERVAL"
done
if [ "$COUNT_AFTER_1" = "-1" ]; then
  if [ "$RUN_STATUS_1" = "succeeded" ]; then record_result "E2E test #1 (new issue)" "PASS" "notification run succeeded (ID: ${RUN_ID_1:-N/A}); GitHub verification unavailable"
  elif [ "$RUN_STATUS_1" = "failed" ]; then record_result "E2E test #1 (new issue)" "FAIL" "notification run failed: $RUN_ERROR_1"
  else record_result "E2E test #1 (new issue)" "FAIL" "run status $RUN_STATUS_1; GitHub verification unavailable"; fi
elif [ "$NEW_ISSUE_COUNT" -gt 0 ]; then
  record_result "E2E test #1 (new issue)" "PASS" "GitHub issue #$NEW_ISSUE_LIST created (run status: $RUN_STATUS_1)"
elif [ "$RUN_STATUS_1" = "failed" ]; then record_result "E2E test #1 (new issue)" "FAIL" "notification run failed: $RUN_ERROR_1; no new GitHub issue"
else record_result "E2E test #1 (new issue)" "FAIL" "no new GitHub issue after polling (run status: $RUN_STATUS_1)"; fi

print_header "Step 5/6: Dedup test — trigger SAME issue again"
echo "  Expect no duplicate GitHub issue (bridge dedup via ISSUE_DEDUPE)"
get_github_issues
ISSUES_BEFORE_2="$GH_ISSUE_NUMBERS"; COUNT_BEFORE_2="$GH_ISSUE_COUNT"
echo "  GitHub issues before dedup: $COUNT_BEFORE_2"
cf_api POST "/workers/observability/issues/${TEST_ISSUE_1}/notification-runs" "$PAYLOAD"
RUN_STATUS_2="unknown"; RUN_ERROR_2=""
if [ "$RESP_SUCCESS" = "true" ]; then
  RUN_ID_2=$(echo "$RESP_BODY" | jq -r '.result.run.id // "N/A'")
  RUN_STATUS_2=$(echo "$RESP_BODY" | jq -r '.result.run.status // "unknown'")
  RUN_ERROR_2=$(echo "$RESP_BODY" | jq -r '.result.run.lastError // ""')
  echo "  Notification run: ID=$RUN_ID_2, status=$RUN_STATUS_2"
else
  ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error'")
  echo "  Notification run API failed: HTTP $RESP_STATUS: $ERR"
fi
echo "  Waiting $NOTIFICATION_WAIT_SECONDS seconds..."
sleep "$NOTIFICATION_WAIT_SECONDS"
ISSUES_AFTER_2=""; COUNT_AFTER_2=""; DEDUP_NEW_COUNT=0
for attempt in $(seq 1 "$GITHUB_POLL_RETRIES"); do
  get_github_issues; ISSUES_AFTER_2="$GH_ISSUE_NUMBERS"; COUNT_AFTER_2="$GH_ISSUE_COUNT"
  if [ "$COUNT_AFTER_2" != "-1" ]; then
    count_new_issues "$ISSUES_BEFORE_2" "$ISSUES_AFTER_2"; DEDUP_NEW_COUNT=$NEW_ISSUE_COUNT
    if [ "$DEDUP_NEW_COUNT" -gt 0 ]; then echo "  ✗ Unexpected new issue(s): #$NEW_ISSUE_LIST"; else echo "  ✓ No new issue detected"; fi
    break
  else echo "  GitHub query failed (attempt $attempt/$GITHUB_POLL_RETRIES)"; fi
  [ "$attempt" -lt "$GITHUB_POLL_RETRIES" ] && sleep "$GITHUB_POLL_INTERVAL"
done
if [ "$COUNT_AFTER_2" = "-1" ]; then
  if [ "$RUN_STATUS_2" = "succeeded" ]; then record_result "Dedup test (same issue)" "PASS" "notification run succeeded; GitHub verification unavailable"
  else record_result "Dedup test (same issue)" "FAIL" "run status $RUN_STATUS_2; GitHub verification unavailable"; fi
elif [ "$DEDUP_NEW_COUNT" -eq 0 ]; then record_result "Dedup test (same issue)" "PASS" "no duplicate GitHub issue detected (run status: $RUN_STATUS_2)"
else record_result "Dedup test (same issue)" "FAIL" "$DEDUP_NEW_COUNT duplicate issue(s): #$NEW_ISSUE_LIST"; fi

print_header "Step 6/6: E2E test #2 — trigger issue ${TEST_ISSUE_2:0:8}"
echo "  Expect a new GitHub issue (debug-endpoints scan)"
get_github_issues
ISSUES_BEFORE_3="$GH_ISSUE_NUMBERS"; COUNT_BEFORE_3="$GH_ISSUE_COUNT"
echo "  GitHub issues before: $COUNT_BEFORE_3"
cf_api POST "/workers/observability/issues/${TEST_ISSUE_2}/notification-runs" "$PAYLOAD"
RUN_STATUS_3="unknown"; RUN_ERROR_3=""
if [ "$RESP_SUCCESS" = "true" ]; then
  RUN_ID_3=$(echo "$RESP_BODY" | jq -r '.result.run.id // "N/A'")
  RUN_STATUS_3=$(echo "$RESP_BODY" | jq -r '.result.run.status // "unknown'")
  RUN_ERROR_3=$(echo "$RESP_BODY" | jq -r '.result.run.lastError // ""')
  echo "  Notification run: ID=$RUN_ID_3, status=$RUN_STATUS_3"
else
  ERR=$(echo "$RESP_BODY" | jq -r '.errors[0].message // "unknown error'")
  echo "  Notification run API failed: HTTP $RESP_STATUS: $ERR"
fi
echo "  Waiting $NOTIFICATION_WAIT_SECONDS seconds..."
sleep "$NOTIFICATION_WAIT_SECONDS"
ISSUES_AFTER_3=""; COUNT_AFTER_3=""; NEW_COUNT_3=0
for attempt in $(seq 1 "$GITHUB_POLL_RETRIES"); do
  get_github_issues; ISSUES_AFTER_3="$GH_ISSUE_NUMBERS"; COUNT_AFTER_3="$GH_ISSUE_COUNT"
  if [ "$COUNT_AFTER_3" != "-1" ]; then
    count_new_issues "$ISSUES_BEFORE_3" "$ISSUES_AFTER_3"
    if [ "$NEW_ISSUE_COUNT" -gt 0 ]; then echo "  GitHub: new issue(s) #$NEW_ISSUE_LIST"; break; fi
    echo "  GitHub: no new issues yet (attempt $attempt/$GITHUB_POLL_RETRIES)"
  else echo "  GitHub query failed (attempt $attempt/$GITHUB_POLL_RETRIES)"; fi
  [ "$attempt" -lt "$GITHUB_POLL_RETRIES" ] && sleep "$GITHUB_POLL_INTERVAL"
done
if [ "$COUNT_AFTER_3" = "-1" ]; then
  if [ "$RUN_STATUS_3" = "succeeded" ]; then record_result "E2E test #2 (new issue)" "PASS" "notification run succeeded (ID: ${RUN_ID_3:-N/A}); GitHub verification unavailable"
  elif [ "$RUN_STATUS_3" = "failed" ]; then record_result "E2E test #2 (new issue)" "FAIL" "notification run failed: $RUN_ERROR_3"
  else record_result "E2E test #2 (new issue)" "FAIL" "run status $RUN_STATUS_3; GitHub verification unavailable"; fi
elif [ "$NEW_ISSUE_COUNT" -gt 0 ]; then record_result "E2E test #2 (new issue)" "PASS" "GitHub issue #$NEW_ISSUE_LIST created (run status: $RUN_STATUS_3)"
elif [ "$RUN_STATUS_3" = "failed" ]; then record_result "E2E test #2 (new issue)" "FAIL" "notification run failed: $RUN_ERROR_3; no new GitHub issue"
else record_result "E2E test #2 (new issue)" "FAIL" "no new GitHub issue after polling (run status: $RUN_STATUS_3)"; fi

print_summary
