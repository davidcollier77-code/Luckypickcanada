# Implementation Plan: DevSkim Reveal Timer False-Positive Filtering

**Branch**: `freebuff/082-devskim-reveal-timer-findings` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/082-devskim-reveal-timer-findings/spec.md`

## Summary

Extend the existing fail-closed DS172411 filter for exactly two reveal application files and one reveal test file. Keep the two application paths in a dedicated allowlist used only by DS172411, and recognize the test assertion only through its exact full-line pattern. Add positive/negative regression coverage and add the four findings to the real-SARIF replay gate. No application behavior or scanner workflow configuration changes.

## Technical Context

**Language/Version**: Python 3 in the DevSkim filter and unittest/replay tools; JavaScript/JSX in the reviewed source.

**Primary Dependencies**: Python standard library, existing Microsoft DevSkim Action, SARIF upload action; no dependency changes.

**Storage**: Repository source, transient `devskim-alerts.sarif`, and the existing append-only alert ledger.

**Testing**: `python3 -m py_compile`, existing DevSkim suppression unittest suite, real-SARIF replay, current-head DevSkim workflow, and `./freebuff-verify.sh` through the repository's available CI/verification path.

**Target Platform**: GitHub Actions on Ubuntu; repository-wide DevSkim scanner.

**Project Type**: Existing Next.js application plus Python-based security scan/report tooling.

**Performance Goals**: No measurable change; only a small number of exact path and regex checks are added to the existing local SARIF processing.

**Constraints**:
- Follow `AGENTS.md`; selected task groups: `security`, `deep-dive`, and `testing`.
- Keep `.docs/` read-only, preserve scanner rules and file coverage, and do not alter workflow triggers or permissions.
- Keep exact source-span validation and existing DS172411 justification.
- Preserve string/opaque timer callbacks and all unreviewed findings.
- Do not change application source, audio, artwork, number generation, sharing, payments, email delivery, dependencies, or deployment.
- Production build hard cap remains 495 MB; no application build input is changed.

## Constitution Check

- **Governance**: PASS — `AGENTS.md`, the Freebuff entrypoint, selected task groups, and relevant project context were inspected first.
- **Existing work**: PASS — prior DevSkim triage/noise-filter/source-span/replay work was examined; this is a new exact finding batch and uses one new feature directory and branch.
- **Scope**: PASS — only the existing filter, its regression tests, replay gate, and task artifacts are changed.
- **False-positive safety**: PASS by design — exact paths, rule, source span, callback syntax, and test literal are required; all ambiguous controls remain visible.
- **Documentation routing**: PASS — no manifest-routed reference document materially changes this task; prior repository-specific security work is the relevant evidence. `.docs/` remains read-only.
- **Hooks**: No `.specify/extensions.yml` exists; no Spec Kit extension hooks are registered.

## Phase 0 — Research

The supplied source lines and existing scanner pipeline were inspected. Prior work in `specs/037-devskim-alert-triage`, `specs/042-devskim-noise-filtering`, `specs/047-devskim-source-span-precision`, and `specs/066-devskim-playwright-offset-remediation` establishes the exact DS172411 policy: inline callable callbacks are eligible only at validated source spans; strings and opaque callback references stay visible. No external research or additional library documentation is needed.

The four current source contexts were classified:
1. `app/lucky-reveal-popup.js:197` — inline arrow callback resets the number-finish state using a named duration constant.
2. `app/lucky-reveal-celebration.jsx:249` — inline arrow callback emits a confetti wave using locally defined state and fixed wave data.
3. `app/lucky-reveal-celebration.jsx:288` — inline arrow callback starts the canvas sampling interval using a compile-time delay.
4. `__tests__/lucky-reveal-finish-phase2.test.js:102` — a quoted string in a static source assertion; not a timer invocation.

The same celebration component also contains opaque callback references at other timer sites. They are deliberately excluded and receive negative coverage.

The latest main-branch DevSkim workflow run inspected for baseline was run 712 (run ID `41580512280`, main SHA `97c21c5`): scanner, syntax, suppression tests, real-SARIF replay, and upload all passed. The workflow's report-update job opened/updated automated PR #1686; its new report rows are not yet part of main. That PR is separate and is not modified or merged by this task.

## Design Decisions

1. Add `SAFE_REVEAL_TIMER_CALLBACK_FILES` for the two application files, separate from the general contextual-rule allowlist. Admit those paths only for DS172411 so other rules gain no new path coverage.
2. Add `SAFE_REVEAL_TIMER_ASSERTION_FILES` for the single test file. Suppress only the exact complete source line that contains the reviewed quoted assertion, and still require the reported SARIF span to begin at the embedded `setTimeout` token.
3. Reuse the existing absolute UTF-16 source-span validation, snippet agreement, line validation, exact-token validation, and existing DS172411 justification.
4. Add positive and negative tests using real source-region-shaped SARIF. Keep unsafe string callbacks, opaque function references, altered literals, and unreviewed paths in the results.
5. Add four exact path/rule/source-line patterns to `verify_devskim_sarif_replay.py`, preserving its temporary-copy and byte-identical raw-SARIF guarantee.
6. Do not edit the application files, `.github/workflows/devskim.yml`, `devskim-alerts.md`, dependencies, or any production configuration.

## Project Structure

### Documentation (this feature)

- `specs/082-devskim-reveal-timer-findings/spec.md`
- `specs/082-devskim-reveal-timer-findings/plan.md`
- `specs/082-devskim-reveal-timer-findings/tasks.md`
- `specs/082-devskim-reveal-timer-findings/checklists/requirements.md`

### Source Code

- `.github/scripts/suppress_devskim_false_positives.py` — exact path/source handling.
- `.github/scripts/test_suppress_devskim_false_positives.py` — positive/negative SARIF regression coverage.
- `.github/scripts/verify_devskim_sarif_replay.py` — four exact audited real-SARIF patterns.
- `.specify/feature.json` — active feature pointer.

**Structure Decision**: Keep all behavior inside the existing Python-based DevSkim suppression and replay pipeline. No application or workflow wiring change is necessary.

## Verification Plan

- Python syntax check for the two changed Python modules.
- Full existing suppression unit-test suite.
- Current-head DevSkim workflow, including real-SARIF replay and SARIF upload.
- `./freebuff-verify.sh` and any mandatory repository CI governance/build checks available on the PR.
- Full final PR diff review; verify no application runtime, workflow, dependency, or unrelated report file changed.
- Record each result independently as PASS, FAIL, BLOCKED, PENDING, or NOT RUN. Do not claim verified completion while a mandatory check remains pending.
