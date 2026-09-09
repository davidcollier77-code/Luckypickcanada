# Canonical Agent Governance & Operating Rules

This file is the canonical repository-level instruction set for all AI coding agents working on LuckyPickCanada.

These rules are mandatory unless a higher-priority system instruction or an explicit task-specific instruction overrides them.

---

# 1. GOVERNANCE FLOW

┌──────────────────────────────────────────────────────────────────────┐
│                         START TASK                                   │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 1. IDENTIFY TASK                                                     │
│    Determine the task group and exact requested scope.                │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. READ REPOSITORY INSTRUCTIONS                                     │
│    Read AGENTS.md and all applicable repository-local instructions.  │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. INSPECT .docs                                                     │
│    Inspect the documentation library and manifest.                   │
│    Identify and actually read the relevant documentation.             │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. INSPECT CURRENT REPOSITORY STATE                                 │
│    Check files, implementation, dependencies, scripts, workflows,    │
│    tests, existing automation, open PRs, and relevant configuration.  │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. CHECK AVAILABLE CAPABILITIES                                     │
│    Determine whether existing libraries, scripts, tools, MCPs,       │
│    workflows, or documentation already solve the problem.            │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 6. MCP DECISION                                                      │
│    Use a connected MCP only when it materially improves accuracy     │
│    or execution and its approval requirements permit its use.        │
│                                                                      │
│    Connection/initialization ≠ usage.                                │
│    Only an actual invocation/query/retrieval counts as MCP usage.    │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 7. UNDERSTAND                                                        │
│    Understand the existing architecture and constraints before       │
│    changing anything.                                                │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 8. IMPLEMENT ONLY AUTHORIZED SCOPE                                  │
│    Do not perform unrelated cleanup, refactoring, dependency         │
│    upgrades, redesign, or architectural changes.                     │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 9. TEST AND VERIFY                                                   │
│    Run the appropriate tests, builds, linting, type checks, and       │
│    repository verification procedures.                               │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 10. DOUBLE-CHECK ACTUAL STATE                                       │
│     Verify the actual repository/workflow/PR/file state.             │
│     Never claim something happened based solely on an intention,      │
│     connection, plan, or tool availability.                           │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 11. DOCUMENTATION ACCOUNTABILITY                                    │
│     Report what was actually consulted, changed, tested, and        │
│     verified. Never fabricate tool, MCP, documentation, or test use.  │
└──────────────────────────────────────────────────────────────────────┘

---

# 2. CORE OPERATING PRINCIPLES

1. Inspect before modifying.
2. Understand before implementing.
3. Preserve existing behavior unless the task explicitly requires changing it.
4. Work only within the requested scope.
5. Prefer existing repository capabilities over adding new ones.
6. Verify actual results rather than trusting assumptions.
7. Never fabricate tool usage, MCP usage, documentation consultation, test results, or deployment state.
8. Never expose secrets, credentials, API tokens, private keys, session tokens, or sensitive environment values.
9. Do not weaken security controls merely to make a task easier.
10. Do not bypass repository governance.
11. Do not duplicate existing automation.
12. Do not silently expand the scope of a task.

The goal is not maximum code change.

The goal is the smallest correct, maintainable, verifiable change that fully satisfies the authorized task.

---

# 3. TASK GROUPS

Every task must be classified into one of these task groups:

1. Creation
2. Troubleshooting
   - Specialist file: `.jules/creation.md`
3. Polishing
   - Specialist file: `.jules/troubleshooting.md`
4. Testing
   - Specialist file: `.jules/polishing.md`
5. Security
   - Specialist file: `.jules/testing.md`
6. Audio
   - Specialist file: `.jules/security.md`
7. Deep Dive / Investigation
   - Specialist file: `.jules/audio.md`
8. SEO
   - Specialist file: `.jules/deep-dive.md`

   - Specialist file: `.jules/seo.md`
Miscellaneous or cross-cutting work may be treated as a fallback category when it genuinely does not fit one of the eight groups.

Do not invent additional permanent task groups without authorization.
When working with the Spec Kit workflow, use the applicable Spec Kit command files under `.jules/cmds/speckit.*.md`.


---

# 4. REQUIRED AGENT PARTICIPATION

## Jules

Jules is the primary implementation agent for repository work.

Jules must:

