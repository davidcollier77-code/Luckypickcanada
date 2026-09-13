AGENTS.md

Purpose

This file is the authoritative repository workflow for LuckyPickCanada.

Follow this file before beginning substantive work. When instructions conflict, use this hierarchy:

AGENTS.md
> .jules/jules.md
> applicable .jules/*.md
> applicable .jules/cmds/*.md
> memory-bank/*
> .docs/*

Higher-level instructions take precedence over lower-level context.

Project

LuckyPickCanada is a Next.js application using React, TypeScript, Tailwind CSS, OpenNext for Cloudflare, and pnpm.

Current runtime/tooling:
- Node.js 22
- pnpm 10.30.3

ABC Operating Flow

Every substantive task follows:

A — Analyze

Establish verified facts before acting.

B — Boundaries and Plan

Determine authorization, constraints, scope, and the smallest appropriate plan before making changes.

C — Execute, Verify, and Report

Make only authorized changes, verify the result, double-check the final state, and report only evidence-supported results.

A — Analyze

1. Read this `AGENTS.md` first.

2. Inspect the actual current repository state before making substantive changes.

3. Read relevant Memory Bank files:
   - `memory-bank/projectBrief.md`
   - `memory-bank/activeContext.md`
   - `memory-bank/progress.md`
   - `memory-bank/techContext.md`

   Memory Bank provides project context and history. It is not proof of the current implementation. Verify important facts against the repository.

4. Read:
   - `.jules/jules.md`
   - applicable `.jules/*.md`
   - applicable `.jules/cmds/*.md`

5. Follow the required Jules Documentation, Jules API, Gemini CLI, and Gemini API documentation workflow.

6. Consult relevant `.docs/` reference material through `.docs/manifest.json` when documentation is applicable.

7. Verify assumptions against the current source, configuration, dependencies, and repository state.

8. Never treat a previous agent report, PR description, memory entry, or cached documentation as authoritative when the current repository can establish the fact.

B — Boundaries and Plan

Authorization and Scope

Explicit authorization is required for substantive changes.

Before changing files or external systems:

1. Determine what the task explicitly authorizes.
2. Identify protected systems and resources.
3. Define the smallest viable scope.
4. Do not expand the task without authorization.

Access to a service does not authorize changing it.

Documentation

`.docs/` is normally read-only during ordinary application work.

Do not refresh, regenerate, or modify `.docs/`, `.docs/manifest.json`, documentation refresh scripts, or documentation refresh workflows unless the task explicitly authorizes that specific modification.

When documentation mapping or updater work is explicitly authorized, use the repository's actual `.docs/manifest.json`, updater workflow/scripts, and corresponding external source as required. Report actual results rather than assuming a mapping or refresh succeeded.

Memory Bank

Memory Bank is durable project context and history.

Use it when applicable, but verify current implementation details against the repository.

Memory Bank does not override `AGENTS.md` or current
