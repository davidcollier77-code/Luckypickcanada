# Tasks: Documentation Updater Retirement Guard and Resilience

**Input**: Design documents from `specs/103-docs-updater-retirement-guard/`

**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Baseline and Records

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, Memory Bank, `manifest.json`, and the `troubleshooting` and `testing` group instructions.
- [x] T002 Identify the four retired IDs and snapshot paths from `__tests__/docs-library-retirement.test.ts` and `specs/102-unused-reference-retirement/` (no guessing).
- [x] T003 Inspect `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, the refresh workflow, and the existing Jules guard; confirm schedules, time zones, retries, Worker and workflow integration are out of scope.

## Phase 2: Retired-Document Protection

- [x] T004 [US1] Add the four PR #1746 IDs and canonical snapshot filenames to the updater's retired sets, keeping the two Jules entries.
- [x] T005 [US1] Sanitize every manifest group, `sources`, `inventory`, and `githubShas` entry before fetching or writing.
- [x] T006 [US1] Clean retired snapshots from every on-disk `.docs` group directory, including dangling links and unrouted groups, without touching nested files.

## Phase 3: Dangling Links and Missing Targets

- [x] T007 [US2] Permit final-path dangling symlinks whose recorded chain stays inside `.docs`; keep rejecting escaping targets and other resolution failures.
- [x] T008 [US2] Repair dangling dedup links via `ensureDocsSymlink` instead of failing with `EEXIST` or writing duplicates.

## Phase 4: Regression Tests

- [x] T009 [US1] Cover the four recorded IDs, full manifest sanitization, retained-source preservation, repeated-run idempotency, and restored-manifest re-stripping.
- [x] T010 [US1] Cover snapshot deletion for regular files, dangling links, unrouted groups, nested-file preservation, and second-run idempotency.
- [x] T011 [US2] Cover dangling-link resolution and size measurement, missing-target repair with untouched valid documents, and rejection of escaping links in `scripts/test-refresh-docs.js`.
- [x] T011a [US1+US2] Add a fixture test that spawns the real updater twice with mocked HTTPS and asserts retirement, snapshot cleanup, link repair, unrelated-file preservation, and a byte-stable second manifest.

## Phase 5: Spec Kit, Memory, and Verification

- [x] T012 Update `.specify/feature.json`, Memory Bank records, and the canonical PR summary.
- [x] T013 Run `node scripts/test-refresh-docs.js`, targeted repository checks, and `./freebuff-verify.sh`; record actual results and the measured production build size (25/25 tests; gate exit 0; build 332,485,953 B = 317.08 MiB < 495 MB).
- [x] T014 Inspect the complete final diff, confirm no schedule/retry/Worker/workflow/application change, and leave the PR open and unmerged.

## Dependencies

T001–T003 establish the baseline. T004–T008 implement both user stories in the same script. T009–T011 lock the behaviour. T012–T014 record and verify it.

## Parallel Opportunities

The manifest guard and link-resilience edits touch separate functions and can be reviewed independently. Snapshot-cleanup tests depend on the final retired filename set.

## Implementation Strategy

One cohesive updater-reliability increment; no manifest content, workflow, scheduler, Worker, application, or dependency change.
