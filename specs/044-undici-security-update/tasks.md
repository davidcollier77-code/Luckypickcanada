# Tasks: Undici CVE-2026-109869 Remediation

## Phase 1: Define and implement the single security fix

- [X] T001 [US1] Create the task specification in `specs/044-undici-security-update/spec.md`.
- [X] T002 [US1] Document the exact pnpm override and lockfile implementation in `specs/044-undici-security-update/plan.md`.
- [X] T003 [US1] Pin the transitive Undici override to `8.12.2` in `package.json`.
- [X] T004 [US1] Update all Undici package/snapshot references and integrity metadata in `pnpm-lock.yaml`.
- [X] T005 [US1] Add the lockfile regression test in `__tests__/undici-security-override.test.js`.

## Phase 2: Verification (must complete before declaring success)

- [ ] T006 [US1] Validate the lockfile using `pnpm install --frozen-lockfile` with the pinned package-manager version.
- [ ] T007 [US1] Run the focused test and full existing unit suite.
- [ ] T008 [US1] Run `./jules-verify.sh`.
- [ ] T009 [US1] Run the production build and applicable OpenNext/Cloudflare validation; measure combined `.next + public` output and confirm it is below 495 MiB.
- [ ] T010 [US1] Inspect the complete final diff, verify no vulnerable `undici@8.10.2` references remain, and update the PR summary with actual CI evidence.
