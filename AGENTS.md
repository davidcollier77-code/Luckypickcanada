LuckyPickCanada — Jules Governance

Scope: These instructions apply to Jules only when working in this repository.

"AGENTS.md" is the single, absolute, mandatory, and authoritative repository workflow and governance file. Jules MUST read it first and follow it throughout the task. No memory, report, PR, specialist file, runbook, library documentation, MCP output, external guidance, or prior instruction may override it. Conditional rules below are mandatory whenever their applicability condition is met.

---

A — ANALYZE / VERIFIED FACTS

1. Required initialization order

Before doing any work:

1. Read "AGENTS.md" first and establish it as governing authority.
2. Select applicable task group(s): creation, troubleshooting, polishing, testing, security, audio, deep-dive, or seo.
3. Establish the applicable official Jules/Gemini documentation baseline.
4. Inspect the actual current repository and actual task state.
5. Read materially applicable repository guidance, specialist files, Spec Kit commands, runbooks, Memory Bank, and relevant source/config/tests.
6. Identify exact relevant libraries, tools, documentation, files, constraints, and protected systems.
7. Separate verified facts from assumptions, hypotheses, and unknowns.

Never replace current repository evidence with memory, previous Jules reports, PR descriptions, task summaries, or assumptions.

2. Official Jules/Gemini documentation

The official Jules/Gemini documentation baseline is mandatory.

Applicable official sources include:

- Jules Getting Started: "https://jules.google/docs"
- Jules Tools Reference: "https://jules.google/docs/cli/reference"
- Jules API: "https://jules.google/docs/api/reference/"
- Gemini CLI: official "google-gemini/gemini-cli" documentation
- Gemini API: "https://ai.google.dev/gemini-api/docs"
- Gemini API reference: "https://ai.google.dev/api"

When repository-local copies exist, use the exact current repository file and do not invent filenames. Known local Jules files include:

- ".docs/deep-dive/jules_google_docs.md"
- ".docs/troubleshooting/jules_google_docs.md"
- ".docs/creation/jules_google_docs.md"
- ".docs/polishing/jules_google_docs.md"
- ".docs/testing/jules_google_docs.md"
- ".docs/security/jules_google_docs.md"
- ".docs/audio/jules_google_docs.md"
- ".docs/seo/jules_google_docs.md"

Official documentation governs documented Jules/Gemini behavior; the current repository governs implementation state.

3. Repository guidance and task groups

Always inspect:

- "AGENTS.md"
- ".jules/jules.md"
- ".docs/manifest.json"

Use applicable specialist(s):

- ".jules/creation.md" — new features/components/pages/capabilities
- ".jules/troubleshooting.md" — defects, failures, regressions, build/runtime/integration problems
- ".jules/polishing.md" — UI/visual/interaction/responsive/animation refinement
- ".jules/testing.md" — tests, coverage, test infrastructure, verification
- ".jules/security.md" — security, auth, validation, sanitization, abuse prevention, secrets
- ".jules/audio.md" — audio playback, sound, timing, Howler
- ".jules/deep-dive.md" — complex investigation and cross-system diagnosis
- ".jules/seo.md" — SEO, metadata, structured data, indexing, discoverability

If multiple groups apply, use all materially applicable specialists; if one is considered but not applicable, state why.

Use applicable ".jules/cmds/" Spec Kit guidance for specification, clarification, planning, analysis, task decomposition, implementation, convergence, checklists, constitution, or issue generation. Spec Kit is mandatory when applicable; otherwise state why it was not applicable.

Available commands include:
"speckit.specify.md", "speckit.clarify.md", "speckit.plan.md", "speckit.tasks.md", "speckit.implement.md", "speckit.analyze.md", "speckit.checklist.md", "speckit.constitution.md", "speckit.converge.md", "speckit.taskstoissues.md".

Supporting context:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"

Memory Bank is supporting project context, never primary technical authority.

4. Libraries and documentation

For every materially relevant library/framework/platform/tool:

- Identify exact name and repository version when applicable.
- Check ".docs/manifest.json".
- Identify the exact documentation entry and ".docs/" path.
- Actually consult it when materially applicable.
- Apply relevant information when it materially contributes to analysis, planning, implementation, or verification.

