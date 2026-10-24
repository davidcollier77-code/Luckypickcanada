# PR Summary — Retire CodeRabbit CLI Integration

## Task and Scope
- **Task group:** Troubleshooting — remove an optional review workflow that cannot authenticate with the credential currently available.
- **Goal:** Remove the active CodeRabbit CLI layer cleanly while keeping the CodeRabbit GitHub App and all other checks intact.
- **Branch / PR:** `fix/coderabbit-cli-workflow-reliability-20261024`, [PR #1594](https://github.com/davidcollier77-code/Luckypickcanada/pull/1594).
- **Scope:** Delete the CLI workflow, its workflow test, local wrapper, CLI instructions, and setup guide; remove the CLI section from the README; update current task artifacts and active context.
- **Protected behavior:** Existing CodeRabbit GitHub App, PR Agent, DevSkim/CodeQL, unrelated tests/workflows, application code, dependencies, deployment, `AGENTS.md`, and `.docs/` remain unchanged.

## Verified Findings
- Workflow run [40117926386](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40117926386) reported `Invalid or expired API key` for the CLI. The configured credential did not authenticate the optional CLI review.
- The user elected to remove the CLI layer instead of continuing account/key experiments.
- Repository inspection found the active CLI-specific workflow, dedicated Vitest test, local wrapper, CLI instructions file, setup guide, and README section.
- Historical `specs/048-coderabbit-cli-review-layer/` remains unchanged.

## Changes
- Deleted `.github/workflows/coderabbit-cli-review.yml`.
- Deleted `__tests__/coderabbit-cli-workflow.test.js`.
- Deleted `scripts/coderabbit-cli-review.sh` and `.coderabbit-cli-instructions.md`.
- Deleted `docs/coderabbit-cli.md` and removed the README's CLI section.
- Replaced the unmerged reliability task artifacts with `specs/049-coderabbit-cli-retirement/` and updated `memory-bank/activeContext.md`.
- No dependency lockfile, package manifest, app source, CodeRabbit App configuration, unrelated workflow, or secret value was changed.

## Required Context Consulted
- `AGENTS.md` — USED=YES; USEFUL=YES; read first; canonical scope, governance, and verification requirements.
- `.jules/jules.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md` — USED=YES; USEFUL=YES; required project state and single-task context.
- `.jules/troubleshooting.md` — USED=YES; USEFUL=YES; selected task group and routed-document requirements.
- `.docs/manifest.json`, `.docs/troubleshooting/jules_google_docs.md`, `.docs/troubleshooting/_google-gemini_gemini-cli.md`, `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md` — USED=YES; USEFUL=NO for implementation details; mandatory local routed-resource consultation completed, and `.docs/` remained read-only.
- `.specify/memory/constitution.md`, spec/plan templates, and the four `.jules/cmds/speckit.*.md` stage definitions — USED=YES; USEFUL=YES; informed the replacement task artifacts and sequential workflow.
- `.github/workflows/coderabbit-cli-review.yml`, `__tests__/coderabbit-cli-workflow.test.js`, `scripts/coderabbit-cli-review.sh`, `.coderabbit-cli-instructions.md`, `docs/coderabbit-cli.md`, `README.md`, and `package.json` — USED=YES; USEFUL=YES; enumerated the active CLI setup and confirmed no package script/dependency change was needed.
- CodeRabbit CLI release `0.9.0` — USED=YES; USEFUL=YES; confirmed from the existing workflow configuration; the workflow itself is removed, so no version/dependency update is needed.

## Spec Kit Stage Record
1. `/speckit.specify` — FILE-DRIVEN PROCEDURAL EXECUTION; `specs/049-coderabbit-cli-retirement/spec.md` and `specs/049-coderabbit-cli-retirement/checklists/requirements.md`.
2. `/speckit.plan` — FILE-DRIVEN PROCEDURAL EXECUTION; `specs/049-coderabbit-cli-retirement/plan.md`.
3. `/speckit.tasks` — FILE-DRIVEN PROCEDURAL EXECUTION; `specs/049-coderabbit-cli-retirement/tasks.md`.
4. `/speckit.implement` — FILE-DRIVEN PROCEDURAL EXECUTION; CLI-only implementation/documentation files deleted and README/Memory Bank updated in this PR branch.

## Exact Changed Files (PR comparison against `main`)
- `.coderabbit-cli-instructions.md` — deleted
- `.github/workflows/coderabbit-cli-review.yml` — deleted
- `README.md` — updated to remove the CLI section
- `__tests__/coderabbit-cli-workflow.test.js` — deleted
- `docs/coderabbit-cli.md` — deleted
- `memory-bank/activeContext.md` — updated
- `scripts/coderabbit-cli-review.sh` — deleted
- `specs/049-coderabbit-cli-retirement/checklists/requirements.md` — added
- `specs/049-coderabbit-cli-retirement/plan.md` — added
- `specs/049-coderabbit-cli-retirement/pr_summary.md` — added
- `specs/049-coderabbit-cli-retirement/spec.md` — added
- `specs/049-coderabbit-cli-retirement/tasks.md` — added

## Verification Status — PENDING REMOTE CHECKS
- **Source/tree reconciliation:** PASS after inspecting the exact changed paths; no application, dependency, deployment, secret-value, or unrelated workflow changes are included.
- **`pnpm test` and `./jules-verify.sh`:** NOT RUN; repository shell execution is unavailable through this connected GitHub API interface. Do not infer success.
- **Remote PR checks:** PENDING inspection after this commit; report each actual result and any pre-existing unrelated failure.
- **Build size:** Not applicable; no application/build/dependency inputs changed.
- **Manual secret cleanup:** The repository owner still needs to delete `CODERABBIT_API_KEY` in GitHub Settings. This tool did not read or modify secrets.
- **Merge:** Not attempted; human-owned merge decision preserved.

## Second Error Check
Final review is limited to removal of the CLI-only automation and materials. The existing CodeRabbit GitHub App and all unrelated scanners/checks remain outside the diff. The historical feature record in `specs/048-coderabbit-cli-review-layer/` is retained; the replacement feature artifacts document the retirement rather than rewriting old history.

**USEFUL RESULT: YES** — the active CLI setup is removed on this PR branch. The change is not active on `main` until the owner merges it, and the repository secret still requires owner-side deletion.
