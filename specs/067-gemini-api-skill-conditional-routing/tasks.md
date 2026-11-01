# Tasks: Conditional Gemini API Developer Skill Routing

**Input**: `specs/067-gemini-api-skill-conditional-routing/spec.md` and `specs/067-gemini-api-skill-conditional-routing/plan.md`

## Phase 1: Inspect and specify

- [x] T001 Read repository governance, the selected Deep-dive group, Memory Bank context, manifest, current reviewer implementation, tests, and skill routing.
- [x] T002 Verify the blanket requirement in `AGENTS.md`, `.freebuff/freebuff.md`, all eight task-group instructions, reviewer rules/scripts, tests, and manifest.
- [x] T003 Verify there is no matching open PR or task branch.
- [x] T004 Specify the desired conditional behavior and the three appropriate task groups.

## Phase 2: Plan and implement

- [x] T005 Define the changes, affected files, conditional detection strategy, and required verification.
- [x] T006 Remove the global skill requirement from `AGENTS.md` and `.freebuff/freebuff.md`.
- [x] T007 Remove blanket skill requirements from all eight task-group instructions; retain conditional guidance in Creation, Troubleshooting, and Deep-dive.
- [x] T008 Update `.docs/manifest.json` and remove unrelated group symlinks while preserving the canonical source.
- [x] T009 Update Gemini reviewer rules, reviewer/autofix prompts, conditional skill loading, and coverage handling.
- [x] T010 Update reviewer context/workflow tests for ordinary and API-specific changes.
- [x] T011 Update Memory Bank context and the active Spec Kit feature pointer.

## Phase 3: Verification and reporting

- [ ] T012 Run focused Gemini reviewer tests and inspect their real outcomes.
- [ ] T013 Run `./freebuff-verify.sh` and all mandatory checks available in the repository.
- [ ] T014 Inspect the complete diff, verify manifest/link consistency, and search for remaining active blanket requirements.
- [ ] T015 Update the canonical PR summary with exact changed files, checks, limitations, and leave the PR open/unmerged.

## Verification record

- **PASS** — Read governance, the selected task-group instructions, Memory Bank context, manifest, and relevant code/tests.
- **PASS** — No matching open PR or task branch was found before starting.
- **PENDING** — Focused Vitest, `./freebuff-verify.sh`, production build measurement, and current-head GitHub Actions. This connector session does not provide a checked-out shell workspace to execute repository scripts; CI must supply those results.
