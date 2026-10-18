# Implementation Plan: Repository Cleanup Audit

**Branch**: `jules-9194309937130832358-29bf1ebc` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

## Scope and Guardrails

This is an audit/reporting-only task. Its diff may modify the canonical PR Summary, active feature pointer, audit specification/plan/tasks/checklist, and Memory Bank status. It must not remove assets, edit application source, change workflow/test logic, remove dependencies, or alter runtime behavior.

## Investigation Method

1. Inspect repository governance, active feature pointer, the relevant task artifacts, and the existing PR Summary.
2. Review the originating audit report and classify its claims by evidence source and confidence.
3. Use repository-source searches and direct file reads to spot-check high-risk claims.
4. Trace image references through the active component and fallback chain before describing assets as potentially unused.
5. Treat dependency scan and grep results as candidate evidence only until a local exhaustive reference and bundler review is possible.
6. Preserve the existing historical PR Summary content and append the audit section.
7. Compare the final changed-file list against the audit report and keep non-documentation work in a separate prerequisite PR.

## Evidence and Limitations

The originating Jules report records running pnpm dlx depcheck, du size measurements, recursive grep, git ls-files, and tracked/ignored-file checks. This correction pass did not execute those shell commands because no local repository checkout was available. It used GitHub file retrieval and source-search results for spot-checks.

A verified spot-check found that app/lucky-card-reveal.js explicitly references the NGC4216 AVIF/WebP/JPEG background fallback chain. Those fallback assets must not be removed based on the previous report. The AVIF poster variant is also referenced by app/lucky-card-content.js and its collection test.

## Verification Plan

- Re-read the canonical PR Summary and active feature pointer.
- Validate that the only audit-diff paths are the eight paths recorded in PR_SUMMARY.md.
- Inspect current-head CI statuses; do not claim a new build or local shell result.
- In a future separately authorized cleanup task, clone/check out the repository, trace static and dynamic references, inspect CSS/manifests/fallbacks, run bundler analysis, and measure build size under the 495 MB ceiling.

## Governance Conflict

The repository's deep-dive specialist says the task must not end as a report-only PR; the user's explicit task authorization requires an audit-only boundary and says to report governance conflicts rather than silently expanding scope. This task retains the authorized boundary, reports the conflict, and does not implement cleanup.
