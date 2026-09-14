LuckyPickCanada — Jules Governance

Scope: These instructions apply to Jules only when working in this repository.

"AGENTS.md" is the authoritative repository workflow and governance file.

---

A — ANALYZE / VERIFIED FACTS

1. Required initialization order

Before doing any work:

1. Read "AGENTS.md" first.
2. Establish the applicable official Jules/Gemini documentation baseline.
3. Inspect the actual current repository and task.
4. Read the applicable repository guidance and specialist files.
5. Identify the exact libraries, tools, documentation, files, and constraints relevant to the task.

Never replace current repository evidence with memory, previous Jules reports, PR descriptions, task summaries, or assumptions.

2. Official Jules/Gemini documentation

The official Jules/Gemini documentation baseline is mandatory.

Use the applicable official sources:

- Jules Getting Started: "https://jules.google/docs"
- Jules Tools Reference: "https://jules.google/docs/cli/reference"
- Jules API documentation: "https://jules.google/docs/api/reference/"
- Gemini CLI documentation: official "google-gemini/gemini-cli" documentation
- Gemini API documentation: "https://ai.google.dev/gemini-api/docs"
- Gemini API reference: "https://ai.google.dev/api"

When repository-local copies exist, use the exact repository file.

Known Jules repository documentation files include:

- ".docs/deep-dive/jules_google_docs.md"
- ".docs/troubleshooting/jules_google_docs.md"
- ".docs/creation/jules_google_docs.md"
- ".docs/polishing/jules_google_docs.md"
- ".docs/testing/jules_google_docs.md"
- ".docs/security/jules_google_docs.md"
- ".docs/audio/jules_google_docs.md"
- ".docs/seo/jules_google_docs.md"

Do not invent documentation filenames.

Official documentation governs documented Jules/Gemini behavior. The current repository governs the actual implementation state.

3. Repository files to inspect

After establishing the official documentation baseline, inspect the files actually relevant to the task.

Always use:

- "AGENTS.md"
- ".jules/jules.md"
- ".docs/manifest.json"

Use the applicable specialist file:

- ".jules/creation.md"
- ".jules/troubleshooting.md"
- ".jules/polishing.md"
- ".jules/testing.md"
- ".jules/security.md"
- ".jules/audio.md"
- ".jules/deep-dive.md"
- ".jules/seo.md"

Use applicable command files under ".jules/cmds/".

Use applicable Memory Bank files:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"

Use relevant source files, tests, configuration, scripts, workflows, and "package.json" as required.

Memory Bank is supporting project context, not primary technical authority.

4. Libraries and documentation

For every library, framework, platform, or tool materially relevant to the task:

- Identify the exact name.
- Identify the actual repository version when applicable.
- Check ".docs/manifest.json".
- Identify the exact documentation entry.
- Identify the exact ".docs/" filename/path.
- Actually consult the documentation when it materially applies.

Do not claim documentation was used merely because it exists.

Do not claim a library was used merely because it appears in "package.json" or ".docs/manifest.json".

The established documentation inventory contains 53 libraries. Do not impose a different numerical limit or change the inventory unless explicitly authorized.

5. Evidence

Classify important findings as:

- Verified
- Assumption
- Hypothesis
- Unknown

Never present an assumption or hypothesis as verified fact.

---

B — BOUNDARIES / CONSTRAINTS / PLAN

1. Scope

Before modifying anything, establish:

- Exact requested outcome.
- Exact repository files planned for inspection/use (with full paths) and exact files planned for modification (distinguished separately).
- Exact files/directories in scope.
- Applicable specialist file(s).
- Relevant libraries and documentation.
- Protected areas.
- Required verification.
- Security, database, deployment, accessibility, and performance implications.

Do not expand the task without authorization.

Access to a file, repository, service, MCP, or tool does not itself authorize modification.

2. Approval

Present the verified analysis and concrete implementation plan before modification unless the task explicitly authorizes autonomous execution.

The plan must be based on current repository evidence.

3. Protected areas

Unless explicitly authorized, preserve:

- Stripe/payment behavior.
- Database behavior and schema.
- Authentication and security controls.
- API routes and existing functionality.
- Cloudflare/Vercel/deployment configuration.
- Environment variables and secrets.
- Accessibility and responsive behavior.
- Existing approved visual/product behavior.

Do not perform unrelated upgrades, refactors, redesigns, backend changes, database changes, deployment changes, or governance changes.

