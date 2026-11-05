#!/usr/bin/env bash
# Fail-closed Spec Kit gate. Resolve the task from changed artifacts, not the
# shared per-checkout .specify/feature.json pointer.
# Keep this script compatible with the system Bash shipped on macOS (3.2+).
set -eo pipefail

if [[ $# -gt 1 ]]; then
  echo "Usage: bash scripts/verify-speckit-task.sh [repository-root]" >&2
  exit 2
fi

DEFAULT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_INPUT="${1:-$DEFAULT_ROOT}"
if ! REPO_ROOT="$(cd -- "$ROOT_INPUT" 2>/dev/null && pwd)"; then
  echo "❌ Spec Kit governance check: repository root does not exist: $ROOT_INPUT" >&2
  exit 1
fi
if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Spec Kit governance check: root is not a Git working tree." >&2
  exit 1
fi

# Portable array membership: indexed arrays work on Bash 3.2; associative
# arrays (declare -A) do not.
contains() {
  local needle="$1"
  shift
  local item
  for item in "$@"; do
    [[ "$item" == "$needle" ]] && return 0
  done
  return 1
}

CHANGED_PATHS=()
add_changed_path() {
  local candidate="$1"
  [[ -n "$candidate" ]] || return 0
  if ! contains "$candidate" "${CHANGED_PATHS[@]}"; then
    CHANGED_PATHS[${#CHANGED_PATHS[@]}]="$candidate"
  fi
}

# The committed change set of the pull request, kept separate from local
# worktree state. Automation such as the Spec Kit updater may leave local
# modifications in a checkout; only what the PR itself commits defines scope.
COMMITTED_PATHS=()
add_committed_path() {
  local candidate="$1"
  [[ -n "$candidate" ]] || return 0
  if ! contains "$candidate" "${COMMITTED_PATHS[@]}"; then
    COMMITTED_PATHS[${#COMMITTED_PATHS[@]}]="$candidate"
  fi
}

# Resolve a comparison base. GitHub pull_request checkouts are often shallow,
# so fetch the declared base when its remote-tracking ref is not present.
BASE_REF="${SPEC_KIT_BASE_REF:-}"
if [[ -n "$BASE_REF" ]] && ! git -C "$REPO_ROOT" rev-parse --verify --quiet "${BASE_REF}^{commit}" >/dev/null; then
  echo "❌ Spec Kit governance check: SPEC_KIT_BASE_REF '$BASE_REF' is not a valid commit." >&2
  exit 1
fi

if [[ -z "$BASE_REF" && -n "${GITHUB_BASE_REF:-}" ]]; then
  for candidate in "origin/${GITHUB_BASE_REF}" "${GITHUB_BASE_REF}"; do
    if git -C "$REPO_ROOT" rev-parse --verify --quiet "${candidate}^{commit}" >/dev/null; then
      BASE_REF="$candidate"
      break
    fi
  done
  if [[ -z "$BASE_REF" && "${GITHUB_ACTIONS:-}" == "true" ]]; then
    if ! git -C "$REPO_ROOT" fetch --no-tags origin "$GITHUB_BASE_REF"; then
      echo "❌ Spec Kit governance check: could not fetch pull request base '$GITHUB_BASE_REF'." >&2
      exit 1
    fi
    if git -C "$REPO_ROOT" rev-parse --verify --quiet "FETCH_HEAD^{commit}" >/dev/null; then
      BASE_REF="FETCH_HEAD"
    fi
  fi
fi

if [[ -z "$BASE_REF" ]]; then
  for candidate in origin/main main origin/master master; do
    if git -C "$REPO_ROOT" rev-parse --verify --quiet "${candidate}^{commit}" >/dev/null; then
      BASE_REF="$candidate"
      break
    fi
  done
fi

if [[ -n "$BASE_REF" ]]; then
  if ! branch_changes="$(git -C "$REPO_ROOT" diff --name-only "${BASE_REF}...HEAD")"; then
    echo "❌ Spec Kit governance check: could not compare HEAD with '$BASE_REF'." >&2
    echo "Fetch the base branch or set SPEC_KIT_BASE_REF to a valid task base." >&2
    exit 1
  fi
  while IFS= read -r path; do
    add_changed_path "$path"
    add_committed_path "$path"
  done <<< "$branch_changes"
fi

# Add staged, unstaged, and untracked task artifacts too.
while IFS= read -r path; do
  add_changed_path "$path"
done < <(
  {
    git -C "$REPO_ROOT" diff --name-only
    git -C "$REPO_ROOT" diff --cached --name-only
    git -C "$REPO_ROOT" ls-files --others --exclude-standard
  } | sort -u
)

CANDIDATE_DIRS=()
for path in "${CHANGED_PATHS[@]}"; do
  if [[ "$path" =~ ^(specs/[^/]+|\.specify/features/[^/]+)/(spec|plan|tasks)\.md$ ]]; then
    candidate_dir="${BASH_REMATCH[1]}"
    if ! contains "$candidate_dir" "${CANDIDATE_DIRS[@]}"; then
      CANDIDATE_DIRS[${#CANDIDATE_DIRS[@]}]="$candidate_dir"
    fi
  fi
done

# Reject even a partial second feature; otherwise a complete feature could mask
# accidental task artifacts left in another directory.
if [[ ${#CANDIDATE_DIRS[@]} -gt 1 ]]; then
  echo "❌ Spec Kit governance check: multiple task feature directories changed:" >&2
  printf ' - %s\n' "${CANDIDATE_DIRS[@]}" >&2
  echo "Keep one feature directory per task/PR. Do not combine or duplicate task artifacts." >&2
  exit 1
fi

# Dependabot maintenance exemption. Legitimate dependency-maintenance pull
# requests (npm/pnpm version bumps and GitHub Actions version bumps) carry no
# feature-development Spec Kit artifacts, so the task-artifact requirement must
# not reject them. The exemption is deliberately narrow and needs every one of
# these independent signals to agree:
#   1. GitHub reports the pull request author as dependabot[bot] (forwarded as
#      SPEC_KIT_PR_AUTHOR by the workflow, never the title or branch name);
#   2. a comparison base exists, so the change set is provable;
#   3. the committed change set is non-empty and every path is a dependency
#      manifest, the lockfile, or a GitHub Actions workflow file;
#   4. every commit in the change set is authored by Dependabot and committed by
#      GitHub (web-flow), which a hand-written commit cannot claim.
# Anything else - a mixed-scope change, an ordinary feature PR, a partial
# artifact set (rejected earlier), or a run without the trusted author - falls
# through to the normal fail-closed checks, and every remaining verification
# step still runs.
DEPENDABOT_PR_AUTHOR="dependabot[bot]"
DEPENDABOT_AUTHOR_EMAILS=(
  "49699333+dependabot[bot]@users.noreply.github.com"
  "support@dependabot.com"
)
GITHUB_WEB_FLOW_EMAIL="noreply@github.com"
DEPENDABOT_EXEMPTION_BLOCKER=""

is_dependency_maintenance_path() {
  local path="$1"
  case "$path" in
    package.json|pnpm-lock.yaml) return 0 ;;
  esac
  # One level only: a nested workflow path is not a Dependabot version bump.
  if [[ "$path" =~ ^\.github/workflows/[^/]+\.ya?ml$ ]]; then
    return 0
  fi
  return 1
}

is_dependabot_author_email() {
  local email="$1"
  local allowed
  for allowed in "${DEPENDABOT_AUTHOR_EMAILS[@]}"; do
    if [[ "$email" == "$allowed" ]]; then
      return 0
    fi
  done
  return 1
}

dependabot_maintenance_exemption() {
  DEPENDABOT_EXEMPTION_BLOCKER=""
  if [[ "${SPEC_KIT_PR_AUTHOR:-}" != "$DEPENDABOT_PR_AUTHOR" ]]; then
    DEPENDABOT_EXEMPTION_BLOCKER="the pull request author is not $DEPENDABOT_PR_AUTHOR"
    return 1
  fi
  if [[ -z "$BASE_REF" ]]; then
    DEPENDABOT_EXEMPTION_BLOCKER="no comparison base is available for the change set"
    return 1
  fi
  if [[ ${#COMMITTED_PATHS[@]} -eq 0 ]]; then
    DEPENDABOT_EXEMPTION_BLOCKER="the committed change set is empty"
    return 1
  fi
  local path
  for path in "${COMMITTED_PATHS[@]}"; do
    if ! is_dependency_maintenance_path "$path"; then
      DEPENDABOT_EXEMPTION_BLOCKER="changed path is outside dependency-maintenance scope: $path"
      return 1
    fi
  done
  local commit_identities
  if ! commit_identities="$(git -C "$REPO_ROOT" log --format='%ae|%ce' "${BASE_REF}..HEAD")"; then
    DEPENDABOT_EXEMPTION_BLOCKER="the commit history could not be read"
    return 1
  fi
  if [[ -z "$commit_identities" ]]; then
    DEPENDABOT_EXEMPTION_BLOCKER="no commits were found in the change set"
    return 1
  fi
  local author_email committer_email
  while IFS='|' read -r author_email committer_email; do
    # Fail closed on unexpected input. Skipping a commit with a missing author
    # identity would let an unverifiable commit satisfy the provenance check.
    if [[ -z "$author_email" ]]; then
      DEPENDABOT_EXEMPTION_BLOCKER="a commit has an empty author email; provenance cannot be verified"
      return 1
    fi
    if ! is_dependabot_author_email "$author_email"; then
      DEPENDABOT_EXEMPTION_BLOCKER="commit author is not Dependabot: $author_email"
      return 1
    fi
    if [[ "$committer_email" != "$GITHUB_WEB_FLOW_EMAIL" ]]; then
      DEPENDABOT_EXEMPTION_BLOCKER="commit committer is not GitHub: $committer_email"
      return 1
    fi
  done <<< "$commit_identities"
  return 0
}

if [[ ${#CANDIDATE_DIRS[@]} -eq 0 ]]; then
  if dependabot_maintenance_exemption; then
    echo "✅ Spec Kit governance check: approved Dependabot maintenance change; feature-development artifacts are not required."
    printf '   Dependency-maintenance scope: %s\n' "${COMMITTED_PATHS[@]}"
    exit 0
  fi
  echo "❌ Spec Kit governance check: no changed task feature artifacts were found." >&2
  if [[ "${SPEC_KIT_PR_AUTHOR:-}" == "$DEPENDABOT_PR_AUTHOR" ]]; then
    echo "Dependabot maintenance exemption not applied: $DEPENDABOT_EXEMPTION_BLOCKER" >&2
  fi
  if [[ -z "$BASE_REF" ]]; then
    echo "No comparison base was found, so committed artifacts cannot be proven current." >&2
    echo "Fetch the base branch or set SPEC_KIT_BASE_REF. The gate fails closed." >&2
  fi
  echo "Expected spec.md, plan.md, and tasks.md together under specs/<feature>/ or .specify/features/<feature>/." >&2
  exit 1
fi

FEATURE_DIR="${CANDIDATE_DIRS[0]}"
for artifact in spec plan tasks; do
  artifact_path="$FEATURE_DIR/$artifact.md"
  if ! contains "$artifact_path" "${CHANGED_PATHS[@]}"; then
    echo "❌ Spec Kit governance check: required artifact was not changed for this task: $REPO_ROOT/$artifact_path" >&2
    exit 1
  fi
  if [[ ! -s "$REPO_ROOT/$artifact_path" ]]; then
    echo "❌ Spec Kit governance check: required artifact is missing or empty: $REPO_ROOT/$artifact_path" >&2
    exit 1
  fi
  echo "✅ Verified changed artifact: $REPO_ROOT/$artifact_path"
done

echo "✅ Spec Kit task artifacts verified and current: $REPO_ROOT/$FEATURE_DIR"
