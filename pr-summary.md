**TASK GROUP**
SELECTED TASK GROUP: polishing
GROUP REASON: This task is a targeted homepage visual-polish/compositing repair involving the photographic sky, aurora overlay, and subtle canvas star effects.

**GOVERNANCE / AUTHORIZATION**
- AGENTS.md was read first and used as the authoritative routing and verification policy.
- Selected specialist: `.jules/polishing.md`.
- User explicitly authorized implementation and explicitly authorized changing protected `app/globals.css` for this homepage visual repair.
- `.docs/` documentation was treated as READ-ONLY; no documentation snapshots were modified.
- No Context7 MCP calls were made.
- All requested application changes were kept scoped to the homepage atmosphere layer.

**ROUTED JULES / GEMINI DOCUMENT REPORT**
DOCUMENT: .jules/jules.md
USED: YES
USEFUL: YES
REASON: Applied the repository's required execution sequence, verification expectations, Memory Bank reporting, protected-file authorization rule, and PR-summary requirements.

DOCUMENT: .docs/polishing/jules_google_docs.md
USED: YES
USEFUL: YES
REASON: Consulted as the required Jules documentation snapshot for the polishing task group and PR/verification workflow.

DOCUMENT: .docs/polishing/_google-gemini_gemini-cli.md
USED: YES
USEFUL: NO
REASON: Required by the polishing routing chain; no Gemini CLI execution was necessary for this one-line CSS repair.

DOCUMENT: .docs/polishing/_websites_ai_google_dev_gemini-api.md
USED: YES
USEFUL: NO
REASON: Required by the polishing routing chain; no Gemini API call was necessary.

**SPECIALIST DOCUMENT REPORT**
CONSULTED: All required `.jules/*.md` specialist records, including:
`.jules/audio.md`, `.jules/bolt.md`, `.jules/ci.md`, `.jules/creation.md`, `.jules/deep-dive.md`, `.jules/jules.md`, `.jules/palette.md`, `.jules/polishing.md`, `.jules/security.md`, `.jules/sentinel.md`, `.jules/sentinel.md.`, `.jules/seo.md`, `.jules/testing.md`, and `.jules/troubleshooting.md`.
USEFUL: YES
REASON: The specialist records supplied the required routing, evidence-driven implementation, browser verification, canvas-performance, protected-file, and reporting constraints. Only polishing, deep-dive, testing, bolt, and jules governance materially affected the implementation.

**SPEC KIT GOVERNANCE REPORT**
CONSULTED: `.specify/workflows/speckit/workflow.yml`, `.specify/memory/constitution.md`, `.specify/integrations/speckit.manifest.json`.
CONSULTED COMMANDS: `.jules/cmds/speckit.analyze.md`, `speckit.checklist.md`, `speckit.clarify.md`, `speckit.constitution.md`, `speckit.converge.md`, `speckit.implement.md`, `speckit.plan.md`, `speckit.specify.md`, `speckit.tasks.md`, and `speckit.taskstoissues.md`.
USED: YES
USEFUL: NO
REASON: Reviewed to satisfy the repository's required governance handling. A new formal spec/plan/tasks artifact set was not created because this was a tightly scoped, one-line repair explicitly authorized for direct execution; the implementation still followed inspect → identify → implement → test → double-check → report.

**LIBRARY CONSULTATION REPORT**
LIBRARY: Next.js
VERSION: 16.3.6 (package.json)
USED: YES
USEFUL: YES
REASON: Verified the App Router/page composition and static homepage structure relevant to the background/overlay mounting.

LIBRARY: React
VERSION: latest (package.json; exact lockfile resolution not asserted)
USED: YES
USEFUL: YES
REASON: Verified the homepage canvas implementation uses React refs/effects and that no component refactor was required.

LIBRARY: Tailwind CSS
VERSION: 4.2.4 (package.json)
USED: YES
USEFUL: YES
REASON: Verified the global stylesheet is part of the Tailwind build path and confirmed the OpenNext validation includes compiled-Tailwind verification.

LIBRARY: GSAP
VERSION: ^3.15.0 (package.json)
USED: YES
USEFUL: NO
REASON: Consulted the required local polishing snapshot; no GSAP code was changed or needed.

LIBRARY: Motion
VERSION: ^13.1.0 (package.json)
USED: YES
USEFUL: NO
REASON: Consulted the required local polishing snapshot; no Framer Motion code was changed or needed.

LIBRARY: Lucide
VERSION: ^1.41.0 (package.json)
USED: YES
USEFUL: NO
REASON: Consulted the required local polishing snapshot; no icon work was involved.

LIBRARY: Sonner
VERSION: ^2.0.8 (package.json)
USED: YES
USEFUL: NO
REASON: Consulted the required local polishing snapshot; no toast work was involved.

LIBRARY: Chrome Developer
VERSION: Local repository documentation snapshot; no semver exposed
USED: YES
USEFUL: YES
REASON: Supported the browser-rendering/compositing verification approach and the Chromium-based visual QA path.