- inspect the repository before acting;
- follow AGENTS.md;
- inspect applicable `.docs` material;
- inspect current repository state;
- determine whether connected tools/MCPs materially improve the task;
- implement only authorized changes;
- run appropriate verification;
- inspect the final actual state;
- provide an accurate final report.

## Gemini

Gemini participation is mandatory for repository tasks where the repository workflow provides Gemini access.

Gemini must genuinely participate in the task rather than merely being mentioned.

The final report must distinguish actual Gemini usage from availability or connection status.

A connection or initialization message does not prove Gemini was used.

---

# 5. DOCUMENTATION-FIRST WORKFLOW

The repository's local documentation library is located under:

    .docs/

`.docs` is a first-class repository resource.

It is not optional background material.

For every applicable task, the agent must:

1. inspect `.docs`;
2. inspect `.docs/manifest.json` when present;
3. identify documentation relevant to the task;
4. actually read the relevant documentation;
5. use that information when making implementation decisions;
6. report the relevant documentation actually consulted.

Do not merely state that `.docs` was checked if the relevant documents were not actually read.

Do not read every document unnecessarily.

Read the documents that materially apply to the task.

`.docs` provides documentation and project guidance.

It does not itself authorize use of external services, MCPs, credentials, APIs, or protected systems.

---

# 6. RESOURCE HIERARCHY

When determining how to solve a task, use this general priority order:

1. Explicit task requirements
2. Higher-priority system/platform instructions
3. This AGENTS.md
4. Repository-local instructions
5. Relevant `.docs` documentation
6. Existing repository implementation
7. Existing scripts/workflows/tests
8. Already-installed dependencies and capabilities
9. Approved MCPs/tools
10. External research or new dependencies only when genuinely necessary

Never use external research as an excuse to ignore repository-local documentation.

Never introduce a new dependency when an existing dependency or repository capability is sufficient.

---

# 7. MCP GOVERNANCE

MCPs are governed individually.

A connected MCP is not automatically permission to use it.

The agent must distinguish:

- connection;
- initialization;
- availability;
- actual invocation;
- actual returned data.

Only an actual invocation/query/retrieval constitutes MCP usage.

## Neon

Neon may be used without additional approval when it is materially applicable to the authorized task.

Use it only within the task's scope.

Do not modify protected database structures without explicit authorization.

## Stitch

Stitch may be used without additional approval when it is materially applicable to the authorized task.

Use it only within the task's scope.

## Context7

Context7 requires explicit approval from the repository owner before any invocation.

Connection or availability does not constitute approval.

Mentioning Context7 in a task does not constitute approval.

A previous Context7 approval does not automatically authorize unrelated future tasks unless that authorization explicitly covers them.

Before invoking Context7, Jules must ask the repository owner for explicit approval and provide:

1. MCP/service being requested;
2. tool/action that will be invoked;
3. reason it is materially necessary;
4. what information it is expected to retrieve;
5. whether the action is read-only or modifies anything.

Until explicit approval is received, do not invoke Context7.

## Other MCPs

Any other MCP requires explicit approval unless a separate standing authorization for that specific MCP has been established.

Do not infer approval from:

- connection status;
- initialization;
- availability;
- prior unrelated approval;
- task wording;
- another agent's use;
- a recommendation to use the MCP.

---

# 8. ACTUAL MCP USAGE REPORTING

Final reports must accurately distinguish MCP status.

Good:

    Context7 was connected but was not invoked because approval was not granted.

Good:

    Neon was queried to inspect the relevant database state.

Bad:

    Context7 was used.

when only a connection/initialization event occurred.

Never claim an MCP was used unless an actual invocation occurred.

---

# 9. PROTECTED SYSTEMS

The following systems are protected from modification unless the task explicitly authorizes the change.

## Payments

Do not modify:

- Stripe integration;
- Stripe Checkout;
- payment processing;
- pricing;
- checkout behavior;
- webhooks;
- payment-related API routes;
- payment environment variables.

Do not redesign or refactor payment code during unrelated work.

## Authentication

Do not modify authentication or authorization behavior unless explicitly authorized.

## Database

Do not modify:

- database schema;
- migrations;
- protected tables;
- database functions;
- production data;
- database permissions;

unless explicitly authorized.

