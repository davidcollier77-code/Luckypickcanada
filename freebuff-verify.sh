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

echo -e "\n✅ All verification steps passed. Remember to also verify actual user-facing behavior in the browser if applicable!"
