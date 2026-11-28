# Implementation Plan: Refresh Baseline Reuse for Open Updater Pull Requests

**Branch**: `freebuff/e001f4616ba90ebf2d84b833` | **Date**: 2026-11-28
**Spec**: spec.md

## Summary

Add a "Reuse Open Refresh Pull Request" workflow step that, only when an open `auto/docs-refresh` pull request exists, fetches that branch, checks its `.docs` tree into the working copy and re-applies the default branch's routing with a small helper. Change the existing change-detection gate to diff the staged `.docs` tree against the selected baseline (the branch tip, or `HEAD` when there is none). No updater logic changes.

## Technical Context

- **Language/Version**: JavaScript, Node.js 26.x (repository requirement); the helper uses only `fs`.
- **Primary Dependencies**: none added.
- **Storage**: `.docs/manifest.json` and snapshots; no schema change.
- **Testing**: `node scripts/test-refresh-docs.js` (also run by the Node 26 Application Verification job and `freebuff-verify.sh`).
- **Target Platform**: GitHub Actions (Ubuntu) with `gh` CLI and `actions/checkout@v4`.
- **Constraints**: preserve updater architecture, inventory, validation/integrity safeguards, PR create/update behaviour, reporting, the 495 MiB cap and the schedule.

## Constitution Check

- AGENTS.md remains authoritative; no governance file changes.
- `.github/workflows/refresh-docs.yml` and `scripts/` are protected paths; this repair is the explicitly authorized task scope.
- Spec Kit stages specify → plan → tasks → implement completed in order.
- `.docs/` content, source URLs and routing are unchanged except at runtime.
- No dependency, application, deployment, database or secret change.

## Research Findings

- The workflow checks out the default branch (`actions/checkout@v4`) and force-pushes `HEAD` to `auto/docs-refresh`, so the local commit exists only on that branch. A subsequent run starts from the default branch unless the pending branch is deliberately restored.
- PR #2062 demonstrates the outcome: three pushes of the same two document changes while the pull request was open.
- `getUpstreamSha` returns the repository head of the configured branch, keyed per library. Two documents from one repository therefore share a SHA value but each pin is read and written per document, so change decisions are already independent; this needs regression coverage only.
- The existing content comparison already normalizes line endings, nonces, Devsite metadata, Cloudflare email-protection hrefs, `sealed_token` values and trailing whitespace, so a correct baseline makes repeat runs stable. Live verification confirmed the current NumPy, Cloudflare Pages and Turnstile snapshots report `CURRENT`/`SKIPPED` with `lastUpdated` untouched.
- Upstream SHA pins are written only after a validated download; failures and rejections already leave the pin and timestamp alone.

## Design

1. `scripts/prepare-docs-refresh-baseline.js` exports `mergePendingBaselineManifest(pending, defaultBranch)` and a CLI. It returns the pending manifest with the owner-controlled configuration (`groups`, `sources`, `inventory`) taken from the default branch, keeping the updater-managed `lastUpdated` and `githubShas` from the pending branch. It validates its inputs and writes atomically, without letting a cleanup failure mask the original error.
2. In the workflow, after dependency installation, a new step resolves the open pull request with `gh pr list --state open --head auto/docs-refresh`. When one exists it saves the default-branch manifest, fetches the pending branch, checks out its `.docs`, runs the helper and publishes the baseline commit SHA. Every path publishes a single `ref` output; a missing pull request or a failed fetch leaves it empty and the run continues from the default branch.
3. The change-detection gate compares `git diff --staged` against `${BASELINE_REF:-HEAD}` with a `.docs/` pathspec and `set -euo pipefail`, so an unchanged repeat run — or a run where unrelated files advanced on the default branch — reports `changed=false`, and a failed git command fails the step instead of reporting no changes.
4. Regression coverage in `scripts/test-refresh-docs.js`: genuine change plus unchanged second run, non-SHA unchanged second run, sibling documents sharing a repository SHA, volatile-token and formatting stability, SHA/timestamp advance rules, download/rejection visibility, a real-git simulation of the open-pull-request loop with an explicit pre-repair control, helper unit tests (including the CLI), and workflow structure assertions.

## Project Structure

- `scripts/prepare-docs-refresh-baseline.js` — new pure merge helper and CLI.
- `.github/workflows/refresh-docs.yml` — baseline reuse step and baseline-aware change gate.
- `scripts/test-refresh-docs.js` — regression coverage.
- `specs/229-docs-refresh-baseline-reuse/` — specification, plan and task record.

## Complexity Tracking

One helper module and one workflow step. No new dependency, service, configuration surface or abstraction; the updater, its transport, validation, integrity reporting and PR behaviour are untouched.
