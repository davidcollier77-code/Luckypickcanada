# Requirements Checklist: Documentation Updater Retirement Guard and Resilience

- [x] The four retired IDs are copied from `__tests__/docs-library-retirement.test.ts` / `specs/102-unused-reference-retirement/`, not guessed.
- [x] The updater strips retired IDs from groups, sources, inventory, and `githubShas` before fetching.
- [x] Retired canonical snapshots are removed from all `.docs` group directories, including dangling links and unrouted groups.
- [x] Nested documentation is not deleted by the snapshot cleanup.
- [x] A dangling final-path symlink inside `.docs` no longer aborts path resolution or size measurement.
- [x] A symlink target outside `.docs` is still rejected.
- [x] Missing canonical targets and dangling dedup links are repaired without modifying valid documents.
- [x] Repeated runs remove nothing and do not reintroduce retired documents, including after a restored manifest.
- [x] Tests are isolated in temporary directories and never read or write the repository `.docs` tree.
- [x] Schedules, Halifax time zones, triggers, retry timings, Cloudflare Worker behaviour, and workflow integration are unchanged.
