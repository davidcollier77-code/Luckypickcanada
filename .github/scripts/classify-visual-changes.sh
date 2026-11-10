#!/usr/bin/env bash
# classify-visual-changes.sh — decide whether a pull request needs the
# Chromium/Playwright visual QA job.
#
# Usage:
#   git diff --name-only BASE...HEAD | bash .github/scripts/classify-visual-changes.sh
#
# Reads repository-relative changed paths, one per line, from standard input and
# prints exactly one line on standard output: `visual_required=true` or
# `visual_required=false`. Diagnostics go to standard error.
#
# The classifier fails closed. Only known non-rendering paths may skip visual QA:
# Markdown files, the specs/, memory-bank/ and .docs/ trees, the Spec Kit feature
# pointer, the classifier implementation itself, and unit tests directly under
# __tests__/. Browser/e2e tests under tests/ and all unknown paths still request visual QA.

set -euo pipefail

non_rendering_path() {
  case "$1" in
    *.md) return 0 ;;
    specs/* | memory-bank/* | .docs/*) return 0 ;;
    .specify/feature.json | .github/scripts/classify-visual-changes.sh) return 0 ;;
    __tests__/*.test.js | __tests__/*.test.jsx | __tests__/*.test.ts | __tests__/*.test.tsx) return 0 ;;
  esac
  return 1
}

visual_required=false
reviewed=0
first_visual_path=""

while IFS= read -r path || [[ -n "$path" ]]; do
  # Tolerate CRLF input from a Windows checkout.
  path="${path%$'\r'}"
  [[ -z "$path" ]] && continue
  reviewed=$((reviewed + 1))
  if non_rendering_path "$path"; then
    continue
  fi
  visual_required=true
  if [[ -z "$first_visual_path" ]]; then
    first_visual_path="$path"
  fi
done

if [[ "$reviewed" -eq 0 ]]; then
  echo "classify-visual-changes: no changed paths were supplied; requesting visual QA (fail closed)." >&2
  echo "visual_required=true"
  exit 0
fi

if [[ "$visual_required" == "true" ]]; then
  echo "classify-visual-changes: ${reviewed} changed path(s) reviewed; '${first_visual_path}' is not positively classified as non-rendering, so visual QA is required." >&2
else
  echo "classify-visual-changes: ${reviewed} documentation-only path(s) reviewed; visual QA is not required." >&2
fi

echo "visual_required=${visual_required}"
