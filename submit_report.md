## Files changed
- `.docs/manifest.json`
- `scripts/refresh-docs.js`
- `fix_refresh_docs.py` (Deleted)
- `fix_script.js` (Deleted)

## Documentation actually consulted
- **Jules documentation:** `jules_google_docs.md`, `developers_google_com_jules_api.md`
- **Gemini documentation:** `_websites_ai_google_dev_gemini-api.md`, `_google-gemini_gemini-cli.md`
- **ScepKit AI reasoning / agent-helper documentation:** None. (Not present in repository).
- **Deep Dive documentation:** `.jules/deep-dive.md`
- **Troubleshooting/diagnostic documentation:** `.jules/troubleshooting.md`, `AGENTS.md` (to verify governance instructions regarding documentation sources and Context7 restrictions).
- **Other relevant local ".docs" resources:** None.

## MCP usage
- None.

## Context7
Context7: NOT USED — prohibited for this task.

## Verification
- Verified both modified README raw URLs (`react-hook-form/resolvers` and `emilkowalski/sonner`) via `curl` - confirmed HTTP 200 responses.
- Verified the removal of the 5-minute wait and polling logic, replaced exactly with a single 60-second retry.
- Verified that a non-fitting resource correctly defers to `deferredUpdates` without blocking the rest of the queue.
- Verified the capacity remains strictly `495 * 1024 * 1024`.
- Verified deterministic termination (no infinite loops) if no deferred items can fit.
- Ran `./jules-verify.sh`, including type checks and Next.js builds. All checks passed.
