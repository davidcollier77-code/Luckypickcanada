# Tasks: Documentation Library and Specialist Routing Cleanup

**Input**: Design documents from `specs/099-docs-library-routing-cleanup/`

**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Governance and baseline

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, the Memory Bank, `.docs/manifest.json`, and the selected group instructions (`deep-dive`, `testing`).
- [x] T002 Inspect the current branch, worktree, PR #1738, and existing Spec Kit artifacts; confirm PR #1738 (`docs: scheduled documentation refresh`, head `476e4f43`) is merged into the task base at `743a1ce8`.
- [x] T003 Audit the current library: 71 routed identifiers, 8 groups, no pre-existing orphan, missing, or broken-symlink entries.
- [x] T004 Verify Pillow is unused (`PIL`, `Image.open`, `import PIL` absent from application, script, and configuration files) and verify NumPy use by the audio tooling (`scripts/inspect-media.py`, `scripts/setup-media-tools.sh`).
- [x] T005 Complete `specs/099-docs-library-routing-cleanup/spec.md`, `plan.md`, and this task list.

## Phase 2: Removals (Pillow, Chrome Offscreen, Android, Gemini CLI)

- [x] T006 [US1] Remove `/python-pillow/Pillow` from the polishing group, `sources`, `inventory`, and `githubShas`; delete `.docs/polishing/_python-pillow_Pillow.md`.
- [x] T007 [US1] Remove `/android/developers` from the deep-dive group, `sources`, and `inventory`; delete `.docs/deep-dive/_android_developers.md`; drop the route from `.freebuff/deep-dive.md`.
- [x] T008 [US1] Remove `/google-gemini/gemini-cli` from the creation, troubleshooting, and deep-dive groups plus `sources`, `inventory`, and `githubShas`; delete the canonical snapshot and both symlinks; delete the three "Conditional Gemini CLI Reference" sections.
- [x] T009 [US1] Replace the Offscreen API source URL with general Chrome documentation, delete the Offscreen snapshot, materialize the replacement snapshot in the first routed group, and recreate the six relative symlinks.

## Phase 3: Retention and NumPy move

- [x] T010 [US2] Move `/numpy/numpy` from `polishing` to `audio` in the manifest, delete the Polishing route, add the Audio route, and `git mv` the snapshot to `.docs/audio/`.
- [x] T011 [US4] Confirm Gemini API (`/google-gemini/gemini-skills/gemini-api-dev`, `/websites/ai_google_dev_gemini-api`), Debian Reference, PostHog JS, and Magic UI routing and snapshots are unchanged.
- [x] T012 [US4] Audit every remaining identifier's group assignment against actual project use; make no further moves because no other identifier's subject and project use clearly supported a better group.

## Phase 4: Dependent test update

- [x] T013 [US3] Update `__tests__/reviewer-retirement.test.ts` so the retirement guard asserts the retained Gemini API skill snapshot instead of the removed Gemini CLI snapshot, keeping the historical reviewer specs and manifest assertions.

## Phase 5: Verification

- [x] T014 Run the manifest and snapshot consistency audit: exact agreement between routing, `sources`, `inventory`, and `githubShas`; zero orphans; zero missing snapshots; zero broken symlinks. **Result: PASS** — 68 sources, 68 inventory, 68 routed, 55 SHA pins; orphans `[]`, missing `[]`, broken symlinks `[]`; no routed identifier lacks a source, inventory entry, or SHA pin mismatch.
- [x] T015 Run `pnpm exec vitest run __tests__/reviewer-retirement.test.ts` and the full `pnpm exec vitest run` suite. **Result: PASS** — focused 1 file / 4 tests; full suite 43 files / 343 tests.
- [x] T016 Run `./freebuff-verify.sh` (bootstrap, frozen install, Spec Kit gate, TypeScript, production build, refresh-docs tests) with the correct comparison base and record the measured build size against the 495 MB ceiling. **Result: PASS** — `SPEC_KIT_BASE_REF=743a1ce84e6b8ef52eec7b40620cd9fa98bc75e8 ./freebuff-verify.sh` exit 0; refresh-docs 19/19; build `.next` 299,056,298 B + `public` 32,840,043 B = 331,896,341 B (316.52 MiB) < 495 MB.
- [x] T017 Confirm `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, and `.github/workflows/refresh-docs.yml` are unchanged in the final diff. **Result: PASS** — the staged diff contains no updater script, updater test, workflow, application, asset, dependency, or lockfile path.
- [x] T018 Inspect the complete final diff, update `PR_SUMMARY.md`, publish the same summary as the single PR body, and leave the PR open and unmerged. **Result: PASS** — final diff audited (20 paths, all intentional), `PR_SUMMARY.md` updated, PR **#1740** opened with this report as its body and left open/unmerged.
