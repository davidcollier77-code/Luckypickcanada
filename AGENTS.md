Purpose

This is the repository-level instruction file for AI coding agents working on LuckyPickCanada.

Keep this file focused on rules and context that should apply to essentially every task. Task-specific procedures belong in the relevant repository instruction files.

Project

LuckyPickCanada is a Canadian entertainment web application built with Next.js, React, TypeScript, and deployed through OpenNext/Cloudflare.

The repository contains application code, automated tests, repository tooling, Jules instructions, a Memory Bank, local documentation under ".docs/", and GitHub automation.

The repository is the source of truth for current implementation state.

Start Here

Before changing code:

1. Read this "AGENTS.md".
2. Inspect the actual repository state relevant to the task.
3. Read the relevant files under "memory-bank/".
4. Read the applicable instruction files under ".jules/".
5. Read applicable ".jules/cmds/" instructions when a command workflow is involved.
6. Consult relevant local documentation in ".docs/", using ".docs/manifest.json" to identify available sources.
7. Verify assumptions against the current source and configuration.

Do not rely solely on an old report, commit message, previous agent summary, or remembered repository state.

Do not assume a file, directory, command, workflow, dependency, or instruction exists without checking.

Instruction Precedence

Repository-specific instructions are layered.

Use the nearest and most specific applicable instruction set.

- Root "AGENTS.md" provides repository-wide rules.
- More specific agent instruction files provide narrower guidance for their scope.
- Relevant ".jules/" files provide task or workflow-specific guidance.
- ".jules/cmds/" provides command-specific workflows when applicable.
- Memory Bank provides project context and history; it does not replace inspection of the actual code.
- ".docs/" provides documentation knowledge; it does not override current repository behavior.

Do not create a competing instruction system.

Do not duplicate large task-specific manuals in this file.

Task Scope

Determine exactly what the task authorizes before editing.

For repair or implementation work, perform the required work rather than stopping at an audit unless the task explicitly requests an audit.

Keep changes focused.

Do not silently add unrelated:

- refactoring or cleanup
- dependency changes
- architecture changes
- UI redesign
- API changes
- database changes
- security changes
- automation changes
- deployment changes

When additional work is genuinely required to complete the authorized task, keep the expansion as small as possible.

Existing Repository Systems

Reuse existing project capabilities before creating new ones.

Inspect existing:

- components and utilities
- scripts
- tests
- workflows
- configuration
- documentation
- Jules instructions
- repository tooling

Prefer extending the existing architecture over introducing duplicate mechanisms.

Do not add a dependency unless it is actually required for the authorized task.

Memory Bank

Use the existing "memory-bank/" system when relevant.

Read only the files needed for the task.

Treat Memory Bank entries as project context, not proof of current implementation state.

Do not redesign, replace, or create a second Memory Bank system.

Update existing Memory Bank files only when the completed work materially changes the information they are intended to record.

Jules Instructions

The ".jules/" directory is the repository's task-specific instruction system.

Inspect the directory and use only the files relevant to the current task.

Do not maintain a hard-coded list of ".jules" files in "AGENTS.md". The contents of ".jules/" may evolve.

When a task requires a command workflow, inspect the applicable ".jules/cmds/" instruction before using that workflow.

Follow more specific applicable repository instructions unless they conflict with this root file or a higher-priority instruction.

Do not claim a repository instruction was followed or consulted unless it was actually read.

Documentation

Use documentation to inform implementation, but verify important behavior against the repository.

Documentation priority:

1. Repository instructions
2. Required standing Jules/Gemini documentation available through the repository's approved workflow
3. Relevant ".docs/" documentation
4. Other authorized relevant documentation
5. Actual repository implementation and configuration

".docs/" is read-only during ordinary application work.

Do not:

- refresh ".docs/"
- regenerate ".docs/"
- rewrite documentation snapshots
- modify ".docs/manifest.json"
- modify documentation refresh scripts
- modify documentation refresh workflows

