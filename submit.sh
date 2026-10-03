#!/bin/bash
# Submits the DNS/email-authentication report branch: commit every reporting file,
# push the branch with an explicit upstream, then open the PR only if one is missing.
set -euo pipefail

TITLE="docs: Add final report for DNS authentication investigation"
REPORT_FILES=(
  FINAL_REPORT.md
  pr_description.md
  pr_description_clean.md
  pr_summary.md
  submit.sh
)

git add "${REPORT_FILES[@]}"

if git diff --cached --quiet; then
  echo "No staged changes in ${REPORT_FILES[*]}; nothing to commit."
else
  git commit -m "$TITLE"
fi

# -u origin HEAD sets/updates the upstream so a freshly created branch pushes
# instead of failing with "has no upstream branch".
git push -u origin HEAD

# gh pr create fails with "a pull request for branch ... already exists" once the
# branch is pushed and a PR is open, so only create when none exists.
if gh pr view --json number,state >/dev/null 2>&1; then
  echo "A pull request already exists for $(git rev-parse --abbrev-ref HEAD); skipping creation."
else
  gh pr create --title "$TITLE" --body-file FINAL_REPORT.md
fi