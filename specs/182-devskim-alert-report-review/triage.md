# Triage: every recorded DevSkim entry

**Baseline**: `devskim-alerts.md` at `44b2b3b7` held **ten** bullet entries, although the task request counted nine. All ten were audited individually. The file's own rule is that entries are removed only after the disposition is verified; none was removed on the assumption that entries sharing a rule behave alike.

**Scanner**: DevSkim CLI `1.0.103+7f8e5e24f6` (`Microsoft.CST.DevSkim.CLI`), the same release line used by the repository workflow. Files were scanned at HEAD and, where remediation was claimed, at the pre-fix revision.

## What the current scan reports

| File at HEAD | Rule | Line | Snippet | Level |
|---|---:|---:|---|---|
| `.github/scripts/test_check_qa_pr_scope.py` | DS176209 | 161 | `TODO` | note |
| `.github/scripts/test_check_qa_pr_scope.py` | DS176209 | 415 | `TODO` | note |
| `.github/scripts/test_review_pr_changes.py` | DS162092 | 140 | `localhost` | note |
| `.github/scripts/review_pr_changes.py` | DS162092 | 569 | `localhost` | note |
| `.github/scripts/review_pr_changes.py` | DS162092 | 570 | `127.0.0.1` | note |
| `.github/scripts/test_report_visual_qa_install_timings.py` | - | - | no findings | - |
| pre-fix `0b12cd86` timing test | DS173237 | 100 | `"6027091ad6c3171ff7329c82a3aa623e17822726"` | error |

The production filter (`.github/scripts/suppress_devskim_false_positives.py`) suppressed **zero** of these six current results. They are therefore un-suppressed live findings, not already-audited exclusions.

## Entry-by-entry disposition

| # | Recorded entry | Stable id | Current source and evidence | Disposition |
|---:|---|---|---|---|
| 1 | DS176209 `.github/scripts/test_check_qa_pr_scope.py:123` | `d786a61cf448c9ee0052` | Line 123 is now `self.assertEqual(len(result["matched_paths"]), 2)`. At `2e7cd054` (2026-11-14) line 123 was `value = declaration(summary="TODO fill this in")`; the same statement moved to line 160 at `e5b86a99` and line 161 at HEAD. The current scan reports DS176209 at 161 and 415 only. | **Stale positional duplicate** of entry 5. |
| 2 | DS162092 `.github/scripts/review_pr_changes.py:314` | `f9c4d74d4ae543124718` | Line 314 is now `classification = "confirmed" if severity == HARD else "potential"`. At `e5b86a99` line 314 was `"127.0.0.1",` inside the loopback-host exclusion set; the set moved to line 570 at `bc6f2016` and HEAD. | **Stale positional duplicate** of entry 9. |
| 3 | DS162092 `.github/scripts/review_pr_changes.py:313` | `1509dd2754aba824cdad` | At `e5b86a99` line 313 was `"localhost",`; the same member now sits at line 569 at HEAD. | **Stale positional duplicate** of entry 10. |
| 4 | DS176209 `.github/scripts/test_check_qa_pr_scope.py:415` | `0c57fc5038163e00fd51` | Line 415 is `{"required": True, "reason": "TODO"},` inside `test_visual_impact_requires_a_boolean_and_specific_reason`; the test asserts that the scope checker rejects this placeholder reason. | **Reviewed false positive** (live test fixture). |
| 5 | DS176209 `.github/scripts/test_check_qa_pr_scope.py:161` | `b727ec376b3c5c935678` | Line 161 is `value = declaration(summary="TODO fill this in")` inside `test_placeholder_summary_is_rejected`; the test asserts `ScopeError`. | **Reviewed false positive** (live test fixture). |
| 6 | DS162092 `.github/scripts/test_review_pr_changes.py:133` | `a12325a1b8ff8b1e6b2f` | Line 133 is now blank. At `e5b86a99` line 133 was `url = "http" + "://localhost:3000/api/health"`; the same fixture moved to line 140 at `bc6f2016` and HEAD. | **Stale positional duplicate** of entry 8. |
| 7 | DS173237 `.github/scripts/test_report_visual_qa_install_timings.py:100` | `7f8f45d7e9f1e3e171b6` | At `0b12cd86` line 100 held the 40-hex `head_sha` fixture and the scanner reports the error. PR #1920 (`b47dbd49`) replaced it with `"head_sha": "fixture-head-sha-value"` at line 155. The current scan reports zero findings for the file. | **Stale, remediated** (fix verified). |
| 8 | DS162092 `.github/scripts/test_review_pr_changes.py:140` | `69b342f83ca7a9c6f432` | Line 140 is `url = "http" + "://localhost:3000/api/health"`, a constructed fixture passed to `review_files` by `test_local_development_http_url_is_not_a_warning`; the test asserts no finding. | **Reviewed false positive** (live test fixture). |
| 9 | DS162092 `.github/scripts/review_pr_changes.py:570` | `8ead838136051be8a6fb` | Line 570 is `"127.0.0.1",` inside the host exclusion set in `_added_line_findings`: `if host.casefold() not in {"localhost", "127.0.0.1", "0.0.0.0", "[::1]", "example.invalid"}`. | **Reviewed false positive** (live allowlist token). |
| 10 | DS162092 `.github/scripts/review_pr_changes.py:569` | `b1471a0d0f21395cc4e8` | Line 569 is `"localhost",` in the same exclusion set. | **Reviewed false positive** (live allowlist token). |

