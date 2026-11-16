#!/usr/bin/env bash
# Publish or update one sticky pull request comment.
#
# The body must begin with the checker's marker so a re-run updates the comment
# developers already have instead of adding another one. An unmarked or oversized
# body is refused, never truncated, so a finding and its suggested fix cannot be
# cut in half.
#
# Usage: upsert_pr_comment.sh <marker> <body-file>
# Environment: GH_TOKEN, REPOSITORY, PR_NUMBER
set -euo pipefail

marker="${1:?marker is required}"
body_file="${2:?body file is required}"

if [[ ! -s "$body_file" ]]; then
  echo "::warning::No comment body was rendered; nothing to publish."
  exit 0
fi

if [[ "$(head -n 1 "$body_file")" != "$marker" ]]; then
  echo "::error::Comment body does not start with its sticky marker ($marker)."
  exit 1
fi

size=$(wc -c < "$body_file")
if (( size > 60000 )); then
  echo "::error::Comment body is $size bytes, above the 60000-byte limit."
  exit 1
fi

export MARKER="$marker"
existing="$(
  gh api --paginate "repos/${REPOSITORY}/issues/${PR_NUMBER}/comments" \
    --jq '.[] | select(.body | startswith(env.MARKER)) | .id' | head -n 1
)"

if [[ -n "$existing" ]]; then
  gh api -X PATCH "repos/${REPOSITORY}/issues/comments/${existing}" \
    -F body=@"$body_file" > /dev/null
  echo "Updated sticky comment ${existing}."
else
  gh api -X POST "repos/${REPOSITORY}/issues/${PR_NUMBER}/comments" \
    -F body=@"$body_file" > /dev/null
  echo "Created a new sticky comment."
fi
