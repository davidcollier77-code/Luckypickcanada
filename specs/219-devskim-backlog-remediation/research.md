# Research: Why the DevSkim Backlog Became 422 Alerts

**Date**: 2026-11-26

## 1. The reported count

The consolidated PR verification report stated "100 open code-scanning alerts". That number was not a measurement of the repository. The workflow fetched one page:

```text
repos/<owner>/<repo>/code-scanning/alerts?pr=<number>&state=open&per_page=100
```

GitHub returns at most 100 items per page and this request never followed the next page. Any true backlog of 100 or more was therefore rendered as exactly 100. The true count and the page boundary were confirmed independently:

| Query | Result |
| --- | --- |
| `state=open`, DevSkim, `per_page=1`, page 422 | alert #713 |
| `state=open`, DevSkim, `per_page=1`, page 423 | empty |

Total: **422 open alerts**, all DevSkim, all severity `note`.

## 2. What actually happened

The repository did not move from about 100 alerts to 422. It moved from **zero currently open alerts to 422 in a single scan batch**.

Every one of the 422 alerts has `created_at = 2026-11-24T23:48:05Z`. The oldest open alert is therefore that batch; nothing older remains open.

The timeline (Atlantic time is UTC−4 on these dates):

| When | Event |
| --- | --- |
| 2026-11-24 19:48:05 | The DevSkim workflow's pull-request scan of Spec 217 PR #2033 creates 422 alerts on the PR ref. |
| 2026-11-24 20:38:11 | PR #2033 merges as `ae844b49`, adding the Spec 217 evidence JSON files to `main`. |
| 2026-11-24 20:42:29 | The first push scan on `main` re-reports the same 422 findings on the default branch (`updated_at`). |
| 2026-11-25 18:01:56 | Dependabot PR #2017 merges as `aeb087f`; the latest `main` scan still reports all 422. |

The 422 are:

- **421 × DS162092** (`DoNotLeaveDebugCodeInProduction`) across 13 JSON files under `specs/217-lucky-meter-reveal-delivery/evidence/`; 11 files contain loopback URLs.
- **1 × DS172411** (`Review setTimeout for untrusted data`) at `app/lib/lucky-meter/meter-scene.js:1575`.

The two JSON files with no loopback findings are `fade-benchmark.json` and the nested `fade-visual/captures.json` contributes one; the rest are repeated measurement records, for example the same local URL recorded once per captured phase.

## 3. Dependabot and "associated repository changes"

Dependabot is **not** the cause.

- The November 24 npm updates (the 29-package minor/patch group, Stripe, jsdom and the resolver package) touched only dependency manifests and the lockfile. None touches the DevSkim workflow, the scanner or a scan path.
- The one Dependabot change to `.github/workflows/devskim.yml` was PR #2017 on November 25: `github/codeql-action/upload-sarif` v4.39.3 → v4.39.4. That action uploads SARIF to the Security tab; it does not scan or decide which files are scanned.
- The `microsoft/DevSkim-Action` pin has been v1.0.16 since 2026-10-24. The last substantive DevSkim workflow change was #1900 on 2026-11-14.
- There is no DevSkim configuration file and no `exclude_paths` or scan-glob setting in the workflow. The action scans the checkout, so newly added files are newly scanned.

The "associated repository change" that matters is the **new content**, not the tooling: Spec 217 added 13 JSON measurement files that DevSkim had never seen. Those files contain the local origins from which the measurements were captured.

## 4. Why the evidence files are documentation, not production code

- They live under `specs/`, which the repository's build-applicability classifier treats as build-exempt and which `next.config.mjs` does not reference.
- They are committed measurement records: captured URLs, labels, timings and probe output.
- The repository already accepts this class of finding as a reviewed false positive for `artifacts/**/*.json` and for two Spec Kit benchmark files (`perf-baseline.json`, `perf-after.json`). The filter validates the JSON document, the JSON string value that contains the reported span, and the loopback host before suppressing anything.
- The Spec Kit evidence directory was simply not included in that existing predicate.

## 5. Options considered for the 421 findings

| Option | Assessment |
| --- | --- |
| Add a DevSkim `exclude_paths` entry for `specs/**` | Rejected. It hides every rule, not just the reviewed loopback rule, and gives no per-finding evidence. |
| Dismiss the 421 alerts in the Security tab | Rejected. It fixes only the current alerts, does not stop the next scan from recreating them, and leaves no source-level validation. |
| Delete or rewrite the evidence files | Rejected. It destroys the Spec 217 audit record and changes another feature's evidence. |
| Extend the existing exact-span filter to `specs/<feature>/evidence/**/*.json` for DS162092 only | **Chosen.** Reuses the validated JSON/loopback predicate, keeps the raw SARIF artifact, is rule- and path-scoped, and is covered by positive and negative tests. |

## 6. The DS172411 watchdog

The reported span is the readiness watchdog in the Lucky Meter scene. Its first argument is an inline arrow function, its delay is a fixed constant, and the handle is cleared when the meter becomes ready or is disposed. No string is evaluated and no untrusted data reaches `setTimeout`.

The rule is broad and matches the call itself; the existing filter already suppresses reviewed callable timers in other files, but `app/lib/lucky-meter/meter-scene.js` was not on any DS172411 allowlist. The fix adds a dedicated, exact-statement allowlist for that one assignment. Other timers in the same file and any DS162092 finding remain visible.

**Disposition**: genuine false positive, suppressed at its exact reviewed statement. No source change, because rewriting a callable timer would not change the rule's match and would churn verified Spec 217/218 code.

## 7. Reporting fix

The report now uses the same pagination pattern as its check-run and Dependabot requests:

```bash
gh api --paginate --slurp \
  "repos/${REPOSITORY}/code-scanning/alerts?pr=${PR_NUMBER}&state=open&per_page=100" \
  | jq 'add // []'
```

This follows every page and flattens the page arrays before the renderer counts. The existing failure path is preserved: a failed request still publishes the "could not be read" warning rather than a partial or zero count.

## 8. Expected close-out

The 422 alerts are default-branch alerts. The filter changes the SARIF that the next default-branch scan uploads. Because the suppressed results are no longer present in that SARIF, GitHub marks the corresponding alerts fixed automatically. No manual dismissal is used. Until this change merges and the next `main` scan runs, the 422 remain open; that post-merge state cannot be verified from this branch.

## 9. Verification caveat discovered during local replay

The downloaded default-branch SARIF was generated from commit `aeb087f`. Running the updated filter against the working tree while the filter's own source file was edited caused 11 of its self-test findings to lose their exact span, because the file grew and their line numbers moved. Replaying against the matching scanned source produced 3,545 suppressed and **0 remaining**. The same result was reproduced after the owner merged PR #2035: the fresh `da8f104c` SARIF has the same 3,545 results and 422 open findings, the watchdog moved to line 1575, and the updated filter left **0 remaining**. In CI the scan and the checked-out source always belong to the same commit, so the 11 self-test findings are a local verification artifact, not a filter defect.
