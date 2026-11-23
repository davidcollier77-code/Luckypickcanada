# Feature Specification — Repository Security Audit and Monitoring (Spec 213)

## Goal

Resolve every outstanding GitHub Security alert in the repository, prove that
each finding was genuine, already fixed or a false positive, and leave ongoing
Dependabot, code-scanning and scheduled monitoring operating as before. Remove
only verified historical entries from `devskim-alerts.md` while keeping the
append-only reporting workflow intact.

## Scope

- Audit the live GitHub Security tab: code scanning, secret scanning and
  Dependabot alerts.
- Remediate the open DevSkim findings with source-level fixes or reviewed inline
  suppressions; never suppress an unverified finding.
- Update the one vulnerable transitive dependency and verify the resolved
  dependency tree.
- Verify Dependabot alerts, Dependabot security updates, the weekly update
  configuration and grouped security updates.
- Verify code scanning runs on pull requests and that the weekly DevSkim and
  CodeQL schedules remain configured.
- Clean verified historical entries from `devskim-alerts.md` while preserving
  the heading, explanatory text, reporting marker and append workflow.
- Record the audit in the Spec Kit artifacts and Memory Bank.

## Non-goals

No application behaviour, artwork, layout, audio, payment, authentication,
database, hosting or deployment change. No new scanner, no second reporting
pipeline, no change to the seven PR checker categories, no change to the 495 MiB
build cap and no dismissal of a finding without supporting evidence.

## User stories

1. The owner can open GitHub Security and see no unresolved finding that lacks
   a documented disposition.
2. A reviewer can read one ledger entry per historical finding and see that the
   corresponding alert was fixed or dismissed with evidence before the entry was
   removed.
3. Weekly Dependabot version updates continue, with security updates grouped
   instead of arriving as one pull request per dependency.
4. DevSkim and CodeQL continue to scan pull requests and the default branches on
   their existing schedule.
5. A future DevSkim finding is still appended to the shared ledger automatically.

## Functional requirements

- **FR-001** Every open code-scanning alert is inspected against its source.
- **FR-002** Genuine defects are fixed; false positives are dismissed with a
  supported reason and a concise comment.
- **FR-003** Secret-scanning alerts are assessed without exposing any value; any
  live credential is revoked or rotated before resolution.
- **FR-004** The vulnerable transitive dependency is upgraded and the lockfile
  is consistent with every manifest.
- **FR-005** Dependabot alerts and security updates are enabled.
- **FR-006** `.github/dependabot.yml` keeps the weekly cadence and groups
  security updates and routine minor/patch updates.
- **FR-007** DevSkim runs on pull requests, pushes to `main` and its weekly
  schedule; CodeQL default setup remains configured with its weekly schedule.
- **FR-008** Verified historical entries are removed from `devskim-alerts.md`;
  the heading, explanation, marker and append script remain.
- **FR-009** No unresolved or unverified entry is removed.
- **FR-010** The production build stays strictly below 495 MiB.

## Acceptance criteria

1. Initial and final counts are recorded for all three alert categories.
2. All 11 initial open code-scanning alerts have a verified disposition.
3. No open secret-scanning alert exists and no secret value is written anywhere.
4. The Dependabot advisory resolves from `pnpm-lock.yaml` and the affected
   consumer still loads.
5. `devskim-alerts.md` contains no historical finding entries and still has its
   heading, explanation and marker.
6. Python checker suites, TypeScript, the full Vitest suite, the build and the
   size gate pass locally.
7. One regular, unmerged pull request records the audit evidence.

## Assumptions

- GitHub Security is authoritative for current alert state.
- DevSkim inline `ignore` comments are the repository's existing suppression
  convention and are honored by the pinned scanner action.
- A Dependabot alert becomes `fixed` only after the corrected manifest reaches
  the default branch and Dependabot rescans; the fix is verified locally first.
