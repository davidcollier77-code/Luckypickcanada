# PR Summary — Reliable CodeRabbit CLI Review Reporting

## Task and Scope
- **Task group:** Troubleshooting — repair a reproducible GitHub Actions failure.
- **Goal:** Fix the confirmed comment-lookup error and expose safe diagnostics when CodeRabbit CLI itself exits unsuccessfully.
- **Scope:** `.github/workflows/coderabbit-cli-review.yml`, `__tests__/coderabbit-cli-workflow.test.js`, this feature's Spec Kit artifacts, and `memory-bank/activeContext.md`.
- **Protected behavior:** Existing CodeRabbit App configuration, PR Agent/scanners, application code, dependencies, deployment, secrets, and site visuals remain unchanged.

## Verified Findings
- PR #1592 run [40115002923](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40115002923) shows CodeRabbit CLI exit code 0 followed by a publishing-step failure: `the --slurp option is not supported with --jq or --template`.
- PR #1593 run [40116622333](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40116622333) shows the same publishing defect. The CLI itself also returned exit code 1 on that run; its stderr was captured but not surfaced, so the CLI's separate root cause is unverified.
- The existing source-level test asserted `gh api --paginate --slurp`, unintentionally codifying the broken option combination.

## Changes
- Remove `--slurp` and use the supported paginated `--jq` output, selecting the last matching comment ID with `tail -n 1`.
- When CLI exit code is nonzero, print a bounded stderr excerpt after redacting the configured key and common bearer/API-key patterns, stripping ANSI escapes, and neutralizing lines that look like GitHub Actions workflow commands.
- Update regression assertions for the corrected pagination and the diagnostic safeguards.

## Required Context Consulted
- `AGENTS.md` — USED=YES; USEFUL=YES; read first; authoritative task sequence, scope and verification rules.
- `.jules/jules.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md` — USED=YES; USEFUL=YES; required project context inspected.
- `.jules/troubleshooting.md` — USED=YES; USEFUL=YES; selected task group and routed-document requirements.
- `.docs/manifest.json`, `.docs/troubleshooting/jules_google_docs.md`, `.docs/troubleshooting/_google-gemini_gemini-cli.md`, `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md` — USED=YES; USEFUL=YES for routed-resource selection/consultation; `.docs/` remained read-only.
- `.specify/memory/constitution.md`, `.specify/templates/spec-template.md`, `.specify/templates/plan-template.md`, and `.jules/cmds/speckit.specify.md`, `plan.md`, `tasks.md`, `implement.md` — USED=YES; USEFUL=YES for feature artifacts, sequence, and evidence reporting.
- `.github/workflows/coderabbit-cli-review.yml`, `__tests__/coderabbit-cli-workflow.test.js`, and the actual GitHub Actions logs — USED=YES; USEFUL=YES; reproduced the faulty assertion and isolated the failure.

## Spec Kit Stage Record
1. `/speckit.specify` — FILE-DRIVEN PROCEDURAL EXECUTION; `specs/049-coderabbit-cli-workflow-reliability/spec.md` and `specs/049-coderabbit-cli-workflow-reliability/checklists/requirements.md`.
2. `/speckit.plan` — FILE-DRIVEN PROCEDURAL EXECUTION; `specs/049-coderabbit-cli-workflow-reliability/plan.md`.
3. `/speckit.tasks` — FILE-DRIVEN PROCEDURAL EXECUTION; `specs/049-coderabbit-cli-workflow-reliability/tasks.md`.
4. `/speckit.implement` — FILE-DRIVEN PROCEDURAL EXECUTION; workflow and Vitest test updated below.

## Exact Changed Files
- `.github/workflows/coderabbit-cli-review.yml`
- `__tests__/coderabbit-cli-workflow.test.js`
- `specs/049-coderabbit-cli-workflow-reliability/spec.md`
- `specs/049-coderabbit-cli-workflow-reliability/plan.md`
- `specs/049-coderabbit-cli-workflow-reliability/tasks.md`
- `specs/049-coderabbit-cli-workflow-reliability/checklists/requirements.md`
- `specs/049-coderabbit-cli-workflow-reliability/pr_summary.md`
- `memory-bank/activeContext.md`

## Verification Status — PENDING
- **Log diagnosis:** PASS — both historical failed runs show the same unsupported gh CLI option combination.
- **Source patch reconciliation:** PENDING — verify exact final commit diff after creation.
- **Focused Vitest, full `pnpm test`, and `./jules-verify.sh`:** NOT RUN; repository shell execution is unavailable through this interface. Do not infer pass from source inspection.
- **Remote CI and live workflow rerun:** PENDING; use current PR-head check results. A continued CLI failure is distinct from the fixed comment-publisher error and must be diagnosed from the new sanitized stderr.
- **Build size:** Not applicable; no app/build/dependency changes.
- **Secrets and paid usage:** No secrets changed; workflow does not add `--use-credits`.

## Second Error Check
The intended implementation changes only the CLI workflow, its existing source-level regression test, the task's Spec Kit artifacts, and active context. The credential preflight, trusted base instructions, pinned CLI, existing review-completion test, comment payload structure, permissions, no-paid-credit behavior and no-merge boundary are preserved. The final diff and current-head CI remain mandatory before calling the fix verified.

**USEFUL RESULT: NO (PENDING CI)** — the code-level repair is proposed; success must be confirmed by the regression test and a fresh workflow run.
