AGENTS.md — LuckyPickCanada Repository Governance

"AGENTS.md" is the canonical repository-wide governance file for Jules. It defines durable rules, boundaries, routing, and verification. Detailed task procedures belong in the existing repository files named below.

A — INSPECT AND ROUTE

1. Initialize correctly

Before analyzing, planning, or changing anything:

1. Read "AGENTS.md".
2. Read "memory-bank/projectBrief.md" and "memory-bank/activeContext.md".
3. Identify the task group.
4. Read the relevant ".jules/*.md".
5. Read relevant ".jules/cmds/*.md" when applicable.
6. Consult required and relevant ".docs/".
7. Inspect the actual repository state.

Do not rely on memory, old reports, task descriptions, commit messages, or assumptions.

".jules/jules.md" contains the mandatory Jules initialization directive. Relevant ".jules/*.md" files provide specialist guidance for creation, troubleshooting, polishing, testing, security, audio, deep-dive/investigation, and SEO.

2. Repository context

The Memory Bank provides project context only:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"

Keep "memory-bank/activeContext.md" current and record meaningful completed milestones in "memory-bank/progress.md".

Do not create a competing memory or governance system.

3. Spec Kit and commands

When applicable, use the repository's existing ".specify/" system and the relevant ".jules/cmds/" instructions, including the existing "speckit.*.md" files.

Do not bypass required specification, planning, clarification, analysis, task, or approval steps. Do not invent a competing workflow.

4. Documentation

Use documentation to inform work, but the actual repository is the source of truth.

Use:

1. "AGENTS.md"
2. Required Jules/Gemini documentation
3. Relevant ".docs/"
4. Other authorized documentation
5. Actual repository implementation

Use ".docs/manifest.json" as the authoritative record of local documentation.

".docs/" is read-only during ordinary tasks. Do not run the documentation updater, regenerate ".docs/", rewrite snapshots, modify ".docs/manifest.json", modify "scripts/refresh-docs.js", or modify ".github/workflows/refresh-docs.yml" unless documentation maintenance is explicitly authorized.

Do not refresh documentation merely because newer material exists.

If documentation is stale, missing, or malformed, report it and use the best available authorized source.

Never claim documentation was consulted unless it was actually read.

5. Inspect and reuse

Inspect the actual files, source, configuration, dependencies, scripts, tests, workflows, implementation, and current branch/diff relevant to the task.

Reuse existing implementations, utilities, libraries, scripts, workflows, and configuration before adding anything new.

Do not assume a file, capability, or behavior exists without checking.

B — BOUNDARIES

1. Scope

Change only what the task authorizes.

No silent:

- refactoring or cleanup;
- dependency changes;
- architecture changes;
- UI redesign;
- API changes;
- database changes;
- security changes;
- performance work;
- automation changes.

Necessary additional work must be explained and kept minimal.

Do not turn an implementation or repair request into audit-only work.

2. Preserve the application

Preserve existing architecture, contracts, accessibility, responsive behavior, security controls, integrations, and user-facing behavior.

Fix root causes rather than masking symptoms.

3. Protected systems

Do not modify these without explicit authorization:

- Stripe/payment processing, Checkout, pricing, payment routes, and webhooks;
- authentication and authorization;
- Neon/database schema, migrations, protected tables/functions, production data, and permissions;
- Cloudflare, Workers, Pages, OpenNext, deployment, bindings, and environment configuration.

Neon access does not itself authorize database changes.

4. Secrets

Never expose, print, copy, commit, paste, summarize, or disclose credentials or secret material.

This includes API keys, tokens, OAuth credentials, GitHub credentials, Cloudflare credentials, database credentials, webhook secrets, private/signing keys, session secrets, cookies, and environment secrets.

Never place secrets in source, logs, issues, PRs, commits, screenshots, documentation, reports, or chat.

If a tool exposes a secret, do not reproduce it.

5. Dependencies and automation

Do not add, remove, upgrade, or downgrade dependencies unless required by the authorized task. Inspect "package.json", the lockfile, current usage, conventions, and relevant documentation first.

Before changing workflows, scripts, CI, scheduled jobs, or other automation, inspect existing capability and reuse or modify it rather than duplicating it.

6. External tools

Local resources come first.

Context7: explicit repository-owner approval is required before every invocation. A connection, initialization, availability message, or visible MCP entry is not approval and is not usage. Mandatory Jules/Gemini documentation does not authorize Context7.

Neon and Stitch: may be used when materially necessary and applicable, within authorized scope. Connection or initialization does not count as use.

Other MCPs/external capabilities: require appropriate approval unless standing authorization exists.

Never claim a tool or service was used unless it was actually invoked.

C — EXECUTE AND VERIFY

1. Work sequence

Use:

"INSPECT → IDENTIFY → UNDERSTAND → PLAN → IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → CREATE PR"

Follow required approval gates before implementation.

For troubleshooting, use evidence to reproduce/isolate the problem, identify the root cause, make the smallest authorized repair, and verify the original failure is resolved.

2. Testing and verification

Run the tests appropriate to the change.

Use Playwright for relevant browser/user-facing verification.

Use the repository's established workflow verification tools when applicable, including:

- "./jules-verify.sh"
- "scripts/act/install-act.sh"
- "scripts/act/run-act.sh"

Use the Scientific Debugging & Verification Protocol for applicable investigation and repair work.

Use "gh" or authorized GitHub tooling when actual GitHub state must be inspected or changed.

Never claim a test, build, Playwright run, "act" run, workflow check, GitHub operation, documentation consultation, or external-tool invocation unless it actually occurred.

3. Final state

Before reporting completion, verify as applicable:

- changed files;
- "git diff";
- "git status";
- tests and results;
- Playwright results;
- build results;
- generated artifacts;
- workflows;
- documentation changes and ".docs/manifest.json" when applicable;
- branch/commit state;
- GitHub/PR state.

A proposed change is not proof of completion. A commit is not proof that behavior works. A successful-looking report is not proof of repository state.

4. Reporting

Clearly distinguish:

- verified facts;
- observed failures;
- assumptions or unknowns;
- changes actually made;
- verification actually performed;
- remaining issues.

Never claim work, verification, tool usage, or repository state that was not actually observed.
