#!/bin/bash
# freebuff-verify.sh
# A local zero-cost verification script to validate builds and configurations.
# This script should be run before finalizing code changes.

echo "Starting verification..."

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo -e "\n--- Bootstrapping the pinned package manager ---"
# Fails closed when package.json stops pinning pnpm, when the pinned version
# cannot be provisioned, or when node_modules no longer matches the lockfile.
source "$SCRIPT_DIR/scripts/bootstrap-pnpm.sh" || { echo "Bootstrap failed." >&2; exit 1; }
if ! pnpm install --frozen-lockfile; then
  echo "❌ pnpm install --frozen-lockfile failed; dependencies do not match pnpm-lock.yaml." >&2
  exit 1
fi

echo -e "\n--- Testing Spec Kit Governance Gate ---"
if ! bash "$SCRIPT_DIR/scripts/test-verify-speckit-task.sh"; then
  echo "❌ Spec Kit governance gate tests failed; remaining verification was not run." >&2
  exit 1
fi

# Enforce task-level Spec Kit artifacts before build/test verification.
# The scheduled Spec Kit updater runs this script outside an interactive coding task.
# That workflow is exempt from task-local Spec Kit artifact checks.
if [[ "${GITHUB_ACTIONS:-}" == "true" && "${GITHUB_WORKFLOW:-}" == "Update Spec Kit" ]]; then
  echo "Skipping task-local Spec Kit artifact gate for the automated Update Spec Kit workflow."
else
  if ! bash "$SCRIPT_DIR/scripts/verify-speckit-task.sh"; then
    echo "❌ Spec Kit governance check failed; remaining verification was not run." >&2
    exit 1
  fi
fi

echo -e "\n--- Testing QA Infrastructure Checkers ---"
# Every checker suite: current-head integrity, the consolidated report, the
# AGENTS.md classifier, scope/protected files, DevSkim summarization, review
# findings, install timings and change applicability. A skipped or earlier
# commit's check is still proven NOT RUN, never a pass.
if ! python3 -m unittest discover -s "$SCRIPT_DIR/.github/scripts" -p 'test_*.py'; then
  echo "❌ QA infrastructure checker tests failed; remaining verification was not run." >&2
  exit 1
fi

# Type Check (TypeScript)
echo -e "\n--- Running Type Check ---"
if ! pnpm exec tsc --noEmit; then
  echo "❌ Type check failed; remaining verification was not run." >&2
  exit 1
fi

# Full unit suite: the same broad regression net CI runs. Selective execution
# is deliberately not applied here or there; it is only used for the provably
# path-dependent browser and build checks.
echo -e "\n--- Running Full Unit Test Suite ---"
if ! pnpm run test; then
  echo "❌ Unit test suite failed; remaining verification was not run." >&2
  exit 1
fi

# Build Check (Next.js; not the OpenNext artifact and never a deployment)
echo -e "\n--- Running Build Check ---"
if ! pnpm run build; then
  echo "❌ Build failed; remaining verification was not run." >&2
  exit 1
fi

echo -e "\n--- Checking Production Build Size (under 495 MiB) ---"
# POSIX `du -sk` keeps this portable; CI measures the exact byte total with
# `du -sb` in the protected OpenNext workflow.
if ! size_bytes="$(du -sk .next public | awk '{total += $1} END {printf "%.0f", total * 1024}')"; then
  echo "❌ The production build size could not be measured." >&2
  exit 1
fi
max_bytes=$((495 * 1024 * 1024))
size_mib="$(awk -v bytes="$size_bytes" 'BEGIN {printf "%.2f", bytes / 1024 / 1024}')"
printf 'Combined .next + public: %s bytes (%s MiB)\n' "$size_bytes" "$size_mib"
if (( size_bytes >= max_bytes )); then
  echo "❌ Combined .next + public reached or exceeded 495 MiB." >&2
  exit 1
fi

echo -e "\n--- Running Refresh Docs Tests ---"
if ! node scripts/test-refresh-docs.js; then
  echo "❌ Refresh Docs Tests failed; remaining verification was not run." >&2
  exit 1
fi

echo -e "\n✅ All verification steps passed."
echo "Before opening the pull request, re-read PR_SUBMISSION.md as the final submission checklist."
echo "Covered here: frozen install, Spec Kit gate, all Python checker suites, TypeScript, the full Vitest suite,"
echo "the Next.js build and the 495 MiB size cap."
echo "Not covered here: Playwright/Visual QA, the OpenNext artifact build, DevSkim and deployment."
echo "Those run in GitHub Actions after PR creation; submitters do not need to supply browser evidence."
