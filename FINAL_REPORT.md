# Documentation Refresh Optimization Report

## Task Group & Library Usage
- **Task Group**: Deep Dive / Investigation (System configuration & GitHub actions)
- **Libraries Consulted / Used**:
  - `AGENTS.md` - Used to determine repository governance, limitations, and routing instructions.
  - `.jules/investigation.md` - Used to understand requirements for surgical changes without unrelated refactoring.
  - `jules.google/docs` - Primary reference for Context7 documentation workflows and manifest structures.
  - `developers.google.com/jules/api` - Reference for CI requirements.

## Modifications Made
1. **`scripts/refresh-docs.js` Updated**:
   - Added `https` requirement to make direct API calls to GitHub.
   - Introduced `getUpstreamSha(lib)` helper function to detect Context7 IDs that map to GitHub repositories (e.g. `/vercel/next.js`) and fetch their current `HEAD` commit SHA using the GitHub API (`https://api.github.com/repos/org/repo/commits/HEAD`). It correctly handles authentication if a `GITHUB_TOKEN` is present in the environment to avoid rate limits.
   - Enhanced the manifest structure (`.docs/manifest.json`) by extending it with a `githubShas` object to reliably map a library ID to its last successfully processed upstream commit SHA.
   - Injected the freshness check inside the primary loop: before fetching with `npx ctx7`, the system checks if the newly fetched `upstreamSha` strictly equals the stored `githubShas[lib]`. If it matches, the fetch is bypassed, a `skipped` counter is incremented, the inventory is updated, and the manifest is saved.
   - Updated the Context7 success block to update `githubShas[lib] = upstreamSha` in memory and persist it to `manifest.json`. The SHA is deliberately only saved *after* Context7 parsing and size limitations checks pass successfully. If a fetch fails, the SHA is not advanced.
   - Enhanced the reporting output to explicitly log "Skipped (no upstream change): ${stats.skipped}" separately from unchanged and failed results.
2. **Context7 Retry Logic**:
   - Enhanced the Context7 fetch step with a bounded 5-minute retry.
   - The first `execFileSync` attempt now sets a `fetchSuccess` flag.
   - On exception during the first attempt, the `catch` block pauses execution for exactly 5 minutes (`await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));`).
   - Immediately following the wait, a single identical `execFileSync` attempt is executed inside a nested `try...catch` block.
   - If the retry succeeds, `fetchSuccess` is set and the loop naturally continues to processing.
   - If the retry fails, the library is logged as an error, added to `stats.failed`, shifted from `pendingUpdates`, and the loop `continue`s directly to the next library without updating or persisting the GitHub SHA.
   - Verified that this logic does not affect or interact with the 495MB capacity loop or the pending/resume process.

## Verification
- Verified by inspecting the diff that the changes narrowly scope around checking `githubShas` and the single Context7 retry loop.
- Confirmed the 495MB limit calculation, pending logic, and error handling structure remain fully preserved.
- Executed `node scripts/refresh-docs.js` locally to observe the check fetching the repository commits and falling back as expected when Context7 fetches fail, including triggering the retry logic.
- Verified `./jules-verify.sh` passes successfully with Next.js build.
- Traced the control flow to guarantee no infinite retry loops can occur, no duplicate Context7 fetches happen, and the SHA only advances upon successful processing.
- The change exactly aligns with governance rules regarding surgical implementations and zero new package/dependency installations.
