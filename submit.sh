#!/bin/bash
set -euo pipefail
git add FINAL_REPORT.md
git commit -m "docs: Add final report for DNS authentication investigation"
git push -u origin HEAD
# Only applies when no pull request exists yet for this branch.
gh pr create --title "docs: Add final report for DNS authentication investigation" --body-file FINAL_REPORT.md
