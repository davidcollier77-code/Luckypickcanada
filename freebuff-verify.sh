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

echo -e "\n--- Testing Verification Status Integrity Checker ---"
# Proves skipped or unrun checks are reported NOT RUN, that checks from an
# earlier commit are never accepted as evidence for the current head, and that
# the bounded wait the report relies on follows the current head.
if ! python3 -m unittest discover -s "$SCRIPT_DIR/.github/scripts" -p 'test_verify_pr_verification_status.py'; then
  echo "❌ Verification status integrity tests failed; remaining verification was not run." >&2
  exit 1
fi

echo -e "\n--- Testing the Consolidated Report Contract ---"
# Proves the report waits, bounded, for the current head's applicable checks
# before reading evidence, and that the seven categories, declarations and
# publication behaviour are unchanged.
if ! python3 -m unittest discover -s "$SCRIPT_DIR/.github/scripts" -p 'test_pr_verification_report.py'; then
  echo "❌ Consolidated report contract tests failed; remaining verification was not run." >&2
  exit 1
fi

echo -e "\n--- Testing AGENTS.md Protection Classifier ---"
# Proves a dedicated governance pull request is allowed, an AGENTS.md edit in
# an unrelated pull request is refused, and a title or body cannot bypass it.
if ! python3 -m unittest discover -s "$SCRIPT_DIR/.github/scripts" -p 'test_agents_md_protection.py'; then
  echo "❌ AGENTS.md protection classifier tests failed; remaining verification was not run." >&2
  exit 1
fi

# Type Check (TypeScript)
echo -e "\n--- Running Type Check ---"
if ! pnpm exec tsc --noEmit; then
  echo "❌ Type check failed; remaining verification was not run." >&2
  exit 1
fi

# Build Check (Next.js)
echo -e "\n--- Running Build Check ---"
if ! pnpm run build; then
  echo "❌ Build failed; remaining verification was not run." >&2
  exit 1
fi

echo -e "\n--- Running Refresh Docs Tests ---"
if ! node scripts/test-refresh-docs.js; then
  echo "❌ Refresh Docs Tests failed; remaining verification was not run." >&2
  exit 1
fi

echo -e "\n✅ All verification steps passed."
echo "Before opening the pull request, re-read PR_SUBMISSION.md as the final submission checklist."
echo "Automated Playwright/Visual QA runs after PR creation; submitters do not need to supply browser evidence."
