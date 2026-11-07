# Implementation Plan: Efficient and Reliable Pull-Request Review Checker

**Branch**: `perf/devskim-review-checker-20261107` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Make the repository-owned pull-request review checker faster without reducing its detection, coverage or accuracy, and close the duplicate-finding gap found while investigating it.

## Selected Task Groups

- `troubleshooting` — the request starts from a performance symptom (slow, inefficient review processing); the work diagnoses the measured cause rather than guessing.
- `deep-dive` — the conclusion had to be evidence-driven: profile the real code path, confirm which checker actually reviews pull requests in this repository, and prove each fix against the pre-change code.
- `testing` — every improvement is verified by execution, with before/after measurements and new regression guards, not by inspection.

Read `.freebuff/troubleshooting.md`, `.freebuff/deep-dive.md`, `.freebuff/testing.md`, `.docs/manifest.json`, and the Trail of Bits false-positive/SARIF references routed for `deep-dive`; they informed the "verify the finding, never assume it" approach.

## Summary

`suppress_devskim_false_positives.py` processed each finding by re-reading the whole source file, re-parsing JSON files with `json.loads`/`raw_decode`, decoding line ranges, and converting DevSkim's UTF-16 offsets to Python indices by scanning the file from the start. At 460 findings that is 420 full-file reads, 401 full JSON parses and ~8.6 million per-character iterations of the conversion loop — 1.78 s of a 1.94 s run.

The fix adds one per-run `SourceCache`/`SourceContext` per distinct source file: text read once, JSON parsed once, line ranges decoded once, and UTF-16 offsets converted with `bisect` over a cached list of astral-character positions. The same cache is threaded through the replay gate. Separately, `append_devskim_findings.py` identified fingerprint-less findings by `(rule, uri, line)` only, so two distinct findings on one line collapsed into a single report entry; identity now includes message, columns and end line, and also recognises the earlier identity so existing entries are never re-appended.

## Technical Context

**Language/Version**: Python 3 (standard library only).

**Primary Dependencies**: none added; `bisect`, `dataclasses`, `json`, `hashlib` are already available.

**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`, the reproducible harnesses in `artifacts/devskim-review-pipeline/`, Vitest, TypeScript, `./freebuff-verify.sh`, OpenNext/Wrangler build.

**Target Platform**: GitHub Actions `ubuntu-latest` runner used by `.github/workflows/devskim.yml`.

**Project Type**: Next.js repository with a Python review pipeline in `.github/scripts/`.

**Performance Goals**: constant reads/parses per run; ≥5× faster filtering at 460 findings (measured 12.1×); faster replay with an identical verdict.

**Constraints**:
- Identical suppression decisions for identical input (digest equality), so review depth and detection cannot regress.
- No change to scan scope, allowlists, audited families, workflow triggers or the retired-reviewer/Pullfrog surface.
- No new dependency, no application change, build below 495 MB.

## Baseline Evidence

Deterministic harness `artifacts/devskim-review-pipeline/benchmark.py` on the real allowlisted files, 5 repeats per size, pre-change code (`before.json`):

| Findings | Best ms | Source reads | JSON parses | Suppressed | Filtered results |
|---------:|--------:|-------------:|------------:|-----------:|-----------------:|
| 85 | 139.58 | 45 | 26 | 45 | 40 |
| 110 | 249.91 | 70 | 51 | 70 | 40 |
| 160 | 458.86 | 120 | 101 | 120 | 40 |
| 260 | 872.01 | 220 | 201 | 220 | 40 |
| 460 | 1716.31 | 420 | 401 | 420 | 40 |

`cProfile` on the same fixture: `_code_point_offset_from_utf16_offset` 1.236 s tottime / 1.779 s cumtime over 460 calls with 8,648,883 `ord` calls.

Post-change code (`after.json`), same harness and fixture:

| Findings | Best ms | Source reads | JSON parses | Suppressed | Filtered results |
|---------:|--------:|-------------:|------------:|-----------:|-----------------:|
| 85 | 21.28 | 3 | 2 | 45 | 40 |
| 110 | 28.59 | 3 | 2 | 70 | 40 |
| 160 | 45.46 | 3 | 2 | 120 | 40 |
| 260 | 81.72 | 3 | 2 | 220 | 40 |
| 460 | 141.90 | 3 | 2 | 420 | 40 |

The filtered-SARIF SHA-256 (`50558a30bcaf9502a3c61fec9ba6d2a27dbf92fdea570c9a55c61ed036ee0636`) and every suppressed count are unchanged.

Replay evidence (`artifacts/devskim-review-pipeline/replay_benchmark.py`, 9 findings covering all eight audited families plus one survivor): 37.58 ms → 21.06 ms, identical verdict, all eight families removed, `audited_absent` empty, one finding preserved.

Identity evidence (`artifacts/devskim-review-pipeline/identity_benchmark.py`): pre-change appender records **1** entry for two distinct same-line findings and re-runs idempotently; post-change records **2**, still records an identical duplicate once, still appends nothing on a re-run, and appends nothing when the report already holds an entry written by the earlier appender.

## Design

1. **`SourceContext`** (per file): `text` (read once), `json_document` parsed lazily once, `line_range_for_json_object` decoded once per object, `astral_indices` cached once and used by `utf16_offset_to_index` with `bisect` — the same arithmetic as the previous reference function, proved equivalent for every offset on BMP and astral strings.
2. **`SourceCache`**: maps a resolved path to its `SourceContext` and caches `line()` lookups. `process_sarif` creates one per run and passes it as the optional `context=` argument through every suppression predicate, so direct callers (and the existing tests) keep working unchanged.
3. **Replay**: `verify_devskim_sarif_replay.replay()` creates one `SourceCache` and passes it to `_assert_audited_findings_removed`, so all audited families share the cache.
4. **Identity**: `finding_identities` returns the refined id and the legacy id; a finding is skipped if either is already known. Fingerprint-less findings now include message, start column and end line in the identity.

## Risks and Mitigations

- **A faster span conversion could change a decision** → equivalence is proved against the reference function for every offset on BMP and astral strings, and the filtered-SARIF digest is compared at five sizes.
- **Caching could suppress the wrong span in JSON files** → `SourceContext` keeps the existing JSON-string containment check; a parse failure falls back to the previous behaviour.
- **A refined identity could duplicate existing report entries** → the appender also checks the legacy id; proved against a report written by the old module.
- **Scope creep into reviewers** → only the repository-owned DevSkim pipeline changed; Pullfrog, retired reviewers and scan scope are untouched.

## Verification Plan

`python3 -m py_compile` on all three modules; the suppression unit suite (87 tests); the three harnesses (filter, replay, identity) against old and new code; full Vitest; `pnpm exec tsc --noEmit`; `./freebuff-verify.sh`; OpenNext build with `.next + public` measured against the 495 MB cap; final diff audit.
