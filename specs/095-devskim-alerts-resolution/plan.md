# Implementation Plan: DevSkim Alerts Report Resolution

**Branch**: `freebuff/c9e5ec63a91aa6449065899b` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/095-devskim-alerts-resolution/spec.md`

## Summary

Audit every entry in `devskim-alerts.md` against current source, then resolve the classes that the scanner still reports. Today's DevSkim CLI run (1.0.100, same release line as the CI action) produced 259 raw results after excluding dependency and build directories. The repository's existing production filter already removes 150 of them, leaving 109: 108 DS162092 loopback-origin notices in `playwright.config.ts` and committed browser-probe reports under `artifacts/`, plus one DS172411 callable timer in the share-image download.

Two of those classes are reviewed false positives, not shipped-code weaknesses: the Playwright config starts and points at a local Next.js server, and the `artifacts/` JSON files are measurement data that never enter the Next.js build. The third is a callable callback with a fixed delay that passes no string to `setTimeout`. The smallest correct change is to extend the existing audited SARIF filter for exactly those reviewed locations, with positive and negative tests and replay entries, then clear the report. No application source, dependency, workflow trigger, scan glob, or rule setting changes, and `.docs/` stays read-only.

## Technical Context

**Language/Version**: Python 3 (repository scanner helpers); JavaScript/TypeScript application unchanged.

**Primary Dependencies**: Existing DevSkim CLI/SARIF tooling and Python standard library only; no new dependency.

**Storage**: N/A.

**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`, the real-SARIF replay gate, a local DevSkim scan filtered by the production helper, `pnpm exec vitest run` for the append-script guards, `./freebuff-verify.sh`, and the measured production build.

**Target Platform**: GitHub Actions DevSkim workflow and the Next.js/Cloudflare application.

**Project Type**: Existing web application with an audited scanner-suppression helper.

**Performance Goals**: No runtime or build-output change; the filter only inspects SARIF results.

**Constraints**: Preserve `.docs/` read-only, all application behavior, and the 495 MB build maximum. Suppressions must remain exact-path, exact-rule, and source-span validated, and must never hide a genuine finding. The report must stay append-only for future genuine findings.

**Scale/Scope**: One report file, one filter helper, its unit suite, the replay gate, and one Spec Kit feature directory.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` and the `security`/`testing` group guidance govern the work; artifacts supplement them.
- **Verify before acting**: PASS — each class was reproduced with a real local scan, and each suppressed location was inspected at its exact source span.
- **Minimal scope**: PASS — only the filter, its tests/replay, the report, and task artifacts change.
- **Secret preservation**: PASS — no credential, secret store, or environment value is read, changed, or recorded.
- **Findings integrity**: PASS — genuine results stay visible; no rule, severity, or glob is disabled; the report is not emptied without evidence.
- **Required verification**: PENDING until the unit suite, replay, scan, repository gate, and build measurement actually run.

## Research

No external research was required. The decisive unknown was which controlled findings remain after the current filter, and that was measured directly with the DevSkim CLI against this checkout. The CLI is installed under `~/.dotnet` for this session; CI continues to use the pinned action.

## Project Structure

### Documentation (this feature)

```text
specs/095-devskim-alerts-resolution/
├── spec.md
├── plan.md
├── tasks.md
├── triage.md
└── checklists/requirements.md
```

### Source Code

```text
devskim-alerts.md                                    # cleared to header + append marker
.github/scripts/suppress_devskim_false_positives.py  # reviewed local-origin and share-timer filtering
.github/scripts/test_suppress_devskim_false_positives.py  # positive/negative regression tests
.github/scripts/verify_devskim_sarif_replay.py       # real-SARIF replay coverage
```

**Structure Decision**: Keep the change inside the existing audited filter and its evidence files. Do not edit application source, `.docs/`, workflows, dependencies, or scanner configuration.

## Phase 1 Design

- No data model or external contract change.
- The filter gains one DS162092 predicate for local Playwright/probe loopback origins and one exact DS172411 statement for the share-image revoke timer; the existing span validation applies to both.
- `triage.md` records the classification of every recorded entry and the measured scan evidence.
- The final PR summary distinguishes implementation, verification, and any remaining limitation.
