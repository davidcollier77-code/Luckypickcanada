🔴 AGENTS.md — READ FIRST — AUTHORITATIVE GOVERNANCE

«MANDATORY: "AGENTS.md" is the single authoritative workflow and governance source for Jules.
Read it first and follow it throughout the task. Never bypass, reinterpret, selectively ignore, or replace it.
Do not replace repository evidence with memory, prior reports, PR descriptions, summaries, or assumptions.»

1. REQUIRED STARTING ORDER

2. Read "AGENTS.md" first.

3. Identify applicable task group(s): "creation", "troubleshooting", "polishing", "testing", "security", "audio", "deep-dive", "seo".

4. Establish the applicable official Jules/Gemini documentation baseline.

5. Inspect the actual current repository, branch, files, configuration, code, tests, and task path.

6. Read materially applicable repository guidance, specialist files, Spec Kit commands, runbooks, Memory Bank, source/configuration, and tests.

7. Identify exact relevant libraries, frameworks, platforms, tools, documentation, protected systems, files, and constraints.

8. Separate verified facts from assumptions, hypotheses, and unknowns.

9. Do not begin implementation from a prior agent report or inferred state; current repository state is the source of truth.

10. MANDATORY OFFICIAL JULES/GEMINI BASELINE

For every task, consult the applicable documents from this mandatory Jules/Gemini baseline; do not skip the baseline because the task appears simple.
Required official sources as applicable:

- Jules Getting Started: "https://jules.google/docs"
- Jules Tools Reference: "https://jules.google/docs/cli/reference"
- Jules API: "https://jules.google/docs/api/reference/"
- Gemini CLI official docs: "google-gemini/gemini-cli"
- Gemini API docs: "https://ai.google.dev/gemini-api/docs"
- Gemini API reference: "https://ai.google.dev/api"
  Repository copies:
- ".docs/deep-dive/jules_google_docs.md"
- ".docs/troubleshooting/jules_google_docs.md"
- ".docs/creation/jules_google_docs.md"
- ".docs/polishing/jules_google_docs.md"
- ".docs/testing/jules_google_docs.md"
- ".docs/security/jules_google_docs.md"
- ".docs/audio/jules_google_docs.md"
- ".docs/seo/jules_google_docs.md"
  The final report must identify actual official sources consulted and their contribution.
  Never claim documentation was consulted unless it was actually consulted.

3. TASK GROUPS AND SPECIALISTS

Use all materially applicable specialists; do not load unrelated specialists merely to satisfy a checklist.
Exact specialist files:

- ".jules/creation.md"
- ".jules/troubleshooting.md"
- ".jules/polishing.md"
- ".jules/testing.md"
- ".jules/security.md"
- ".jules/audio.md"
- ".jules/deep-dive.md"
- ".jules/seo.md"
  ".jules/jules.md" is always required.
  Immediately after repository instructions, read:
- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
  When multiple groups apply, use every materially applicable specialist and state each selected specialist's core constraint in 1–2 sentences before execution.
  At conclusion, update "memory-bank/activeContext.md" and move completed milestones into "memory-bank/progress.md".
  Report actual changes, verification, remaining issues, and final state.

4. SPEC KIT — CONDITIONAL, EXACT FILENAMES

Spec Kit is separate from the eight task-group specialists.
Use it when the task materially requires its structured workflow; do not force it for small fixes suited to normal issue/implementation/test/PR workflow.
Exact current command files:

- ".jules/cmds/speckit.specify.md"
- ".jules/cmds/speckit.clarify.md"
- ".jules/cmds/speckit.plan.md"
- ".jules/cmds/speckit.tasks.md"
- ".jules/cmds/speckit.implement.md"
- ".jules/cmds/speckit.analyze.md"
- ".jules/cmds/speckit.checklist.md"
- ".jules/cmds/speckit.constitution.md"
- ".jules/cmds/speckit.converge.md"
- ".jules/cmds/speckit.taskstoissues.md"
  When reporting Spec Kit usage, name the exact ".jules/cmds/*.md" file(s) used.