The established documentation inventory contains 53 libraries. Do not impose another numerical limit or change the inventory without explicit authorization.

Do not claim documentation was consulted/library used merely because it exists in the manifest, "package.json", node_modules, or an available tool.

5. Conditional runbooks

Consult the following root guides when their stated conditions apply:

- "CSS_FIX_GUIDE.md" — CSS/theme loading, frontend rendering, production CSS issues
- "DATABASE_SETUP.md" — DB setup, schema, connectivity, environment configuration, DB troubleshooting
- "DEPLOYMENT_CHECKLIST.md" — deployment, production preflight, release, rollback, deployment verification
- "QUICK_FIX_GUIDE.md" — known production bug/quick-fix classes
- "FINAL_REPORT.md" — historical implementation/reporting context only; not current authority

Runbooks are subordinate to "AGENTS.md" and must be checked against current repo/config/scope. Never expose, copy, or execute credentials/connection strings or other sensitive values found in historical documentation.

Historical ".jules/bolt.md", ".jules/ci.md", ".jules/palette.md", ".jules/sentinel.md", and ".jules/sentinel.md." are supporting context only, not additional mandatory task groups.

6. Evidence labels

Use:

- Verified — directly confirmed
- Assumption — reasonable but not directly confirmed
- Hypothesis — proposed explanation requiring verification
- Unknown — cannot currently be established

Never present an assumption or hypothesis as verified fact.

---

B — BOUNDARIES / CONSTRAINTS / PLAN

1. Scope and plan

Before modifying anything, establish:

- exact requested outcome
- exact files/directories in scope
- applicable specialist(s) and Spec Kit guidance
- relevant libraries/documentation
- protected areas
- verification requirements
- security/database/deployment/accessibility/performance implications

List exact repository files to inspect/use and distinguish them from exact files planned for modification.

Do not expand scope without authorization. Access to a file, service, MCP, or tool does not authorize modification.

Unless autonomous execution is explicitly authorized, present the verified analysis and concrete implementation plan before modification.

2. Protected areas

Unless explicitly authorized, preserve:

- Stripe/payment behavior
- database behavior/schema
- authentication/authorization/security controls
- API routes and existing functionality
- Cloudflare/Vercel/deployment configuration
- environment variables/secrets
- accessibility/responsive behavior
- approved visual/product behavior
- documentation updater/refresh system
- "AGENTS.md" governance

No unrelated upgrades, dependency changes, refactors, redesigns, backend/database/deployment/governance changes.

Do not modify "AGENTS.md" during ordinary implementation.

3. MCP and tool approval

Use MCPs/tools only when materially applicable and authorized.

Context7 is controlled fallback documentation, not the normal documentation source. Every invocation requires fresh explicit developer/user approval. Connection, availability, initialization, or discovery does not count as invocation. Do not invoke it merely to claim use. If it is necessary, stop and obtain approval before invoking it.

When explicitly requesting Context7 libraries, provide only the required plain-text library identifiers.

Neon may be used for genuine authorized database work. Stitch may be used for genuine authorized UI/design work. Other MCPs require explicit approval unless separately authorized.

For every actual MCP/tool invocation, report the action, reason, authorization status, result, and contribution.

4. Documentation updater protection

An existing documentation updater/refresh system is protected. Do not modify, replace, redesign, manually alter, or change its workflow, source mechanism, batching, freshness/SHA logic, retry behavior, limits, or related implementation without explicit authorization.

Do not move updater mechanics into "AGENTS.md".

Preserve the established 53-library inventory and eight task-group structure.

---

C — CONCRETE EXECUTION / VERIFICATION / REPORTING

1. Execute

Execute only the approved plan and use existing architecture/conventions.

Use pnpm. Never use "npm ci".

Inspect "package.json" before claiming or using scripts.

Do not silently broaden scope, upgrade dependencies, or change protected behavior.

2. Security, accessibility, audio

Never expose or commit secrets.

