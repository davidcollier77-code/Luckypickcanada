1. **Fix `getUpstreamSha` to be branch-aware**:
   - Update `getUpstreamSha(lib, sourceConfig)` to extract the branch from `sourceConfig.url` when the domain is `raw.githubusercontent.com`.
   - The path is usually `/owner/repo/branch/path/to/file`. We'll split the path to get the branch (the 3rd segment after owner and repo).
   - Make the GitHub API request to `/repos/${org}/${repo}/commits/${branch}` instead of `/repos/${org}/${repo}/commits/HEAD`.
   - If not a GitHub raw URL, or if we cannot determine the branch, return `null`.

2. **Fix `fetchDocumentation` redirects and HTTP handling**:
   - Rewrite it to use a helper function to manage redirects with a max count (e.g. 5).
   - Maintain the `User-Agent: LuckyPickCanada-DocsUpdater/1.0` header on redirects.
   - For a 3xx response with `Location`, construct the absolute URL properly and retry.
   - For non-2xx responses, explicitly throw an error (e.g. `reject(new Error(...))`).

3. **Fix Retry log**:
   - Change `Waiting 5 minutes` to `Waiting 60 seconds` (in `scripts/refresh-docs.js`).

4. **Correct the flow in `refresh-docs.js`**:
   - Retrieve `const sourceConfig = sourcesConfig[lib];` early.
   - Update the call `await getUpstreamSha(lib)` to `await getUpstreamSha(lib, sourceConfig)`.

5. **Fix the stale description in the workflow (`.github/workflows/refresh-docs.yml`)**:
   - Replace "approved 46-library inventory" with "approved library inventory".

6. **Add the 6 missing libraries to `.docs/manifest.json`** using verified URLs:
   - `"/marsidev/react-turnstile"` (security)
     - `https://raw.githubusercontent.com/marsidev/react-turnstile/main/README.md`
   - `"/upstash/ratelimit"` (security)
     - `https://raw.githubusercontent.com/upstash/ratelimit/main/README.md`
   - `"/pmndrs/react-three-fiber"` (creation - requested ANIMATION / GRAPHICS)
     - `https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/readme.md`
   - `"/websites/neon"` (troubleshooting - requested BACKEND / DATABASE)
     - `https://neon.com/docs/llms.txt`
   - `"/magicuidesign/magicui"` (polishing - requested FRONTEND / NEXT.JS / REACT)
     - `https://raw.githubusercontent.com/magicuidesign/magicui/main/README.md`
   - `"/posthog/posthog-js"` (deep-dive - requested STATE / DATA / ANALYTICS)
     - `https://raw.githubusercontent.com/PostHog/posthog-js/main/README.md`

7. **Verify no Sonner duplication**:
   - Use `grep -c '"/emilkowalski/sonner"' .docs/manifest.json` to verify the entry exists exactly once in the inventory array (and once in groups/sources/githubShas as appropriate). We will make sure we don't accidentally duplicate it.

8. **Run Verification and Tests**:
   - Run `node scripts/refresh-docs.js` to confirm it successfully fetches the new documentation, correctly skips unmodified docs, handles redirects correctly, respects the 495 MB limit, and produces a successful refresh report.
   - Run local validation `./jules-verify.sh`.

9. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

10. Submit report and create PR.
