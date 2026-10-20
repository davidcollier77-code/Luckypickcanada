#!/usr/bin/env bash
# Fail-closed Spec Kit gate. Resolve the task from changed artifacts, not the
# shared per-checkout .specify/feature.json pointer.
set -euo pipefail

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

# Resolve a comparison base. GitHub Actions pull_request checkouts are often
# shallow and may contain only the PR merge ref, so fetch the event's base when
# necessary instead of silently missing committed task artifacts.
BASE_REF="${SPEC_KIT_BASE_REF:-}"
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
if [[ -n "$BASE_REF" ]] && ! git -C "$REPO_ROOT" rev-parse --verify --quiet "${BASE_REF}^{commit}" >/dev/null; then
  echo "❌ Spec Kit governance check: comparison base '$BASE_REF' is not a valid commit." >&2
  exit 1
fi

# Merge committed branch changes, staged/unstaged changes, and untracked files.
# A task feature is valid only when all three canonical artifacts changed in
# the same feature directory during this task.
declare -A changed_paths=()
if [[ -n "$BASE_REF" ]]; then
  if ! branch_changes="$(git -C "$REPO_ROOT" diff --name-only "${BASE_REF}...HEAD")"; then
    echo "❌ Spec Kit governance check: could not compare HEAD with '$BASE_REF'." >&2
    echo "Fetch the base branch or set SPEC_KIT_BASE_REF to a valid task base." >&2
    exit 1
  fi
  while IFS= read -r path; do
    [[ -n "$path" ]] && changed_paths["$path"]=1
  done <<< "$branch_changes"
fi
while IFS= read -r path; do
  [[ -n "$path" ]] && changed_paths["$path"]=1
done < <(
  {
    git -C "$REPO_ROOT" diff --name-only
    git -C "$REPO_ROOT" diff --cached --name-only
    git -C "$REPO_ROOT" ls-files --others --exclude-standard
  } | sort -u
)

declare -A candidate_dirs=()
for path in "${!changed_paths[@]}"; do
  if [[ "$path" =~ ^(specs/[^/]+|\.specify/features/[^/]+)/(spec|plan|tasks)\.md$ ]]; then
    candidate_dirs["${BASH_REMATCH[1]}"]=1
  fi
done

# Reject even a partial second feature: otherwise a complete feature could mask
# accidental task artifacts left behind in another directory.
if [[ ${#candidate_dirs[@]} -gt 1 ]]; then
  printf '❌ Spec Kit governance check: multiple task feature directories changed:\n' >&2
  printf ' - %s\n' "${!candidate_dirs[@]}" >&2
  echo "Keep one feature directory per task/PR. Do not combine or duplicate task artifacts." >&2
  exit 1
fi

valid_dirs=()
for dir in "${!candidate_dirs[@]}"; do
  valid=true
  for artifact in spec plan tasks; do
    artifact_path="$dir/$artifact.md"
    if [[ -z "${changed_paths[$artifact_path]:-}" || ! -s "$REPO_ROOT/$artifact_path" ]]; then
      valid=false
      break
    fi
  done
  [[ "$valid" == true ]] && valid_dirs+=("$dir")
done

if [[ ${#valid_dirs[@]} -eq 0 ]]; then
  echo "❌ Spec Kit governance check: no single task feature has all three non-empty artifacts changed for this task." >&2
  echo "Expected spec.md, plan.md, and tasks.md together under specs/<feature>/ or .specify/features/<feature>/." >&2
  echo "The gate no longer relies on .specify/feature.json because it is machine-local and causes cross-PR conflicts." >&2
  if [[ -z "$BASE_REF" ]]; then
    echo "No comparison base was found; fetch main or set SPEC_KIT_BASE_REF to the task's base branch." >&2
  fi
  exit 1
fi

if [[ ${#valid_dirs[@]} -gt 1 ]]; then
  printf '❌ Spec Kit governance check: multiple task feature directories changed:\n' >&2
  printf ' - %s\n' "${valid_dirs[@]}" >&2
  echo "Keep one feature directory per task/PR. Do not combine or duplicate task artifacts." >&2
  exit 1
fi

FEATURE_DIR="${valid_dirs[0]}"
for artifact in spec plan tasks; do
  echo "✅ Verified changed artifact: $REPO_ROOT/$FEATURE_DIR/$artifact.md"
done
echo "✅ Spec Kit task artifacts verified and current: $REPO_ROOT/$FEATURE_DIR"
