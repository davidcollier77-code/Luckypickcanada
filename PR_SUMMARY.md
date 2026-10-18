# PR Summary — PR #1510: Remove No-op Code-scanning Debug Artifact

## Current-head Visual QA failure and targeted follow-up — 2026-10-17

- **Run inspected:** [Visual QA run #39038534341, job #117413181877](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39038534341/job/117413181877). The unit test stages, standalone TypeScript check, `./jules-verify.sh` Spec Kit gate, and committed visual baseline check passed. Playwright ended with 16 passed, 5 failed, and 3 skipped; the job failure was not Robin.
- **Verified homepage timing cause:** The Playwright trace shows the Howler browser chunk requested/served approximately 7.58 seconds after the initial page document and `/sounds/confetti-pop.wav` at approximately 8.33 seconds. The old test required the request within five seconds and then found the SSR button still at `data-hydrated="false"` and `data-confetti-pop-ready="false"`. This is consistent with slow first-time Next dev chunk compilation; the asset URL was requested successfully in the trace.
- **Verified daily quota timing cause:** The 30-second test deadline expired after cold navigation took about 12.7 seconds plus three intentionally animated fortune reveals. The captured page had reached the exhausted-quota message, disabled button, and three session readings. The test's overall time budget, rather than a missing quota state, was the reported failure.
- **Targeted test-only change committed:** `tests/visual/homepage.spec.ts` now waits up to 30 seconds for hydration, the pre-activation audio request, and ready state; keyboard test readiness uses the same bounded timeout and a 60-second test budget. `tests/visual/crystal-ball-daily-limit.spec.ts` has a 60-second test budget. Functional assertions were not removed or skipped. No application implementation, dependency, security setting, reviewer workflow, or deployment configuration was changed by this follow-up.
- **Verification status:** These changes are committed on `alert-autofix-16`; current-head Visual QA must rerun before they can be declared effective. Robin/OpenRouter/Amazon Q is a separate review gate and was not changed as part of this repair. Do not merge until all required current-head checks and the repository's review gate are resolved.

## A — Analyze

- SELECTED TASK GROUP: troubleshooting
- GROUP REASON: Diagnose the failed PR verification using workflow logs and repair the verified causes rather than merely reporting them.
- Authorization: The repository owner explicitly authorized full repair of PR #1510.
- PR: https://github.com/davidcollier77-code/Luckypickcanada/pull/1510
- Verified candidate issue: code-scanning alert #16 flagged a self-replacement operation in test_fix.js.
- Verified Visual QA root cause: scripts/verify-speckit-task.sh rejected specs/025-crystal-ball-audio-daily-limit/spec.md because it was not changed in the current task branch. The active pointer referenced an unrelated Crystal Ball feature.
- Verified reviewer issue: Robin exhausted five OpenRouter attempts because no first response arrived within 45 seconds. This is an upstream review-provider timeout, not a code finding. Do not weaken the fail-closed review check.
- The remaining test_fix.js contained only an fs import, a read of components/DailyResonance.tsx, and a debugging comment after the transformation had been removed. It provided no assertion or useful output; the complete temporary artifact is removed.
- Context7 was not invoked because the repository requires separate explicit owner approval for every call.

## B — Boundaries + Plan

- Delete the root-level test_fix.js artifact.
- Create the dedicated specs/026-code-scanning-noop-cleanup feature artifacts and point .specify/feature.json to that feature so the existing governance gate validates fresh, task-specific spec.md, plan.md, and tasks.md.
- Update Memory Bank and this canonical summary.
- No application source, UI, audio, dependency manifest/lockfile, secrets, API routes, payments, database schema, deployment settings, or security controls are changed. `.github/workflows/robin.yml` now has one failure-only, bounded diagnostic to expose account/quota/provider status; the review enforcement and fail-closed outcome remain unchanged.
- The actual repo shell is unavailable from this session because git clone could not resolve github.com. The repository API is used for the scoped commit; GitHub Actions must provide execution evidence.

## C — Spec Kit Stages and Governance Record

- /speckit.specify — definition: .jules/cmds/speckit.specify.md; method: FILE-DRIVEN PROCEDURAL EXECUTION THROUGH REPOSITORY API; result: artifact created and quality checklist completed at specs/026-code-scanning-noop-cleanup/spec.md and specs/026-code-scanning-noop-cleanup/checklists/requirements.md. Native dispatch and local prerequisite shell command were unavailable; extension-hook config .specify/extensions.yml was not found.
- /speckit.plan — definition: .jules/cmds/speckit.plan.md; method: FILE-DRIVEN PROCEDURAL EXECUTION THROUGH REPOSITORY API; result: plan and verified research/quickstart artifacts created at specs/026-code-scanning-noop-cleanup/plan.md, research.md, quickstart.md. Native dispatch and local setup script were unavailable.
- /speckit.tasks — definition: .jules/cmds/speckit.tasks.md; method: FILE-DRIVEN PROCEDURAL EXECUTION THROUGH REPOSITORY API; result: task list created at specs/026-code-scanning-noop-cleanup/tasks.md. Implementation/CI validation tasks remain pending until updated-head results are inspected.
- /speckit.implement — definition: .jules/cmds/speckit.implement.md; method: REPOSITORY API CHANGE PLUS GITHUB ACTIONS VERIFICATION; result: removal of the inert debugging script and governance artifacts prepared. Full completion depends on the actual updated-head CI results; no local shell/build command is claimed.
- Active feature pointer: .specify/feature.json → specs/026-code-scanning-noop-cleanup.
- Governance gate requirement: each active spec.md, plan.md, tasks.md must be non-empty and modified on the current branch. The new feature artifacts meet the intended gate; the updated-head workflow will confirm.
- Governance and code/build verification status: PASS on candidate HEAD 8bdd4fef8a7515e837da5138c6140b49cdb4e5fe. Visual QA, full tests, TypeScript, ./jules-verify.sh, Playwright, Next.js/OpenNext/Wrangler checks, the 495 MiB size gate, and all three CodeQL analyzers passed. Robin remains a separate failed review gate; it did not post a review. The underlying pre-first-chunk HTTP/provider status is masked by Robin v2.12.0 and is not proven from the current logs.

## Required Resources Consulted

- AGENTS.md — USED=YES, USEFUL=YES: task group routing, required Spec Kit sequence, no bypass/false claims, protected-system limits, and 495 MiB hard cap.
- .jules/jules.md — USED=YES, USEFUL=YES: initialization, Memory Bank updates, Spec Kit execution/reporting requirements.
- .jules/troubleshooting.md — USED=YES, USEFUL=YES: evidence-driven troubleshooting and required local resource snapshots.
- .jules/testing.md — USED=YES, USEFUL=YES: real execution is required rather than code inspection alone.
- .jules/security.md — USED=YES, USEFUL=YES: preserve security checks and avoid weakening controls.
- .specify/memory/constitution.md — USED=YES, USEFUL=YES: use the required Spec Kit sequence and report file-driven execution truthfully.
- .specify/init-options.json — USED=YES, USEFUL=YES: sequential feature numbering; 026 follows the highest existing feature 025.
- .specify/integration.json, .specify/integrations/generic.manifest.json, .specify/workflows/speckit/workflow.yml, .specify/workflows/workflow-registry.json — USED=YES, USEFUL=YES: inspected the configured Spec Kit integration/workflow route.
- .specify/templates/spec-template.md, plan-template.md, tasks-template.md — USED=YES, USEFUL=YES: structure of generated task artifacts.
- .docs/troubleshooting/jules_google_docs.md — USED=YES, USEFUL=NO: required Jules documentation snapshot read; no runtime implementation detail changed.
- .docs/troubleshooting/_google-gemini_gemini-cli.md — USED=YES, USEFUL=NO: required CLI snapshot read; no Gemini CLI was invoked.
- .docs/troubleshooting/_websites_ai_google_dev_gemini-api.md — USED=YES, USEFUL=NO: required Gemini API snapshot read; no Gemini API is used by this fix.
- package.json — USED=YES, USEFUL=YES: confirms test command and no declared test_fix.js script entry.
- test_fix.js on the PR head — USED=YES, USEFUL=YES: confirms the remaining script was inert after the no-op removal.
- scripts/verify-speckit-task.sh, scripts/test-verify-speckit-task.sh, jules-verify.sh, .github/workflows/visual-qa.yml — USED=YES, USEFUL=YES: confirmed the exact gate failure and what subsequent checks should run.
- GitHub Actions logs for runs 39035622659, 39035622617, and 39035622623 — USED=YES, USEFUL=YES: verified Visual QA's gate failure, Robin's provider timeout, and the earlier successful OpenNext check.
- Repository code search for test_fix.js — USED=YES, USEFUL=YES: returned no references; search indexing can be incomplete, so this is supportive, not the sole removal rationale.
- Context7 — NOT USED: no call was made; separate owner approval is required.
- Full inventory of all unrelated .jules specialist histories and optional Speckit commands was not exhaustively re-read because troubleshooting plus specify/plan/tasks/implement are the task route; the final governance report must not claim more than was actually consulted.

## Changed Files in This Candidate

1. .specify/feature.json
2. PR_SUMMARY.md
3. memory-bank/activeContext.md
4. memory-bank/progress.md
5. specs/026-code-scanning-noop-cleanup/spec.md
6. specs/026-code-scanning-noop-cleanup/checklists/requirements.md
7. specs/026-code-scanning-noop-cleanup/plan.md
8. specs/026-code-scanning-noop-cleanup/research.md
9. specs/026-code-scanning-noop-cleanup/quickstart.md
10. specs/026-code-scanning-noop-cleanup/tasks.md
11. test_fix.js (deleted)

No dependency, application source, workflow, lockfile, secret, or deployment configuration changed.

## Verification Record — Updated Candidate

**Verified HEAD at time of checks:** `8bdd4fef8a7515e837da5138c6140b49cdb4e5fe`

- COMMAND: `pnpm exec vitest run __tests__/oracle-usage.test.js` (Visual QA run [39036393317](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39036393317))
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: 1 test file / 3 tests passed.
- COMMAND: `pnpm run test` (same Visual QA run)
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: 12 test files / 76 tests passed.
- COMMAND: `pnpm tsc --noEmit` (same Visual QA run)
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: standalone TypeScript check completed successfully.
- COMMAND: `./jules-verify.sh` (same Visual QA run)
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: Spec Kit regression checks passed; `scripts/verify-speckit-task.sh` verified the task-specific `spec.md`, `plan.md`, and `tasks.md`; Next.js production build passed; `scripts/test-refresh-docs.js` completed with 17 passed and 0 failed. This explicitly resolves the original active-artifact gate failure.
- COMMAND: `pnpm exec playwright test` (same Visual QA run)
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: 21 passed, 3 skipped, 0 failed. Visual QA run conclusion is success.
- COMMAND: `pnpm run build` and size-enforcement step (OpenNext validation run [39036393128](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39036393128))
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: production build succeeded. Combined `.next + public` measured 325,423,721 bytes / 310.35 MiB, below 495 MiB (519,045,120 bytes).
- COMMAND: `pnpm exec opennextjs-cloudflare build`
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: OpenNext Cloudflare build completed. Tailwind CSS scan, `.open-next/worker.js`, `.open-next/assets`, Wrangler `build` validation with no deployment, and final Git status checks passed in run 39036393128.
- COMMAND: CodeQL Actions / JavaScript-TypeScript / Python analysis (workflow run [39036390039](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39036390039))
  - RESULT: PASS
  - EVIDENCE/OUTPUT SUMMARY: all three CodeQL analysis jobs completed successfully on this candidate.
- COMMAND: Robin Code Review workflow run [39036393135](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39036393135), attempts 1 and 2
  - RESULT: FAIL — review not produced
  - EVIDENCE/OUTPUT SUMMARY: both attempts exhausted five requests and posted no review. The action reported `OpenRouter stall: no first response within 45000 ms`. The log timestamps show the rejection following each attempt almost immediately, not after 45 seconds. Inspection of Robin v2.12.0 source (`src/llm-client.ts`, pre-first-chunk catch branch around lines 489–516) shows that many errors before the first stream chunk are converted to the same generic stall error. Therefore the actual HTTP/provider status is not visible in these logs; an actual provider outage, invalid API key, rate limit, or route error cannot be distinguished from this evidence. No Robin workflow guard or review policy was weakened. Separate Amazon Q review comments exist, but they do not make the failed Robin check green.
- COMMAND: Query current active code-scanning alert 16 status
  - RESULT: NOT AVAILABLE through the connected GitHub API tool
  - EVIDENCE/OUTPUT SUMMARY: the connector denied the security alert endpoint. Do not claim the dashboard alert is closed on the default branch before merge/reanalysis.
- COMMAND: Local `git` / shell checks
  - RESULT: NOT AVAILABLE
  - EVIDENCE/OUTPUT SUMMARY: local repository clone failed because the session could not resolve `github.com`; all execution results above are from the remote GitHub Actions runners or read-only repository API.

## Final Scope and Diff Audit

The exact candidate PR file inventory was re-read from GitHub after commit `8bdd4fe`. The original source-cleanup change contained 11 paths; the Robin diagnostic/fallback added a twelfth, and this Visual QA timing follow-up adds two test files for 14 changed paths total. The new test edits do not change runtime behavior or any review enforcement.

1. `.specify/feature.json`
2. `PR_SUMMARY.md`
3. `memory-bank/activeContext.md`
4. `memory-bank/progress.md`
5. `specs/026-code-scanning-noop-cleanup/checklists/requirements.md`
6. `specs/026-code-scanning-noop-cleanup/plan.md`
7. `specs/026-code-scanning-noop-cleanup/quickstart.md`
8. `specs/026-code-scanning-noop-cleanup/research.md`
9. `specs/026-code-scanning-noop-cleanup/spec.md`
10. `specs/026-code-scanning-noop-cleanup/tasks.md`
11. `test_fix.js` (deleted)
12. `.github/workflows/robin.yml` (adds free-model quota preflight, failure diagnostics, and an Amazon Q fallback that is accepted only after a substantive review of the exact current head)
13. `tests/visual/homepage.spec.ts` (bounded hydration and audio-readiness waits; assertion scope preserved)
14. `tests/visual/crystal-ball-daily-limit.spec.ts` (60-second allowance for the complete animated quota flow; assertions preserved)

No dependency, lockfile, application source, environment variable, secret, or deployment configuration was changed by the Visual QA timing follow-up. The Robin workflow change remains a separately scoped change in this PR. No deployment was performed. The earlier source-cleanup CI run passed, and the initial Spec Kit gate failure is resolved; however, run #39038534341 exposed the five Playwright failures described above. The two test-only fixes now require fresh current-head evidence. Robin/Q review verification is also tracked separately, so the PR remains open and unmerged.

Pre-submission double-check: the live PR file list was compared with the summary above; the source diff is limited to deletion of the inert script, and the remaining changed paths are task-governance and documentation records. Actual changed-head execution results are recorded above. The only known red check is Robin; its cause cannot be fully diagnosed without exposing the masked provider response/status or restoring a reliable review result.

USEFUL RESULT: PARTIAL — the no-op artifact is removed and source-cleanup checks passed on commit 8bdd4fe, but run #39038534341 later failed the Playwright stage on the reviewer-workflow update commit. The test-only timing fixes are committed and current-head verification is pending. MERGE-READINESS: NO until current-head checks pass and the required Robin/Amazon Q review gate is verified; do not describe all checks as green.


## Amazon Q follow-up review findings addressed

Review `5558036445` on head `e459b24309a8b5382ea803313d2474547b713898` caught three workflow hardening items. The follow-up commit adds `primary_review.outcome == 'skipped'` to the Amazon Q fallback condition, explicitly redacts the real API key only when non-empty, and aligns the polling budget (90 seconds) with a 3-minute step and 7-minute job timeout. The reviewer result remains fail-closed unless a substantive review for the exact current SHA exists. Current-head CI has to revalidate these final workflow changes before merge-readiness is claimed.


## Final diagnostic audit follow-up

A read-back of the quota preflight revealed that the bearer redaction regex was over-escaped and an obsolete `clean` helper remained. Both were corrected: the regex now uses normal JavaScript whitespace matching and status/error fields consistently use the explicit non-empty-secret-aware `redact` helper. Fresh current-head validation remains required.


---

## PR #1511 — Merge-conflict resolution and Crystal Ball reveal repair (2026-10-17)

### Task group and reason
- SELECTED TASK GROUP: polishing
- GROUP REASON: This PR refines Crystal Ball word wrapping, Unicode rendering, newline handling, reveal timing, scrolling, and reduced-motion responsiveness.

### Verified findings
- The branch head before repair was `311af3710bab2ba05887b5b33173068bc23b4933`; main had advanced 13 commits beyond the branch's prior base.
- The second PR commit appended a second copy of `CrystalBall` to `app/components/CrystalBall/CrystalBall.tsx`, leaving two default-export declarations. This was a source defect in addition to the Git conflict.
- The shared `.specify/feature.json` conflict is resolved in favor of this PR's active feature, `specs/crystal-ball-fix`, so the branch's active pointer matches the spec/plan/tasks being delivered.
- The main-branch `PR_SUMMARY.md` contains the PR #1510 verification record. This repair preserves that record and appends this PR's section rather than replacing unrelated evidence.

### Implementation
- Rebuilt `CrystalBall.tsx` from the single-component implementation in the first PR commit and reapplied the intended reduced-motion dependency and newline-display fixes.
- Kept exactly one default component export.
- Newline tokens are emitted as standalone `<br>` elements; word wrappers continue to prevent mid-word wrapping.
- Reveal counters now use `Array.from(...).length` so their count matches code-point iteration.
- Preserved the 20 ms base typing delay, 125 ms punctuation pause, top-aligned smooth scrolling, audio calls, leaf-flight sequence, and reduced-motion handling.
- Resolved `.specify/feature.json` to `specs/crystal-ball-fix`, matching the Spec Kit artifacts delivered by this PR.
- Updated the Crystal Ball feature spec, plan, and task checklist. Final verification remains explicitly pending.

### Exact changed-file list
1. `.specify/feature.json`
2. `app/components/CrystalBall/CrystalBall.tsx`
3. `app/components/CrystalBall/CrystalBall.module.css`
4. `specs/crystal-ball-fix/spec.md`
5. `specs/crystal-ball-fix/plan.md`
6. `specs/crystal-ball-fix/tasks.md`
7. `PR_SUMMARY.md`
8. `memory-bank/activeContext.md`
9. `memory-bank/progress.md`

### Routed material actually inspected
- `AGENTS.md`, `.jules/jules.md`, `.jules/polishing.md`, `.docs/manifest.json`, `.docs/polishing/jules_google_docs.md`, `.docs/polishing/_google-gemini_gemini-cli.md`, and `.docs/polishing/_websites_ai_google_dev_gemini-api.md`.
- `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/progress.md`, `memory-bank/techContext.md`, and `.specify/memory/constitution.md`.
- The Spec Kit specify, plan, tasks, and implement command definitions were inspected for process constraints. Native dispatch and local shell-driven setup were not available in this API-only editing session; this entry does not claim these procedures or `./jules-verify.sh` were executed.

### Verification status
- Source integrity checks during candidate preparation: PASS — exactly one `export default function CrystalBall` and one component declaration remain; the newline and reduced-motion dependency fixes are present.
- COMMAND: `pnpm run test`
  - RESULT: NOT RUN in this editing session; requires current-head GitHub Actions evidence.
- COMMAND: `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts`
  - RESULT: NOT RUN in this editing session; requires current-head GitHub Actions evidence.
- COMMAND: `pnpm tsc --noEmit`
  - RESULT: NOT RUN in this editing session; requires current-head GitHub Actions evidence.
- COMMAND: `./jules-verify.sh`
  - RESULT: NOT RUN in this editing session; requires the repository shell/setup flow.
- COMMAND: `pnpm run build`, OpenNext/Cloudflare validation, and measured `.next + public` size
  - RESULT: NOT RUN in this editing session; current-head build evidence is required. The 495 MB hard maximum remains mandatory.
- Pre-submission double-check: source integrity assertions passed; full repository verification and current-head CI remain pending.
- Remaining issue: do not merge until GitHub reports no conflict and the required checks and review gate are verified.

USEFUL RESULT: PARTIAL — the conflict-repair candidate removes the duplicate component and preserves the intended behavior, but completion and merge readiness depend on current-head verification.


---

## Crystal Ball browser-local daily allowance — 2026-10-17

### Task and authorization
- **Task group:** polishing.
- **Reason:** implement the user-authorized Crystal Ball allowance UX: three successful AI-backed answers per visitor-local day, a visible countdown to local midnight, and removal of the separate persistent server-side daily IP quota.
- **Authorization:** explicit user authorization to implement; user subsequently directed that AGENTS.md not be treated as a blocker.
- **Branch:** `fix/crystal-ball-browser-daily-limit`.
- **PR:** https://github.com/davidcollier77-code/Luckypickcanada/pull/1516
- **Scope:** Crystal Ball daily allowance storage/display, Oracle API validation and daily-quota removal, directly related tests/specs/summary. Artwork, reveal order, audio, model prompt, response aliases, CORS allowlist, and API short-window rate limiter are preserved.

### Implementation summary
- Added `app/crystal-ball-client/daily-usage.js` with a versioned localStorage key, visitor-local `YYYY-MM-DD` key, bounded 0–3 count, next-local-midnight calculation, stale/malformed-value reset, and in-memory fallback if storage is unavailable.
- Updated `app/crystal-ball-client/CrystalBallClient.js` to remove its GET quota request; initialize/save the local counter; notice cross-tab storage changes and local date rollover; count successful AI-backed responses only; and pass the local next-midnight timestamp to the Crystal Ball.
- Updated `app/components/CrystalBall/CrystalBall.tsx` and `CrystalBall.module.css` to display the existing remaining-questions/exhaustion message plus an HH:MM:SS countdown that updates every second.
- Removed persistent Redis/KV/process-memory daily quota reservations and the `GET /api/oracle` status handler from `app/api/oracle/route.js`. The existing ten-requests-per-minute IP request limiter remains. The route rejects malformed/missing/non-string/empty/over-120-character/filtered questions before calling the AI provider, while retaining the existing fallback response for missing credentials or provider failures.
- Deleted the obsolete `app/lib/oracle-usage.js` implementation and its server-quota-only test. Added unit coverage for browser-local date/storage rules and route-validation tests proving invalid questions do not call the AI provider. Updated the Visual QA targeted test step and the daily-limit Playwright assertion/waits.
- Added active Spec Kit artifacts at `specs/028-crystal-ball-browser-daily-limit/` and pointed `.specify/feature.json` at the new feature so the repository's task-artifact check can validate this task.
- Added a supersession note to the earlier feature 025 records so readers do not recreate the removed IP-based quota. Memory Bank entries record current scope and verification limitations.

### Important behavior and accepted limitation
- The daily reset is the visitor's **local midnight**, calculated with the local Date constructor rather than UTC midnight or a fixed 24-hour duration. The UI visibly displays `Allowance resets in HH:MM:SS`.
- The counter represents completed AI-backed answers; generic fallback fortunes do not consume a slot.
- Browser storage can be cleared or edited to bypass this counter. That is the consciously accepted simplicity/usability trade-off, not tamper-resistant cost control.
- The existing API short-window IP rate limiter is retained; no daily IP-derived quota identifier or persistent daily quota store remains in the Oracle route.

### Files changed in this candidate
1. `.specify/feature.json`
2. `.github/workflows/visual-qa.yml`
3. `app/api/oracle/route.js`
4. `app/components/CrystalBall/CrystalBall.tsx`
5. `app/components/CrystalBall/CrystalBall.module.css`
6. `app/crystal-ball-client/CrystalBallClient.js`
7. `app/crystal-ball-client/daily-usage.js`
8. `app/lib/oracle-usage.js` (deleted)
9. `__tests__/crystal-ball-daily-usage.test.js`
10. `__tests__/oracle-route-validation.test.js`
11. `__tests__/oracle-usage.test.js` (deleted)
12. `tests/visual/crystal-ball-daily-limit.spec.ts`
13. `specs/025-crystal-ball-audio-daily-limit/spec.md`
14. `specs/025-crystal-ball-audio-daily-limit/plan.md`
15. `specs/025-crystal-ball-audio-daily-limit/tasks.md`
16. `specs/025-crystal-ball-audio-daily-limit/quickstart.md`
17. `specs/025-crystal-ball-audio-daily-limit/data-model.md`
18. `specs/028-crystal-ball-browser-daily-limit/spec.md`
19. `specs/028-crystal-ball-browser-daily-limit/plan.md`
20. `specs/028-crystal-ball-browser-daily-limit/tasks.md`
21. `specs/028-crystal-ball-browser-daily-limit/research.md`
22. `specs/028-crystal-ball-browser-daily-limit/data-model.md`
23. `specs/028-crystal-ball-browser-daily-limit/quickstart.md`
24. `specs/028-crystal-ball-browser-daily-limit/contracts/oracle-quota.md`
25. `memory-bank/activeContext.md`
26. `memory-bank/progress.md`
27. `PR_SUMMARY.md`

### Materials consulted
- `AGENTS.md`, `.jules/jules.md`, `.jules/polishing.md`, `.docs/manifest.json`, `.docs/polishing/jules_google_docs.md`, `.docs/polishing/_google-gemini_gemini-cli.md`, and `.docs/polishing/_websites_ai_google_dev_gemini-api.md`.
- `.specify/init-options.json`, `.specify/feature.json`, and the spec/plan/tasks templates; active task artifacts are under `specs/028-crystal-ball-browser-daily-limit/`.
- `package.json` (pnpm 10.30.3, Node 22, Vitest, Playwright, Next.js 16.3.8, React/React DOM, and @upstash/redis dependencies).
- Original Oracle route and usage manager, Crystal Ball client/component/CSS, Lucky Meter's local date/countdown pattern, existing daily-limit and interaction Playwright tests, Visual QA workflow, OpenNext validation workflow, and the earlier feature 025 specs.
- Context7 was not called. No dependency was added or upgraded.

### Verification record — candidate not yet run
No local repository checkout is available in this session, so the following commands have **NOT RUN locally**. GitHub Actions must provide current-head execution evidence before merge; do not infer passing results from source inspection.

- COMMAND: `pnpm exec vitest run __tests__/crystal-ball-daily-usage.test.js __tests__/oracle-route-validation.test.js`
  - RESULT: NOT RUN locally; pending Visual QA.
  - EVIDENCE/OUTPUT SUMMARY: regression tests added; no local output is available.
- COMMAND: `pnpm exec playwright test tests/visual/crystal-ball-daily-limit.spec.ts`
  - RESULT: NOT RUN locally; pending Visual QA.
  - EVIDENCE/OUTPUT SUMMARY: test asserts the local-midnight countdown and retains the three-answer lockout flow.
- COMMAND: `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts`
  - RESULT: NOT RUN locally; pending Visual QA.
- COMMAND: `pnpm run test`
  - RESULT: NOT RUN locally; pending Visual QA.
- COMMAND: `pnpm tsc --noEmit`
  - RESULT: NOT RUN locally; pending Visual QA.
- COMMAND: `./jules-verify.sh`
  - RESULT: NOT RUN locally; pending Visual QA.
- COMMAND: `pnpm run build`
  - RESULT: NOT RUN locally; pending OpenNext validation.
- COMMAND: `pnpm exec opennextjs-cloudflare build`
  - RESULT: NOT RUN locally; pending OpenNext validation.
- COMMAND: `pnpm exec wrangler build --config ./wrangler.jsonc`
  - RESULT: NOT RUN locally; pending OpenNext validation.
- COMMAND: `du/size measurement for .next + public` (the configured validation workflow performs the exact byte calculation)
  - RESULT: NOT RUN locally; CI must confirm the combined build stays below 495 MiB.
- Pre-submission double-check: remote file reads were used to inspect the edited route, client, quota helper, countdown UI/CSS, unit tests, Playwright test, and workflow update. A complete local diff/build/test run remains unavailable; the pull request's live diff and current-head Actions must be reviewed after creation.
- Remaining issues: confirm all new Vitest/Playwright code and the Cloudflare build compile in GitHub Actions; record actual workflow URLs/results after they complete. Do not merge if any required current-head check fails.
- **USEFUL RESULT: PARTIAL** — the intended implementation and regression coverage are committed on the branch, but no test/build results are claimed until the CI runner executes them.

---

---

# Troubleshooting Record — CI Stability: Robin Groq Fallback + Crystal Ball Visual QA

**Date:** 2026-10-18 | **Task group:** troubleshooting | **Branch:** `fix/ci-stability-1518`

## Root causes and changes

- Groq 404ed on `llama-3.1-8b-instant`; Groq's current deprecation page also marks `llama-3.3-70b-versatile` deprecated for developer-tier use and recommends `openai/gpt-oss-20b` for the old 8B model: https://console.groq.com/docs/deprecations
- A real Groq fallback request on `1502487` failed HTTP 413 at **8,657 tokens requested vs. 8,000 TPM**. The 384-token cap was too high; this change uses 256 tokens and reduces nonessential task-artifact diff size. The updated fallback is still awaiting a new observed attempt.
- Crystal Ball clears the question after a successful answer and keeps the input disabled during the reveal. The test now waits for the input to re-enable; the next iteration enters text before asserting the button enables.

## Governance and evidence

- Selected group: troubleshooting. Reviewed `AGENTS.md`, `.jules/jules.md`, `.jules/troubleshooting.md`, `.docs/manifest.json`, the three required troubleshooting Jules/Gemini snapshots, Spec Kit integration/registry/templates/command definitions, Memory Bank context, package scripts, and the verification scripts.
- Spec Kit specify/plan/tasks/implement artifacts are file-driven through repository API; native dispatch and local shell execution are not claimed.
- Vitest covers fallback configuration; Playwright covers the UI flow; GitHub Actions supplies execution evidence. Context7 was not used because repository guidance requires explicit authorization.
- Prior commit `1502487` passed full unit tests, TypeScript and the Spec Kit gate. Its build measured **325,473,493 bytes (310.40 MiB)**; OpenNext, Wrangler and the 495 MiB gate passed. Playwright rerun is still in progress; the prior Robin job failed on the measured TPM overrun.
- No local command is claimed. The latest output-cap/diff-size changes require fresh CI and a real Groq fallback attempt.

## Exact Changed Files

1. `.github/workflows/robin.yml`
2. `.specify/feature.json`
3. `PR_SUMMARY.md`
4. `memory-bank/activeContext.md`
5. `memory-bank/progress.md`
6. `specs/030-ci-stability/checklists/requirements.md`
7. `specs/030-ci-stability/data-model.md`
8. `specs/030-ci-stability/plan.md`
9. `specs/030-ci-stability/quickstart.md`
10. `specs/030-ci-stability/research.md`
11. `specs/030-ci-stability/spec.md`
12. `specs/030-ci-stability/tasks.md`
13. `tests/visual/crystal-ball-daily-limit.spec.ts`
14. `tests/workflows/robin-groq-fallback.test.ts`

**Remaining issues:** current-head Playwright and required CI must pass; new cap must be validated on a real Groq fallback call. Do not merge while these remain pending.
**USEFUL RESULT: PARTIAL — causes are verified and corrections prepared; latest verification is pending.**
---

# PR #1518 — Canonical Repository Cleanup Audit (Audit-Only)

**Audit scope:** identify repository files/assets/dependencies that may be unused; report evidence and recommended follow-up only. No deletion, dependency removal, workflow edit, application-source change, or runtime behavior change is part of this PR's diff. The prerequisite CI/test corrections are isolated in PR #1519 and this PR is stacked on that branch so those changes do not appear in the audit diff.

## A — Analyze

### Governance and conflict

- **SELECTED TASK GROUP:** deep-dive.
- **GROUP REASON:** The requested task was an evidence-driven repository inventory/reference investigation and categorized report.
- **GOVERNANCE CONFLICT:** .jules/deep-dive.md states deep-dive must not become an audit-only stage producing a report-only PR. The user explicitly authorized an audit-only task and required conflicts with that read-only boundary to be reported instead of silently expanding scope. This PR preserves that user-authorized boundary and documents the conflict; no cleanup implementation is included.
- **Repository governance:** AGENTS.md, .jules/jules.md, .jules/deep-dive.md, .docs/manifest.json, the three required deep-dive Jules/Gemini snapshots, the Spec Kit integration/templates/command definitions, and the relevant Memory Bank context were inspected during this work.
- **Context7:** Not used. The repository requires explicit owner approval before each invocation; no approval was requested or needed for repository-source checks available through GitHub.

### Method provenance and limitations

The original Jules audit record states that its investigation used pnpm dlx depcheck, du size measurements, recursive grep, git ls-files, and tracked/ignored-file checks. This correction pass did not have a local checkout and did not rerun those local commands. It did use GitHub's repository-file API and source-search API to validate specific disputed references.

Static search is not proof of non-use: it can miss dynamic paths, CSS references, bundler configuration, generated manifests, external links, and non-indexed files. Accordingly, no item below is authorized for removal by this audit. All unreferenced-resource claims are classified as candidates pending a local checkout, exhaustive reference tracing, and where relevant bundler/runtime verification.

## B — Categorized Findings

### Unreferenced candidates — NOT confirmed unused

The originating audit reported the following sizes and said it found no application references. This correction pass did not independently measure the binary file sizes or run a local full-repository search. Estimated possible savings are only a prioritization hint, not a verified saving.

- public/a_polished_high_detail_card_illustration_poster_i.png — reported about 3.1 MB.
- public/a_polished_high_detail_card_illustration_poster_i.webp — reported about 416 KB.
  - The active variant public/a_polished_high_detail_card_illustration_poster_i.avif is explicitly mapped in app/lucky-card-content.js and appears in __tests__/lucky-card-collection.test.js. The PNG/WebP variants were not found in the GitHub source searches used for this correction, but must remain until exhaustive checkout-based reference/bundler checks confirm they are not required.
- public/yodguard-lightning-magic-3-378649.mp3 — reported about 252 KB; GitHub source search returned no current source matches. Verify references across all source, CSS, config, and runtime-generated paths before considering removal.
- public/freesound_community-shaking-coins-105774.mp3 — reported about 58 KB; GitHub source search returned no current source matches. Verify references across all source, CSS, config, and runtime-generated paths before considering removal.
- copilot_image_1785515250260.jpeg — reported about 1.1 MB and tracked at the repository root by the originating audit. Source search returned no current source matches; its purpose and ownership still need repository-history review.
- Dependency html2canvas — present in package.json and pnpm-lock.yaml; GitHub source search used for this correction found no application import match, while project memory documentation still describes screenshot generation. Do not remove until exhaustive imports, dynamic loading, and bundle paths are checked.
- Dependency lucide-react — present in package.json and pnpm-lock.yaml; source-index queries did not return an application import match. The index may be incomplete; do not remove until a local, exhaustive import and bundler check is completed.

### Tracked stale-file candidates — do not delete in this PR

The originating audit reports these as tracked conflict-recovery artifacts. Their paths and contents exist on the current default branch, but this correction pass did not execute git ls-files locally to independently reconfirm tracking status:

- components/DailyResonance.tsx.orig
- components/DailyResonance.tsx.rej
- app/lucky-card-reveal.js.orig

They resemble merge/reject leftovers, but their contents should be compared with the active source and history before any separate authorized deletion. This audit makes no file removals.

### DO NOT REMOVE — actively referenced image fallback chain

The earlier audit's treatment of the NGC4216 JPEG/WebP variants as possible unused fallbacks was incorrect.

- public/NGC4216_crawford.webp
- public/NGC4216_crawford.jpg

GitHub source search in the current default branch confirms app/lucky-card-reveal.js uses a picture fallback chain with AVIF, WebP, and JPEG sources and a JPEG img src. These files are active fallbacks and must not be treated as unused.

Also preserve the AVIF poster variant public/a_polished_high_detail_card_illustration_poster_i.avif, which is mapped to the “Lucky Canadian Moose” entry in app/lucky-card-content.js and used by its collection test.

### Needs separate dependency verification — do not remove based on this report

- @stripe/stripe-js: current search results showed its package and lockfile declarations and the project's technology notes, but no loadStripe or direct import matches. The current app/luck-map.js and app/api/checkout/route.js use the server-side stripe package; those imports alone do not prove the browser SDK is required. Conversely, incomplete code-search results do not prove it is unused. Leave it unchanged until a local full-source/bundler trace identifies whether it has consumers.

The originating report also lists these as protected because it observed references: public/1784889264858.png, public/1785347037732.png, public/BackgroundEraser_20260724_163638777.png/AVIF, and public/FB_IMG_1785107325979.jpg. No removal is proposed; their references should be rechecked in any future cleanup implementation.

## C — Build-Size Record

- **Originating report's command:** du -sk .next public/ | awk '{print $1 / 1024 " MB\t" $2}'.
- **Originating report's recorded output:** .next = 287.54 MB; public/ = 29.08 MB; total reported as approximately 316.6 MB.
- **Latest completed prerequisite build (PR #1519, commit 1502487):** combined `.next + public` measured **325,473,493 bytes (310.40 MiB)** and passed the 495 MiB hard gate. This predates the output-budget commits `6518153` and `d821991`; the current head requires its own passing build/size run before merge.
- **Constraint:** 495 MB is the hard maximum. A current production build and size check must pass in CI before any PR is considered merge-ready.

## D — Spec Kit and Task Artifacts

- The active feature pointer now targets specs/031-audit-cleanup because prerequisite CI stability work is tracked in specs/030-ci-stability on stacked PR #1519.
- The audit spec, plan, tasks, and requirements checklist are substantive records of the audit-only task, its methodology, classifications, and unresolved verification. They do not authorize deletion or dependency changes.
- The Spec Kit files are not claimed to have been run through native dispatch. The current-head CI must run the repository governance gate; local execution was unavailable.

## Exact Changed-File Reconciliation — PR #1518 Audit Diff

Relative to its stacked base branch fix/ci-stability-1518, this PR changes only:

1. .specify/feature.json — active feature pointer to specs/031-audit-cleanup.
2. PR_SUMMARY.md — append audit findings after, not in place of, historical PR #1510/#1511/#1516 records and the separate PR #1519 troubleshooting record.
3. memory-bank/activeContext.md — record the audit scope and current status.
4. memory-bank/progress.md — record the completed reporting work and remaining validation.
5. specs/031-audit-cleanup/spec.md — audit-only objectives, acceptance criteria, and boundaries.
6. specs/031-audit-cleanup/plan.md — investigation method and explicit limitations.
7. specs/031-audit-cleanup/tasks.md — evidence review completed; any removals/bundler checks remain pending future authorized work.
8. specs/031-audit-cleanup/checklists/requirements.md — specification quality checklist.

The workflow/model, Crystal Ball test, workflow regression test, and empty route file are not changes in this audit diff; their respective base-branch contents are inherited from the separate CI follow-up PR #1519. No application source, asset, dependency, lockfile, workflow, test, API route, security setting, or runtime behavior is changed by the audit-only diff.

## Remaining Issues / Verification

- The candidates labelled above require a local checkout, exhaustive reference tracing, and for assets/dependencies, bundler or runtime verification before any removal decision.
- The latest verified build-size measurement is 310.40 MiB on prerequisite commit 1502487; build-size validation must rerun on the latest prerequisite head before merge.
- On prerequisite commit 1502487, full unit tests, TypeScript, Spec Kit, OpenNext, Wrangler and the 495 MiB gate passed. Playwright on that head was still running after the test correction. Robin's Groq fallback was exercised and failed at 8,657 requested tokens vs. 8,000 TPM; commit 6518153 lowers the cap to 128 and reduces task-artifact diff size. Fresh CI and a new fallback attempt remain required.
- No tests/build are claimed as run locally in this repository-API-only session.
- Pre-submission double-check for the audit will require comparing the final PR #1518 changed-file list and patches against this exact eight-file list.

**USEFUL RESULT: PARTIAL — the audit report and scope are corrected; removal decisions and current-head CI verification remain pending.**
