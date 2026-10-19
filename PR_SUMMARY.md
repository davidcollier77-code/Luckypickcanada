# PR Summary — Restore Shared Sky Backgrounds

## TASK ROUTING

- **SELECTED TASK GROUP**: troubleshooting
- **GROUP REASON**: A visual regression appeared after the latest shared CSS performance change; the task restores the previously working stylesheet import order and adds a focused browser regression check.

## GOVERNANCE AND EXECUTION METHOD

- Read root AGENTS.md first.
- Inspected current main, merged PR #1532's source diff, app/layout.js, app/globals.css, themes/default/index.css, themes/default/homepage.css, homepage/Crystal Ball/Lucky Map markup, the existing visual test, package scripts, and Visual QA workflow.
- Read the routed troubleshooting references for Jules, Gemini CLI/API, GitHub Actions, Next.js, and the documentation manifest; also inspected the repository troubleshooting guide and relevant CSS-loading guide.
- Spec Kit stage definitions were inspected. Native Jules slash-command dispatch and repository-local setup scripts could not be executed because the connected shell cannot resolve github.com; the task artifacts were authored directly via the GitHub repository API. Current-head CI must run ./jules-verify.sh before any completion claim.
- **Specify**: .jules/cmds/speckit.specify.md; method: FILE-DRIVEN ARTIFACT AUTHORING VIA GITHUB API; artifact: .specify/features/restore-shared-sky-backgrounds/spec.md; setup script not run locally.
- **Plan**: .jules/cmds/speckit.plan.md; method: FILE-DRIVEN ARTIFACT AUTHORING VIA GITHUB API; artifact: .specify/features/restore-shared-sky-backgrounds/plan.md; setup script not run locally.
- **Tasks**: .jules/cmds/speckit.tasks.md; method: FILE-DRIVEN ARTIFACT AUTHORING VIA GITHUB API; artifact: .specify/features/restore-shared-sky-backgrounds/tasks.md; setup script not run locally.
- **Implement**: .jules/cmds/speckit.implement.md; method: GITHUB API SOURCE EDITS; implementation candidate committed in the repair PR. Local check-prerequisites and ./jules-verify.sh could not run in this session.

## ROOT-CAUSE ASSESSMENT

- **VERIFIED**: PR #1532 moved the import of themes/default/index.css out of app/layout.js and into app/globals.css after Tailwind's stylesheet import.
- **VERIFIED**: The shared sky backdrop element and its CSS definitions still exist in the homepage, Crystal Ball, and Lucky Map markup/theme source.
- **STRONG HYPOTHESIS**: The changed import location/order interfered with the theme's stylesheet/cascade on affected routes. The regression followed the import-only performance update.
- Restored the known-good order: import themes/default/index.css before app/globals.css in app/layout.js, and removed the duplicate theme @import from app/globals.css. This deliberately rolls back the CSS import-consolidation part of the performance change rather than risking the page visuals. A different optimization must first prove that it preserves these visuals.

## REQUIRED LIBRARIES

- **LIBRARY**: Next.js | **VERSION**: 16.3.8 | **USED**: YES | **USEFUL**: YES | **REASON**: Verified App Router layouts/routes and the existing global CSS loading point.
- **LIBRARY**: Tailwind CSS | **VERSION**: 4.2.4 | **USED**: YES | **USEFUL**: YES | **REASON**: The recent import relocation was relative to the Tailwind stylesheet import.
- **LIBRARY**: Playwright / playwright-chromium | **VERSION**: repository package range ^1.63.0 | **USED**: YES | **USEFUL**: YES | **REASON**: Added computed-style checks for the shared backdrop across the three reported routes.
- No dependency was added, removed, or upgraded.

## REQUIRED ROUTED DOCUMENTS AND COMPONENTS

