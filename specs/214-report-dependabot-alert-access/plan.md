# Implementation Plan: Read-only Dependabot alert access for the PR verification report

**Branch**: `freebuff/8fe3183e6a06cbe506bf0bb7-dependabot-alert-access` | **Date**: 2026-11-23 | **Spec**: `specs/214-report-dependabot-alert-access/spec.md`

## Summary

The consolidated PR verification report's seventh category reads
`repos/{owner}/{repo}/dependabot/alerts`, but the workflow's `GITHUB_TOKEN`
permissions grant only `security-events: read`. That scope covers code scanning,
not Dependabot alerts, so the fetch fails with `Resource not accessible by
integration` and the category correctly reports `NOT RUN`.

The fix is one read-only permission line,
`vulnerability-alerts: read`, in the workflow's existing top-level
`permissions` block. Nothing else changes.

## Technical Context

**Language/Version**: GitHub Actions workflow YAML; Python 3 checker scripts

**Primary dependencies**: `actions/checkout@v4.2.2`, the GitHub REST API
`dependabot/alerts` endpoint, `GITHUB_TOKEN`

**Storage**: none

**Testing**: Python checker suites and the Spec Kit governance gate; the
workflow change is also exercised by GitHub Actions after merge

**Target Platform**: GitHub Actions, with no application runtime change

## Constitution Check

- **Least change**: one `permissions` entry in one workflow file. PASS.
- **Preserve security controls**: the added scope is read-only, narrower than a
  write scope and narrower than a personal access token. No existing permission,
  trigger or step changes. PASS.
- **Owner authorization**: the repository owner explicitly requested this
  separate read-only permission change. PASS.
- **No secret exposure**: no token, secret or value is added, read or printed.
  PASS.
- **Monitoring preserved**: Dependabot, DevSkim, CodeQL and every schedule stay
  unchanged. PASS.
- **Build limit**: no application, dependency or build input changes, so the
  production build is unaffected; the last measured build remains 413.38 MiB,
  below 495 MiB. PASS.
- **Governance**: one feature directory, one separate regular unmerged PR. PASS.

## Design Decisions

1. **Add the exact read-only permission.** GitHub documents
   `vulnerability-alerts` as the `GITHUB_TOKEN` scope for listing Dependabot
   alerts, with only `read` and `none` values. `security-events` is documented
   for code scanning and does not grant this access. Adding the specific scope is
   the least-privilege fix; `read-all` or a personal access token would broaden
   access unnecessarily.
2. **Keep the change in its own PR.** The report workflow uses
   `pull_request_target`, checks out `ref: main`, and executes the workflow file
   and permissions from the base branch. A permission added on a pull request
   branch therefore cannot apply to that pull request's own report; it applies
   only after it reaches `main`. PR #2014 is also already open with an unrelated
   security-audit scope, so its workflow permissions must not be changed for
   this purpose.
3. **Document the bootstrap limitation honestly.** This PR's own report also
   runs the current `main` workflow and will not have the new permission, so its
   seventh category will remain `NOT RUN` until this change merges. That is
   expected, not a failure of the change.
4. **Document the PR #2014 consequence.** Even after this permission reaches
   `main`, PR #2014's seventh category becomes `WARNING`, not `PASSED`, because
   that PR changes `.github/dependabot.yml`; the checker treats any Dependabot
   configuration change as a warning by design. Moving or dropping that
   configuration change would be required for `PASSED`, and is not part of this
   read-only permission PR.

## Project Structure

```text
.github/workflows/pr-verification-report.yml   # one added permissions entry
memory-bank/techContext.md                     # durable permission fact
specs/214-report-dependabot-alert-access/
├── spec.md
├── plan.md
└── tasks.md
```

**Structure Decision**: One workflow file plus one durable Memory Bank note and
the Spec 214 artifacts. No source, test, dependency or configuration behaviour
changes.

## Complexity Tracking

No constitution violations. No additional structure is introduced.
