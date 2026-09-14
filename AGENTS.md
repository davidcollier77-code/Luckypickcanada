LuckyPickCanada — Jules Governance

Scope: These instructions apply to Jules only when working in this repository.

"AGENTS.md" is the authoritative repository workflow and governance source.

---

A — ANALYZE / VERIFIED FACTS

1. Establish the documentation baseline

Before analyzing the repository or making implementation decisions, establish the applicable official Jules/Gemini documentation baseline first.

Consult the applicable official sources:

- Jules Getting started documentation.
- Jules CLI Jules Tools Reference.
- Jules API Quickstart and API Reference when API work is relevant.
- Gemini CLI documentation when Gemini CLI behavior is relevant.
- Gemini API documentation when Gemini API behavior is relevant.

When official documentation is stored in this repository, use its exact repository filename/path.

Known Jules documentation files include:

- ".docs/deep-dive/jules_google_docs.md"
- ".docs/troubleshooting/jules_google_docs.md"

Do not invent filenames for official documentation that do not exist in the repository. If relevant documentation is not stored in the repository, identify the exact official documentation page/source instead.

2. Inspect the current repository

After establishing the documentation baseline, inspect the actual current repository.

Read, as applicable:

- "AGENTS.md"
- ".jules/jules.md"
- Relevant ".jules/*.md"
- Relevant ".jules/cmds/*.md"
- Relevant Memory Bank files
- ".docs/manifest.json"
- Relevant source files
- Relevant tests
- Relevant configuration
- Relevant scripts and workflows

Memory Bank is supporting project context, not primary technical authority.

Never substitute a prior Jules report, PR description, task summary, memory, or assumption for current repository evidence.

3. Identify relevant libraries and exact documentation files

For every library, framework, or tool relevant to the task:

- Identify the exact name.
- Identify the actual repository version.
- Use ".docs/manifest.json" to locate its documentation when applicable.
- Identify the exact documentation filename/path.
- Use that exact path in the plan, implementation notes, verification, and final report.

Do not use vague references such as “React docs,” “Jules docs,” “Gemini docs,” or “library docs” when an exact source is known.

Do not claim a library was used merely because it exists in "package.json" or ".docs/manifest.json".

4. Actually consult relevant documentation

Documentation must be actually used when it materially applies to the task, not merely acknowledged as available.

Jules must determine which documentation is relevant to the specific task, then actually consult the relevant sources.

For each relevant source, distinguish:

- Consulted — actually read, queried, or invoked.
- Useful — materially helped understand, decide, troubleshoot, implement, or verify.
- Used/Applied — directly affected a decision, constraint, implementation, test, verification step, or workflow.

Availability, connection, initialization, or listing does not count as consultation or use.

Use documentation as a source of practical project intelligence.
Report exactly what documentation was consulted, what was useful, and what was used/applied. Do not report documentation merely because it was available.
«No library documentation was required for this task.»
When documentation is missing, insufficient, outdated, unclear, incomplete, or otherwise inadequate, state that explicitly and explain the practical impact.

When no library documentation was required for the task, report exactly:
5. Record evidence quality

Classify important findings as:

- Verified
- Assumption
- Hypothesis
- Unknown

Never present assumptions or hypotheses as verified facts.

---

B — BOUNDARIES / CONSTRAINTS / PLAN

1. Use the applicable specialist guidance

Use the existing specialist file(s) relevant to the task:

1. ".jules/creation.md"
2. ".jules/troubleshooting.md"
3. ".jules/polishing.md"
4. ".jules/testing.md"
5. ".jules/security.md"
6. ".jules/audio.md"
7. ".jules/deep-dive.md"
8. ".jules/seo.md"

For overlapping work, identify the primary and secondary specialist groups and avoid conflicting or duplicated work.

2. Define the task boundary

Before making changes, establish:

- Exact requested outcome.
- Exact files/directories in scope.
- Protected areas.
- Relevant documentation and libraries.
- Required verification.
- Dependency, database, deployment, security, accessibility, or performance implications.

Do not expand the scope without authorization.

3. Approval boundary

Present the verified analysis and concrete implementation plan before modification unless the task explicitly authorizes autonomous execution.

The plan must be based on current repository evidence.

4. Preserve existing repository behavior

Unless explicitly authorized, preserve:

- Stripe/payment behavior.
- Database behavior and schema.
- Authentication and security controls.
- API routes and existing functionality.
- Cloudflare/Vercel/deployment configuration.
- Environment variables and secrets.
- Accessibility and responsive behavior.
- Existing approved visual/product behavior.

Do not perform unrelated dependency upgrades, refactors, redesigns, backend/database/deployment changes, or governance changes.

Do not modify "AGENTS.md" during ordinary implementation unless explicitly authorized.

5. MCP and documentation tools

Context7 is a controlled fallback, not the normal documentation source. Use it only when genuinely needed and permitted by repository governance and ".jules/jules.md".

When explicitly requesting Context7 libraries, provide only the required plain-text library identifiers.

Use Neon only when database access is genuinely required.

Use Stitch only when UI/design work genuinely requires it.

Do not invoke a tool merely to claim usage. Report actual invocations and their purpose.

