#!/bin/bash
# submit.sh
# Stages, commits, pushes, and creates-or-updates the PR for the DNS report work.
# Safe to re-run: skips empty commits and reuses the existing PR for this branch.
#
# Usage: ./submit.sh [--dry-run]   # --dry-run prints commands without running them
set -euo pipefail

readonly TITLE="docs: Add final report for DNS authentication investigation"
readonly BODY_FILE="FINAL_REPORT.md"

# Every file this PR introduces or updates, not just the report itself.
readonly PR_FILES=(
  FINAL_REPORT.md
  pr_description.md
  pr_description_clean.md
  pr_summary.md
  submit.sh
)

die() {
  echo "submit.sh: $*" >&2
  exit 1
}

run() {
  if [ "${DRY_RUN:-false}" = "true" ]; then
    echo "dry-run: $*"
  else
    "$@"
  fi
}

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

# Run from the repository root regardless of the caller's directory.
cd "$(dirname "${BASH_SOURCE[0]}")"

for tool in git gh; do
  command -v "$tool" >/dev/null 2>&1 || die "required tool not found: $tool"
done
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not a git repository"
[ -f "$BODY_FILE" ] || die "PR body file not found: $BODY_FILE"

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" != "HEAD" ] || die "detached HEAD; check out a branch first"

# Stage the full file set, and fail loudly if the reported set drifts from the repo.
staged_paths=()
for path in "${PR_FILES[@]}"; do
  if [ -e "$path" ]; then
    staged_paths+=("$path")
  else
    die "expected PR file not found: $path"
  fi
done
run git add -- "${staged_paths[@]}"

# Commit only when something is actually staged, so re-runs are harmless no-ops.
if git diff --cached --quiet; then
  echo "submit.sh: no staged changes; skipping commit"
else
  run git commit -m "$TITLE"
fi

# Set the upstream explicitly: a fresh branch has none and bare `git push` fails.
run git push -u origin HEAD

# Reuse the open PR for this branch when one exists; otherwise create it.
# `gh pr view` also matches merged/closed PRs, so confirm the state is OPEN.
pr_state="$(gh pr view --json state --jq .state 2>/dev/null || true)"
if [ "$pr_state" = "OPEN" ]; then
  pr_number="$(gh pr view --json number --jq .number 2>/dev/null || true)"
  echo "submit.sh: updating existing PR #$pr_number"
  run gh pr edit --title "$TITLE" --body-file "$BODY_FILE"
else
  run gh pr create --title "$TITLE" --body-file "$BODY_FILE"
fi