- **DOCUMENT**: .docs/troubleshooting/jules_google_docs.md | **USED**: YES | **USEFUL**: NO | **REASON**: Required troubleshooting-group reference; covers Jules CLI operation, not stylesheet order.
- **DOCUMENT**: .docs/troubleshooting/developers_google_com_jules_api.md | **USED**: YES | **USEFUL**: NO | **REASON**: Required troubleshooting-group reference; remote Jules API is not used here.
- **DOCUMENT**: .docs/troubleshooting/_google-gemini_gemini-cli.md | **USED**: YES | **USEFUL**: NO | **REASON**: Required routed provider/CLI reference; not relevant to CSS behavior.
- **DOCUMENT**: .docs/troubleshooting/_websites_ai_google_dev_gemini-api.md | **USED**: YES | **USEFUL**: NO | **REASON**: Required routed provider reference; this repair does not call Gemini.
- **DOCUMENT**: .docs/troubleshooting/_github_docs.md | **USED**: YES | **USEFUL**: YES | **REASON**: Supplied the repository's GitHub workflow/PR verification context.
- **DOCUMENT**: .docs/troubleshooting/_vercel_next_js.md | **USED**: YES | **USEFUL**: YES | **REASON**: Consulted the routed Next.js troubleshooting reference while checking global CSS import behavior.
- **DOCUMENT**: .docs/manifest.json | **USED**: YES | **USEFUL**: YES | **REASON**: Checked the troubleshooting reference inventory.
- **DOCUMENT**: CSS_FIX_GUIDE.md | **USED**: YES | **USEFUL**: YES | **REASON**: Reviewed its stylesheet import troubleshooting advice; compared it with actual pre-regression source history rather than blindly following its stale examples.
- **COMPONENT**: app/layout.js and app/globals.css | **USED**: YES | **USEFUL**: YES | **REASON**: The only application source files changed; restored the previous theme-first import.
- **COMPONENT**: themes/default/index.css and themes/default/homepage.css | **USED**: YES | **USEFUL**: YES | **REASON**: Confirmed that the existing shared backdrop assets/rules were still present and should not be redesigned.
- **COMPONENT**: app/page.js, app/crystal-ball/page.js, app/map/page.js, app/lucky-map-of-canada/lucky-map-of-canada.js | **USED**: YES | **USEFUL**: YES | **REASON**: Confirmed the affected routes still render the shared backdrop.
- **COMPONENT**: tests/visual/homepage.spec.ts and .github/workflows/visual-qa.yml | **USED**: YES | **USEFUL**: YES | **REASON**: Added a focused regression test and identified the existing CI verification gate.
- **COMPONENT**: package.json | **USED**: YES | **USEFUL**: YES | **REASON**: Verified existing pnpm/test/build script names and dependency versions.

## EXACT CHANGED-FILE RECONCILIATION

- app/layout.js
- app/globals.css
- tests/visual/homepage.spec.ts
- .specify/feature.json
- .specify/features/restore-shared-sky-backgrounds/spec.md
- .specify/features/restore-shared-sky-backgrounds/plan.md
- .specify/features/restore-shared-sky-backgrounds/tasks.md
- .specify/features/restore-shared-sky-backgrounds/research.md
- .specify/features/restore-shared-sky-backgrounds/quickstart.md
- .specify/features/restore-shared-sky-backgrounds/checklists/requirements.md
- PR_SUMMARY.md
- memory-bank/activeContext.md
- memory-bank/progress.md

## VERIFICATION RESULTS

- **COMMAND**: git ls-remote https://github.com/davidcollier77-code/Luckypickcanada.git HEAD
  - **RESULT**: FAIL (environment limitation)
  - **EVIDENCE/OUTPUT SUMMARY**: The connected shell could not resolve github.com; local checkout and local command execution were unavailable.
- **COMMAND**: pnpm exec playwright test tests/visual/homepage.spec.ts -g "shared sky backdrop remains styled"
  - **RESULT**: PENDING CURRENT-HEAD CI
  - **EVIDENCE/OUTPUT SUMMARY**: The new regression test was authored but has not been executed locally.
- **COMMAND**: pnpm run test; pnpm tsc --noEmit; ./jules-verify.sh
  - **RESULT**: PENDING CURRENT-HEAD CI
  - **EVIDENCE/OUTPUT SUMMARY**: Not executed locally due to missing repository checkout; the current-head Visual QA gate must provide evidence.