### Why the report held both old and new positions

All ten identities were written by the automated report merge `77c18907` on 2026-11-16 02:47, but the scanner identities came from more than one run. `2e7cd054` and `e5b86a99` predate the large `bc6f2016` rewrite of `review_pr_changes.py`; the rewrite moved the loopback tokens from lines 313/314 to 569/570 and the test fixture from 133 to 140. `0b12cd86` predates the timing-test remediation. The append-only report kept the earlier positional identities and then received the later ones, which is why four entries are duplicates of live locations rather than separate defects.

## False-positive verification (Trail of Bits workflow)

The repository's designated method was applied to each of the five live findings. The claim in every case is "debug code in production" (DS162092) or "suspicious comment" (DS176209); neither rule asserts an exploitable sink.

| Gate | Result | Evidence |
|---|---|---|
| 1. Process | PASS | Source, Git history, scanner output, and workflow context inspected for every entry. |
| 2. Reachability | FAIL | No production path. `.github/scripts/**` is CI-only: nothing under `app/` or `components/` references it, and it is not part of the Next.js build. `review_pr_changes.py` runs from the trusted base checkout in `pull_request_target`; the tests run only in Python unit-test jobs. No attacker-controlled input reaches the matched tokens. |
| 3. Real impact | FAIL | The DS162092 tokens are comparison members of a loopback-host *exclusion* set used to avoid warning about local development URLs. They are not URLs that are fetched, not `eval` input, and not credentials. The DS176209 tokens are test inputs that prove placeholder rejection. No RCE, privilege escalation, or information disclosure follows. |
| 4. PoC | FAIL | There is no attack path to demonstrate: the values are constants compared with `in`/`not in`, and the test fixtures are literals passed to a pure function. |
| 5. Math bounds | N/A | No bounds arithmetic in the matched context. |
| 6. Environment | FAIL | The code never executes in the Cloudflare Pages/Workers production runtime. |

**Verdict**: five live findings are **FALSE POSITIVE** in their exact context; four entries are **stale positional duplicates**; one entry is **stale and remediated**. No finding survives as a genuine vulnerability, and none is unresolved.

### Context detail for the live findings

- `review_pr_changes.py` is the advisory changed-line reviewer. It reads a patch string and emits warnings; it does not enforce a gate, does not perform network requests, and does not evaluate the patch. `_insecure_http_match` extracts a host, and the matched literals are the set of hosts deliberately excluded from the advisory `insecure-http-url` warning. A hardcoded local origin in that set is a policy choice, not debug code.
- `test_review_pr_changes.py:140` builds `http://localhost:3000/api/health` from concatenated fragments and feeds it to the reviewer to assert that local development URLs are not reported. No request is made.
- `test_check_qa_pr_scope.py:161` and `:415` pass `TODO` as a *value* that the scope checker must reject as placeholder text. They are not comments, not unfinished work, and not shipped code.

## Genuine or unresolved findings

**None.** No entry required a code fix, and no entry remains uncertain. The four DS162092 entries resolve to two live tokens plus two stale duplicates; the three DS176209 entries resolve to two live fixtures plus one stale duplicate; the DS173237 entry is remediated.

## Approval-ready recommendations (not implemented)

No suppression, scanner, workflow, or source change was made. Because the five live false positives will be appended again by the next scheduled scan, the durable options require owner approval:

1. **Recommended - exact-span audited suppression** in `.github/scripts/suppress_devskim_false_positives.py`:
   - DS162092: only the exact `"localhost"` and `"127.0.0.1"` tokens inside `review_pr_changes.py`'s loopback exclusion set, and only the exact loopback fixture line in `test_review_pr_changes.py:140`. Any other hardcoded host, any real outbound URL, and any token outside these spans must remain visible.
   - DS176209: only the two exact `TODO` fixture spans in `test_check_qa_pr_scope.py:161,415`. A genuine `TODO` comment anywhere else must remain visible.
   - Required regression tests: positive and negative cases in `test_suppress_devskim_false_positives.py`, matching real-SARIF replay entries, and an append-idempotence check proving the filtered scan adds nothing.
   - Risks: an over-broad path-level rule would hide future real hardcoded endpoints or placeholder comments; every predicate must validate path, rule, exact token, and reported span, and must fail closed on missing coordinates.
2. **Alternative - retain and re-review**: leave the five live entries in the report and re-audit them each scan. This keeps the noise but avoids any suppression surface.

Neither option is implemented here because both are security-related changes that require explicit owner approval. Rewriting the test literals to avoid the scanner is not recommended: it would obscure deliberate fixtures and amount to gaming the rule rather than resolving it.

## Removed entries

All ten bullets were removed. The report now contains its title, explanatory paragraph, and append marker only:

1. `d786a61cf448c9ee0052` - stale positional duplicate.
2. `f9c4d74d4ae543124718` - stale positional duplicate.
3. `1509dd2754aba824cdad` - stale positional duplicate.
4. `0c57fc5038163e00fd51` - reviewed false positive.
5. `b727ec376b3c5c935678` - reviewed false positive.
6. `a12325a1b8ff8b1e6b2f` - stale positional duplicate.
7. `7f8f45d7e9f1e3e171b6` - stale, remediated.
8. `69b342f83ca7a9c6f432` - reviewed false positive.
9. `8ead838136051be8a6fb` - reviewed false positive.
10. `b1471a0d0f21395cc4e8` - reviewed false positive.
