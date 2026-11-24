# Feature Specification — Read-only Dependabot alert access for the PR verification report (Spec 214)

**Feature Branch**: `freebuff/8fe3183e6a06cbe506bf0bb7-dependabot-alert-access`

**Created**: 2026-11-23

**Status**: Implemented

**Input**: Owner direction: correct the category 7 answer because the report
workflow runs from `main` via `pull_request_target`; open a separate read-only
PR that adds `vulnerability-alerts: read`; document that the Dependabot
configuration change in PR #2014 keeps that category at `WARNING`.

## Goal

Give the consolidated PR verification report least-privilege read access to the
repository's Dependabot alerts, so its seventh category can read the advisory
source instead of reporting `NOT RUN` because the endpoint is inaccessible.

## Scope

- Add `vulnerability-alerts: read` to the existing `permissions` block of
  `.github/workflows/pr-verification-report.yml`.
- Record the exact `pull_request_target` behaviour and the resulting bootstrap
  limitation.
- Record the Spec 214 artifacts and the durable technical fact in the Memory
  Bank.

## Non-goals

No checker logic, category, status, trigger, concurrency, timeout or step
change. No write permission, no personal access token, no new secret, no change
to `.github/dependabot.yml`, the Dependabot schedule, code scanning, DevSkim or
the application. No change to PR #2014's branch or commit.

## User stories

1. After this change reaches `main`, the seventh category can read Dependabot
   alerts and report the real advisory state instead of `NOT RUN`.
2. A reviewer can confirm that the workflow gained only one read-only permission
   and no broader access.

## Functional requirements

- **FR-001** The workflow's `permissions` block declares `vulnerability-alerts: read`.
- **FR-002** No `write` permission and no new token or secret is added.
- **FR-003** Every existing trigger, permission, concurrency rule and step stays unchanged.
- **FR-004** The PR documents that `pull_request_target` evaluates the workflow
  file and its permissions from `main`, so the permission cannot affect the
  report of the PR that adds it, and did not affect PR #2014's report.
- **FR-005** The PR documents that PR #2014's `.github/dependabot.yml` change
  keeps that PR's seventh category at `WARNING`, never `PASSED`, even after the
  permission reaches `main`.
- **FR-006** The change is delivered as one separate, regular, non-draft PR that
  remains open and unmerged for the owner.

## Acceptance criteria

1. The diff contains only the workflow permission, the Spec 214 artifacts and
   the durable Memory Bank note.
2. The workflow parses and its permissions block contains `vulnerability-alerts: read`.
3. The existing Python checker suites pass unchanged.
4. The Spec Kit gate recognizes one complete feature directory.
5. The PR is open and unmerged for the owner.

## Assumptions

- GitHub exposes `vulnerability-alerts: read` for `GITHUB_TOKEN`; it is separate
  from `security-events`, which covers code scanning.
- The repository owner explicitly authorized this exact workflow permission
  change and a separate PR for it.
- A `pull_request_target` event evaluates the workflow file and permissions from
  the base branch, not from the pull request head.
