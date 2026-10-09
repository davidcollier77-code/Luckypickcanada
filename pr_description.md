SELECTED TASK GROUP: troubleshooting
GROUP REASON: Task involves diagnosing and permanently fixing a recurring security integration failure involving Cloudflare Turnstile, OpenNext deployment configuration, and React component recovery.

## LIBRARY CONSULTATION REPORT
LIBRARY: @marsidev/react-turnstile
VERSION: 1.6.1
USED: YES
USEFUL: YES
REASON: Inspected `SKILL.md` and type definitions (`index.d.ts`) to understand `action` mapping, error handling, `scriptOptions`, and the component's inability to retry failed script injection without a full remount.

LIBRARY: Cloudflare Turnstile
VERSION: latest
USED: YES
USEFUL: YES
REASON: Consulted `.docs/troubleshooting/_cloudflare_cloudflare-docs_turnstile.md` to verify supported features and error code mapping.

LIBRARY: Cloudflare Workers SDK (Wrangler)
VERSION: 4.141.0
USED: YES
USEFUL: YES
REASON: Investigated `wrangler deploy --help` to identify the `--keep-vars` flag needed to prevent dashboard-managed environment variables from being wiped on OpenNext deployments.

## ROUTED JULES/GEMINI DOCUMENT REPORT
DOCUMENT: .jules/troubleshooting.md
USED: YES
USEFUL: YES
REASON: Followed the prescribed troubleshooting instructions and verified all necessary components.

DOCUMENT: .jules/jules.md
USED: YES
USEFUL: YES
REASON: Read the initialization directives and correctly managed MCP approvals and project boundaries.

DOCUMENT: AGENTS.md
USED: YES
USEFUL: YES
REASON: Ensured strict adherence to all governance boundaries and pre-submission checks, particularly around protected configuration files and the PR summary.

## REPOSITORY COMPONENT REPORT
COMPONENT: .github/workflows/deploy-open-next.yml
USED: YES
USEFUL: YES
REASON: Modified to apply `--keep-vars` for `wrangler deploy` to preserve `NEXT_PUBLIC_TURNSTILE_SITE_KEY` across deployments.

COMPONENT: app/spam-protection.js
USED: YES
USEFUL: YES
REASON: Hardened the server-side verification logic to enforce `result.hostname` against production hostnames and ensure `result.action` matches `formName`.

COMPONENT: app/turnstile-field.jsx
USED: YES
USEFUL: YES
REASON: Improved the script failure recovery mechanism by introducing a `retryKey` that forces React to remount the Turnstile widget instead of executing a no-op `.reset()`. Passed the `action` prop down.

COMPONENT: app/turnstile-field.test.jsx
USED: YES
USEFUL: YES
REASON: Updated to cover the new `action` prop implementation and the React `key` state.

COMPONENT: app/spam-protection.test.js
USED: YES
USEFUL: YES
REASON: Created this new test file to guarantee comprehensive coverage of the hardened server-side validation logic (hostname mismatch, action mismatch, etc.).

## EXACT FINAL DIFF RECONCILIATION
- `.github/workflows/deploy-open-next.yml`
- `app/homepage/HomePage.js`
- `app/lucky-map-of-canada/lucky-map-of-canada.js`
- `app/spam-protection.js`
- `app/spam-protection.test.js`
- `app/turnstile-field.jsx`
- `app/turnstile-field.test.jsx`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

## VERIFICATION
COMMAND: `pnpm test`
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: `app/spam-protection.test.js` executed 5 tests covering missing tokens, unsuccessful verifications, invalid hostnames, invalid actions, and successful verifications. Total 67 tests passed.

COMMAND: `pnpm run build`
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Completed successfully.

COMMAND: `pnpm exec playwright test`
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Visual browser tests executed seamlessly confirming visual UI fidelity across viewports. Total 12 tests passed, 3 skipped.

COMMAND: `./jules-verify.sh`
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Script executed all pre-commit governance and build verifications smoothly.

USEFUL RESULT: YES
