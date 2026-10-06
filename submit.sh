#!/bin/bash
gh pr edit --title "$(cat pr_title.txt)" --body-file pr_description.txt
