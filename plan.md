1. **Fix `getUpstreamSha` in `scripts/refresh-docs.js`**:
   - For raw GitHub URLs, strip `/owner/repo/` from the path.
   - If `sourceConfig.branch` or `sourceConfig.ref` is provided, use it.
   - Otherwise, check if the remaining path starts with a known standard branch (`main/`, `master/`, `canary/`, `develop/`, `production/`). If so, use that branch.
   - If it doesn't match a known branch and has no explicit metadata, return `null` to safely fallback to byte comparison.
   - Fix the duplicate `sourceConfig` validation in `refresh-docs.js`.
   - In `fetchDocumentation`, before following a redirect, call `res.resume()` to drain the response.

2. **Update Tests (`scripts/test-refresh-docs.js` and `jules-verify.sh`)**:
   - Update the redirect limit test to assert that `requestedUrls.length` is exactly the max redirects + 1.
   - Add `node scripts/test-refresh-docs.js` to `./jules-verify.sh` so it runs during normal CI.
   - Add a `scripts/test-manifest.js` test suite (recreating the lost manifest tests) and wire it into `./jules-verify.sh`.

3. **Update `manifest.json` SHAs**:
   - Fetch the current `main` commit SHAs for the newly added GitHub raw sources (like turnstile, upstash, magicui, posthog) and add them to `githubShas` in `.docs/manifest.json`.

4. **Fix `.docs/deep-dive/_posthog_posthog-js.md`**:
   - Fix the contributor badge to point to `posthog/posthog-js` instead of potentially incorrect one.
   - Fix broken relative links to package files and `CONTRIBUTING.md` using absolute upstream GitHub URLs.

5. **Fix `.docs/troubleshooting/_websites_neon.md`**:
   - Fix duplicated `production-readiness.md` title/summary.

6. **Fix `.docs/security/_upstash_ratelimit.md`**:
   - Remove client-side guidance exposing the REST token.
   - Make the example server-side.
   - Document `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
   - Fix the TypeScript example (`return` inside a handler).

7. **Fix `.docs/polishing/_magicuidesign_magicui.md`**:
   - Change Discord/community link to HTTPS.

8. **Fix `.docs/security/_marsidev_react-turnstile.md`**:
   - Add `alt` text to the npm badge.
   - Add `import type { FormEvent } from 'react';` to make the TS example compile.
   - Replace relative LICENSE link with absolute upstream URL.
   - Remove `sealed_token` in Star History URLs. In `refresh-docs.js`, add a sanitization step to strip `sealed_token=...` from downloaded docs.

9. **Fix `.docs/creation/_pmndrs_react-three-fiber.md`**:
   - Correct the React Native instructions to use stable React 18 versions instead of prerelease.

10. **Final Verification**:
   - Run `./jules-verify.sh`.
   - Verify all tests pass, limits are respected, and no secrets are exposed.
