# Verification Evidence: Exact-Span DevSkim Suppression for CI Loopback Tokens

**Date**: 2026-11-17

**Branch**: `freebuff/c3e3aea4b5256eb42e63e937`

**Base for this task**: `8663ee1a9a9efa055ea6792e0910b133575e3913`

## Scope

DS162092 only, in:

- `.github/scripts/review_pr_changes.py` (two exclusion-set members)
- `.github/scripts/test_review_pr_changes.py` (one local health-check fixture)

The two DS176209 placeholder fixtures in `.github/scripts/test_check_qa_pr_scope.py` are deliberately out of scope.

## Predicate Prototype

Before editing, the proposed predicates were run read-only against the real DevSkim SARIF regions:

- All 5 real results matched their intended family.
- 7 negative controls were rejected: a different set member, a loopback token outside the set, a fixture in an unreviewed file, a placeholder fixture in an unreviewed file, a real placeholder comment, an external host, and a partial token span.
- The prototype initially failed only because SARIF URIs were bare filenames; mapping them to `.github/scripts/` produced the results above.

## Implemented Change

- `SAFE_SECURITY_TOOLING_LOOPBACK_FILES` contains exactly the reviewer and its test.
- `process_sarif` unions that set only for DS162092.
- `should_suppress_security_tooling_loopback_token` validates the exact span, token, line pattern, and (for the reviewer) the preceding exclusion-set statement.
- `SECURITY_TOOLING_LOOPBACK_JUSTIFICATION` is in `VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS`.
- The replay gate has two new `AuditedFinding` families.

## Executed Checks

### Syntax

```text
python3 -W error::SyntaxWarning -m py_compile \
  .github/scripts/suppress_devskim_false_positives.py \
  .github/scripts/test_suppress_devskim_false_positives.py \
  .github/scripts/verify_devskim_sarif_replay.py
```

Result: exit 0, no syntax warnings.

### Focused unit suite

```text
PYTHONPATH=.github/scripts python3 -m unittest test_suppress_devskim_false_positives
```

Result:

```text
Ran 110 tests in 0.139s
OK
```

The three new positives, six negative controls, justification-membership test, pipeline test, and replay test all passed.

### Real-SARIF replay

The three current per-file DevSkim SARIF documents were combined with repository-relative URIs, preserving the real regions and snippets:

```text
DS162092 .github/scripts/review_pr_changes.py 570
DS162092 .github/scripts/review_pr_changes.py 569
DS162092 .github/scripts/test_review_pr_changes.py 140
DS176209 .github/scripts/test_check_qa_pr_scope.py 415
DS176209 .github/scripts/test_check_qa_pr_scope.py 161
total 5
```

Command:

```text
PYTHONPATH=.github/scripts python3 .github/scripts/verify_devskim_sarif_replay.py /tmp/ds/combined.sarif
```

Result:

```text
DevSkim SARIF replay: 5 result(s), 3 suppressed, 3 removed, 2 remaining
  removed audited false positive: Security reviewer loopback exclusion tokens (2)
  removed audited false positive: Security reviewer loopback fixture (1)
  second pass: no suppressions remained
OK: no audited false positive survived the filter; the raw SARIF is unchanged.
```

The two remaining results are the deliberately out-of-scope DS176209 placeholder fixtures.

### Repository gate

```text
SPEC_KIT_BASE_REF=HEAD ./freebuff-verify.sh
```

Result: exit 0.

- Spec Kit verifier: 25 self-tests passed; `spec.md`, `plan.md`, and `tasks.md` verified for `specs/183-devskim-tooling-loopback-suppression`.
- Verification-status integrity checker: 29 tests passed.
- AGENTS.md protection classifier: 27 tests passed.
- `pnpm exec tsc --noEmit`: passed (part of the gate).
- `pnpm run build`: compiled successfully; 21 static pages generated.
- Refresh Docs tests: 48 passed, 0 failed.

### Production build size

```text
du -sb .next public
```

Result: `362,017,487` bytes = **345.25 MiB**, strictly below the 495 MiB cap.

### Diff hygiene

```text
git diff --check
```

Result: exit 0.

## Limitations

- The DevSkim scanner binary is not installed on this runner. The replay used the existing real DevSkim 1.0.103 SARIF for the three affected files, not a fresh whole-repository scan.
- GitHub Actions DevSkim, PR Scope Verification, Protected File Changes, and Visual QA checks are pending PR creation.
- No browser or visual check applies: the change touches CI-only Python tooling and documentation records, not rendering paths.
