# Implementation Plan

1. Modify `app/gift-email.js` to replace `Math.random().toString(36).slice(2)` with `crypto.randomUUID()` when generating `ownershipToken`.
2. Run format/lint checks.
3. Run test suite to ensure the change does not break functionality.
