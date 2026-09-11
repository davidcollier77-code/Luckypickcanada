# Progress

- Completed deep dive of `scripts/refresh-docs.js` updater.
- Fixed `getUpstreamSha` to reliably identify GitHub repos directly from `sourceConfig.url`, eliminating hardcoded guessing and fallback parsing of Context7 identifiers. It now returns `null` correctly for non-GitHub URLs (e.g. `/websites/neon`), allowing fallback to safe byte-comparison.
- Fixed `fetchWithRedirects` by implementing strict request timeouts (15s), limiting redirects (max 5), resolving relative redirect locations correctly, and handling all non-200 HTTP statuses by safely rejecting instead of downloading error HTML.
- Implemented size protections during the stream downloading phase by rejecting fetches that exceed 50 MB, avoiding memory exhaustion.
- Enforced atomic manifest saves by saving to a `manifest.json.tmp` file and renaming to prevent corruption during failed or interrupted script execution.
- Added tests for edge cases like ambiguity, missing configuration, non-GitHub URLs, timeouts, redirects, and atomic saving.