- **COMMAND**: pnpm run build and measured .next + public size check
  - **RESULT**: PENDING CURRENT-HEAD CI
  - **EVIDENCE/OUTPUT SUMMARY**: No dependencies or assets changed. OpenNext validation must still prove build success and output strictly under 495 MiB.
- **COMMAND**: visual confirmation using rendered browser screenshots
  - **RESULT**: PENDING CURRENT-HEAD CI
  - **EVIDENCE/OUTPUT SUMMARY**: Static source inspection confirmed markup and rules exist; the new computed-style test and current-head browser results are needed before claiming the backgrounds are restored.

## PRE-SUBMISSION DOUBLE-CHECK

The final diff must contain only the three source/test changes and the task-scoped governance records listed above. No sky artwork, images, colors, copy, Lucky Meter/Card Reveal component code, interactions, dependencies, application APIs, secrets, or deployment settings are intended to change.

**USEFUL RESULT**: NO — fix candidate prepared; the visual regression is not considered verified until current-head CI passes.
---

# PR Summary — Gemini All-in-One Review Depth Enhancement

## Merge-conflict repair and Amazon Q findings — 2026-10-19

- **Conflict root cause:** PR #1533 and merged PR #1532 both changed `.specify/feature.json`. This repair incorporates the current `main` tree (including PR #1532's homepage CSS changes and lower-case `pr_summary.md`) while selecting `.specify/features/gemini-review-depth` as the active feature for this branch.
- **Amazon Q — model identifiers:** Not a valid finding. Google's official Gemini model catalogue lists `gemini-3.8-flash`, `gemini-3.6-flash`, and `gemini-3.5-flash-lite`; PR-Agent uses the `gemini/` provider prefix. References: https://ai.google.dev/gemini-api/docs/models and https://docs.pr-agent.ai/installation/github/.
- **Amazon Q — string versus integer:** Not a demonstrated defect. GitHub Actions passes step `env` values as strings, and PR-Agent documents `pr_reviewer.num_max_findings` as supported configuration. The quoted value `"8"` is retained; eight remains an upper limit, not a required count. Reference: https://github.com/The-PR-Agent/pr-agent/blob/main/docs/docs/tools/review.md.
- **Amazon Q — negative model assertion:** Valid maintainability point. Removed the test assertion that unnecessarily forbade `gemini/gemini-2.0-flash`; positive assertions still check the intended Gemini 3.8 primary model and ordered Gemini 3.6 / 3.5 Flash-Lite fallbacks.
- **Verification status:** Local Vitest and `./jules-verify.sh` remain unrun because the connected shell cannot resolve GitHub. Current-head Actions checks and governance are pending after this commit; no successful run is claimed in advance.

---

## TASK ROUTING

- **SELECTED TASK GROUP**: troubleshooting
- **GROUP REASON**: Improve the output of the existing automatic Gemini PR review after sparse feedback was observed; this refines an existing review workflow, rather than adding a new reviewer/provider.

## GOVERNANCE AND EXECUTION METHOD

- Read root `AGENTS.md` first, then inspected `.jules/jules.md`, `.jules/troubleshooting.md`, Memory Bank context, `.docs/manifest.json`, repository-routed Gemini/GitHub references, the current workflow, test, Spec Kit pointer, and relevant active feature artifacts.
- Consulted current PR-Agent documentation for the documented finding limit, inline issue comments, extra review instructions, risk assessment, merge recommendation, and failure-mode settings.
- **Environment limitation**: the connected shell could not resolve `github.com` (`git ls-remote https://github.com/davidcollier77-code/Luckypickcanada.git HEAD` failed with a DNS resolution error). Changes were written through the GitHub repository API. Spec Kit setup scripts and `./jules-verify.sh` could not be executed locally. The PR must not be treated as merge-ready until current-head CI demonstrates required verification.
- **Specify**: `.jules/cmds/speckit.specify.md`; method: artifact drafted directly via GitHub API; `.specify/features/gemini-review-depth/spec.md`; the setup script/command itself was **not executed locally**.
- **Plan**: `.jules/cmds/speckit.plan.md`; method: artifact drafted directly via GitHub API; `.specify/features/gemini-review-depth/plan.md`; `.specify/scripts/bash/setup-plan.sh --json` was **not executed locally**.
- **Tasks**: `.jules/cmds/speckit.tasks.md`; method: artifact drafted directly via GitHub API; `.specify/features/gemini-review-depth/tasks.md`; `.specify/scripts/bash/setup-tasks.sh --json` was **not executed locally**.
- **Implement**: `.jules/cmds/speckit.implement.md`; implementation candidate authored through the repository API. Native Jules slash-command dispatch was unavailable; local `./jules-verify.sh` remains **pending current-head CI**.
- `.specify/feature.json` points to the active task directory `.specify/features/gemini-review-depth`.

