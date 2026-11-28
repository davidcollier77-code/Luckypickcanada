# Implementation Plan: DevSkim Findings Remediation and Stable Ledger Identity

**Branch**: `freebuff/d05e4582a2636e1701cac123` | **Date**: 2026-11-28
**Spec**: spec.md

## Summary

Remove the two synthetic 56-character hex fixture tokens that DS173237 matches, keep
one ledger entry per distinct open finding, and replace the ledger identity for a
fingerprint-less finding with one built from the SARIF result alone. Occurrences are
matched against the entries the ledger already holds instead of a rank recomputed from
the scan. The fingerprint identity and every earlier id are preserved, and the report
stays append-only.

## Technical Context

- **Language/Version**: JavaScript on the repository's Node.js 26.x runtime for the
  fixture; Python 3 on the GitHub Actions Ubuntu runner, standard library only
  (`hashlib`, `json`, `re`, `pathlib`, `collections`) for the appender.
- **Primary Dependencies**: none added; the fixture helper uses `String.prototype.repeat`
  and `String.prototype.slice`.
- **Storage**: `devskim-alerts.md` (append-only ledger) and `devskim-alerts.sarif`
  (generated input).
- **Inputs**: the SARIF artifact and the ledger. The identity does not read the working
  tree: the `update-report` job checks out an existing
  `chore/devskim-report-update-*` branch after downloading the current run's SARIF, so
  the checkout may be from a different revision than the scan.
- **Testing**: `node scripts/test-refresh-docs.js` (61 tests),
  `vitest run __tests__/devskim-dedup.test.js __tests__/dependency-management.test.js`,
  the Python DevSkim suites, `py_compile`, and `identity_benchmark.py` against the
  superseded script.
- **Target Platform**: GitHub Actions; the appender runs once per scan.
- **Constraints**: no scanner, workflow, suppression, permission or report-format
  change; no entry removed or rewritten; no assertion weakened.

## Constitution Check

- `AGENTS.md` is authoritative and unchanged; no governance file is touched.
- Spec Kit stages specify → plan → tasks → implement are completed in order; one
  feature directory holds all artifacts for this task, as the governance gate requires.
- No protected file is changed: the test fixture, ledger, reporting script, its test,
  the benchmark and these Spec Kit records are not listed in `.github/CODEOWNERS`, and
  no workflow, dependency, deployment, secret or application file is modified.
- `.docs/` is untouched.
- Security posture is unchanged or improved: detection stays exactly as configured, and
  the false-positive literals are removed rather than suppressed.
- No suppression was added, broadened or disabled and no scan path was excluded.

## Research Findings

### DS173237 and the fixture

- DevSkim's DS173237 rule is defined in `rules/default/security/privacy/secrets.json`
  with pattern `[\"'][a-f0-9]{30,}[\"']` and scope `code`. The four alert spans are the
  quoted literals themselves (for example alert 1146 reports columns 53–105 of line
  194), so removing the literal removes the match.
- `scripts/refresh-docs.js` recognizes a Cloudflare email-protection href with
  `url.origin === page.origin && url.pathname === '/cdn-cgi/l/email-protection' &&
  /^#[0-9a-f]+$/i.test(url.hash)`. Token length and internal structure are irrelevant,
  so a generated 56-character hex value is an equivalent input.
- The two tokens' prefixes are asserted in negative checks
  (`/2d5e4841|dcafb9b0/`), so the generated values must retain those prefixes.
  Repeating each 8-character seed seven times yields 56 characters with the same
  prefix.
- A local baseline of the updater suite failed 10/61 solely because `jsdom` was not
  installed; after `pnpm install --frozen-lockfile` the suite is 61/61, so those
  failures were an environment artefact, not a repository defect.

### The ledger duplication

- The pre-#2063 file held the same two tokens at lines 193/194 and 748/767, and #2063
  moved them to 194/195 and 749/768. `finding_identities()` included the reported line
  when no scanner fingerprint was present, so each shift produced a new 20-character id
  and a second entry.

### The identity defects

- The first repair's occurrence rank is recomputed from the scan's current positions.
  An insertion transfers the known finding's rank to the new result, so the new finding
  is skipped and the known one is appended twice; a remediation followed by a new
  finding can suppress the entry entirely.
- DevSkim emits `charOffset`/`charLength` (UTF-16 code units) and `snippet`, and omits
  `partialFingerprints` for rules such as DS173237. The absolute offset can be stale or
  absent, so it cannot carry the identity.
- `.github/workflows/devskim.yml` does **not** guarantee the checkout matches the scan:
  the `update-report` job downloads the current SARIF and then checks out an existing
  `chore/devskim-report-update-*` branch. Reading the working tree to build an identity
  therefore makes one unchanged finding produce two ids.

## Design

### Fixture remediation

1. Add `syntheticLongHex(seed)` above the test runner:
   `seed.repeat(Math.ceil(56 / seed.length)).slice(0, 56)`, with a comment naming
   DS173237 and stating that the values are synthetic fixtures.