6. Documentation inventory and refresh system

".docs/manifest.json" is the documentation inventory authority.

Preserve the established 46-library inventory. Do not impose a different numerical limit.

The normal documentation refresh mechanism is the repository's designated upstream documentation update mechanism, not Context7.
The normal documentation refresh mechanism is the repository's designated upstream documentation mechanism, not Context7.
Preserve these rules:

- Unchanged upstream SHA → skip.
- Changed SHA → update through the normal upstream mechanism.
- New/missing documentation → use that mechanism when it can provide the required material.
- Context7 → permitted fallback only.
- Preserve last-known-good documentation.
- Preserve last-known-good documentation when an update fails.
- Do not persist a new upstream SHA/state until the documentation update has successfully validated.
- Preserve the existing five-minute retry-once behavior on refresh failure.
- Preserve the Friday 02:00 Atlantic schedule, DST-safe handling, and "America/Halifax" runtime gate where implemented.
- Preserve the Friday 02:00 Atlantic / "America/Halifax" DST-safe schedule.

---

C — CONCRETE EXECUTION / VERIFICATION / REPORTING

1. Execute only the approved plan

Make only the changes required by the approved scope.

Use the repository's existing architecture and conventions.

Do not silently broaden the task.

2. Package management

Use the package manager and versions declared by the repository.

The repository uses pnpm.

Never use "npm ci".

Inspect the current "package.json" before claiming a script exists.

3. Security

Never expose or commit secrets.

Do not weaken environment-variable handling, authentication, authorization, validation, CAPTCHA/Turnstile, rate limiting, or other existing security controls.

4. UI, audio, and performance

For UI work, verify actual behavior as well as source changes.

Respect accessibility, responsive behavior, keyboard interaction, and "prefers-reduced-motion".

For audio work, follow ".jules/audio.md".

Howler.js remains the primary audio playback technology unless explicitly changed.

Do not introduce public MP3 assets or unrelated audio systems without authorization.

For performance work, use evidence from measurements, profiling, build output, or runtime behavior.

5. Database and external systems

Use live Neon/database access only when genuinely required.

Do not alter production data or schema without authorization.

Verify external-service changes using the repository's actual configuration and available tests.

6. Verification

Run the relevant real checks after implementation.

Re-check "package.json" before using scripts.

Inspect "package.json" for available scripts. Do not rely on historical lists.
Verify:

- Intended behavior.
- Relevant tests.
- Build success when applicable.
- No unrelated behavior changes.
- No unintended files.
- Final diff matches the approved scope.

7. Final inspection

Inspect the final diff and every changed file.

Remove unintended temporary artifacts.

Confirm protected areas were not changed unintentionally.

8. Required final report

Report the work using the same A-B-C structure.

A — Verified

State the important current repository facts established during the task.

B — Boundaries / Plan

State:

- Approved scope.
- Applicable specialist group(s).
- Important constraints.
- Relevant documentation decisions.

C — Executed / Verified

State:

- Exact files changed.
- Exact tests/builds/checks run.
- Results.
- Remaining issues.
- Unresolved assumptions or unknowns.

Documentation and library intelligence

For each relevant Jules/Gemini documentation source, report:
For each relevant Jules/Gemini documentation source used during the task, report:
- Exact repository filename/path, or exact official source/page identifier when no verified repository file exists.
- Exact repository filename/path when the documentation is stored in the repository.
- Exact official source/page identifier when no verified repository file exists.
- Useful: Yes/No.
- Used/Applied: Yes/No.
- What it contributed.

For each relevant library/framework, report:
For each relevant library/framework used during the task, report:
- Exact library name and version.
- Exact documentation filename/path from ".docs/manifest.json".
- Consulted: Yes/No.
- Useful: Yes/No.
- Used/Applied: Yes/No.
- What it contributed.

When documentation is missing, insufficient, outdated, unclear, incomplete, or otherwise inadequate, state that explicitly and explain the practical impact rather than pretending the documentation was sufficient.

If no library documentation was required for the task, state exactly:

«No library documentation was required for this task.»

MCP/tool invocations must be reported with what each contributed. Do not report documentation or tools merely because they were available. Report only what was actually consulted, what was useful, and what was used/applied.

---

CORE RULE
Establish the applicable official Jules/Gemini documentation baseline first. Assess the actual current repository. Use "AGENTS.md" as the authoritative repository workflow and governance source. Identify exact documentation filenames/paths and relevant libraries. Actually use relevant documentation when it materially applies to the task. Report what was consulted, what was useful, what was used/applied, and what it contributed. When documentation is insufficient, report that explicitly. Use verified evidence, not assumptions. Stay within the approved scope, execute the plan, verify the result, and report the exact evidence.
Establish the applicable official Jules/Gemini documentation baseline first. Assess the current repository. Follow "AGENTS.md". Identify exact documentation filenames/paths and relevant libraries. Actually consult the relevant documentation. Report what was consulted, what was useful, what was used/applied, and what it contributed. Identify documentation or library gaps that need improvement. Use verified evidence, not assumptions. Stay within the approved scope, execute the plan, verify the result, and report the exact evidence.