## REQUIRED LIBRARIES

- **LIBRARY**: The-PR-Agent/pr-agent
  - **VERSION**: `fbf7f6d3fcff6d9bf15aef7d8f4a6c2cacc7ad1f` (existing pin, unchanged)
  - **USED**: YES
  - **USEFUL**: YES
  - **REASON**: Its configuration reference established the supported finding ceiling, inline publication, custom instructions, and structured review options.
- **LIBRARY**: Vitest
  - **VERSION**: Existing repository dependency `^5.0.0`
  - **USED**: YES
  - **USEFUL**: YES
  - **REASON**: Extended the existing workflow regression test; a local test execution was not available in this connected environment.
- No dependency was added, removed, or upgraded.

## REQUIRED ROUTED DOCUMENTS

- **DOCUMENT**: `.docs/troubleshooting/jules_google_docs.md`
  - **USED**: YES; **USEFUL**: NO
  - **REASON**: Retrieved as the required repository-routed troubleshooting reference; it documents Jules CLI rather than PR-Agent settings.
- **DOCUMENT**: `.docs/troubleshooting/developers_google_com_jules_api.md`
  - **USED**: YES; **USEFUL**: NO
  - **REASON**: Retrieved as the required standing agent reference; the task did not use the Jules REST API.
- **DOCUMENT**: `.docs/troubleshooting/_google-gemini_gemini-cli.md`
  - **USED**: YES; **USEFUL**: NO
  - **REASON**: Retrieved as required repository documentation; Gemini CLI usage does not configure this GitHub Action.
- **DOCUMENT**: `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md`
  - **USED**: YES; **USEFUL**: NO
  - **REASON**: Retrieved as the repository-routed provider documentation; the actual PR-Agent setting names were confirmed from PR-Agent's own current configuration documentation.
- **DOCUMENT**: `.docs/troubleshooting/_github_docs.md`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Consulted for repository workflow and GitHub Action context.
- **DOCUMENT**: `.docs/manifest.json`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Checked the repository's routed troubleshooting reference inventory.
- **DOCUMENT**: PR-Agent configuration reference — https://docs.pr-agent.ai/usage-guide/configuration_reference/
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Verified supported configuration names and the existing default finding limit of three.
- **DOCUMENT**: PR-Agent GitHub Action installation documentation — https://docs.pr-agent.ai/installation/github/
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Verified that custom review settings can be passed through the action step's environment mapping.

## IMPLEMENTATION AND PRESERVATION

- Added `pr_reviewer.num_max_findings: "8"`; eight is a maximum, not a required count.
- Enabled `pr_reviewer.inline_key_issues` so actionable findings can be published inline where supported.
- Enabled explicit test/security review, risk assessment, merge recommendation, and failure-mode review options.
- Added evidence-first reviewer instructions for correctness/bugs, security, performance, SEO, visual/UI regressions, accessibility, and missing tests.
- Instructions prohibit fabricated, duplicated, vague, unrelated findings and false claims of actual visual QA.
- Extended the existing static workflow regression test.
- Preserved the Gemini primary model, both existing Gemini fallbacks and their order, pinned action, triggers, permissions, credential preflight, and review-only behavior. Automatic description and code-improvement features remain disabled.
- No app runtime, dependencies, secrets, payments, APIs, or deployment settings were changed.

## EXACT CHANGED-FILE RECONCILIATION

