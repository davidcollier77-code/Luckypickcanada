# Spec — Repository Cleanup Audit (Feature 030)

## Objective

Perform a read-only audit of the Luckypickcanada repository to identify unused files, assets (images, audio), and npm dependencies. No deletions or code changes are authorized in this audit task; the output is a documented findings report only.

## Scope

- Static analysis of `public/` directory assets against code references in `app/`, `components/`, `scripts/`, and `tests/`.
- Dependency audit using `depcheck` cross-referenced against `grep` searches.
- Git-tracked stale artifacts (`.orig`, `.rej` files) identification.
- Build size measurement and comparison against the 495 MB hard ceiling.

## Acceptance Criteria

- All findings categorized as CONFIRMED UNUSED, LIKELY UNUSED, or DO NOT REMOVE with supporting evidence.
- Build size reported in MB with evidence.
- No application source, dependency manifests, workflows, or tests modified within audit scope.
- `PR_SUMMARY.md` updated with categorized findings and build size measurement.

## Constraints

- This is an audit-only task. No files may be deleted, and no dependencies may be removed within this PR.
- Static grep-based analysis may miss dynamic imports or CSS `url()` references; all CONFIRMED UNUSED classifications should be verified with bundler analysis before actual removal in a future implementation PR.
- The NGC4216 image variants require verification of Next.js `<picture>` or image loader fallback configuration before removal can be confirmed safe.
