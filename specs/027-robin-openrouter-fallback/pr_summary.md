# PR Summary — Robin OpenRouter Fallback Recovery

## Task Group

- **SELECTED TASK GROUP**: troubleshooting
- **GROUP REASON**: The task repairs a CI reviewer workflow's incorrect failover provider and review-result enforcement.
- **Authorization**: The repository owner explicitly authorized this in-scope repair. The work is prepared on `fix/robin-openrouter-fallback`; `main` is not changed directly.

## Intended and Implemented Scope

- Restores a second pinned Robin action using the same `OPENROUTER_API_KEY` secret and a different concrete OpenRouter free model.
- Supports `ROBIN_LLM_FALLBACK_MODEL` while defaulting safely to `nvidia/nemotron-3-super-120b-a12b:free`; it switches to a second free model if the primary is configured to the default fallback.
- Exports numeric free quota remaining; a confirmed zero prevents fallback inference and does not turn the review check green.
- Verifies the exact current PR head after the fallback and fails if there is no qualifying Robin review.
- Removes `/q review`, the Q fallback step/output, and the Q review acceptance path from Robin's workflow.
- Leaves Amazon Q's independent workflow, all secret values, application runtime, dependencies, and deployment configuration unchanged.

## Governance and Resources

- `AGENTS.md`: read first; troubleshooting task group selected.
- `.jules/jules.md`, `.jules/troubleshooting.md`, every `.jules/*.md` specialist file, and all ten `.jules/cmds/speckit.*.md` definitions: inspected for initialization, approval gates, Spec Kit procedure, and completion requirements.
- Spec Kit stages `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`: file-driven procedural execution because native slash dispatch is not available in this session. Active artifacts are under `specs/027-robin-openrouter-fallback/`, and `.specify/feature.json` points to this feature. The requirements checklist is complete so it does not create a speculative approval stop.
- Required routed troubleshooting documents were reviewed: `.docs/troubleshooting/jules_google_docs.md`, `.docs/troubleshooting/_google-gemini_gemini-cli.md`, `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md`, and `.docs/manifest.json`.
- Jules docs, Jules API docs, Gemini CLI local documentation, Gemini API docs and GitHub Actions workflow-syntax documentation were inspected. Jules/Gemini materials were used to follow the governance/agent execution model; GitHub's workflow docs informed step ordering, `if` behavior and timeout handling.
- OpenRouter's official model pages were checked for free pricing and structured-output support. The unrelated manifest libraries (Next.js, React, TypeScript runtime, OpenNext, Cloudflare, Neon, Upstash, Sentry, React Error Boundary, browser/Web Audio, and Turnstile) were considered not applicable to this workflow-only diff; no app dependency or runtime code was changed. Context7 was not invoked because the repository requires separate permission and the local task did not need it.
- Memory Bank project brief, active context, progress record, constitution/integration pointer, and the Spec Kit templates/active pointer were inspected.

## Changed-File Reconciliation

1. `.github/workflows/robin.yml`
2. `.specify/feature.json`
3. `specs/027-robin-openrouter-fallback/spec.md`
4. `specs/027-robin-openrouter-fallback/plan.md`
5. `specs/027-robin-openrouter-fallback/research.md`
6. `specs/027-robin-openrouter-fallback/quickstart.md`
7. `specs/027-robin-openrouter-fallback/checklists/requirements.md`
8. `specs/027-robin-openrouter-fallback/tasks.md`
9. `specs/027-robin-openrouter-fallback/pr_summary.md`
10. `tests/workflows/robin-openrouter-fallback.test.ts`
11. `memory-bank/activeContext.md`
12. `memory-bank/progress.md`

## Verification Status

- Static source assertions executed in the editing session: PASS — no Q fallback path, exactly two pinned Robin calls, shared secret reference, free quota output/zero guard, exact-head guard, diagnostics ordered after fallback.
- Targeted test and full `pnpm test`: PENDING PR CI; not run locally.
- `./jules-verify.sh`: PENDING PR CI; not run locally because this connected shell cannot resolve `github.com`.
- Production build and measured build size: PENDING required verification. Never exceed the 495 MB hard maximum.
- Final PR checks: PENDING until GitHub Actions publishes current-head results.

**USEFUL RESULT: YES — workflow and regression test are implemented in this branch; end-to-end completion remains subject to verification.**
**Pre-submission double-check**: required against the final diff and GitHub checks before calling the task fully verified.