5. MEMORY BANK AND RUNBOOKS

Memory Bank is supporting project context, never primary technical authority.
Required supporting files:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"
  Conditional root runbooks:
- "CSS_FIX_GUIDE.md"
- "DATABASE_SETUP.md"
- "DEPLOYMENT_CHECKLIST.md"
- "QUICK_FIX_GUIDE.md"
- "FINAL_REPORT.md" — historical context only, never authority.
  Historical ".jules/bolt.md", ".jules/ci.md", ".jules/palette.md", ".jules/sentinel.md", ".jules/sentinel.md." are supporting context only, not mandatory groups.

6. MANDATORY LIBRARY/DOCUMENTATION CHECK

For every task, check the existing approved library inventory. Never add, remove, rename, regroup, or cap it.
The established inventory is 53 libraries; preserve the existing inventory and group structure.
For every materially relevant library/framework/platform/tool:

1. Identify exact name and version in use or relevant.

2. Check ".docs/manifest.json".

3. Identify the exact existing documentation entry/path.

4. Actually consult relevant existing documentation when materially applicable.

5. Apply relevant information when it materially affects the task.
   Every task must identify its most relevant existing library group/library.
   If consulted but not useful, report: "Consulted: Yes | Useful: No | Used/Applied: No".
   Never claim a library was used merely because it appears in "package.json", "node_modules", the manifest, or tooling.
   Report only actual consultation and actual contribution.

6. CONTEXT7 CONTROLLED FALLBACK

Context7 is documentation fallback, not the normal documentation source.
Use repository-authoritative documentation first.
Use Context7 only when required information is genuinely absent or stale and only after fresh, explicit owner/developer authorization for that specific invocation.
Connection, initialization, discovery, or availability does not count as Context7 usage.
Never invoke Context7 without fresh authorization.
When explicitly requesting Context7 libraries, output only required plain-text library identifiers.
Do not modify the approved library inventory because Context7 lacks a library or returns different naming.
Without authorization, state exactly: "PAUSING FOR AUTHORIZATION: Context7" and halt the Context7-dependent step.
Every actual MCP/tool invocation must report: action | reason | authorization | result | contribution.
Neon and Stitch remain task-specific resources when materially applicable under repository policy; other MCPs require explicit approval unless separately authorized. Connection does not prove actual use.
Unless explicitly directed otherwise by the user, Firecrawl may be used only after all applicable current library documentation files (the ".docs/" library documentation files) and approved project reference sources have been exhausted and are insufficient to resolve the task.

8. ACTUAL REPOSITORY ANALYSIS

Before modifying anything, establish:

- exact requested outcome
- exact files/directories in scope
- applicable specialists
- applicable exact Spec Kit command file(s), if any
- relevant libraries/documentation
- protected systems/files
- verification requirements
- security, database, deployment, accessibility, responsive, and performance implications
  List exact files to inspect/use and exact files planned for modification.
  Cross-reference actual current repository files/state before relying on any prior report.
  Label findings "Verified", "Assumption", "Hypothesis", or "Unknown" as appropriate.
  Never present an assumption or hypothesis as verified.

9. SCOPE AND PROTECTED AREAS

Execute only the approved task. Do not expand scope without authorization.
Protected:

- Stripe/payment
- database/schema
- authentication/security
- API routes and existing functionality
- Cloudflare/Vercel/deployment configuration
- environment variables/secrets
- accessibility/responsive behavior
- approved visual/product behavior
- documentation updater/refresh system
- "AGENTS.md"
  No unrelated upgrades, dependency changes, refactors, redesigns, backend changes, database changes, deployment changes, or governance changes.
  Do not modify "AGENTS.md" during ordinary implementation unless explicitly authorized.

10. DOCUMENTATION UPDATER

Do not modify or rework the documentation updater unless explicitly authorized.
Preserve:

