#!/usr/bin/env bash
# verify-playwright-cache.sh — decide whether a restored Playwright cache really
# contains a runnable Chromium build.
#
# Usage: verify-playwright-cache.sh [browser-root]
# Prints exactly one line: `ready=true` or `ready=false`.
#
# The workflow cache is keyed by the installed Playwright version, but a partial
# or corrupt archive can still restore "successfully" with no browser inside it.
# CI uses this check so that case falls back to an explicit install instead of
# failing every visual test at launch time.
#
# Read-only: it inspects the cache directory and never downloads or mutates it.
set -euo pipefail

root="${1:-${HOME:-}/.cache/ms-playwright}"

ready=false
if [[ -d "$root" ]]; then
  # Chromium lives at <root>/chromium-<revision>/<platform>/chrome and the
  # headless shell at <root>/chromium_headless_shell-<revision>/<platform>/...
  while IFS= read -r candidate; do
    if [[ -x "$candidate" ]]; then
      ready=true
      break
    fi
  done < <(find "$root" -maxdepth 3 -type f \( -name 'chrome' -o -name 'headless_shell' \) 2>/dev/null || true)
fi

printf 'ready=%s\n' "$ready"
