# Active Context

- Investigated and implemented deep fixes to the Context7 `.docs/` updater logic within `scripts/refresh-docs.js`.
- Identified and corrected GitHub ref parsing logic that incorrectly utilized the library identifier string (e.g., `/websites/neon`) instead of the configured source URL, correcting fallback behaviors to ensure identical or non-GitHub resources are not improperly overwritten.
- Resolved network streaming safety by adding strict HTTP size limits, timeouts, and redirect limit behaviors.
- The `.docs/` folder size cap limits are properly tested and verified.
