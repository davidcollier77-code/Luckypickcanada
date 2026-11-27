# Implementation Plan: Progressive Build-Size Planning

**Branch**: `225-progressive-build-limit-planning` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/225-progressive-build-limit-planning/spec.md`

## Summary

Add one optional planning clarification to the shared Production build limit section in `AGENTS.md`: when useful, logically coherent work may be divided across smaller PRs and delivered progressively. The wording must explicitly avoid urgency and preserve functionality, security and quality. The 495 MiB limit and all existing safeguards remain unchanged.

## Technical Context

**Language/Version**: Markdown documentation only

**Primary Dependencies**: None

**Storage**: Git-tracked repository documentation

**Testing**: Text/diff review; protected-file classifier and repository PR workflows provide automated checks

**Target Platform**: GitHub repository governance

**Project Type**: Documentation / agent governance

**Performance Goals**: No runtime or build-output effect

**Constraints**: Production build remains strictly below 495 MiB; record measured build-size evidence with provenance; distinguish the latest verified base measurement from a build run for this documentation-only PR; no application, dependency, build, deployment, security-control or visual change

**Scale/Scope**: One shared policy addition plus the required Spec Kit, feature-pointer and Memory Bank records

## Constitution Check

- **Single source of truth**: Add the clarification only to `AGENTS.md`; supporting records do not create alternate policy.
- **Verify before acting**: Confirmed current `AGENTS.md`, Spec Kit templates/workflow, constitution, PR instructions, checker requirements and live GitHub state.
- **Implementation sequence**: Specify → plan → tasks → implement; no routine owner pause because the scope and text were explicitly authorized.
- **Protected systems**: `AGENTS.md` is changed only in a dedicated governance PR. The separate protected-file environment authorization and governance digest approval remain mandatory; the agent will not post owner approval commands.
- **Resource conservation**: No dependency, install, service, application build or deployment is introduced.
- **Build policy**: The existing 495 MiB limit and current stop-safe/measurement requirements remain unchanged. The latest successful CI build measured 426,389,100 bytes (406.64 MiB) combined `.next + public` in run #2614 / `${runId}` on PR #2048 head `${runHead}`, leaving 88.36 MiB below the cap. PR #2052's own build is trusted-skipped as not applicable; the recorded size is the latest verified base measurement, not a new build for this PR.

## QA and Governance Review

- `.github/workflows/protected-files.yml` runs the trusted-base AGENTS protection test and classifies the changed paths. This must remain a dedicated governance PR.
- `.github/scripts/agents_md_protection.py` permits AGENTS.md alongside the required Spec Kit and Memory Bank records; unrelated source/configuration paths are rejected.
- `.github/scripts/test_agents_md_protection.py` covers dedicated governance paths, rejected unrelated files and the protected-file workflow contract.
- `.github/workflows/pr-scope-verification.yml` and `.github/scripts/check_qa_pr_scope.py` require exact changed paths, matching per-file purposes and an owner `/approve-governance` digest.
- `.github/workflows/pr-verification-report.yml`, `.github/scripts/pr_verification_report.py` and `.github/scripts/verify_pr_verification_status.py` produce and audit the seven-category report against the current head SHA. The governance parser requires Spec Kit artifact paths on the same line as the exact `Spec Kit artifact paths:` label.
- `.github/workflows/validate-open-next-repair.yml` and `.github/scripts/pr_applicability.py` determine whether the build runs; the workflow records the exact combined `.next + public` byte/MiB measurement when applicable and skips only trusted build-exempt paths.
- `.github/workflows/devskim.yml` and `.github/workflows/visual-qa.yml` retain their normal PR triggers. The change is documentation-only and contains no rendered UI or executable logic; applicability and all final statuses are determined by trusted CI.
- `PR_SUBMISSION.md` governs the required body, declarations, local verification reporting and post-submission handoff.

## Project Structure

### Documentation (this feature)

```text
specs/225-progressive-build-limit-planning/
├── spec.md
├── plan.md
└── tasks.md
```

### Source / policy file

```text
AGENTS.md
```

**Structure Decision**: One insertion in the existing shared build-limit section. The feature pointer, Spec Kit records and three Memory Bank files are updated only to maintain the repository's required task records and current measured build evidence. No checker, workflow, application or build file changes are needed.

## Complexity Tracking

No constitution violations. A narrowly scoped policy paragraph is simpler and safer than changing the threshold, adding a new build mechanism or modifying any enforcement workflow.
