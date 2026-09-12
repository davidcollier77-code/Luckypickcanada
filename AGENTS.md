# AGENTS.md

## Purpose

Repository-wide instructions for AI coding agents working on LuckyPickCanada.

Keep task-specific procedures in `.jules/`.

## Project

LuckyPickCanada is a Canadian entertainment web application built with Next.js, React, TypeScript, and OpenNext/Cloudflare, with GitHub used for source control and repository automation.

The repository is the source of truth for current implementation state.

## Start Here

Before changing code:

1. Read `AGENTS.md`.
2. Inspect the actual repository state relevant to the task.
3. Read `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/progress.md`, and `memory-bank/techContext.md` as relevant.
4. Read `.jules/jules.md` and the applicable `.jules/*.md` specialist instruction.
5. Read the applicable `.jules/cmds/*.md` instruction when a command workflow is involved.
6. Consult the required Jules Documentation, Jules API, Gemini CLI, and Gemini API documentation.
7. Consult relevant `.docs/` sources using `.docs/manifest.json`.
8. Verify important assumptions against the current source and configuration.

Do not rely on old reports, commits, agent summaries, or remembered state.

Do not assume a file, command, dependency, workflow, or instruction exists without checking.

## Instruction Order

Use the most specific applicable instruction.

- `AGENTS.md` — repository-wide rules
- `.jules/jules.md` — Jules initialization and task routing
- applicable `.jules/*.md` — specialist guidance
- applicable `.jules/cmds/*.md` — command workflows
- `memory-bank/` — project context and history
- `.docs/` — documentation

Specific instructions must not conflict with higher-priority rules.

Do not create competing instruction systems or duplicate large manuals.

## Task Scope

Determine exactly what the task authorizes before editing.

For repair or implementation work, perform the authorized work rather than stopping at an audit unless an audit is requested.

Keep changes focused. Do not add unrelated refactoring, cleanup, dependencies, architecture, UI, API, database, security, automation, or deployment changes.

Do not add or change dependencies unless required by the authorized task.

## Documentation

Use documentation to inform implementation, but verify important behavior against the repository.

Use the applicable `.jules/*.md` specialist guidance and its relevant documentation sources.

Do not consult unrelated specialist instructions or documentation libraries.

`.docs/` is read-only during ordinary application work.

AI agents must not manually update or maintain the ".docs/" documentation library unless explicitly authorized by the repository owner.

If local documentation is incomplete or stale, use the best available authorized source and report the limitation.

## Memory Bank

Use the existing Memory Bank when relevant.

Treat `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/progress.md`, and `memory-bank/techContext.md` as project context and history, not proof of current implementation.

Do not redesign, replace, or create another Memory Bank system.

Follow the applicable `.jules/jules.md` requirements for updating `memory-bank/activeContext.md` and `memory-bank/progress.md` when completed work changes recorded project state.

## External Tools

Use repository resources first.

Context7 is the only MCP requiring explicit authorization from the repository owner.

Other permitted MCPs and external capabilities may be used when genuinely relevant to the task.

## Commands

Use commands defined by the current `package.json`.

Current repository commands:

`pnpm install --frozen-lockfile`
`pnpm dev`
`pnpm build`
`pnpm test`
`pnpm start`

Package manager: `pnpm@10.30.3`
Node target: `22`

For explicitly authorized deployment work, use the existing `pnpm deploy` command and OpenNext/Cloudflare configuration.

Do not change build or deployment commands for preference or cleanup.

## Verification

Match verification to the change.

For repairs:

1. establish the facts
2. reproduce the failure when practical
3. isolate the cause
4. make the smallest authorized change
5. verify the original failure is resolved
6. check relevant regressions

Use appropriate tests, builds, browser checks, workflow checks, or deployment checks.

Do not present a hypothesis as a verified cause.

Do not claim a check was performed unless it was actually performed.

Before reporting completion, inspect the changed file, resulting diff, and repository status.

## Protected Systems

These require explicit authorization to modify:

- Stripe, payments, and pricing
- payment and webhook routes
- Cloudflare/OpenNext deployment configuration
- production bindings and environment configuration
- database schema, migrations, production data, and permissions
- authentication and authorization
- security controls
- secrets and credentials

Access to a service does not authorize changing it.

## Secrets

Never expose, print, commit, paste, summarize, or disclose secrets, credentials, tokens, private keys, cookies, or authentication material.

Never place secrets in source code, logs, commits, issues, PRs, screenshots, documentation, or reports.

## Git and Pull Requests

Preserve unrelated work.

Inspect actual GitHub state before branch, commit, issue, workflow, or PR operations.

Do not discard unrelated changes.

Do not create a PR or push changes when the task workflow requires approval first.

## General Rule

Inspect first.

Use the existing repository architecture and instruction system.

Make the smallest authorized change.

Verify the result against the actual repository state.

Do not guess when the repository can answer the question.