Do not modify "AGENTS.md" during ordinary implementation unless explicitly authorized.

4. MCP and tools

Use tools and MCPs only when materially applicable.

Context7 is a controlled fallback, not the normal documentation source.

Context7 requires explicit developer/user approval before every invocation.

The mandatory Jules/Gemini documentation requirement does not automatically authorize Context7.

If Context7 is materially necessary, stop and request approval before invoking it.

When explicitly requesting Context7 libraries, provide only the required plain-text library identifiers.

Neon may be used when genuine database work requires it and the action is authorized.

Stitch may be used when genuine UI/design work requires it and the action is authorized.

Other MCPs require explicit approval unless separately authorized.

Do not invoke tools merely to claim usage.

5. Documentation updater

A documentation updater system already exists in the repository.

During ordinary work, Jules must not modify, replace, redesign, manually update, or otherwise alter the documentation updater or its refresh workflow.

Any change to the documentation updater or its refresh workflow requires explicit authorization from the developer/user.

Do not place updater implementation details, schedules, retry behavior, batching rules, SHA/state mechanics, or workflow mechanics in "AGENTS.md".

---

C — CONCRETE EXECUTION / VERIFICATION / REPORTING

1. Execute

Execute only the approved plan.

Use the repository's existing architecture and conventions.

Do not silently broaden the scope.

Use pnpm.

Never use "npm ci".

Inspect "package.json" before using or claiming a package script.

2. Security and protected behavior

Never expose or commit secrets.

Do not weaken authentication, authorization, validation, Turnstile/CAPTCHA, rate limiting, environment-variable handling, or other security controls.

For UI work, preserve accessibility, responsive behavior, keyboard interaction, and reduced-motion behavior.

For audio work, follow ".jules/audio.md".

Howler.js remains the primary audio playback technology unless explicitly changed.

Do not introduce public MP3 assets or unrelated audio systems without authorization.

3. Verification

Run the real checks relevant to the task.

Verify, as applicable:

- Intended behavior.
- Relevant tests.
- Build.
- Lint/type checks.
- Accessibility.
- Security.
- No unrelated behavior changes.
- No unintended files.
- Final diff matches the approved scope.

Do not claim a check was performed when it was not.

Inspect the final diff and every changed file.

4. Final report

Use the A-B-C structure.

A — Verified

Report the important current repository facts established during the task.

B — Boundaries / Plan

Report:

- Approved scope.
- Applicable specialist file(s).
- Important constraints.
- Relevant documentation.
- Relevant tools/MCPs.

C — Executed / Verified

Report:

- Exact files changed.
- Exact tests/builds/checks run.
- Results.
- Remaining issues.
- Assumptions and unknowns.
- Any scope deviations.

Documentation report

For each relevant Jules/Gemini documentation source, report:

- Exact repository filename/path or exact official source.
- Consulted: Yes/No.
- Useful: Yes/No.
- Used/Applied: Yes/No.
- What it contributed.

For each relevant library/framework/tool, report:

- Exact name and repository version when applicable.
- Exact documentation filename/path from ".docs/manifest.json".
- Consulted: Yes/No.
- Useful: Yes/No.
- Used/Applied: Yes/No.
- What it contributed.

If no library documentation was required for the task, state exactly:

No library documentation was required for this task.

If documentation is missing, insufficient, outdated, unclear, incomplete, or contradictory, state that explicitly and explain the practical impact.

For each MCP/tool actually invoked, report:

- Tool/MCP name.
- Actual invocation/action.
- Why it was needed.
- What it provided.
- How it contributed.

Never claim consultation, use, or invocation that did not actually occur.

---

CORE ABC RULE

A — Analyze: Read "AGENTS.md" first, establish the official Jules/Gemini documentation baseline, then inspect the current repository and identify verified facts, relevant files, libraries, tools, and documentation.

B — Boundaries: Follow "AGENTS.md", ".jules/jules.md", the applicable ".jules/*.md" specialist file, applicable ".jules/cmds/*.md" files, relevant ".docs/" documentation, and supporting Memory Bank context. Define the exact scope, constraints, approvals, and plan before modification.

C — Concrete execution: Execute only the approved plan, use the actual relevant documentation and tools, protect existing behavior, verify the real result, inspect the final diff, and report exact evidence.

The goal is not to merely acknowledge documentation or tools. The goal is to actually use the relevant documentation and tools to produce better, evidence-based work.
