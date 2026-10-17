# PR Summary — Repair Crystal Ball Audio Build Failure

**Task group:** audio  
**Reason:** The deployment build fails while parsing the Crystal Ball sound helpers in app/lib/audio.js.

## Verified diagnosis

- Failed Cloudflare deployment run: https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39021855291, on merge commit b68d3ace0eb958d2cedeccad53d4a5d75ea3a27f.
- Compiler output: "Return statement is not allowed here" at app/lib/audio.js:195, followed by "Expression expected" at the closing brace.
- Commit 1c721f46075743cf2a2be1a9a801831da91cfb4c removed the stopCrystalBallEnergy declaration and server guard, inserting a promise assignment and stray semicolon between the energy-start and energy-stop logic. The stop body consequently has a top-level return and the named export consumed by app/components/CrystalBall/CrystalBall.tsx is missing.

## Implementation and scope

- Restore the separate exported stopCrystalBallEnergy function and its server-side guard in app/lib/audio.js.
- Preserve the captured sound ID so a delayed fade-stop callback does not stop a later sound instance.
- Add __tests__/audio-exports.test.js to protect the helper export.
- Update the active Spec Kit spec, plan, tasks, Memory Bank and this canonical summary. No packages, sound assets, API routes, deployment configuration, workflow files or secrets are changed.
- User explicitly authorized the repair. No payment, database/schema, authentication, or direct production deployment action was performed.

## Governance

- SELECTED TASK GROUP: audio
- GROUP REASON: The failure is inside the audio helper, and .jules/audio.md routes the task through the Audio specialist.
- AGENTS.md was read first and treated as authoritative.
- SPEC KIT METHOD: FILE-DRIVEN PROCEDURAL EXECUTION. Native Jules slash-command dispatch and a local checkout/shell are unavailable in this session. The core command definitions were inspected and the active feature artifacts were updated. Local setup scripts and ./jules-verify.sh were not executed here; remote PR CI must validate this candidate.

## Required libraries and tools

| Library / tool | Version | USED | USEFUL | Reason |
|---|---|---:|---:|---|
| Howler.js | ^2.2.4 (build log: 2.2.4) | YES | YES | Existing sound start/fade/stop behavior must be preserved. |
| Vitest | 5.0.0 | YES | YES | Regression test protects the named helper export. |
| Next.js | 16.3.8 | YES | YES | Its production compiler reported the syntax failure. |
| OpenNext Cloudflare | 1.20.6 | YES | YES | Same build pathway must pass after repair. |
| React | 19.3.0 | YES | YES | The importing component's expected helper export was inspected. |
| Node.js | 22.23.3 in build log | YES | YES | Runtime context of the failed CI build. |
| pnpm | 10.30.3 | YES | YES | Required package manager for verification. |
| Other dependencies | Existing lockfile | NO | NO | No dependency changes are needed. |

## Required Jules / Gemini documentation

| Document | USED | USEFUL | Contribution |
|---|---:|---:|---|
| .jules/audio.md | YES | YES | Selected the required audio path and resources. |
| .jules/jules.md | YES | YES | Initialization, Memory Bank, Spec Kit and reporting requirements. |
| .docs/manifest.json | YES | YES | Identified the routed documentation set. |
| .docs/audio/_goldfire_howler_js.md | YES | YES | Relevant Howler sound-ID and stop/fade guidance. |
| .docs/audio/jules_google_docs.md | YES | NO | Required Jules reference consulted; content did not change the repair. |
| .docs/audio/developers_google_com_jules_api.md | YES | NO | Jules API definitions are unrelated to this syntax defect. |
| .docs/audio/_google-gemini_gemini-cli.md | YES | NO | CLI tips did not affect the JavaScript fix. |
| .docs/audio/_websites_ai_google_dev_gemini-api.md | YES | NO | API overview did not affect the repair. |
| .docs/audio/_websites_developer_chrome.md | YES | NO | Chrome offscreen-extension documentation is unrelated to this parser error. |
| .docs/audio/_websites_developer_apple_webkit.md | YES | NO | The snapshot provided no useful audio guidance for this syntax issue. |
| .docs/audio/_websites_mdn_web_audio.md | YES | NO | Web Audio API behavior is unrelated to a function-boundary error. |

## Other required governance resources

