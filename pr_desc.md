## What changed
- **Fetch Deadline & Size Limits**: `fetchWithRedirects()` now enforces a 45-second hard deadline for the entire request using `setTimeout` to call `req.destroy()`, rather than relying solely on the socket timeout. It also actively tracks downloaded bytes and aborts if the response exceeds the 50MB safety limit during the streaming phase.
- **Manifest Atomic Saving**: `saveManifest()` now writes to `manifest.json.tmp` and uses `fs.renameSync` to atomically commit it to `manifest.json`, eliminating the possibility of corruption on crash.
- **Test Coverage**: Created 5 new tests in `scripts/test-refresh-docs.js` verifying the exact oversized response tracking, hard timeout behavior, ambiguous ref fallback, explicit ref overrides, and context7 ID parsing.
- **Network Safety**: `fetchWithRedirects()` correctly bounds redirects to a maximum of 5, handles relative path redirects, and correctly rejects any non-200 responses to prevent writing 404/500 HTML pages as documentation.

## Files changed
- `scripts/refresh-docs.js`
- `scripts/test-refresh-docs.js`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

## Testing & Verification
- Validated fixes directly against `scripts/refresh-docs.js` codebase.
- Executed `./jules-verify.sh`, successfully building Next.js and passing type checks without any Neon database or MCP dependency injected into the script or workflow.
- 19 automated unit tests passed testing all fetch safety boundaries and GitHub logic edge cases.
- Validated that `memory-bank` edits reflect only what was genuinely verified without erasing preceding progress.
