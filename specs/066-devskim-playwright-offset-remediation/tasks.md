# Tasks: DevSkim Playwright Offset Remediation

**Input**: `specs/066-devskim-playwright-offset-remediation/spec.md` and `specs/066-devskim-playwright-offset-remediation/plan.md`

## Phase 1: Setup

- [x] T001 Inspect governance (`AGENTS.md`, `.freebuff/freebuff.md`, `.freebuff/security.md`, `.docs/manifest.json`), memory bank, branch/worktree state, existing DevSkim precedent specs (045/047/054/055), the filter, its tests, the workflow, and `devskim-alerts.md`.
- [x] T002 Recover the interrupted state: no local branch, stash, dangling commit, or remote branch carried an unfinished diff for this task; the recoverable work is the committed filter, the ledger rows, and the two specs. Nothing was discarded.

## Phase 2: Foundational evidence

- [x] T003 Install DevSkim CLI 1.0.100 and scan both specs to obtain authoritative SARIF regions.
- [x] T004 Prove the offset convention: reported `charOffset` matches UTF-16 code units for all 10 results and code points only for the ASCII-only file; prove both spec paths were outside the allowlist.

## Phase 3: Implementation

- [x] T005 Add UTF-16 → code-point offset normalization in `.github/scripts/suppress_devskim_false_positives.py` (fail closed on split surrogates and out-of-range offsets).
- [x] T006 Add the two exact audited paths to `KNOWN_CONTEXTUAL_SUPPRESSION_FILES`.
- [x] T007 Add regression and negative-control tests, including a real-file UTF-16 replay and an end-to-end `suppress_sarif()` check.
- [x] T008 Remove only verified ledger rows from `devskim-alerts.md` and confirm the report structure. All 14 rows for the two specs (8 gold CTA, 6 sitewide) were removed; heading and append marker preserved.
- [x] T009 Run the focused Python suite, the full-repository scanner inventory, and reconcile against the ledger. 60 focused tests passed; the full-repository scan produced 148 results and the filter removed 147, leaving one genuine finding.
- [x] T010 Run both Playwright specifications. Both were executed; homepage and Crystal Ball renderer crashes block a green local run in this container.
- [x] T011 Run `./freebuff-verify.sh` and record the measured production build size.
- [x] T012 Inspect the final diff, publish the PR body, and leave the PR open and unmerged.

## Verification record

- **PASS — Python syntax:** `python3 -m py_compile` on the filter and its tests.
- **PASS — focused suite:** `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` — 60 tests, OK.
- **PASS — real scanner replay:** DevSkim 1.0.100 SARIF for `sitewide-gold-cta.spec.ts` (6 results) and `gold-cta.spec.ts` (4 results) through `suppress_sarif()`: 6/6 and 4/4 suppressed, **0 results remaining**.
- **PASS — full inventory scan:** repository-wide `devskim analyze` produced 148 results; after filtering, 147 removed and **1** remains (`playwright.config.ts:31 DS162092`), which is deliberately left visible.
- **PASS — governance/build:** `./freebuff-verify.sh` completed with `✅ All verification steps passed` (Spec Kit gate, `pnpm tsc --noEmit`, `pnpm run build`, refresh-docs 19/19).
- **PASS — build size:** `.next` 388,493,055 bytes + `public` 32,011,361 bytes = **420,504,416 bytes / 401.02 MiB** (below the 495 MB hard maximum).
- **FAIL (environment) — Playwright:** both specs executed. Default config: 3 passed / 27 failed. Desktop-only sitewide with staged system libraries: 2 passed (Lucky Map, About) / 4 failed. Failures are `page.goto: Target page, context or browser has been closed` on `/` and `/crystal-ball`; the local Chromium renderer crashes. Full-Chromium channel cannot launch here at all. No assertion-level defect is claimed or hidden; CI Playwright remains the confirmation path.
- **BLOCKED — GitHub Code Scanning alert objects:** no token is available in this environment, so alert-by-alert reconciliation uses the real local scanner plus the ledger instead.
