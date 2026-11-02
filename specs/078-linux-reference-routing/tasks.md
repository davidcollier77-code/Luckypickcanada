# Tasks: Linux Environment Reference Routing

**Input**: `specs/078-linux-reference-routing/spec.md` and `plan.md`

## Phase 1: Inspect and specify

- [x] T001 Confirm the existing Wrangler source is routed to `troubleshooting` and `deep-dive` in `.docs/manifest.json`.
- [x] T002 Inspect `scripts/refresh-docs.js` and verify its source-ID filename sanitization, first-group canonical copy, and subsequent-group symlink/fallback behavior.
- [x] T003 Verify the official Debian Reference source and Ubuntu package-management supporting reference.
- [x] T004 Create and quality-check `specs/078-linux-reference-routing/spec.md`.

## Phase 2: Plan and implement

- [x] T005 Create `specs/078-linux-reference-routing/plan.md` with routing, updater, distro-detection, and sandbox-safety decisions.
- [x] T006 Add `/debian/debian-reference` once to both intended group arrays, its source URL to `.docs/manifest.json`, and one inventory entry.
- [x] T007 Add the conditional Linux reference and distro/permission safeguards to `.freebuff/troubleshooting.md` and `.freebuff/deep-dive.md`.
- [x] T008 Update `.specify/feature.json` and `memory-bank/activeContext.md`.
- [x] T009 Create this executable task record at `specs/078-linux-reference-routing/tasks.md`.

## Phase 3: Verify and report

- [x] T010 Parse the final branch manifest and assert exactly two group memberships, one source configuration, one inventory entry, and the expected snapshot name.
- [ ] T011 Run `node scripts/test-refresh-docs.js` and `./freebuff-verify.sh` in a repository shell; report exact results.
- [ ] T012 Re-trigger the documentation updater after the branch change is merged; verify the canonical Troubleshooting snapshot and Deep-dive link.
- [x] T013 Review the complete PR diff and update this PR's single canonical summary; leave it open and unmerged.

## Verification Status

- **PASS** — Wrangler's original group routing and updater's canonical-copy/link implementation inspected.
- **PASS** — Official Debian Reference and Ubuntu package-management sources selected.
- **PASS** — Manifest/group instruction/Spec Kit updates committed to this branch.
- **PASS** — Final branch manifest assertions: exactly two target groups, one source URL, one inventory entry, and the expected sanitized snapshot name.
- **PASS** — Complete PR diff reviewed; PR #1683 summary updated to match the actual changes and verification evidence.
- **PENDING** — `node scripts/test-refresh-docs.js` and `./freebuff-verify.sh` were not run locally because no repository shell is available in this session; PR CI workflows are running.
- **PENDING** — Actual updater execution after the manifest reaches the default branch.