Neon access does not itself authorize database modification.

## Secrets and Environment

Never expose:

- API keys;
- access tokens;
- authentication tokens;
- private keys;
- webhook secrets;
- database credentials;
- environment variable values;
- GitHub tokens;
- Cloudflare tokens;
- service-account credentials.

Never place secrets into:

- source code;
- commits;
- PR descriptions;
- issues;
- logs;
- screenshots;
- documentation;
- final responses.

If a secret appears in tool output, do not repeat it.

## Cloudflare

Do not modify Cloudflare configuration unless explicitly authorized.

Protected configuration includes, but is not limited to:

- `wrangler.jsonc`;
- `open-next.config.ts`;
- Cloudflare Pages/Workers configuration;
- deployment configuration;
- bindings;
- environment configuration.

---

# 10. AUDIO PROTECTION

Existing audio behavior is protected.

Do not:

- redesign audio;
- change sound effects;
- add sounds;
- remove sounds;
- change playback sequencing;
- change timing;
- change volume;
- change triggers;
- change reveal/audio choreography;

unless explicitly authorized.

Howler is the approved audio library for the project's current implementation where applicable.

Removing obsolete library references for inventory/documentation purposes does not authorize changing actual audio behavior.

---

# 11. LAYOUT AND UI SAFETY

When fixing layout or responsive issues:

- do not use negative margins as positioning hacks;
- do not use transforms as positioning hacks;
- do not use unnecessary absolute positioning;
- do not bypass the existing layout system;
- preserve semantic structure;
- preserve responsive behavior;
- prefer fixing the actual parent/container sizing, spacing, flow, or layout constraint causing the problem.

Do not move an element visually without understanding why the existing layout places it incorrectly.

---

# 12. DEPENDENCY GOVERNANCE

Do not add, remove, upgrade, or downgrade dependencies unless the task requires it.

Before introducing a dependency:

1. inspect `package.json`;
2. inspect the lockfile;
3. inspect existing imports/usages;
4. check whether an installed dependency already solves the problem;
5. check repository documentation;
6. determine whether the new dependency is genuinely necessary.

Unrelated dependency cleanup is prohibited unless explicitly requested.

Do not upgrade dependencies merely because newer versions exist.

---

# 13. AUTOMATION GOVERNANCE

Before creating any:

- workflow;
- script;
- scheduled job;
- verification process;
- documentation refresh process;
- CI check;
- automation;

inspect existing repository automation first.

Do not duplicate existing automation.

If existing automation already performs the required function, modify or reuse it only when authorized.

Do not create a second workflow that performs substantially the same job.

---

# 14. REQUIRED OPERATING METHOD

Use this sequence:

    INSPECT
        ↓
    IDENTIFY
        ↓
    UNDERSTAND
        ↓
    VERIFY
        ↓
    CHOOSE
        ↓
    RESEARCH
        ↓
    IMPLEMENT
        ↓
    TEST
        ↓
    DOUBLE-CHECK

Research should happen after local repository inspection, not before.

The agent should first determine what the repository already knows.

---

# 15. VERIFICATION REQUIREMENTS

Verification must reflect the actual change.

Where applicable, use:

    ./jules-verify.sh

This is the primary repository verification command.

When local CI simulation is appropriate, use:

    bash scripts/act/run-act.sh "push -j <JOB_ID>"

Do not claim tests passed if they were not run.

Do not claim a build succeeded if it was not actually executed successfully.

Do not claim a workflow ran because the workflow file exists.

Do not claim deployment succeeded because a build completed locally.

---

# 16. ACTUAL STATE VERIFICATION

Before reporting completion, inspect the actual repository state.

Verify, as applicable:

- changed files;
- git diff;
- git status;
- relevant workflow files;
- generated artifacts;
- tests;
- build output;
- PR state;
- commits;
- branch state;
- documentation state.

Do not rely solely on an agent's task report.

Do not treat a proposed change as a completed change.

Do not treat a generated commit as proof that the intended behavior works.

---

# 17. SCOPE CONTROL

Do not perform unrelated:

- cleanup;
- refactoring;
- formatting;
- dependency upgrades;
- architectural changes;
- UI redesign;
- API changes;
- database changes;
- security changes;
- performance rewrites.

If an unrelated issue is discovered, report it separately unless it blocks the authorized task.

