# Tasks: Cloudflare Toolchain Re-Audit and OpenNext Patch

**Input**: Design documents from `specs/220-cloudflare-toolchain-maintenance/`

**Prerequisites**: `spec.md`, `research.md`, `plan.md`

**Tests**: Required by FR-008 and FR-010.

## Phase 1: Independent Audit

- [X] T001 Re-read the four core Memory Bank files, `AGENTS.md`, `.specify/memory/constitution.md`, the Spec Kit command definitions and `PR_SUBMISSION.md`.
- [X] T002 Inspect the live `package.json`, `pnpm-lock.yaml`, `wrangler.jsonc`, `open-next.config.ts`, `workers/updater-scheduler/wrangler.toml` and the deployment/QA workflows.
- [X] T003 Re-derive current stable releases from versioned npm registry manifests and GitHub release pages: adapter 1.20.19 (newest), Wrangler 4.166.0/4.167.0/4.168.0 (4.168.0 newest; 4.169.0 absent).
- [X] T004 Compare peer/engine requirements, release notes and transitive changes; evaluate Wrangler 4.167.0 and 4.168.0 and record why neither is safer than 4.166.0 for this deployment.
- [X] T005 Verify GHSA-g3hv-75wg-m249 (minimatch) and GHSA-xjj6-f33q-929c (undici), including affected ranges and patched floors.
- [X] T006 Record the audit, alternatives and rejected changes in `research.md`; rewrite `spec.md`, `plan.md` and this task list from the fresh evidence.

## Phase 2: Dependency Implementation

- [X] T007 [US1] Recheck npm dist-tags immediately before editing: `@opennextjs/cloudflare` latest 1.20.19; Wrangler 4.168.0 newest with no applicable fix.
- [X] T008 [US1] Set `@opennextjs/cloudflare` to `1.20.19` in `package.json`; retain `wrangler` 4.166.0 and every other pin and override unchanged.
- [X] T009 [US1] Regenerate `pnpm-lock.yaml` with pnpm 10.30.3 under Node 26.13.0 using `pnpm install --lockfile-only` (no hand edits).
- [X] T010 [US1] Review the complete lockfile diff: adapter and `@opennextjs/aws 4.2.1` updated; `glob 13.0.7` and `path-scurry 2.0.2` removed; adapter `glob` edge now 14.0.6; no unrelated version changes.
- [X] T011 [US2] Verify the resolved graph: one `glob@14.0.6`; minimatch 3.1.5, 11.0.1 and 11.0.9 only; one `undici@8.12.2`; no `glob@13` or `minimatch@10` snapshot.
- [X] T012 [US2] Extend `__tests__/dependency-management.test.js` to guard exact Cloudflare build-tool pins, lockfile importer consistency and the absence of the glob 13/minimatch 10 path.
- [X] T013 [US3] Confirm every existing override, including `undici: 8.12.2`, `glob@10: 14.0.4` and the inert minimatch entries, is unchanged in `package.json` and the lockfile.
- [X] T014 [US3] Confirm no application, configuration, workflow, binding, compatibility-date, secret or deployment file changed.

## Phase 3: Verification

- [X] T015 Run `pnpm install --frozen-lockfile` on Node 26.13.0 with pnpm 10.30.3; installed Wrangler 4.166.0 and adapter 1.20.19.
- [X] T016 Run the focused dependency tests: `dependency-management` (11 tests) and `undici-security-override` (1 test) — 12/12 passed.
- [X] T017 Run `./freebuff-verify.sh` with `SPEC_KIT_BASE_REF` set to the task base: 520 Python checker tests and 51 docs tests passed, TypeScript passed, full Vitest passed **113 files / 1,269 tests**, and the Next.js build completed.
- [X] T018 Run `pnpm exec opennextjs-cloudflare build`: `.open-next/worker.js` and `.open-next/assets` exist, Tailwind is compiled, the `.lucky-vessel-scene`, `.lucky-vessel-canvas-host` and `.lucky-results-dock` rules are present, and `BUILD_ID` matches the checked-out HEAD.
- [X] T019 Run `pnpm exec wrangler build --config ./wrangler.jsonc` (Wrangler 4.166.0): exit 0, 317 assets read, 8,893.90 KiB upload / 1,846.20 KiB gzip, expected bindings reported.
- [X] T020 Run `pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml` (Wrangler 4.166.0): exit 0, 7.87 KiB upload / 2.66 KiB gzip, expected variables reported, no deployment.
- [X] T021 Measured combined `.next` + `public`: **439,922,688 bytes (419.54 MiB)**, strictly below the 495 MiB cap.
- [X] T022 CI-only checks (both Playwright shards, DevSkim, the OpenNext CI job, the seven-category report and deployment) are recorded as **PENDING — runs after PR creation** and are not claimed locally.

## Phase 4: Release Boundary

- [ ] T023 Commit the reviewed change set and push the task branch.
- [ ] T024 Open exactly one regular, non-draft pull request against `main` with the complete body, QA scope declaration and protected-file authorization declaration.
- [ ] T025 Confirm the PR is open and unmerged, and record the current head SHA for owner review. Do not deploy.

## Dependencies and Execution Order

- Phase 1 completes before Phase 2; Phase 2 completes before Phase 3.
- Phase 3 verification must pass, or the exact failure/limitation is recorded, before Phase 4.
- Production deployment and merge are excluded.

## Definition of Done

- The adapter is on 1.20.19 and Wrangler remains on the proven 4.166.0, with the retention rationale recorded.
- The frozen lockfile is coherent, patched and free of the glob 13/minimatch 10 path.
- Focused tests, the full suite, the type check, both builds, Wrangler validation and the size gate pass locally, or limitations are reported honestly.
- One regular, non-draft PR is open and unmerged for owner review.
