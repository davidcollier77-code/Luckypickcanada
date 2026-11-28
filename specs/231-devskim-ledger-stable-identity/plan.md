# Implementation Plan: Stable DevSkim Ledger Identity

**Branch**: `freebuff/d05e4582a2636e1701cac123` | **Date**: 2026-11-28
**Spec**: spec.md

## Summary

Replace the per-scan occurrence rank with an identity built from the SARIF result
alone, and match occurrences against the entries the ledger already holds instead of
a rank recomputed from the scan. Keep the fingerprint identity, keep every earlier id
as an alias, keep the report append-only.

## Technical Context

- **Language/Version**: Python 3 on the GitHub Actions Ubuntu runner, standard library
  only (`hashlib`, `json`, `re`, `pathlib`, `collections`).
- **Primary Dependencies**: none added.
- **Storage**: `devskim-alerts.md` (append-only ledger) and `devskim-alerts.sarif`
  (generated input).
- **Inputs**: the SARIF artifact and the ledger. The identity does not read the
  working tree: the `update-report` job checks out an existing
  `chore/devskim-report-update-*` branch after downloading the current run's SARIF,
  so the checkout may be from a different revision than the scan.
- **Testing**: `vitest run __tests__/devskim-dedup.test.js` (spawns the real script),
  `python3 -m unittest test_suppress_devskim_false_positives`,
  `python3 -m py_compile`, and `identity_benchmark.py` against the superseded script.
- **Target Platform**: GitHub Actions; invoked once per scan.
- **Constraints**: no scanner, workflow, suppression, permission or report-format
  change; no entry removed or rewritten.

## Constitution Check

- `AGENTS.md` is authoritative and unchanged.
- Spec Kit stages specify → plan → tasks → implement completed in order.
- No protected file changes: the reporting script, its test, the benchmark and the
  Spec 231 records are not workflow, dependency, deployment, secret or application
  files.
- Detection is unchanged; the repair only stops the ledger from skipping or
  duplicating a finding.
- No suppression was added, broadened or disabled and no scan path was excluded.

## Identity Design

| Case | Identity |
| --- | --- |
| Stable scanner fingerprint | `sha256("v2", "fingerprint", rule, uri, fingerprint)` — unchanged from the version this repairs, so fingerprinted ids never change |
| No fingerprint | `sha256("v4", "content", rule, uri, message, snippet text, column, length)` |

Content parts and where they come from:

- **span text** — the `snippet.text` DevSkim records for the result. It is the
  matched source text, so it separates different findings and survives renumbering;
  it is part of the SARIF, so the checkout cannot change it.
- **column** — the reported `startColumn`, the finding's 1-based position within its
  own line. It separates two different findings on one line and does not depend on
  the line number.
- **length** — `charLength` when present, else `endColumn - startColumn`, else the
  snippet length. It stays meaningful when no snippet is present and is independent
  of absolute offsets.

No absolute line, no absolute `charOffset`, no source-file content and no rank among
other results participates, so a renumber cannot change an id, an insertion or
remediation cannot transfer one to another finding, and a reused report branch cannot
change one either.

### Occurrence accounting

A scan can hold several occurrences of one identity (identical content repeated). The
ledger is the record of how many are known, so:

1. **Same location first** — a result whose `uri:line` is already recorded for that
   identity consumes one recorded occurrence. This keeps a known finding attached to
   its entry when a new one is inserted before it.
2. **Remaining recorded occurrences** — consume the rest in document order. This is
   the pure-renumber case: the locations moved, the count did not.
3. **Legacy aliases** — a result whose identity has no recorded entries but whose
   earlier-version id is present is covered by that entry, once: each recorded
   earlier id is consumed by a single occurrence, so a line-based legacy entry cannot
   cover a second, different finding on the same line.

Only unmatched results are appended, in document order. An unchanged or renumbered
scan therefore appends nothing, an inserted finding appends at its own line, and a
remediated finding keeps its entry (append-only).

### Compatibility

`previous_identities()` returns the ids earlier versions could write —
`(rule, uri, line)`, `(rule, uri, fingerprint)` and `(rule, uri, line, detail)` — plus
the superseded v2 shape id for its own occurrence rank. The v3 content shape was
withdrawn during review and never wrote a ledger entry, so no alias is needed for it.
The v2 fingerprint id is the *current* primary id for fingerprinted results, so it is
not repeated in the alias list; the docstring states that the primary id is checked
separately (addressing the Graphite API-review note).

The public contract is unchanged: `finding_identities()` still returns
`(identity, legacy_identity)`, where the second element is the original
`(rule, uri, line)` id the existing unit test uses.

### Limitation

Findings that are identical in every SARIF field — same rule, file, message, snippet
text, column and length — and have no fingerprint cannot be distinguished across
scans. They share an identity and the ledger tracks their occurrences: an additional
copy appends one entry (attribution to the inserted copy is not guaranteed when the
copies also shift), and removing a copy then adding an identical one appends nothing
because the append-only ledger cannot observe the removal. This is recorded rather
than papered over with a rank, which would reintroduce the defect for every finding.
Dropping the source line from the identity broadens this to identical findings that
sit on different lines of the same file; that is the price of an identity no
checkout can change.

## Files

| File | Change |
| --- | --- |
| `.github/scripts/append_devskim_findings.py` | Content identity, source validation, occurrence accounting, alias compatibility |
| `__tests__/devskim-dedup.test.js` | Row-level regression cases for renumbering, insertion, remediation, duplicates and the limitation |
| `artifacts/devskim-review-pipeline/identity_benchmark.py` | Insertion and remediation sequences; records the line each append names |
| `artifacts/devskim-review-pipeline/RESULTS.md` | Pointer to the new evidence and its results |
| `specs/231-devskim-ledger-stable-identity/` | Specification, plan, tasks and benchmark evidence |
| `.specify/feature.json` | Feature pointer (unchanged target) |
| `memory-bank/activeContext.md`, `techContext.md`, `progress.md` | Corrected design, verified technical fact, milestone |

## Risks

- **Source/scan drift** — the report checkout may differ from the scan tree. The
  identity no longer reads the checkout, so this cannot change an id; it is covered
  by a fixed-SARIF/changed-workspace regression.
- **Scanner wording or span changes** — treated as a new finding, as before.
- **Byte-identical findings** — the documented limitation; no stable discriminator
  exists in the SARIF.
- **Performance** — a single pass over each result and over the ledger; no source
  file is opened.