- `.github/workflows/pr-agent.yml`
- `__tests__/pr-agent-workflow.test.js`
- `.specify/feature.json`
- `.specify/features/gemini-review-depth/spec.md`
- `.specify/features/gemini-review-depth/plan.md`
- `.specify/features/gemini-review-depth/tasks.md`
- `.specify/features/gemini-review-depth/research.md`
- `.specify/features/gemini-review-depth/quickstart.md`
- `.specify/features/gemini-review-depth/checklists/requirements.md`
- `PR_SUMMARY.md`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

## VERIFICATION RESULTS

- **COMMAND**: `git ls-remote https://github.com/davidcollier77-code/Luckypickcanada.git HEAD`
  - **RESULT**: FAIL (environment limitation)
  - **EVIDENCE/OUTPUT SUMMARY**: Local shell could not resolve `github.com`; no repository checkout was available.
- **COMMAND**: `pnpm exec vitest run __tests__/pr-agent-workflow.test.js`
  - **RESULT**: PENDING current-head CI
  - **EVIDENCE/OUTPUT SUMMARY**: Not executed locally because a checkout and dependency installation were unavailable.
- **COMMAND**: `pnpm run test`
  - **RESULT**: PENDING current-head CI
  - **EVIDENCE/OUTPUT SUMMARY**: Not executed locally for the same environment limitation.
- **COMMAND**: `./jules-verify.sh`
  - **RESULT**: PENDING current-head CI
  - **EVIDENCE/OUTPUT SUMMARY**: Not executed locally; repository governance remains an explicit merge gate.
- **COMMAND**: `pnpm tsc --noEmit`
  - **RESULT**: NOT RUN
  - **EVIDENCE/OUTPUT SUMMARY**: Workflow/test-only change; no TypeScript source changed. Any required repository CI check still takes precedence.
- **COMMAND**: `pnpm exec playwright test`
  - **RESULT**: NOT RUN
  - **EVIDENCE/OUTPUT SUMMARY**: No application UI/runtime code changed; reviewer visual claims are explicitly constrained to available screenshot/browser evidence.
- **COMMAND**: Production/OpenNext build and `.next + public` size gate
  - **RESULT**: NOT RUN for this candidate
  - **EVIDENCE/OUTPUT SUMMARY**: No production source or dependency changed, but repository CI's required build-size gate remains authoritative; the 495 MiB hard maximum is unchanged.
- **COMMAND**: Live Gemini review using the new instructions
  - **RESULT**: PENDING
  - **EVIDENCE/OUTPUT SUMMARY**: The settings are committed to a PR branch. One natural eligible event may run the current default-branch workflow; the new settings are not considered live-verified until the updated configuration reaches `main` and a subsequent review visibly demonstrates its behavior.

## PRE-SUBMISSION DOUBLE-CHECK

The workflow and test were inspected after editing. The exact changed-file inventory above is intended to match the final PR diff. Current-head CI and the Spec Kit governance gate must pass before merging; no local pass is claimed.

**USEFUL RESULT**: NO — the implementation candidate is prepared, but required current-head verification and live review evidence remain pending.

---

## Previous task record — Gemini PR-Agent Workflow Repair

## TASK ROUTING

- **SELECTED TASK GROUP**: troubleshooting
- **GROUP REASON**: Repair an existing automated review workflow that has malformed step configuration and selects the wrong model, while preserving unrelated automation.

## GOVERNANCE AND EXECUTION METHOD

- Root `AGENTS.md` was read first.
- Spec Kit stage definitions were read and used in file-driven procedural execution because native Jules slash-command dispatch and a repository shell checkout were unavailable in this session.
- **Specify**: `.jules/cmds/speckit.specify.md`; method: FILE-DRIVEN PROCEDURAL EXECUTION; result: artifacts updated under `.specify/features/034-pr-agent/`.
- **Plan**: `.jules/cmds/speckit.plan.md`; method: FILE-DRIVEN PROCEDURAL EXECUTION; result: task-scoped implementation and verification plan updated.
- **Tasks**: `.jules/cmds/speckit.tasks.md`; method: FILE-DRIVEN PROCEDURAL EXECUTION; result: ordered implementation and remaining verification tasks updated.
- **Implement**: `.jules/cmds/speckit.implement.md`; method: FILE-DRIVEN PROCEDURAL EXECUTION; result: workflow correction and regression test authored through the GitHub repository API. Local tests could not run here.
- `.specify/feature.json` continues to point at the active feature `.specify/features/034-pr-agent`.