Do not weaken validation, sanitization, authentication, authorization, Turnstile/CAPTCHA, rate limiting, duplicate-entry protection, environment-variable handling, or other security controls.

For UI work, preserve accessibility, keyboard interaction, responsive behavior, and "prefers-reduced-motion".

Audio work follows ".jules/audio.md". Howler.js remains primary audio playback technology. Do not introduce public MP3 assets or unrelated audio systems without explicit authorization.

3. Real verification

Run the real checks relevant to the task, as applicable:

- intended behavior/runtime
- tests
- build
- lint/type checks
- accessibility
- security
- relevant API/database checks
- responsive/browser checks
- regression/no-unrelated-change checks

Do not claim a check was run when it was not. Inspect the final diff and every changed file; confirm no unintended files, dependency changes, secret exposure, or scope drift.

4. Required final report

Use A/B/C.

A — Verified

- important current repository facts
- applicable task group(s)
- official Jules/Gemini baseline
- relevant repository guidance
- facts vs assumptions/unknowns

B — Boundaries / Plan

- approved scope
- files inspected/used
- files planned/changed
- applicable specialists and Spec Kit
- libraries/documentation
- protected systems
- MCP/tool authorizations and use

C — Executed / Verified

- exact files changed
- exact checks run and results
- final diff review
- remaining issues
- assumptions/unknowns
- any scope deviation

Documentation/resource usage

For every relevant source/resource that was actually considered, consulted, invoked, or applied, report:

- Exact source/path
- Consulted: Yes/No
- Useful: Yes/No
- Used/Applied: Yes/No
- Contribution

Apply this reporting to official Jules/Gemini sources, specialist files, Spec Kit commands, Memory Bank, ".docs" documentation, runbooks, libraries/frameworks/tools, and MCPs actually invoked.

“Consulted” means actually read/reviewed. “Useful” means materially informative. “Used/Applied” means it materially influenced analysis, planning, implementation, verification, or a concrete decision.

For a resource considered but not used, explicitly give the reason rather than implying use.

For each relevant library/framework/tool, also report exact name, relevant version, and exact ".docs" path from ".docs/manifest.json" when available.

For each actual MCP/tool invocation, report exact action, why needed, authorization, result, and contribution. For Context7, record the fresh approval preceding the invocation.

Never claim consultation, usefulness, application, verification, or invocation that did not actually occur.

If no library documentation was required, state:

No library documentation was required for this task.

If documentation is missing, insufficient, outdated, unclear, or contradictory, state the issue and practical impact.

5. Project-context updates

At conclusion, update:

- "memory-bank/activeContext.md"
- "memory-bank/progress.md"

Record actual completed work, verification, remaining issues, and relevant current state. Do not fabricate progress. If updates cannot be made, report why.

6. Final governance audit

Before finalizing:

- Confirm this "AGENTS.md" remained authoritative.
- Confirm applicable specialist and Spec Kit guidance was followed.
- Confirm official Jules/Gemini baseline was established and reported.
- Confirm current repository state was actually inspected.
- Confirm inspected files vs changed files are accurate.
- Confirm relevant libraries/docs were actually consulted.
- Confirm MCP approval gates were followed; no unapproved Context7 invocation occurred.
- Confirm protected systems and documentation updater were not changed outside scope.
- Confirm pnpm was used and "npm ci" was not used.
- Confirm no sensitive material was exposed.
- Confirm real verification and final diff inspection occurred.
- Confirm "activeContext.md" and "progress.md" were updated when applicable.
- Confirm the final report contains Consulted/Useful/Used-Applied status and contribution.
- Remove any unsupported completion or usage claims.

7. Governance maintenance

This file is the authoritative governance system. During authorized governance updates, preserve valid requirements and integrate new ones here; do not create parallel governance.

Keep the finished "AGENTS.md" within 175–300 lines, with 300 lines as the hard ceiling. Do not pad it to reach the range; clarity, completeness, and zero ambiguity take priority.

For every authorized governance update, perform a final audit for contradictions, duplicate/superseded wording, missing filenames/task groups, missing conditional routing, missing reporting, missing security/MCP/verification rules, incorrect library count, and unsupported assumptions.
