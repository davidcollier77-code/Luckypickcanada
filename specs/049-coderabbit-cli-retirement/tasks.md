# Tasks: Retire CodeRabbit CLI Integration

**Input**: Design documents in `specs/049-coderabbit-cli-retirement/`  
**Prerequisites**: `spec.md`, `plan.md`

## Phase 1 — Scope and baseline

- [x] T001 Read `AGENTS.md` first, required Memory Bank context, the Troubleshooting specialist, routed documents, Spec Kit definitions, and relevant repository files.
- [x] T002 Confirm the CLI workflow's authentication failure and identify the complete active CLI file set; confirm the CodeRabbit App and unrelated workflows are outside scope.

## Phase 2 — Retire active CLI setup

- [x] T003 Delete the CLI GitHub Actions workflow and its dedicated workflow test.
- [x] T004 Delete the local CLI wrapper, CLI-only instruction file, and CLI setup guide.
- [x] T005 Remove the CLI advertisement from `README.md` without changing other README content.
- [x] T006 Replace the current feature artifacts with a focused retirement spec, plan, tasks, checklist, and evidence summary; update the current Memory Bank context.

## Phase 3 — Final verification and reporting

- [x] T007 Reconcile the intended file changes and ensure the diff preserves the CodeRabbit GitHub App and unrelated checks.
- [x] T008 Inspect the available remote run logs/statuses and record the confirmed failures and pending jobs; local `pnpm test` and `./jules-verify.sh` remain unavailable through this API-only interface. Recheck final-head statuses before merge.
- [ ] T009 Confirm the owner deletes `CODERABBIT_API_KEY` from GitHub Actions secrets; secret management is not performed by this repository edit.

## Dependencies

- T001–T002 precede implementation.
- T003–T006 form the sequential file cleanup.
- T007 follows implementation.
- T008 depends on available local/remote verification; T009 is a manual GitHub settings action for the repository owner.