LIBRARY: Apple WebKit Developer
VERSION: Local repository documentation snapshot; no semver exposed
USED: YES
USEFUL: NO
REASON: Consulted as required cross-browser reference material; final automated runtime verification used Chromium only.

LIBRARY: Jules Documentation
VERSION: Snapshot/source dated 2025-10-02
USED: YES
USEFUL: YES
REASON: Required Jules reference for workflow/verification/reporting behavior.

LIBRARY: Jules API
VERSION: Local repository documentation snapshot; no semver exposed
USED: YES
USEFUL: NO
REASON: Required standing reference; no Jules API call was needed.

LIBRARY: Gemini CLI
VERSION: Local repository documentation snapshot; no semver exposed
USED: YES
USEFUL: NO
REASON: Required standing reference; no Gemini CLI call was needed.

LIBRARY: Gemini API
VERSION: Local repository documentation snapshot; no semver exposed
USED: YES
USEFUL: NO
REASON: Required standing reference; no Gemini API call was needed.

LIBRARY: axe-core
VERSION: ^4.13.0 (package.json)
USED: YES
USEFUL: NO
REASON: Consulted the required accessibility snapshot; no accessibility rule or markup change was introduced.

LIBRARY: Magic UI
VERSION: Local repository documentation snapshot; no semver exposed
USED: YES
USEFUL: NO
REASON: Consulted as required; no Magic UI component was used.

LIBRARY: Howler.js
VERSION: ^2.2.4 (package.json)
USED: YES
USEFUL: NO
REASON: Consulted as required; this repair intentionally changed no audio behavior.

**REPOSITORY / GOVERNANCE COMPONENT REPORT**
COMPONENT: AGENTS.md
USED: YES
USEFUL: YES
REASON: Authoritative task routing, scope, protected-file, verification, and reporting governance.