## REQUIRED LIBRARIES

- **LIBRARY**: The-PR-Agent/pr-agent
  - **VERSION**: `fbf7f6d3fcff6d9bf15aef7d8f4a6c2cacc7ad1f`
  - **USED**: YES
  - **USEFUL**: YES
  - **REASON**: The existing pinned action is retained; its expected step-level environment configuration was compared with the malformed repository workflow.
- **LIBRARY**: Vitest
  - **VERSION**: Existing project dependency `^5.0.0`
  - **USED**: YES
  - **USEFUL**: YES
  - **REASON**: Used as the existing test harness for the new static workflow regression test; no dependency was added or changed.
- No dependency was added, upgraded, or removed.

## REQUIRED ROUTED JULES / GEMINI DOCUMENTS

- **DOCUMENT**: `.docs/troubleshooting/jules_google_docs.md`
  - **USED**: YES; **USEFUL**: NO
  - **REASON**: Consulted as required troubleshooting-group reference; it covers Jules CLI operation, not GitHub Actions step configuration.
- **DOCUMENT**: `.docs/troubleshooting/developers_google_com_jules_api.md`
  - **USED**: YES; **USEFUL**: NO
  - **REASON**: Consulted as required standing reference; its REST source APIs do not affect this workflow repair.
- **DOCUMENT**: `.docs/troubleshooting/_google-gemini_gemini-cli.md`
  - **USED**: YES; **USEFUL**: NO
  - **REASON**: Consulted as required troubleshooting-group reference; Gemini CLI usage does not configure PR-Agent's GitHub Action.
