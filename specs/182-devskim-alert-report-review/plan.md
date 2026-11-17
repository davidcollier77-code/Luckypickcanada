# Implementation Plan: DevSkim Alert Report Review and Cleanup

**Branch**: `freebuff/c3e3aea4b5256eb42e63e937` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/182-devskim-alert-report-review/spec.md`

## Summary

Audit all ten bullets in `devskim-alerts.md` against the current tree, the Git revision that produced each entry, and a fresh DevSkim 1.0.103 scan. The audit found five live findings at HEAD (two DS176209 `TODO` test fixtures and three DS162092 loopback-host allowlist/test-fixture tokens), four stale positional duplicates, and one remediated DS173237 error. All are verified false positives or stale artefacts, so the report is reduced to its header and append marker.

No source, suppression, rule, workflow, or scanner configuration changes. The live false positives are not suppressed because suppression changes are security-related and require owner approval; the resulting re-append risk is documented with an approval-ready recommendation.

## Technical Context

**Language/Version**: Python 3.12 for the repository scanner helpers; application stack unchanged.

**Primary Dependencies**: DevSkim CLI 1.0.103 (`Microsoft.CST.DevSkim.CLI`) installed locally for reproduction; no repository dependency added.

**Storage**: N/A.

**Testing**: DevSkim scans of the four affected files and the pre-fix revision; production suppression-filter replay; Python QA checker suites; `./freebuff-verify.sh`; measured production build.

**Target Platform**: GitHub Actions DevSkim workflow and CI-only Python tooling under `.github/scripts/`.

**Project Type**: Existing Next.js application with audited security-scanning infrastructure.

**Performance Goals**: No runtime or build change.

**Constraints**: Preserve the report format, `.docs/` read-only, all scanner rules and suppressions, every application behaviour, and the 495 MiB build cap. Do not implement genuine security fixes or suppression changes without approval.

**Scale/Scope**: One report file, two memory-bank records, and one Spec Kit feature directory.

## Constitution Check

- **Single source of truth**: PASS - `AGENTS.md`, `PR_SUBMISSION.md`, the security task group, and the repository Spec Kit gate govern the work.
- **Verify before acting**: PASS - every disposition is backed by current source, Git history, and a scanner run; the remediated error is reproduced on the pre-fix revision.
- **Minimal scope**: PASS - only the report, task artifacts, and memory-bank records change.
- **Secret preservation**: PASS - no credential value is read, recorded, or changed.
- **Findings integrity**: PASS - no rule, severity, glob, workflow, or suppression is weakened; live findings are classified rather than hidden.
- **Required verification**: PASS after the recorded commands run; results are in `evidence.md`.

## Research

No external research was required. The decisive unknowns were which entries the scanner still reports and which line numbers moved; both were measured directly with the repository's release line and Git history. The repository's designated Trail of Bits false-positive guidance was applied to every live finding.

## Project Structure

### Documentation (this feature)

```text
specs/182-devskim-alert-report-review/
├── spec.md
├── plan.md
├── tasks.md
├── triage.md
└── evidence.md
```

### Source Code

```text
devskim-alerts.md                 # remove the ten audited entries, preserve header and marker
memory-bank/activeContext.md      # record the reviewed task state
memory-bank/progress.md           # record the completed milestone
```

**Structure Decision**: Keep the change inside the report and its auditable task records. No application, scanner, workflow, suppression, dependency, or deployment file is edited.

## Phase 1 Design

- No data model, API, contract, or runtime change.
- The triage record maps every recorded identity to its current location or its superseding revision.
- The evidence record captures the scanner commands, the pre-fix reproduction, the production-filter replay, and the repository gate results.
- Live false positives remain visible to the scanner; the owner can approve an exact-span suppression as a separate task.

## Risks and Mitigations

- **Re-append risk**: the next scheduled scan will add the five live false positives again because no suppression is applied. Mitigation: disclose it and provide an approval-ready, exact-span suppression recommendation with positive and negative tests.
- **Line drift**: future edits move the tokens again. Mitigation: the triage records both the historical and current positions.
- **Report integrity**: removing live entries could look like hiding findings. Mitigation: a live scan is reproduced in evidence, and the dispositions are recorded in the PR body and task artifacts.