COMPONENT: .jules/*
USED: YES
USEFUL: YES
REASON: Required specialist routing and execution guidance; all required specialist records were consulted.

COMPONENT: .jules/cmds/*
USED: YES
USEFUL: YES
REASON: Required command/governance records were reviewed, including all speckit.* command records.

COMPONENT: .specify/*
USED: YES
USEFUL: NO
REASON: Governance and workflow references were reviewed; no new formal specification artifact was required for this surgical repair.

COMPONENT: .docs/manifest.json
USED: YES
USEFUL: YES
REASON: Confirmed the approved polishing documentation/library routing and local snapshot sources.

COMPONENT: CSS_FIX_GUIDE.md
USED: YES
USEFUL: YES
REASON: Verified the repository's source/served CSS synchronization convention and protected CSS caution.

COMPONENT: DATABASE_SETUP.md
USED: YES
USEFUL: NO
REASON: Reviewed to confirm database behavior was outside this visual-only scope.

COMPONENT: DEPLOYMENT_CHECKLIST.md
USED: YES
USEFUL: NO
REASON: Reviewed to confirm deployment/build concerns and required production verification boundaries.

COMPONENT: QUICK_FIX_GUIDE.md
USED: YES
USEFUL: NO
REASON: Reviewed as required repository guidance; no unrelated production fix was attempted.

COMPONENT: package.json
USED: YES
USEFUL: YES
REASON: Verified current Next.js, Tailwind, React, Playwright, pnpm, and related dependency versions.

COMPONENT: app/page.js
USED: YES
USEFUL: YES
REASON: Verified the homepage mounts the photographic backdrop and aurora container in the intended DOM order.

COMPONENT: app/homepage/HomePage.js
USED: YES
USEFUL: YES
REASON: Verified the existing viewport canvas is transparent and already implements sparse independent twinkling plus randomized shooting stars.

COMPONENT: themes/default/homepage.css
USED: YES
USEFUL: YES
REASON: Verified the photographic Pexels Milky Way remains the homepage foundation at z-index -30 and retained its existing styling.

COMPONENT: public/themes/default/homepage.css
USED: YES
USEFUL: YES
REASON: Verified the served homepage stylesheet remains synchronized with the source stylesheet.

COMPONENT: app/globals.css
USED: YES
USEFUL: YES
REASON: Root-cause file and the only application source file changed; removed the opaque aurora container paint while preserving the four existing aurora layers.

COMPONENT: tests/visual/homepage.spec.ts
USED: YES
USEFUL: YES
REASON: Provides the real Chromium screenshot verification used for the corrected desktop/mobile result.

COMPONENT: playwright.config.ts
USED: YES
USEFUL: YES
REASON: Verified the required Chromium viewport matrix: 1440×900, 390×844, and 412×915.

COMPONENT: .github/workflows/visual-qa.yml
USED: YES
USEFUL: YES
REASON: Verified the repository's mandatory visual-regression execution path and committed-baseline policy.

COMPONENT: .github/workflows/validate-open-next-repair.yml
USED: YES
USEFUL: YES
REASON: Verified the clean build/OpenNext/Tailwind/Wrangler validation path. No deployment was performed.

COMPONENT: memory-bank/activeContext.md
USED: YES
USEFUL: YES
REASON: Updated with the final root cause, implementation, authorization, and verification evidence.

COMPONENT: memory-bank/progress.md
USED: YES
USEFUL: YES
REASON: Updated with the completed PR #1306 milestone and final verification.

**ROOT CAUSE / IMPLEMENTATION**
- The existing photographic homepage background is mounted as `.homepage-sky-backdrop` at `z-index: -30`.
- The homepage aurora container is mounted above it at `z-index: -20`.
- The aurora container itself had `background-color: var(--lp-bg)`, where `--lp-bg` is an opaque dark color. That solid paint hid the photographic sky beneath the aurora.
- The existing star/twinkle canvas is transparent and uses `mix-blend-mode: screen`; it was not the layer hiding the photograph.
- The surgical fix changed only the aurora container background from the opaque dark fill to `background: transparent`.
- The four existing aurora layers, their slow animations, and the existing sparse (~8%) independent star-twinkle/shooting-star behavior were preserved.
- No homepage image was deleted, replaced, or rewritten.
- No audio, card artwork, tier logic, reset/countdown, collection/share, payment, database, authentication, deployment configuration, dependency versions, or secrets were changed.

**TEMPORARY BASELINE HANDLING**
- The first post-fix Visual QA run (36534136655) correctly detected that the existing approved screenshots represented the previous dark/obscured composition; the mobile-412 comparison reported 63,568 differing pixels (ratio 0.17). The threshold was not weakened.
- A temporary baseline-regeneration workflow was used only to render the corrected page with real Chromium and update the three committed visual baselines.
- Temporary baseline workflow run 36534409540 completed successfully.
- The temporary workflow file was removed before finalization and is not part of the final diff.

**VERIFICATION REPORT**
COMMAND: pnpm exec playwright test --update-snapshots
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Executed in GitHub Actions on the corrected branch; regenerated the three committed homepage baselines for desktop 1440×900, mobile 390×844, and mobile 412×915.

COMMAND: pnpm exec playwright test
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Final Visual QA run 36534573471 passed the committed-baseline check and the screenshot comparison for all three configured Chromium viewports: desktop 1440×900, mobile-390 390×844, and mobile-412 412×915.

COMMAND: pnpm run build
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Final OpenNext validation run 36534573368 completed the clean Next.js production build successfully.

COMMAND: pnpm exec opennextjs-cloudflare build
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Final OpenNext validation run 36534573368 produced `.open-next/worker.js` and the assets directory successfully.

COMMAND: Compiled Tailwind verification
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Validation confirmed generated CSS exists and did not contain the unprocessed `@tailwind base;` directive.

COMMAND: Wrangler build validation
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: `pnpm exec wrangler build --config ./wrangler.jsonc` completed successfully with no deployment.

COMMAND: Git status validation
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: The final validation workflow completed its Git-status step successfully.

COMMAND: pnpm test
RESULT: NOT RUN
EVIDENCE/OUTPUT SUMMARY: The repository's final PR verification path for this visual task was the dedicated Playwright Visual QA workflow plus the clean OpenNext validation workflow. No application logic/test-suite changes were introduced.

**BUILD CAP / RESOURCE CHECK**
495 MB CAP: FOLLOWED
EVIDENCE: The task introduced no dependency, deployment, or broad asset changes. The current `validate-open-next-repair.yml` workflow does not emit a numeric total build-size measurement, so no unsupported current size figure is claimed.

**PROTECTED FILE AUTHORIZATION**
PROTECTED FILE: `app/globals.css`
AUTHORIZATION: Explicitly authorized by the repository owner in the task request.
SCOPE: One declaration changed inside `.aurora-container`; no other protected configuration files were modified.

**EXACT FINAL DIFF RECONCILIATION**
app/globals.css
memory-bank/activeContext.md
memory-bank/progress.md
pr-summary.md
tests/visual/__screenshots__/desktop/homepage-viewport.png
tests/visual/__screenshots__/mobile-390/homepage-viewport.png
tests/visual/__screenshots__/mobile-412/homepage-viewport.png

NOT IN FINAL DIFF:
.github/workflows/temporary-homepage-baseline.yml
REASON: Temporary baseline-regeneration workflow was used only for controlled screenshot regeneration and was deleted before finalization.

FINAL DIFF CHARACTER: The application source change is exactly one line added and one line removed in `app/globals.css`; the remaining changed files are the three corrected visual baselines and required Memory Bank/PR reporting records.

**CURRENT PR**
PR: #1306
TITLE: fix(homepage): reveal photographic sky beneath aurora
BRANCH: fix/homepage-aurora-background-layer
BASE: main
MERGED: NO

**PRE-SUBMISSION DOUBLE-CHECK**
The pre-submission double-check is completed. Verified the root cause against the actual homepage DOM/CSS, verified the transparent star canvas, reconciled the exact final changed-file list, confirmed the temporary workflow is absent from the final diff, confirmed protected-file authorization, and confirmed the required visual/build verification paths passed.

**USEFUL RESULT: YES**
REASON: The homepage retains the intended photographic Milky Way image while allowing the existing aurora overlay and sparse twinkling-star/shooting-star atmosphere to render above it without the opaque aurora foundation hiding the background.