unless the task explicitly authorizes documentation maintenance.

Use ".docs/manifest.json" as the current inventory of the local documentation library. Do not copy that inventory into this file.

If local documentation is stale or incomplete, report that fact and use the best available authorized source. Do not silently modify the documentation system while performing unrelated work.

Context7 and External Tools

Local repository resources come first.

Context7 is approval-controlled.

Do not invoke, query, retrieve from, or otherwise use Context7 without explicit authorization from the repository owner.

A connection, initialization event, availability message, or MCP listing does not count as approval and does not count as actual use.

Neon, Stitch, and other external capabilities may be used only when genuinely relevant and permitted by the applicable repository instructions.

Never claim a tool or service was used when it was only connected or made available.

Never disclose credentials, tokens, secrets, or authentication material.

Project Commands

Use the commands defined by the current "package.json" rather than inventing alternatives.

The repository currently uses:

pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm start

The package manager is "pnpm@10.30.3", and the repository targets Node 22.

When deployment work is explicitly authorized, use the repository's existing OpenNext/Cloudflare deployment configuration rather than creating a new deployment path. Use the existing "pnpm deploy" command. Deployment requires explicit authorization.

Do not change build or deployment commands merely for preference or cleanup.

Testing and Verification

Choose verification that matches the change.

Use the repository's existing test and verification tooling where applicable.

Use browser-level verification when user-facing behavior requires it.

Use repository workflow verification tooling when GitHub Actions behavior requires it.

For troubleshooting and repair work:

1. establish observable facts
2. reproduce the failure when practical
3. isolate the cause
4. make the smallest authorized repair
5. verify the original failure is resolved
6. check for relevant regressions

Do not present a hypothesis as a verified root cause.

Do not claim that a test, build, browser check, workflow check, deployment check, or other verification was performed unless it actually was.

Protected Systems

Treat these as protected unless the task explicitly authorizes changes:

- Stripe/payment processing and pricing
- payment and webhook routes
- Cloudflare/OpenNext deployment configuration
- production bindings and environment configuration
- database schema, migrations, production data, and permissions
- authentication and authorization systems
- security controls
- secrets and credentials

The presence of access to a service does not authorize modification of that service.

Inspect the existing implementation before making changes to protected systems.

Secrets and Credentials

Never expose, print, commit, paste, summarize, or disclose:

- API keys
- access tokens
- OAuth credentials
- database credentials
- webhook secrets
- private keys
- signing secrets
- session secrets
- cookies
- environment secrets

Do not place secrets in source code, logs, commits, issues, PRs, screenshots, documentation, or reports.

If a tool reveals a secret unexpectedly, do not reproduce it.

Dependencies

Before changing dependencies, inspect:

- "package.json"
- the lockfile
- existing imports and usage
- repository conventions
- relevant documentation

Do not upgrade, downgrade, remove, or add dependencies unless the authorized task requires it.

Verification of Final State

Before reporting completion:

- inspect the changed files
- inspect the resulting diff
- inspect repository status
- run appropriate tests/checks
- verify generated files when applicable
- verify relevant workflow/configuration changes
- confirm the requested behavior actually works

A successful commit is not proof that the implementation works.

A plausible agent report is not proof of repository state.

Report what was actually changed and what was actually verified.

Git and Pull Requests

Preserve unrelated existing changes.

Do not overwrite or discard work that is outside the authorized task.

When branch, commit, issue, workflow, or PR operations are part of the authorized task, inspect the actual GitHub state before modifying it.

Do not create a PR or push changes merely because the implementation is technically complete if the task workflow requires an approval step first.

General Rule

Be evidence-driven.

Inspect first.

Use the existing repository architecture and instruction systems.

Make the smallest change that correctly completes the authorized task.

Verify the result against the actual repository state.

Do not guess when the repository can answer the question.
