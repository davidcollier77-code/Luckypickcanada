# Requirements Checklist: DevSkim Reveal Timer False-Positive Filtering

**Purpose**: Confirm that the requested scanner-noise correction is bounded, testable, and does not weaken real security detection.

**Created**: 2026-11-03

**Feature**: [spec.md](../spec.md)

## Scope and evidence

- [x] CHK001 The four findings are identified by exact DS172411 rule ID and source path/line.
- [x] CHK002 Each finding is classified from its actual source context, not from the alert wording alone.
- [x] CHK003 Existing repository triage and suppression policies are reviewed and reused.
- [x] CHK004 The task excludes application behavior changes, broad rule suppression, and scan-path exclusions.

## Fail-closed suppression requirements

- [x] CHK005 New application paths are added only to the DS172411 allowlist.
- [x] CHK006 The test-file exception requires the exact quoted assertion line and exact embedded token span.
- [x] CHK007 Existing absolute source-span, snippet, line, and token-start validation remains required.
- [x] CHK008 String callbacks, opaque callback references, changed assertions, invalid spans, and unreviewed paths remain reportable.
- [x] CHK009 The real-SARIF replay gate explicitly covers all four source patterns.
- [x] CHK010 Current-head CI passed 70 unit tests and the real-SARIF replay gate (151/151 reviewed findings removed; zero remaining; raw SARIF unchanged).

## Handoff accuracy

- [x] CHK011 The final nine-file PR diff and changed-file list have been reviewed.
- [x] CHK012 Verification results and the unrun local `./freebuff-verify.sh` are recorded accurately; pending checks are not described as passed.
