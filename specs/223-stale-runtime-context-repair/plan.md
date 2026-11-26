# Implementation Plan: Reconcile Stale ChatGPT Runtime Documentation

**Branch**: `docs/2042-runtime-context-repair` | **Date**: 2026-11-26 | **Spec**: `specs/223-stale-runtime-context-repair/spec.md`

## Summary

Reconcile the stale ChatGPT execution statements across Spec 220, affected historical Spec Kit records and the Memory Bank. The live `AGENTS.md` §6 is the authority: Node.js 26.x-dependent project operations cannot run under ChatGPT's Node.js 22.x runtime; the repository Playwright CLI/setup is unavailable; compatible independent repository scripts and QA/PR-support utilities remain permitted when their own prerequisites, runtime, permissions, effects, network access and costs are acceptable.

Spec 220's dependency implementation remains owner-authorized but unimplemented. It requires Node.js 26.x and pnpm 10.30.3 for package installation, lockfile generation and project verification. This PR does not update Wrangler, OpenNext, package.json or pnpm-lock.yaml.

## Technical Context

**Language/Version**: Markdown and JSON documentation; no application runtime change.

**Primary Dependencies**: None added or changed. Spec 220's existing dependency targets remain untouched.

**Storage**: Git-tracked Spec Kit and Memory Bank documentation only.

**Testing**: Read-only GitHub source inspection, exact-path and phrase review, and Spec Kit artifact completeness review. The always-required Application Verification still runs in CI; no application-behavior-specific test or production build is part of the local documentation scope.

**Target Platform**: GitHub repository governance and task documentation.

**Project Type**: Documentation-only reconciliation.

**Performance Goals**: No runtime, bundle, build or production performance change.

**Constraints**:
- Follow current `AGENTS.md` §6; do not reinstate blanket script prohibitions.
- Do not run Node-26-dependent operations under Node.js 22.16.0.
- Do not run the repository Playwright CLI or its setup.
- Do not change `AGENTS.md`, `.docs/manifest.json`, application code, package manifests, lockfiles, QA workflows/checkers, deployment configuration, Cloudflare settings, secrets or production resources.
- Preserve historical facts that checks were not run; correct only the erroneous reason.
- Leave Spec 220 dependency implementation, production deployment and merge outside this PR.

**Scale/Scope**: The 16 exact documentation and Spec Kit paths listed in `spec.md`. No other paths are authorized.

## Constitution Check

| Principle | Assessment | Result |
| --- | --- | --- |
| Single Source of Truth | Live `AGENTS.md` §6 remains authoritative; Spec Kit and Memory Bank records describe its current boundary. | PASS |
| Verify Before Acting | Current `AGENTS.md`, manifest, Memory Bank, Spec 220 artifacts, prior affected records, PR submission requirements and QA definitions were inspected. | PASS |
| Implementation Sequence | Specify, plan and tasks are recorded in Spec 223; implementation is the documentation-only reconciliation in the exact scope. | PASS |
| Protect Core Systems | No application, dependency, security, deployment, environment, secrets or protected governance source file is changed. | PASS |
| Resource Conservation | No dependency, service, install, build or browser binary is added. | PASS |
| Evidence Integrity | Historical unrun checks remain unrun; no test/build/CI pass is inferred. | PASS |

## Affected Documents and Correction Strategy

1. **Spec 220** — correct its status, assumptions, implementation phase heading and blocker explanation. Retain the investigated OpenNext/Wrangler targets, Undici/minimatch analysis, acceptance criteria and Node 26/pnpm requirements.
2. **Specs 175, 176, 177, 197 and 216** — replace statements that repository scripts were prohibited with precise explanations of the historical non-execution reason. Preserve each task's original test/build status.
3. **Spec 164 evidence** — correct the assertion that ChatGPT was prohibited from loading/executing `freebuff-verify.sh`; distinguish current permission from the script's actual Node 26/pnpm prerequisites and historical no-checkout limitation.
4. **Memory Bank** — correct current/active context and historical progress explanations while preserving dates, unrun statuses and unrelated project history.
5. **Spec Kit pointer and artifacts** — point `.specify/feature.json` to Spec 223 and include this specification, plan and tasks in the same PR.

## QA Requirements and Verification Review

- **QA Checker / Application Verification**: the PR's always-required Application Verification remains authoritative. No test source or application behavior is changed. Do not claim its result before CI runs.
- **DevSkim**: inspect the changed documentation for accidental secret disclosure or unsafe instructions; no secret values are in scope.
- **PR Scope Verification**: the PR body must list all 16 exact paths and one purpose per path. No unlisted path is permitted.
- **Protected File Changes**: `AGENTS.md`, workflows, package manifests, lockfiles and protected application/configuration paths are excluded. The PR must still report the automated category result.
- **Verification Integrity**: no command or check is reported as executed unless it actually ran; the startup check is recorded separately from project verification.
- **Governance and Workflow Verification**: include Spec 223 spec/plan/tasks in the diff, point the feature pointer to Spec 223, declare the selected task group and report Memory Bank/reference reading.
- **Dependency Health & Vulnerability Review**: no dependency manifest or lockfile changes are included.
- **Visual QA/build applicability**: this is non-rendering documentation-only work. The trusted classifier decides whether build and both Playwright shards are not applicable; do not pre-empt or fabricate that result.

## Environment and Local Verification

The exact Library startup preflight was executed in check-only mode. It reported Node.js 22.16.0, repository requirement Node.js 26.x, and pnpm unavailable. No repository checkout is present in the ChatGPT working container. Therefore no repository script, Python checker suite, project test, type check, build, build-size measurement or Playwright run was executed in this session. This is not because current `AGENTS.md` §6 prohibits compatible scripts; it is because the current container lacks the repository checkout, and the Node-26/pnpm-dependent project gate is unavailable. PR-triggered checks remain pending until observed on the exact PR head.

## Project Structure

```text
.specify/feature.json
memory-bank/activeContext.md
memory-bank/progress.md
specs/164-playwright-agentmd-guidance/evidence/qa-governance-continuation.md
specs/175-docs-html-normalization/tasks.md
specs/176-gemini-doc-source/plan.md
specs/177-web-images-source-correction/plan.md
specs/197-shared-graphics-toolkit-guidance/plan.md
specs/197-shared-graphics-toolkit-guidance/tasks.md
specs/216-chatgpt-browser-priority/plan.md
specs/220-cloudflare-toolchain-maintenance/spec.md
specs/220-cloudflare-toolchain-maintenance/plan.md
specs/220-cloudflare-toolchain-maintenance/tasks.md
specs/223-stale-runtime-context-repair/spec.md
specs/223-stale-runtime-context-repair/plan.md
specs/223-stale-runtime-context-repair/tasks.md
```

**Structure Decision**: Keep all corrections in existing Spec Kit and Memory Bank documents. Do not alter authoritative governance, QA code, workflows or project runtime files.