- **DOCUMENT**: `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Consulted the local Google Gemini API snapshot; it establishes the repository-routed provider reference. Current model identifier was also checked against the official model documentation recorded in the research file.
- **DOCUMENT**: `.docs/troubleshooting/_github_docs.md`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Supplied the repository-routed reference for GitHub Actions, secrets, and workflow behavior.
- **DOCUMENT**: `.docs/manifest.json`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Verified the required troubleshooting-group documentation inventory.
- **DOCUMENT**: Official PR-Agent GitHub installation/configuration documentation — https://docs.pr-agent.ai/installation/github/
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Confirmed the provider variable belongs in the action step's `env` map.
- **DOCUMENT**: Official Google Gemini API models documentation — https://ai.google.dev/gemini-api/docs/models
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Checked the intended Gemini model name.

## REPOSITORY COMPONENTS CONSULTED

- **COMPONENT**: `.github/workflows/pr-agent.yml`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Confirmed settings were indented below `uses:` without an `env:` section and that the wrong Gemini model was selected.
- **COMPONENT**: PR #1527 merge diff
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Traced the incorrect workflow back to the implementation merged into `main`.
- **COMPONENT**: `.specify/features/034-pr-agent/`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Existing active Spec Kit feature; used for specification, plan, research, task, checklist, and quickstart records.
- **COMPONENT**: `.github/workflows/visual-qa.yml` and `.github/workflows/validate-open-next-repair.yml`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Identified the CI test, TypeScript, governance, Playwright, OpenNext, Wrangler, and 495 MiB verification paths.
- **COMPONENT**: `package.json`
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Verified Node.js/pnpm context, the existing Vitest dependency, and available scripts.
- **COMPONENT**: Memory Bank
  - **USED**: YES; **USEFUL**: YES
  - **REASON**: Updated current repository context and progress without removing existing records.

## IMPLEMENTATION, BOUNDARIES, AND REMAINING ISSUES

- Fixed step-level workflow structure, selected `gemini/gemini-3.8-flash`, aligned the GitHub Actions and PR-Agent event filters, removed the bot-sender exclusion, added a credential-presence preflight, and configured Gemini 3.5 Flash-Lite as the fallback while keeping Gemini 3.8 Flash primary.
- Kept the pinned PR-Agent action, existing GitHub permissions, and review-only behavior. Auto description and auto improvement remain disabled.
- No changes to CodeRabbit, Amazon Q, Robin retirement, API routes, app UI, dependencies, deployment workflows, or the secret value.
- **Secret status: UNKNOWN** — GitHub repository secret values and secret existence cannot be queried through the available interface. The new preflight will confirm availability on a workflow run.
- **Live reviewer status: NOT YET VERIFIED** — the first PR-Agent run passed preflight and attempted `gemini/gemini-3.8-flash`, but Google returned HTTP 503 `UNAVAILABLE` with a temporary high-demand message. PR-Agent then attempted the unrelated default `gpt-5.6-terra` fallback, which failed because no usable OpenAI key is configured. The workflow now falls back to Gemini 3.5 Flash-Lite and does not use the unrelated default OpenAI model. A successful review is still required.
- A local checkout attempt failed because the execution environment could not resolve `github.com`. Local shell-based tests/build/governance checks are therefore not claimed.
- **Scope authorization**: user explicitly authorized direct implementation and a new PR. The change only consumes the intended existing secret; it does not create or modify any secret.

## EXACT CHANGED-FILE RECONCILIATION

- `.github/workflows/pr-agent.yml`
- `.specify/feature.json`
- `__tests__/pr-agent-workflow.test.js`
- `.specify/features/034-pr-agent/spec.md`
- `.specify/features/034-pr-agent/plan.md`
- `.specify/features/034-pr-agent/tasks.md`
- `.specify/features/034-pr-agent/research.md`
- `.specify/features/034-pr-agent/quickstart.md`
- `.specify/features/034-pr-agent/checklists/requirements.md`
- `PR_SUMMARY.md`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

## VERIFICATION RESULTS

- **COMMAND**: `pnpm exec vitest run __tests__/pr-agent-workflow.test.js`
  - **RESULT**: PASS (within the full test suite)
  - **EVIDENCE/OUTPUT SUMMARY**: The updated regression file completed 4 tests successfully.
- **COMMAND**: `pnpm run test`
  - **RESULT**: PASS
  - **EVIDENCE/OUTPUT SUMMARY**: Current completed CI run reported 14 test files passed and 91 tests passed.
- **COMMAND**: `pnpm tsc --noEmit`
  - **RESULT**: PASS
  - **EVIDENCE/OUTPUT SUMMARY**: TypeScript check completed successfully in Visual QA run 39276675079.
- **COMMAND**: `./jules-verify.sh`
  - **RESULT**: FAIL ON THE LAST RUN; FIX COMMITTED
  - **EVIDENCE/OUTPUT SUMMARY**: Verifier stopped because `.specify/feature.json` still pointed to the previously active Crystal Ball task. This commit updates the pointer to `.specify/features/034-pr-agent`; a current-head rerun is required.
- **COMMAND**: `pnpm exec playwright test`
  - **RESULT**: PENDING CURRENT-HEAD CI
  - **EVIDENCE/OUTPUT SUMMARY**: Visual QA stopped at the governance gate in run 39276675079, before Playwright ran.
- **COMMAND**: OpenNext build and measured `.next + public` size check (495 MiB hard limit)
  - **RESULT**: PASS
  - **EVIDENCE/OUTPUT SUMMARY**: Validate OpenNext run 39276675103 passed Next.js build and the explicit 495 MiB size gate. Its current final outcome must still be verified for full OpenNext/Wrangler validation.
- **COMMAND**: Live Gemini review
  - **RESULT**: FAILED TRANSIENTLY; RETRY REQUIRED
  - **EVIDENCE/OUTPUT SUMMARY**: The credential preflight passed; PR-Agent attempted the documented `gemini/gemini-3.8-flash` primary model twice and received HTTP 503 `UNAVAILABLE` (high demand). The prior unrelated OpenAI fallback was removed; Gemini 3.5 Flash-Lite is now the fallback. A visible review is still not confirmed.

## PRE-SUBMISSION DOUBLE-CHECK

The source workflow, test assertions, Spec Kit artifacts, and proposed file list were cross-checked against the focused scope. The changed-file list above is the intended complete set. Final current-head GitHub diff and CI results must be inspected after PR creation before treating implementation as verified.

**USEFUL RESULT**: NO — implementation is prepared in the PR; runtime success remains dependent on actual CI and a credentialed live review.
