SELECTED TASK GROUP: security
GROUP REASON: Task relates to fixing security bot verification (Cloudflare Turnstile) implementation which frequently breaks from visual rendering interactions on the site.

LIBRARY: /marsidev/react-turnstile
VERSION: 2be6ab9a5570b9edc3edd91f73531fc2e9d11251
USED: YES
USEFUL: YES
REASON: Replaced the manual implementation of Turnstile with the robust, official `@marsidev/react-turnstile` wrapper. This implementation is resilient to unmounts and hydration differences.

DOCUMENT: .docs/security/_marsidev_react-turnstile.md
USED: YES
USEFUL: YES
REASON: Consulted documentation for the `@marsidev/react-turnstile` integration to learn usage pattern (`<Turnstile />`, API options like `onSuccess` vs `callback`, passing refs).

COMPONENT: app/turnstile-field.js
USED: YES
USEFUL: YES
REASON: Rewrote this component to delegate loading and integration to `@marsidev/react-turnstile` instead of raw, error-prone direct global variable and vanilla JS script interaction.

COMPONENT: package.json
USED: YES
USEFUL: YES
REASON: Added `@marsidev/react-turnstile` (version 1.6.1) as a dependency.

IMPLEMENTATION:
1. Replaced the manual loading mechanism for `window.turnstile` in `app/turnstile-field.js` with the robust `<Turnstile />` component provided by `@marsidev/react-turnstile`.
2. Preserved the existing form submission UX (disabling submission button until loaded/verified).
3. The new approach correctly handles cleanup, hydration, and lifecycle issues automatically, isolating Turnstile initialization from unrelated React render cycles on the homepage.

EXACT FINAL DIFF RECONCILIATION:
- package.json
- pnpm-lock.yaml
- app/turnstile-field.js

VERIFICATION:
COMMAND: pnpm test
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: `5 passed (42)` tests successfully passed indicating no regressions in logic or spam-protection test suites.

COMMAND: pnpm run build
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: `Compiled successfully`, build size check passed (well under 495 MB).

COMMAND: ./jules-verify.sh
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Type Check, Build Check, and Refresh Docs Tests successfully executed with 0 failures.

REMAINING ISSUES: None. Pre-submission double-check completed.
USEFUL RESULT: YES
