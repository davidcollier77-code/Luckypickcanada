# Implementation Plan: Reduce DevSkim False-Positive Noise

**Branch**: fix/devskim-noise-filtering | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification in specs/042-devskim-noise-filtering/spec.md

## Summary

Extend the existing DevSkim SARIF suppression pipeline to filter only audited, context-proven false positives observed in the report batch. Suppress narrowly verified manifest checksums, the documented public Cloudflare account identifier, safe callable timer callbacks/test-timeout configuration, exact development-origin/test fixtures, and a static regex used by a security regression test. Attach exact reviewable justifications, remove only those exact justified false positives from the uploaded SARIF, and add regression tests for both the allowlisted cases and negative cases.

The current DevSkim run after the change passed its dedicated workflow, all 39 suppression regression tests, and the suppression step reported 34 verified false positives filtered from that scan. The separate DevSkim code-scanning check still reports remaining findings; the implementation does not blanket-suppress those.

## Technical Context

**Language/Version**: Python 3 in the filter and unittest suite; JavaScript/TypeScript source patterns are validated as data by the filter.

**Primary Dependencies**: Existing Python standard library, GitHub Actions, Microsoft DevSkim Action, and CodeQL SARIF upload action. No dependency additions.

**Storage**: Repository source files and generated SARIF artifact; no database or persistent runtime data changes.

**Testing**: The command python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py' passed 39 tests in CI. Repository CI includes DevSkim, CodeQL, Visual QA, OpenNext build validation, and PR Agent.

**Target Platform**: GitHub Actions on Ubuntu; scan output is uploaded to GitHub code scanning.

**Project Type**: Existing repository security-scanning workflow and Python helper scripts.

**Performance Goals**: Filter execution stays within the existing scan job and adds no network calls.

**Constraints**:
- Do not disable DevSkim rules globally or exclude scanned paths.
- Do not suppress unknown secret-like values, string timer callbacks, opaque callback references, or findings outside the exact audited file/context allowlist.
- Remove a finding from SARIF only when it carries an exact reviewed justification.
- Keep .docs read-only; do not modify workflow triggers, secrets, Cloudflare settings, or application behavior.
- Preserve the 495 MB build ceiling and existing site behavior.

**Scale/Scope**: Two implementation files: .github/scripts/suppress_devskim_false_positives.py and .github/scripts/test_suppress_devskim_false_positives.py, plus task-scoped Spec Kit artifacts.

## Constitution Check

- Single source of truth: pass; repository AGENTS.md governs the task.
- Verify before acting: the existing report, scanner workflow, source lines, filter, and regression suite were inspected; current CI evidence is used below.
- Protected systems: no application runtime, secrets, authentication, rate limits, Cloudflare configuration, payment behavior, or scan triggers are changed.
- Resource/scope limits: no new dependency, no change to build configuration, and no directory exclusion.
- Testing and auditability: positive and negative regression cases are added; exact suppression justifications are retained in source.
- Limitation: this connector session cannot run a repository shell or ./jules-verify.sh directly. CI evidence must be used. The preceding Visual QA run failed because the PR did not yet include required feature artifacts; CI must re-evaluate after they are added.

**Gate**: Pass for the targeted scope with the verification limitation stated above. No unresolved design question blocks implementation.

## Design and Decisions

1. Extend existing path/context validation rather than suppressing DevSkim rule IDs globally.
2. Validate that manifest hashes are in the actual top-level checksum map, match the parsed JSON value, have the expected length/format, and overlap the reported SARIF source span.
3. Suppress the Cloudflare account-ID warning only if the exact constant/path/value and current explanatory comments are present; do not treat credentials generically as safe.
4. Suppress DS172411 only for inline callable callbacks or numeric test-runner timeout configuration in test files. Leave string callbacks and opaque callback variables visible.
5. Suppress known localhost/test fixture and security-test regex findings only at their exact reviewed source locations and when expected context/comment checks pass.
6. Add every new suppression reason to the exact justification set that removes such results from uploaded SARIF; no generic suppression metadata is trusted.
7. Add regression tests for every new pattern, including negative cases designed to prove nearby unsafe/unknown values are not suppressed.

No separate research, data-model, external contract, or quickstart artifact is necessary for this narrow helper-only change; relevant existing code and current CI output resolve the implementation questions.

## Project Structure

### Documentation (this feature)

- specs/042-devskim-noise-filtering/spec.md
- specs/042-devskim-noise-filtering/plan.md
- specs/042-devskim-noise-filtering/tasks.md
- specs/042-devskim-noise-filtering/checklists/requirements.md

### Source Code

- .github/scripts/suppress_devskim_false_positives.py
- .github/scripts/test_suppress_devskim_false_positives.py
- .github/workflows/devskim.yml (existing workflow, intentionally unchanged)
- devskim-alerts.md (existing append-only report, intentionally unchanged by this PR)

**Structure Decision**: Keep filtering and its unit tests in the existing .github/scripts/ location. Do not edit the workflow or append-only report in this task.

## Verification Status at Planning

- **PASS** — 39 suppression tests on the inspected implementation commit.
- **PASS** — DevSkim scan, verified-suppression stage, and SARIF upload in the dedicated workflow; log reported 34 false positives suppressed.
- **PASS** — OpenNext build-artifact validation.
- **PASS** — CodeQL and static analysis checks reported success on the inspected run.
- **PENDING / MUST RECHECK** — Visual QA failed on the preceding commit because required feature artifacts were absent, so its later verification steps did not run. Recheck after this plan and tasks are present on the current PR head.
- **NOT RUN HERE** — Direct local ./jules-verify.sh because this interface does not provide repository-shell execution.

## Complexity Tracking

No constitution exceptions or new dependency complexity were introduced.
