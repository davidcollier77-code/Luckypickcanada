# Implementation Plan: Documentation Updater Retirement Guard and Resilience

**Branch**: `freebuff/0c7146a6c6b6866b90666004` | **Date**: 2026-11-06 | **Spec**: `spec.md`

**Input**: Feature specification from `specs/103-docs-updater-retirement-guard/spec.md`

## Summary

Extend the existing retired-source guard in `scripts/refresh-docs.js` from the two Jules sources to the four documents retired by PR #1746, scan all on-disk group directories for their stale snapshots, and make path resolution tolerate dangling final-path symlinks while preserving the `.docs` containment rule. Add dedicated helpers to repair missing dedup links and isolated regression tests in `scripts/test-refresh-docs.js`.

## Technical Context

**Language/Version**: Node.js 22.x (CommonJS script and standalone assertion suite).

**Primary Dependencies**: Node built-in `fs`, `path`, and `https`; no dependency added or changed.

**Storage**: `.docs/manifest.json` and the `.docs/<group>/*.md` snapshots and dedup symlinks.

**Testing**: `node scripts/test-refresh-docs.js`; repository gate `./freebuff-verify.sh` (Spec Kit gate, typecheck, production build, updater tests).

**Target Platform**: GitHub Actions documentation refresh runner and the existing Cloudflare scheduler dispatch; no runtime application surface.

**Project Type**: Next.js application repository with a versioned agent documentation library and updater automation.

**Performance Goals**: No change to batching, retry, or size behaviour; the added work is one directory listing and a small set lookup per run.

**Constraints**: Preserve schedules (`21 2/6/10 * * 2,5` Halifax), time zones, triggers, 180-second retry, 15-second fetch timeout, 10 MB response cap, 495 MB `.docs` ceiling, Worker and workflow integration. No manifest or `.docs` content change.

**Scale/Scope**: Six retired IDs (two Jules plus four PR #1746) and their canonical filenames; two existing functions renamed, three small helpers added.

## Constitution Check

- **Authorization**: the Master Work Request explicitly authorizes repairing the documentation updater and its tests.
- **Smallest correct change**: only `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, Spec Kit artifacts, the feature pointer, and Memory Bank records change.
- **Preservation**: no workflow, schedule, time zone, retry timing, Cloudflare Worker, application, dependency, payment, database, authentication, or deployment change.
- **Verification**: isolated executed suite, repository gate, measured build size, and a full diff audit.

## Phase 0: Research

- The exact four IDs and snapshot paths are recorded in `__tests__/docs-library-retirement.test.ts`; `specs/102-unused-reference-retirement/plan.md` confirms one canonical snapshot each and no other copies.
- The existing guard in `scripts/refresh-docs.js` only lists the two Jules IDs; its snapshot cleanup iterates manifest groups, so a retired file in an unrouted group would survive.
- `resolveDocsPath` calls `fs.realpathSync` for a final-path symlink and throws on `ENOENT`, so one dangling link aborts `cleanupStaleTempFiles`, `getDirSize`, and the update loop.
- `scripts/test-refresh-docs.js` already extracts functions from source and mocks `https`, so the new tests follow the same isolation pattern.

## Project Structure

### Documentation (this feature)

```text
specs/103-docs-updater-retirement-guard/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Repository paths

```text
scripts/refresh-docs.js
scripts/test-refresh-docs.js
__tests__/docs-library-retirement.test.ts   (read-only source of retired IDs)
.freebuff/cmds/speckit.*.md                 (stage definitions)
.specify/feature.json
PR_SUMMARY.md
memory-bank/activeContext.md
memory-bank/progress.md
```

**Structure Decision**: Reuse the existing single updater script and its standalone assertion suite; no new module, dependency, workflow, or feature directory duplicate.

## Design Decisions

1. **One retired set, generic names**: rename `RETIRED_JULES_SNAPSHOT_FILENAMES` to `RETIRED_SNAPSHOT_FILENAMES` and the two Jules-specific functions to retired-library names, adding the four IDs. Snapshot filenames follow the updater's existing `safeName` convention and are asserted against the retirement records in the test.
2. **Disk-driven snapshot cleanup**: list immediate `.docs` subdirectories instead of manifest groups, so a retired snapshot in an unrouted group is removed. Only exact canonical filenames are unlinked; nested files are untouched.
3. **Dangling links are inspectable, not fatal**: on `realpathSync` `ENOENT`, validate the recorded link chain lexically against `.docs`; other errors and any escape still throw.
4. **Repair, don't duplicate**: `ensureDocsSymlink` leaves valid files and links alone, removes a dangling link, and creates the correct relative link, retaining the existing fallback-to-copy behaviour on failure.
5. **Idempotency tests**: run the guard and cleanup twice and assert zero removals plus byte-identical valid documents; simulate a restored manifest to prove re-stripping.
6. **Full-run evidence**: a fixture test spawns `scripts/refresh-docs.js` twice with `process.cwd()` in a temporary `.docs` tree and only HTTPS mocked, proving the real main loop strips retired IDs, deletes stale snapshots, restores a missing canonical target and dangling link, leaves unrelated files untouched, and produces a byte-stable second manifest.

## Complexity Tracking

No constitution violations. No new dependencies, services, migrations, or architecture changes.
