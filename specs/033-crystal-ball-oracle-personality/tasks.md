# Tasks: Crystal Ball Oracle Personality

## Phase 1 — Setup and specification
- [x] T001 Inspect `AGENTS.md`, active Oracle route, existing route tests, package scripts, and repository constraints.
- [x] T002 Create `specs/033-crystal-ball-oracle-personality/spec.md` with user stories and verifiable acceptance criteria.
- [x] T003 Create `specs/033-crystal-ball-oracle-personality/plan.md` with implementation boundaries and verification plan.
- [x] T004 Create `specs/033-crystal-ball-oracle-personality/tasks.md` with ordered implementation and verification tasks.

## Phase 2 — User Story 1: Distinctive Oracle readings (P1)
- [x] T005 [US1] Update the active feature pointer in `.specify/feature.json` to `specs/033-crystal-ball-oracle-personality`.
- [x] T006 [US1] Replace the vague system message with the focused fortune-personality contract in `app/api/oracle/route.js`, preserving existing provider and API behavior.
- [x] T007 [US1] Extend `__tests__/oracle-route-validation.test.js` to assert the outbound system prompt contains the specificity, non-generic voice, and lottery-safety requirements.
- [x] T008 Update `memory-bank/activeContext.md`, `memory-bank/progress.md`, and `PR_SUMMARY.md` with the actual change and truthful verification status.

## Phase 3 — Verification
- [ ] T009 Run `pnpm exec vitest run __tests__/oracle-route-validation.test.js` on the candidate.
- [ ] T010 Run the full Vitest suite, standalone TypeScript check, `./jules-verify.sh`, production build, and OpenNext/Cloudflare validation; measure the generated build against the 495 MB hard cap.
- [ ] T011 Review the complete final diff and inspect current-head GitHub Actions; perform a credentialed live-response check only if a safe, authorized runtime credential is available.


## Phase 4 — Post-merge build and security correction (2026-10-18)
- [x] T012 Reproduce the Cloudflare compiler failure from the supplied log and locate the broken sanitization chain in `app/api/oracle/route.js`.
- [x] T013 Restore syntactically valid sanitization and check prompt-injection patterns against both raw and sanitized input.
- [x] T014 Add regression inputs with quotes and angle brackets splitting a blocked phrase; retain valid-question coverage.
- [ ] T015 Run targeted Oracle route tests and the full unit suite on the hotfix branch.
- [ ] T016 Run TypeScript, `./jules-verify.sh`, production/OpenNext Cloudflare build validation, and verify generated build size remains below 495 MB.
- [ ] T017 Inspect the complete final diff and current-head CI results; resolve any remaining failures before declaring the repair verified.
- [x] T018 Restore `const apiKey = getApiKey();` after the targeted CI run exposed a `ReferenceError` for valid Oracle requests.
- [ ] T019 Re-run targeted and full tests plus production/OpenNext verification on the latest PR head; do not treat earlier-head failures as resolved without new evidence.
