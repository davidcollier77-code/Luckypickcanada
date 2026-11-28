# Tasks: Refresh Baseline Reuse for Open Updater Pull Requests

**Input**: spec.md and plan.md
**Prerequisites**: plan.md and spec.md

## Phase 1: Setup and evidence

- [x] T001 Inspect `.github/workflows/refresh-docs.yml`, `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, `scripts/test-refresh-docs-e2e.js` and `.docs/manifest.json`.
- [x] T002 Collect run evidence: PR #2062 and its three notification comments/commit SHAs; the per-commit history of `_cloudflare_cloudflare-docs_pages.md`, `_numpy_numpy.md` and `.docs/manifest.json`.

## Phase 2: Diagnosis

- [x] T003 Confirm the baseline defect: every run checks out the default branch and force-pushes the pending branch, so an open pull request is never the comparison baseline.
- [x] T004 Separate the two document causes: NumPy = rotating Cloudflare email-protection href token (fixed by Spec 228, one legitimate clean-up in #2062); Cloudflare Pages = one genuine upstream content change re-applied by the follow-up run.
- [x] T005 Verify against the live library that NumPy, Cloudflare Pages and Turnstile now report `CURRENT`/`SKIPPED` with an unchanged `lastUpdated`, and that the recorded SHA pins are per document.

## Phase 3: Implementation

- [x] T006 Add `scripts/prepare-docs-refresh-baseline.js` with the pure `mergePendingBaselineManifest` helper, input validation and an atomic CLI.
- [x] T007 Add the "Reuse Open Refresh Pull Request" workflow step with a safe default-branch fallback and exactly one `ref` output.
- [x] T008 Make "Check for Changes" compare against the selected baseline ref.

## Phase 4: Regression coverage

- [x] T009 Genuine upstream change is refreshed once; the next run reports it skipped/unchanged with a stable snapshot and timestamp.
- [x] T010 A second run without SHA tracking reports the document as unchanged.
- [x] T011 Two documents sharing one upstream repository SHA are decided independently.
- [x] T012 Volatile URL tokens, nonces and line-ending differences do not create recurring updates.
- [x] T013 SHAs and timestamps advance only for verified downloads; failures and rejections stay visible.
- [x] T014 Real-git simulation: with an open refresh pull request the pre-repair path re-updates and re-commits, the repaired path reports no change and produces no new commit.
- [x] T015 Helper unit tests including the CLI, and workflow structure assertions (single `ref` output, baseline diff, guard, dispatch, force-push, PR base).

## Phase 5: Verification

- [x] T016 `node scripts/test-refresh-docs.js` passes.
- [x] T017 Workflow YAML parses; schedule, timezone, guard and dispatch inputs unchanged.
- [x] T018 Execute the real workflow baseline and change-gate scripts in a temporary git repository for the open-PR, no-PR and fetch-failure cases.
- [x] T019 Record local results and limitations in the handoff.

## Preserved behavior

The refresh implementation, transport, validation/integrity safeguards, static GSAP policy, approved inventory, source URLs, 495 MiB library cap, PR creation/update flow, reporting and the Tuesday/Friday 02:21, 06:21 and 10:21 `America/Halifax` schedule remain unchanged.

## Verification boundary

The updater suite ran under Node.js 24 in this environment rather than the repository's Node.js 26 requirement; the Node 26 Application Verification job and `freebuff-verify.sh` remain the authoritative gates. No production build or Playwright run was performed, and none is affected by these paths.