- USED=YES, USEFUL=YES: AGENTS.md; .specify/memory/constitution.md; .specify/integration.json; .specify/feature.json; .specify/init-options.json; .specify/templates/spec-template.md; .specify/templates/plan-template.md; .specify/templates/tasks-template.md; active feature specs/025-crystal-ball-audio-daily-limit/spec.md, plan.md, tasks.md; memory-bank/projectBrief.md; memory-bank/activeContext.md; memory-bank/progress.md; app/lib/audio.js; app/components/CrystalBall/CrystalBall.tsx; package.json; vitest.config.mts; .github/workflows/visual-qa.yml; .github/workflows/validate-open-next-repair.yml; jules-verify.sh; scripts/test-verify-speckit-task.sh; scripts/verify-speckit-task.sh.
- USED=YES, USEFUL=NO for this narrow fix: CSS_FIX_GUIDE.md; DATABASE_SETUP.md; DEPLOYMENT_CHECKLIST.md; QUICK_FIX_GUIDE.md. They were reviewed as required by AGENTS.md, but their CSS/database/general deployment material does not affect the missing function boundary.
- Specialist/command inventory: available .jules/*.md files and .jules/cmds/*.md definitions were inspected. The audio specialist and core Spec Kit specify/plan/tasks/implement definitions informed this task. Unrelated specialist notes and optional command definitions did not materially alter the fix. No Context7 call was made because repository policy requires separate explicit approval for every call.
- Spec Kit status: the active pointer remains specs/025-crystal-ball-audio-daily-limit. Its spec.md, plan.md and tasks.md were updated on this repair branch. Native dispatch and local setup scripts could not be run here; do not claim that they ran.

## Changed files

1. app/lib/audio.js
2. __tests__/audio-exports.test.js
3. specs/025-crystal-ball-audio-daily-limit/spec.md
4. specs/025-crystal-ball-audio-daily-limit/plan.md
5. specs/025-crystal-ball-audio-daily-limit/tasks.md
6. memory-bank/activeContext.md
7. memory-bank/progress.md
8. PR_SUMMARY.md

## Verification commands and current evidence

- COMMAND: npx @opennextjs/cloudflare build  
  RESULT: FAIL on pre-repair main  
  EVIDENCE: Run 39021855291 reports a Next.js return-outside-function syntax error in app/lib/audio.js.
- COMMAND: pnpm run test  
  RESULT: NOT RUN LOCALLY; repair PR CI pending  
  EVIDENCE: No local checkout is available; require the Visual QA result for the current repair candidate.
- COMMAND: pnpm tsc --noEmit  
  RESULT: NOT RUN LOCALLY; repair PR CI pending  
  EVIDENCE: The Visual QA workflow includes this standalone check.
- COMMAND: ./jules-verify.sh  
  RESULT: NOT RUN LOCALLY; repair PR CI pending  
  EVIDENCE: Its Spec Kit gate, TypeScript check, production build and documentation tests have not been executed in this session.
- COMMAND: pnpm run build  
  RESULT: NOT RUN LOCALLY; repair PR CI pending  
  EVIDENCE: Must pass on the post-repair candidate.
- COMMAND: pnpm exec opennextjs-cloudflare build  
  RESULT: NOT RUN LOCALLY; repair PR CI pending  
  EVIDENCE: Required to confirm the deployment build no longer has the parser error.
- COMMAND: pnpm exec wrangler build --config ./wrangler.jsonc  
  RESULT: NOT RUN LOCALLY; repair PR CI pending  
  EVIDENCE: No-deploy Wrangler validation must pass after the OpenNext build.
- COMMAND: Native Spec Kit dispatch and local setup scripts  
  RESULT: NOT AVAILABLE IN THIS SESSION  
  EVIDENCE: GitHub API repository access is available, but no Jules command dispatcher or local checkout is attached.
- COMMAND: du -sb .next public  
  RESULT: NOT RUN  
  EVIDENCE: Exact generated size against the hard 495 MiB cap is unknown and must not be inferred from an older build.
- COMMAND: Real-device mobile audio playback  
  RESULT: NOT RUN  
  EVIDENCE: No physical mobile-device test session is available here.
- COMMAND: git clone https://github.com/davidcollier77-code/Luckypickcanada.git  
  RESULT: FAIL / BLOCKED  
  EVIDENCE: GitHub DNS resolution failed, so no local compile or test result is claimed.

## Outstanding issues and double-check

- Remaining gates: repair-branch CI must pass; run the repository verifier; measure exact generated output size below 495 MiB; perform real mobile audio playback. The active feature still records these broader outstanding gates; do not claim the full feature is governance-complete without evidence.
- Pre-submission double-check: the patch restores the missing named export consumed by the component, removes the stray statements that caused the parse error, and retains the sound-ID race correction. The final changed-path list must be reconciled against the actual PR.
- USEFUL RESULT: NO (pending verification). The source-level cause is established from the compiler error and commit diff, but production build recovery is not confirmed until the repair candidate passes OpenNext/Cloudflare CI.
