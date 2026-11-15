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
# The classifier fails closed. Known non-rendering paths may skip visual QA:
# documentation/task records, agent skill and Playwright documentation, CI
# configuration and scripts, backend API route handlers, the classifier itself,
# unit tests directly under __tests__/, and standalone Playwright configuration
# files that CI visual QA does not use. Frontend application paths, browser/e2e
# tests, the QA Playwright configuration, visual assets and unknown paths still
# request visual QA.
#
# package.json is never exempt by path. It is non-rendering only when the caller
# positively establishes, with PACKAGE_JSON_SCRIPTS_ONLY=true, that the manifest
# changed solely in test/tooling scripts (see package-json-scripts-only.mjs).
# Dependencies, exports, engines, pnpm overrides, build/dev lifecycle scripts,
# an unknown script name, or a missing/unreadable determination keep visual QA.

set -euo pipefail

non_rendering_path() {
  case "$1" in
    # Documentation at any depth, task records and the reference library.
    *.md) return 0 ;;
    specs/* | memory-bank/* | .docs/*) return 0 ;;

    # Agent skill documentation, including the vendored Playwright CLI skill and
    # its reference material. Agents read these files; the Next.js build never
    # bundles them and they cannot change rendered output.
    .agents/skills/*) return 0 ;;

    # Repository automation, QA checkers and backend API route handlers.
    .specify/feature.json | .github/* | app/api/* | pages/api/*) return 0 ;;

    # Unit-test-only changes under __tests__/.
    __tests__/*.test.js | __tests__/*.test.jsx | __tests__/*.test.ts | __tests__/*.test.tsx) return 0 ;;

    # The Playwright configuration the visual QA job runs stays on the visual
    # path: a change there changes how the committed baselines are produced.
    playwright.config.ts) return 1 ;;

    # Standalone Playwright configurations (for example the opt-in SwiftShader
    # investigation configuration) are not used by the CI visual QA job and do
    # not affect the application's rendered output.
    playwright.*.config.ts | playwright-*.config.ts) return 0 ;;

    # package.json is decided by the manifest comparison supplied by the caller.
    package.json)
      [[ "${PACKAGE_JSON_SCRIPTS_ONLY:-}" == "true" ]]
      return
      ;;
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
  echo "classify-visual-changes: ${reviewed} known non-rendering path(s) reviewed; visual QA is not required." >&2
fi

echo "visual_required=${visual_required}"
