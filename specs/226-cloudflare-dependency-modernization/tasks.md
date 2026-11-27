# Tasks: Cloudflare Production Dependency Modernization

**Input**: `specs/226-cloudflare-dependency-modernization/spec.md` and `plan.md`
**Tests**: focused dependency guards, `pnpm audit`, the full repository gate, the OpenNext build, the Wrangler build and the updater-scheduler dry-run.

## Phase 1 — Investigation and specification

- [X] T001 Record the current adapter/Wrangler pair, their peer ranges and the latest published releases.
- [X] T002 Enumerate every `pnpm.overrides` entry with the version(s) normal resolution selects without it.
- [X] T003 Verify the advisory scope and patched floors for minimatch (GHSA-g3hv-75wg-m249) and brace-expansion (GHSA-v6h2-p8h4-qcjw).
- [X] T004 Confirm `@typescript-eslint` 8.74.0 declares minimatch `^11.0.1`, removing the only minimatch-10 consumer.
- [X] T005 Create the Spec 226 spec, research, plan and tasks artifacts and point `.specify/feature.json` at them.

## Phase 2 — Implementation

- [X] T006 [US1] Update `wrangler` to 4.168.0 in `package.json`.
- [X] T007 [US2] Reduce `pnpm.overrides` to the three Undici major floors.
- [X] T008 [US2] Regenerate `pnpm-lock.yaml` and update the `@typescript-eslint` packages to 8.74.0.
- [X] T009 [US2] Confirm the resolved graph: glob 14.0.6; minimatch 3.1.5/11.0.9; brace-expansion 1.1.21/5.0.13; no cross-major force.
- [X] T010 [US2] Rewrite the override expectations and add the patched-floor checks in `__tests__/dependency-management.test.js`.
- [X] T011 [US3] Confirm no application source, `open-next.config.ts`, `wrangler.jsonc`, compatibility date/flag, workflow, secret or binding changed.

## Phase 3 — Verification

- [X] T012 Run the focused guards (`dependency-management`, `undici-security-override`) and record the result.
- [X] T013 Run `pnpm audit` and record the advisory count.
- [X] T014 Run `SPEC_KIT_BASE_REF=<base> ./freebuff-verify.sh` and record frozen install, Spec Kit, Python, TypeScript, Vitest, docs, build and size results.
- [X] T015 Run `pnpm exec opennextjs-cloudflare build` on the updated pair.
- [X] T016 Run `pnpm exec wrangler build --config ./wrangler.jsonc`.
- [X] T017 Run the updater-scheduler `deploy --dry-run` (no deploy).
- [X] T018 Measure the clean production build and confirm it is strictly below 495 MiB.
- [X] T019 Review the complete diff for unrelated changes and accurate claims.

## Phase 4 — Records and delivery

- [X] T020 Update `memory-bank/activeContext.md`, `techContext.md` and `progress.md`.
- [X] T021 Commit the change set with the required commit footer.
- [X] T022 Push the branch and open one regular, non-draft PR against `main`; report the head SHA and pending checks.

## Verification Results

- `pnpm audit`: 0 advisories across 999 dependencies.
- Resolved graph: glob 14.0.6; minimatch 3.1.5 and 11.0.9; brace-expansion 1.1.21 and 5.0.13; undici 6.29.1/7.30.2/8.13.1; wrangler 4.168.0 with workerd 1.20261123.1.
- Focused guards: 2 files, 15 tests passed.
- `SPEC_KIT_BASE_REF=2fe486e6cf2deb4a0f2ff3310ec6cf1242bcbc1c ./freebuff-verify.sh`: exit 0 — frozen install, Spec Kit gate, 520 Python tests, TypeScript, 113 Vitest files / 1,272 tests, Next.js build, docs tests and the size cap.
- Production build: 440,279,040 bytes (419.88 MiB), strictly below 495 MiB.
- OpenNext build: passed on 1.20.19 + Wrangler 4.168.0; `.open-next/worker.js` written and `BUILD_ID` matched the injected SHA.
- `wrangler build`: 8,893.61 KiB upload with all seven bindings; updater-scheduler dry-run passed; updater Node tests 17/17.
- Playwright/Visual QA: not run locally; PR-triggered checks pending.

## Dependencies & Execution Order

- T001–T005 block implementation.
- T006–T009 precede T010–T018.
- T019–T020 follow executed verification; T021–T022 follow the final diff review.

## Owner-directed review repair (post-submission)

- Pullfrog's approval gate failed on `b20a5e1c` for one substantive finding: `lockfilePackageVersions()` matched only unquoted, peer-suffix-free snapshot keys, so the `@vitest/mocker` guard read an empty list and could not fail on the regression it names.
- Repair: the helper now accepts pnpm's quoted scoped keys and peer suffixes, and the guard asserts a non-empty result. The "one glob line" assertion uses the 14.0.6 floor instead of exact equality, so a legitimate 14.x patch/minor remains a valid graph while glob 10 and 13 still fail.
- Re-confirmed on the repair commit: frozen install, dependency-management guards 12/12, `pnpm audit` clean, production build below the 495 MiB cap. No application source, configuration, workflow, binding or secret changed.

## Verification Boundary

- `pnpm audit` is a point-in-time advisory snapshot; the advisory floors are also encoded in the unit guard.
- Playwright/Visual QA is not run locally for this dependency-only diff; PR-triggered checks remain pending.
- No merge, deployment or Cloudflare setting change is part of this task.
