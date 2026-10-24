# PR Summary — Independent CodeRabbit CLI Review Layer

## Task and Scope
- **Task group:** Creation — add optional developer tooling and documentation without changing application functionality.
- **Goal:** Provide an on-demand local second-opinion review with an explicitly supplied CLI instruction file.
- **Scope guard:** Existing CodeRabbit GitHub App, DevSkim/CodeQL/other scanners, workflows, package manifests, application source, deployment, secrets, and `AGENTS.md` are not to be changed.
- **Configuration decision:** Use `.coderabbit-cli-instructions.md` with the CLI's explicit `--config` argument, not conventional `.coderabbit.yaml` / `.coderabbit.yml` / `.coderabbit.config.ts` discovery filenames.
- **Quota handling:** Do not promise a fixed free quota. Use `cr usage` on the configured account.

## Governance and References
- `AGENTS.md` — read first; required repository workflow and boundaries.
- `.jules/jules.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md` — required context read.
- `.jules/creation.md`, `.docs/manifest.json`, `.docs/creation/jules_google_docs.md`, `.docs/creation/developers_google_com_jules_api.md`, `.docs/creation/_google-gemini_gemini-cli.md`, `.docs/creation/_websites_ai_google_dev_gemini-api.md` — routed Creation resources inspected; `.docs/` remained read-only.
- `.specify/memory/constitution.md`, `.specify/templates/spec-template.md`, `.specify/templates/plan-template.md`, `.specify/templates/tasks-template.md` — governance and artifact templates consulted.
- `.jules/cmds/speckit.specify.md`, `.jules/cmds/speckit.plan.md`, `.jules/cmds/speckit.tasks.md`, `.jules/cmds/speckit.implement.md` — stage procedures read; this interface does not provide native slash-command dispatch or a mounted repo shell, so the workflow is file-driven.
- Official CodeRabbit CLI docs: <https://docs.coderabbit.ai/cli/reference>; path-instruction docs: <https://docs.coderabbit.ai/configuration/path-instructions>; configuration overview: <https://docs.coderabbit.ai/guides/configuration-overview>.

## Spec Kit Stage Record
1. `/speckit.specify` — **FILE-DRIVEN PROCEDURAL EXECUTION**; `specs/048-coderabbit-cli-review-layer/spec.md`.
2. `/speckit.plan` — **FILE-DRIVEN PROCEDURAL EXECUTION**; `specs/048-coderabbit-cli-review-layer/plan.md`.
3. `/speckit.tasks` — **FILE-DRIVEN PROCEDURAL EXECUTION**; `specs/048-coderabbit-cli-review-layer/tasks.md`.
4. `/speckit.implement` — **FILE-DRIVEN PROCEDURAL EXECUTION**; implementation files are in this branch. Full local verification remains unavailable in this interface.

## Files Changed
- `.coderabbit-cli-instructions.md`
- `scripts/coderabbit-cli-review.sh`
- `docs/coderabbit-cli.md`
- `specs/048-coderabbit-cli-review-layer/spec.md`
- `specs/048-coderabbit-cli-review-layer/plan.md`
- `specs/048-coderabbit-cli-review-layer/tasks.md`
- `specs/048-coderabbit-cli-review-layer/pr_summary.md`
- `README.md`

## Verification Status — PENDING
- **Repository inspection:** Confirmed base branch, no existing conventional CodeRabbit configuration file, no matching open setup PR, and inspected task files.
- **Wrapper shell test:** PASS in an isolated temporary Git worktree. `bash -n` passed; a mock `cr` confirmed `review`, the explicit absolute `--config` path, and all review flags are forwarded exactly; the missing-CLI branch returned exit 127 with setup guidance; the non-worktree branch returned exit 2 with guidance. This checks the wrapper but does not test the real CodeRabbit service.
- **Full repository verification / YAML parser / live CodeRabbit CLI:** NOT RUN. This interface has no mounted checkout of the actual repository and no interactive authenticated CodeRabbit session. No YAML config was introduced.
- **Required before merge:** Observe remote CI, including `./jules-verify.sh` and required checks. The branch change list and all eight changed file contents were inspected against `main`; no unrelated runtime or automation files are included.
- **Required after merge on maintainer machine:** Install CLI, complete `cr auth login`, inspect `cr auth status`, `cr doctor`, and `cr usage`, and run one live local review.
- **Potential limitations:** The wrapper is a text file and is documented to be run via `bash`; it does not require executable bit metadata.

## Behavior Preserved
No intended changes to the GitHub App configuration, PR automation, scanner workflows, package/dependency files, application behavior, deployment, secrets, or repository governance. CLI reviews are opt-in and local.

## Second Error Check
The compare-to-main result was `ahead`, `behind_by: 0`, with exactly these eight changed paths: `.coderabbit-cli-instructions.md`, `README.md`, `docs/coderabbit-cli.md`, `scripts/coderabbit-cli-review.sh`, and the four files under `specs/048-coderabbit-cli-review-layer/`. All eight were re-read. The wrapper passed isolated shell checks. Remote CI, the full `./jules-verify.sh` gate, and the first live CodeRabbit review remain unverified.

## USEFUL RESULT: NO (PENDING)
The setup files are drafted on the branch, but readiness, authenticated quota, shell execution, and a first live review cannot yet be demonstrated from this interface. Reassess only after the real checks run.