If fixing the issue is necessary to complete the authorized task, explain why before expanding scope when practical.

---

# 18. CURRENT PROJECT STACK

LuckyPickCanada currently uses the following major technologies and services where applicable:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- PostgreSQL / Neon
- Cloudflare Pages / Workers
- OpenNext for Cloudflare
- Stripe Checkout
- Resend
- Cloudflare Turnstile
- Howler
- Framer Motion
- Canvas-based visual effects
- Playwright
- Vitest
- Testing Library
- ESLint
- Prettier

Do not assume every listed technology is relevant to every task.

Inspect actual usage before changing anything.

---

# 19. RUNTIME AND PACKAGE MANAGEMENT

The repository uses Node.js 22.x.

Respect the repository's Node version configuration.

The repository uses pnpm.

Use pnpm-compatible commands and respect the existing lockfile.

Do not replace pnpm with npm merely for convenience.

Do not regenerate or modify the lockfile unless required by the task.

When CI is involved, ensure the CI runtime matches the repository's supported Node version.

---

# 20. CODING INVARIANTS

Preserve existing project conventions.

Where applicable:

- use the Next.js App Router architecture already present;
- preserve server/client boundaries;
- preserve existing caching strategy;
- use existing revalidation mechanisms;
- preserve existing database access patterns;
- preserve existing API contracts;
- preserve existing animation timing unless explicitly changing it;
- preserve existing Web Audio/Canvas timing where applicable;
- preserve accessibility behavior;
- preserve responsive behavior;
- preserve existing security controls.

Do not replace an established architecture with a different pattern simply because another approach is personally preferred.

---

# 21. SITE STRUCTURE

The project contains major user-facing areas including:

- `/`
- `/lucky-meter`
- Lucky Cards
- `/lucky-map-of-canada`
- `/map`
- `/where-luck-has-been-found-in-canada`
- Crystal Ball / Oracle
- `/reveal/[revealId]`
- `/about`

Major project directories and files must be inspected before assuming where functionality lives.

Do not assume a route's implementation from its URL alone.

---

# 22. DOCUMENTATION LIBRARY INVENTORY

The `.docs` library is authoritative for repository-maintained technical documentation.

The current adopted documentation inventory includes the libraries and technologies actively identified by the project, including:
The documentation inventory is maintained in `.docs/manifest.json`, which serves as the single authoritative source of truth for the documentation library.

Before implementing any task, agents must:

1. Inspect `.docs/manifest.json` to identify available documentation;
2. Read the relevant documentation files referenced in the manifest;
3. Use that documentation when making implementation decisions;
4. Report the specific documentation sources actually consulted.

The manifest organizes documentation by task group and provides a complete inventory of all available documentation sources.

Do not maintain a second documentation inventory that can drift from the manifest.
- Next.js

The final report should identify the documentation actually read or used for the task.

---

# 23. SPEC KIT INTEGRATION

When a task uses the repository's Spec Kit workflow, follow the existing Spec Kit process and repository-local instructions.

Do not invent an alternate specification workflow.

Do not bypass an existing specification or approval process.

---

# 24. DOCUMENTATION REFRESH AUTOMATION

The documentation refresh system is scheduled for Tuesday and Friday at 2:21 AM Atlantic time.

The UTC schedules are:

    21 5 * * 2,5
    21 6 * * 2,5

The workflow uses a runtime timezone gate where applicable.

Documentation refresh automation must preserve existing duplicate-prevention behavior.

The refresh workflow may create a documentation-refresh issue when documentation requires review.

Do not create duplicate documentation-refresh workflows or duplicate issue automation.

When modifying documentation automation, verify the actual workflow configuration and behavior.

---

# 25. PLAYWRIGHT ARTIFACTS

Playwright CLI artifacts under:

    .playwright-cli/

must never be committed to the repository unless a task explicitly changes this rule.

Do not add generated Playwright artifacts to source control.

---

# 26. REPORTING REQUIREMENTS

Every completed repository task should report, accurately and concisely:

1. What was changed.
2. What files were changed.
3. What documentation was actually consulted.
4. What tools/MCPs were actually invoked.
5. What tests/checks were actually run.
6. Whether verification succeeded or failed.
7. Any limitations or remaining issues.
8. Whether any scope boundaries prevented additional changes.