2. Replace all four `htmlForToken('<56 hex>')` call arguments with
   `htmlForToken(syntheticLongHex('2d5e4841'))` and
   `htmlForToken(syntheticLongHex('dcafb9b0'))`. No assertion, test name or count
   changes.
3. In `devskim-alerts.md`, delete the four superseded entries and keep the four entries
   for the current lines 194/195/749/768. Every distinct finding stays listed; only its
   duplicate is removed.

### Identity

| Case | Identity |
| --- | --- |
| Stable scanner fingerprint | `sha256("v2", "fingerprint", rule, uri, fingerprint)` — unchanged from the version this repairs, so fingerprinted ids never change |
| No fingerprint | `sha256("v4", "content", rule, uri, message, snippet text, column, length)` |

Content parts and where they come from:

- **span text** — the `snippet.text` DevSkim records for the result. It is the matched
  source text, so it separates different findings and survives renumbering; it is part
  of the SARIF, so the checkout cannot change it.
- **column** — the reported `startColumn`, the finding's 1-based position within its own
  line. It separates two different findings on one line and does not depend on the line
  number.
- **length** — `charLength` when present, else `endColumn - startColumn`, else the
  snippet length. It stays meaningful when no snippet is present and is independent of
  absolute offsets.

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
2. **Remaining recorded occurrences** — consume the rest in document order. This is the
   pure-renumber case: the locations moved, the count did not.
3. **Legacy aliases** — a result whose identity has no recorded entries but whose
   earlier-version id is present is covered by that entry, once: each recorded earlier
   id is consumed by a single occurrence, so a line-based legacy entry cannot cover a
   second, different finding on the same line.

Only unmatched results are appended, in document order. An unchanged or renumbered scan
therefore appends nothing, an inserted finding appends at its own line, and a remediated
finding keeps its entry (append-only).

### Compatibility

`previous_identities()` returns the ids earlier versions could write — `(rule, uri,
line)`, `(rule, uri, fingerprint)` and `(rule, uri, line, detail)` — plus the superseded
v2 shape id for its own occurrence rank. The v3 content shape was withdrawn during
review and never wrote a ledger entry, so no alias is needed for it. The v2 fingerprint
id is the *current* primary id for fingerprinted results, so it is not repeated in the
alias list; the docstring states that the primary id is checked separately (addressing
the Graphite API-review note).

The public contract is unchanged: `finding_identities()` still returns
`(identity, legacy_identity)`, where the second element is the original
`(rule, uri, line)` id the existing unit test uses.

### Limitation

Findings that are identical in every SARIF field — same rule, file, message, snippet
text, column and length — and have no fingerprint cannot be distinguished across scans.
They share an identity and the ledger tracks their occurrences: an additional copy
appends one entry (attribution to the inserted copy is not guaranteed when the copies
also shift), and removing a copy then adding an identical one appends nothing because
the append-only ledger cannot observe the removal. This is recorded rather than papered
over with a rank, which would reintroduce the defect for every finding. Dropping the
source line from the identity broadens this to identical findings that sit on different
lines of the same file; that is the price of an identity no checkout can change.

## Files

| File | Change |
| --- | --- |
| `scripts/test-refresh-docs.js` | Generate the two synthetic tokens at runtime instead of storing hex literals |
| `devskim-alerts.md` | One entry per distinct open finding |
| `.github/scripts/append_devskim_findings.py` | SARIF-only content identity, occurrence accounting, alias compatibility |
| `__tests__/devskim-dedup.test.js` | Row-level regression cases for renumbering, insertion, remediation, duplicates, distinctness and checkout independence |
| `artifacts/devskim-review-pipeline/identity_benchmark.py` | Insertion, remediation and changed-workspace sequences; records the line each append names |
| `artifacts/devskim-review-pipeline/RESULTS.md` | Pointer to the new evidence and its results |
| `specs/230-devskim-findings-remediation/` | Specification, plan, tasks and benchmark evidence for this task |
| `.specify/feature.json` | Feature pointer (this directory) |
| `memory-bank/activeContext.md`, `techContext.md`, `progress.md` | Current task, verified technical facts, milestones |

## Risks

- **Source/scan drift** — the report checkout may differ from the scan tree. The
  identity no longer reads the checkout, so this cannot change an id; it is covered by
  a fixed-SARIF/changed-workspace regression.
- **Scanner wording or span changes** — treated as a new finding, as before.
- **Byte-identical findings** — the documented limitation; no stable discriminator
  exists in the SARIF.
- **Performance** — a single pass over each result and over the ledger; no source file
  is opened.
- **Two Spec Kit feature directories** — rejected by `verify-speckit-task.sh`. Both
  repairs are therefore recorded in this one directory; the gate is run locally before
  pushing.

## Complexity Tracking

No violation. The change removes four literals, adds one pure helper, prunes four
superseded ledger entries and replaces one identity function. It introduces no
abstraction, dependency, configuration surface or workflow change.
