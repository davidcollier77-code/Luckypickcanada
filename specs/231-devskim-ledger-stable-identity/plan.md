# Implementation Plan: Line-Insensitive DevSkim Ledger Identity

**Branch**: `freebuff/d05e4582a2636e1701cac123` | **Date**: 2026-11-28
**Spec**: spec.md

## Summary

Replace the line-based half of `finding_identities()` with a shape-plus-occurrence identity, keep the fingerprint identity unchanged in substance, and keep every id written by earlier versions as a recognised alias. The ledger stays append-only and gains no new entry when a file is renumbered.

## Technical Context

- **Language/Version**: Python 3 on GitHub Actions Ubuntu runners, standard library only (`hashlib`, `json`, `re`, `pathlib`).
- **Primary Dependencies**: none added.
- **Storage**: `devskim-alerts.md` (append-only markdown ledger) and `devskim-alerts.sarif` (generated input).
- **Testing**: `vitest run __tests__/devskim-dedup.test.js` (spawns the real script), `python3 -m unittest test_summarize_devskim_findings test_suppress_devskim_false_positives`, `python3 -m py_compile`, and `artifacts/devskim-review-pipeline/identity_benchmark.py` against the pre-change script.
- **Target Platform**: GitHub Actions; invoked once per scan by `.github/workflows/devskim.yml`.
- **Constraints**: no scanner, workflow, suppression, permission or report-format change; no entry removed or rewritten.

## Constitution Check

- `AGENTS.md` is authoritative and unchanged.
- Spec Kit stages specify → plan → tasks → implement completed in order in this directory.
- No protected file is changed: the reporting script, its test, the Spec Kit artifacts and the Memory Bank are not workflow, dependency, deployment, secret or application files.
- `.docs/` is untouched.
- Detection is unchanged; the fix only stops the ledger from recording the same finding twice.

## Identity Design

| Case | Previous identity | New identity |
| --- | --- | --- |
| Stable scanner fingerprint | `sha256(rule, uri, fingerprint)` | `sha256("v2", "fingerprint", rule, uri, fingerprint)` |
| No fingerprint | `sha256(rule, uri, line, message, columns, endLine)` | `sha256("v2", "shape", rule, uri, message, startColumn, endColumn, span, occurrence)` |

- **span** is `endLine - startLine`, so a finding's physical size participates but its absolute position does not.
- **occurrence** is the index of the result among results sharing its shape, ordered by reported position. It keeps identical findings on different lines apart, makes an added identical finding append exactly one entry, and gives exact duplicate results (same shape and same position) the same index so they collapse to one entry.
- Renumbering preserves the relative order of identical shapes, so every index, and therefore every identity, is unchanged.
- `previous_identities()` returns the three id forms earlier versions could have written — `(rule, uri, line)`, `(rule, uri, fingerprint)` and `(rule, uri, line, detail)`. A result is skipped when its new identity or any previous alias is already recorded.
- Header parsing of `<!-- devskim-id:… -->` markers, the rendered row format, `GITHUB_OUTPUT` `new_count` and the append-only write are unchanged.

### Known limitation

An entry written by an earlier version of the script, whose finding later moves to a different line *and* still has no fingerprint, is recognised only by its previous aliases and would be appended once more. The current ledger's four entries are DS173237 findings that no longer exist in the source, and any re-appearance at their recorded lines matches an alias, so no live path reaches this case. It is recorded rather than solved by rewriting existing entries, which would break the append-only contract.

## Files

| File | Change |
| --- | --- |
| `.github/scripts/append_devskim_findings.py` | Line-insensitive identity, occurrence indexing, previous-identity aliases |
| `__tests__/devskim-dedup.test.js` | Six regression cases against the real script |
| `specs/231-devskim-ledger-stable-identity/spec.md`, `plan.md`, `tasks.md` | Spec Kit records |
| `.specify/feature.json` | Feature pointer |
| `memory-bank/activeContext.md`, `techContext.md`, `progress.md` | Current state, verified technical fact, milestone |

## Risks

- **Hidden findings**: mitigated by including message, columns and span in the shape and by the occurrence index, which never merges distinct positions.
- **Double append on upgrade**: mitigated by the previous-identity aliases and verified by the identity benchmark's legacy case.
- **Unstable ordering**: mitigated by sorting on numeric `(startLine, startColumn, endLine, endColumn)` rather than SARIF result order.
