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

if [[ ${#CANDIDATE_DIRS[@]} -eq 0 ]]; then
  echo "❌ Spec Kit governance check: no changed task feature artifacts were found." >&2
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