Never report:

- planned work as completed;
- connected MCPs as used MCPs;
- available documentation as consulted documentation;
- intended tests as executed tests;
- expected deployment as actual deployment;
- assumed repository state as verified repository state.

---

# 27. SECURITY AND SECRET-HANDLING RULE

Under no circumstances may an agent reveal, print, copy, commit, paste, summarize, or otherwise disclose a secret credential or authentication material.

This includes, but is not limited to:

- API tokens;
- access tokens;
- GitHub tokens;
- personal access tokens;
- OAuth tokens;
- Cloudflare tokens;
- database credentials;
- webhook secrets;
- private keys;
- signing keys;
- session tokens;
- cookies;
- environment-variable secrets.

If a task requires access to a secret, use the repository's existing secure mechanism without exposing the value.

Never place secret values in:

- source files;
- logs;
- issues;
- PR comments;
- commit messages;
- screenshots;
- documentation;
- task reports;
- chat responses.

If a secret is accidentally exposed in tool output, immediately avoid reproducing it and treat it as sensitive.

Never ask the repository owner to paste a secret into chat when a secure credential mechanism already exists.

---

# 28. GITHUB AND PR GOVERNANCE

Before working on an existing PR:

1. inspect the current PR state;
2. inspect existing commits;
3. inspect changed files;
4. inspect existing review comments;
5. inspect CI status;
6. determine whether the requested change is already implemented;
7. avoid duplicating an existing fix.

Jules is the primary implementation agent.

When an existing PR requires a follow-up fix through Amazon Q Developer, address Amazon Q using:

    /q

Do not use unrelated agent commands when the repository workflow specifies `/q`.

After a PR change is made, verify the actual resulting PR state.

---

# 29. NO FABRICATION RULE

The agent must never fabricate:

- tool usage;
- MCP usage;
- research;
- documentation consultation;
- test results;
- build results;
- deployment results;
- database changes;
- file changes;
- PR status;
- workflow execution;
- approvals.

If something could not be verified, say so plainly.

Accuracy is more important than producing a confident-looking completion report.

---

# 30. CHANGE MINIMIZATION

When multiple technically valid solutions exist, prefer the solution that:

1. satisfies the task completely;
2. changes the fewest unrelated files;
3. preserves existing architecture;
4. preserves existing behavior;
5. introduces the fewest new dependencies;
6. minimizes security and operational risk;
7. is easiest to verify.

Do not optimize for the largest or most impressive change.

---

# 31. FINAL PRE-COMPLETION CHECK

Before declaring a task complete, ask:

    [ ] Did I inspect the current repository state?
    [ ] Did I read the applicable repository instructions?
    [ ] Did I inspect .docs?
    [ ] Did I actually read the relevant .docs documentation?
    [ ] Did I check for existing scripts/workflows/automation?
    [ ] Did I check whether existing dependencies already solve the problem?
    [ ] Did I respect all protected systems?
    [ ] Did I stay within the requested scope?
    [ ] Did I use MCPs only when permitted and materially useful?
    [ ] Did I distinguish MCP connection from actual MCP usage?
    [ ] Did I protect all secrets?
    [ ] Did I run the appropriate verification?
    [ ] Did I inspect the actual final repository state?
    [ ] Did I verify the PR/workflow state where applicable?
    [ ] Did I accurately report what was actually done?

Only after these checks should the task be reported as complete.

---

# 32. GOVERNANCE PRIORITY

These rules exist to protect:

- repository integrity;
- security;
- payment systems;
- authentication;
- database integrity;
- deployment configuration;
- existing user-facing behavior;
- documentation accuracy;
- automation reliability;
- reproducibility;
- truthful reporting.

When uncertain, stop and inspect.

When an approval is required, ask.

When scope is unclear, do not silently expand it.

When something cannot be verified, do not claim that it was verified.

When a secret is encountered, protect it.

When existing functionality already solves the problem, preserve and reuse it.

The governing principle is:

    INSPECT FIRST.
    USE EXISTING RESOURCES.
    CHANGE ONLY WHAT IS AUTHORIZED.
    PROTECT SENSITIVE SYSTEMS.
    VERIFY ACTUAL RESULTS.
    REPORT ONLY WHAT ACTUALLY HAPPENED.
