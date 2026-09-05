#!/bin/bash
# jules-verify.sh
# A local zero-cost verification script to validate builds and configurations.
# This script should be run before finalizing code changes.

echo "Starting verification..."

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

echo -e "
