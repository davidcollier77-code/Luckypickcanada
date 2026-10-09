#!/bin/bash
# jules-verify.sh
# A local zero-cost verification script to validate builds and configurations.
# This script should be run before finalizing code changes.

echo "Starting verification..."

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\n--- Testing Spec Kit Governance Gate ---"
if ! bash "$SCRIPT_DIR/scripts/test-verify-speckit-task.sh"; then
  echo "❌ Spec Kit governance gate tests failed; remaining verification was not run." >&2
  exit 1
fi

# Enforce task-level Spec Kit artifacts before build/test verification.
# The scheduled Spec Kit updater calls this script in GitHub Actions but is
# not a Jules task; this one known automation workflow is the only exemption.
if [[ "${GITHUB_ACTIONS:-}" == "true" && "${GITHUB_WORKFLOW:-}" == "Update Spec Kit" ]]; then
  echo "Skipping task-local Spec Kit artifact gate for the automated Update Spec Kit workflow."
else
  if ! bash "$SCRIPT_DIR/scripts/verify-speckit-task.sh"; then
    echo "❌ Spec Kit governance check failed; remaining verification was not run." >&2
    exit 1
  fi
fi

# Type Check (TypeScript)
echo -e "
--- Running Type Check ---"
pnpm tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Type check failed."
  return 1 2>/dev/null || builtin exit 1
fi

# Build Check (Next.js)
echo -e "
--- Running Build Check ---"
pnpm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed."
  return 1 2>/dev/null || builtin exit 1
fi

echo -e "\n--- Running Refresh Docs Tests ---"
node scripts/test-refresh-docs.js
if [ $? -ne 0 ]; then
  echo "❌ Refresh Docs Tests failed."
  return 1 2>/dev/null || builtin exit 1
fi

echo -e "
✅ All verification steps passed. Remember to also verify actual user-facing behavior in the browser if applicable!"
