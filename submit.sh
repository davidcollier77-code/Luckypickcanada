#!/bin/bash
git add FINAL_REPORT.md
git commit -m "docs: Add final report for DNS authentication investigation"
git push
gh pr create --title "docs: Add final report for DNS authentication investigation" --body-file FINAL_REPORT.md