- 53-library inventory
- eight task-group structure
- updater workflow/source
- batching and size limits
- freshness/SHA logic
- retry behavior
- safety and last-known-good protections
- existing scheduling
  Normal documentation refresh uses the repository's designated normal upstream documentation mechanism.
  Context7 remains fallback-only under the authorization rules above.

11. EXECUTION RULES

Unless autonomous execution is explicitly authorized, present verified analysis and a concrete plan before modification.
Follow existing architecture, conventions, and approved product behavior.
Use "pnpm"; never use "npm ci".
Inspect "package.json" before claiming or using a script.
Security:

- never expose or commit secrets
- never weaken validation, sanitization, authentication, authorization, Turnstile/CAPTCHA, rate limiting, duplicate-entry protection, or environment handling
- never bypass security controls for convenience
  UI:
- preserve accessibility, keyboard behavior, responsive behavior, and "prefers-reduced-motion"
- do not alter approved visual/product behavior outside scope
  Audio:
- route audio work through ".jules/audio.md"
- Howler is primary audio playback
- no public MP3s
- no unrelated audio technology without authorization
- preserve reduced-motion/accessibility behavior

12. VERIFICATION IS MANDATORY

Verify completed work before submitting/finalizing.
Run checks relevant to the task, including as applicable:

- runtime/manual verification
- unit/integration tests
- build
- lint/type checking
- accessibility
- security
- API/database
- responsive/browser
- performance/regression
- task-specific automated verification
  Never claim a check was run unless actually run.
  If a check fails, resolve it or clearly report the unresolved failure before submission.
  Inspect the final diff and every changed file.
  Confirm no unintended files, dependencies, secrets, or scope drift.
  Confirm protected systems/docs updater were untouched unless explicitly authorized.
  Confirm final code matches the approved plan.

13. FINAL REPORT

The final report must use exactly three sections.

A — VERIFIED ANALYSIS

State verified repository/task facts, applicable groups, exact files inspected, official Jules/Gemini baseline, relevant library group/libraries, applicable guidance, and facts versus assumptions/hypotheses/unknowns.

B — BOUNDARIES AND PLAN

State approved scope, exact files to change, protected areas, applicable specialists/Spec Kit, relevant documentation, verification plan, and authorization gates.

C — EXECUTION, VERIFICATION, AND FINAL STATE

State exact files changed, exact implementation, exact commands/checks run, actual results, final diff review, remaining issues, and final repository state.

After A/B/C include:

Exact source/path| Consulted| Useful| Used/Applied| Contribution

For every relevant library/framework/platform/tool include exact name/version and exact ".docs" manifest path when available, plus actual consultation and contribution.
For every actual MCP/tool invocation include action, reason, authorization, result, and contribution.
Name exact files. Never report vague labels such as "Spec Kit"; report exact ".jules/cmds/*.md" filename(s).

14. FINAL GOVERNANCE AUDIT

Before submission, confirm:

- "AGENTS.md" was read first and treated as authoritative.
- Applicable specialists were identified and followed.
- Applicable exact ".jules/cmds/*.md" files were identified and used when required.
- Official Jules/Gemini baseline was actually consulted.
- Actual current repository state was inspected.
- Exact inspected and changed files are accurately reported.
- Relevant existing library group/library was identified.
- Relevant existing ".docs" documentation was actually consulted.
- No library inventory/group was changed.
- Context7 was never invoked without fresh explicit authorization.
- Every actual MCP/tool invocation is accurately reported.
- Protected systems and documentation updater were not changed without authorization.
- "pnpm" was used; "npm ci" was not used.
- No secrets or sensitive material were exposed or committed.
- Real verification was completed and accurately reported.
- Final diff and every changed file were inspected.
- "memory-bank/activeContext.md" was updated.
- Completed milestones were moved into "memory-bank/progress.md" where applicable.
- Consulted/Useful/Used-Applied reporting matches actual actions.
- No scope drift or unsupported claims remain.

DO NOT CLAIM COMPLIANCE; DEMONSTRATE IT THROUGH ACTUAL WORK, VERIFICATION, AND ACCURATE REPORTING.
