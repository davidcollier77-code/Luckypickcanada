# AGENTS.md — LuckyPickCanada Repository Workflow

This file defines the authoritative workflow Jules must follow when working in the LuckyPickCanada repository.

## Instruction Hierarchy

When instructions conflict, follow this precedence order:

1. "AGENTS.md" (this file)
2. ".jules/jules.md"
3. Applicable specialist files under ".jules/*.md"
4. Applicable command/workflow files under ".jules/cmds/*.md"
5. "memory-bank/*"
6. ".docs/*" reference documentation

Higher-level instructions take precedence over lower-level context.

## A — ANALYZE

Before beginning substantive work, establish the current verified repository state.

### Required Documentation

For every substantive task, Jules must actually read and use these official sources:

1. Official Jules Documentation
   - "https://jules.google/docs"
2. Official Jules API Documentation
   - "https://jules.google/docs/api/reference/"
3. Official Gemini CLI Documentation
   - Repository-local documentation identifier, when applicable: "/google-gemini/gemini-cli"
4. Official Gemini API Documentation
   - Repository-local documentation identifier, when applicable: "/websites/ai_google_dev_gemini-api"

These sources must be used to inform the work. They must not be merely acknowledged, listed, or cited.

When the repository contains a corresponding local reference under ".docs/", Jules must also use that repository-local reference when applicable and report the specific file used.

Do not substitute unofficial articles, third-party summaries, cached explanations, or assumptions for the required official documentation.

### Repository Guidance

Before substantive work, Jules must read and follow the repository guidance applicable to the task, including:

- ".jules/jules.md"
- Applicable specialist files under ".jules/*.md"
- Applicable command/workflow files under ".jules/cmds/*.md"
- Applicable "memory-bank/*" files
- Applicable ".specify/*" and ".specify/memory/*" files

The specialist/task-group structure under ".jules/" is authoritative.

Do not replace that structure with a hard-coded task-group count.

### Memory Bank

The Memory Bank is agent-maintained project context and history.

It provides context about project goals, current work, completed work, technical facts, and relevant history. It does not override "AGENTS.md" and does not establish the current implementation state.

The current repository is authoritative for implementation facts.

Jules must maintain the applicable Memory Bank files as part of normal task completion:

- "memory-bank/activeContext.md" — maintain important current project/task state.
- "memory-bank/progress.md" — record completed milestones when applicable.
- "memory-bank/techContext.md" — update when durable technical facts or architecture change.
- "memory-bank/projectBrief.md" — update when stable project identity, scope, or goals materially change.

Memory Bank updates must be based on verified information, relevant to the work, and limited to durable project context.

Do not rewrite unrelated history.

Never store secrets, credentials, tokens, private keys, or other sensitive authentication material in Memory Bank.

### Repository Reference Documentation

Use ".docs/manifest.json" to identify relevant repository-local documentation.

The actual ".docs/manifest.json" is the authority for the current documentation/library inventory.

When a task depends on a library or reference, Jules must inspect the manifest and use the corresponding actual ".docs/" reference when available.

Do not assume a library, mapping, or documentation entry exists solely because it appeared in a previous report, prompt, or memory entry.

### Current Repository State

Inspect the actual current repository before making substantive changes.

Verify important implementation facts against the current source, configuration, dependencies, workflows, and other relevant repository files.

Do not treat previous agent reports, PR descriptions, memory entries, cached documentation, or previous task results as authoritative when the current repository can establish the fact.

Clearly distinguish verified facts from assumptions.

## B — BOUNDARIES AND PLAN

Before making substantive changes, determine what the task authorizes and what must remain unchanged.

### Scope and Authorization

Make only the changes required to complete the authorized task.

Do not expand the task into unrelated work.

Access to a repository, tool, service, or integration does not by itself authorize Jules to modify it.

### Protected Repository Resources

The following are protected and must not be changed unless the task explicitly authorizes the change:

- ".docs/manifest.json"
- ".docs/"
- Documentation sources and mappings
- Documentation refresh scripts and workflows
- ".jules/"
- ".jules/cmds/"
- ".specify/"

In particular, Jules must not add, remove, rename, remap, or otherwise change the repository's documentation/library inventory without explicit authorization.

The inventory must be derived from the actual ".docs/manifest.json".

Do not hard-code a library count.

### Context7

Context7 requires explicit repository-owner approval before every invocation.

A Context7 connection, installation, availability, or prior use does not constitute permission to invoke it.

Jules must not invoke Context7 unless that explicit approval has been given for the invocation.

When normal designated documentation sources or repository-local references provide what is needed, use those sources instead of Context7.

### Documentation Update Work

Documentation-mapping or documentation-refresh work is separate from ordinary application development.

Jules must not modify documentation mappings, the documentation inventory, or documentation-refresh infrastructure unless that work is explicitly authorized.

When such work is explicitly authorized, Jules must inspect and use the actual repository implementation of the documentation workflow rather than relying on assumptions or previous reports.

### Plan Before Execution

Before making substantive changes, establish:

- the task scope
- the applicable repository guidance
- the required documentation
- the protected resources involved
- the smallest viable implementation
- the validation required to establish completion

## C — EXECUTE, VERIFY, AND REPORT

Execute only the authorized work.

Make minimal, targeted changes necessary to complete it.

### Implementation

Follow the applicable specialist and command/workflow guidance.

Use Spec Kit commands and workflows when the task or repository guidance requires them.

Do not introduce new workflow behavior, dependencies, architectural changes, or unrelated cleanup merely because they appear useful.

### Review and Verification

Before reporting completion, Jules must review his own work and verify:

1. The actual final repository state.
2. The implementation matches the requested task.
3. Changes remain within authorized scope.
4. Protected resources were not changed without authorization.
5. Required Memory Bank maintenance was completed when applicable.
6. Appropriate tests, checks, builds, or other validation were actually performed.
7. The relevant repository guidance was actually read and followed.
8. The relevant official and repository-local documentation was actually read and used.

Verification must distinguish confirmed facts from assumptions.

### Reporting

Report only evidence-supported results.

Include:

- What was actually changed.
- Validation actually performed.
- Final verified repository state.
- Relevant guidance files actually read and used.
- Relevant documentation actually read and used.
- Relevant Memory Bank updates actually made.
- Any unresolved limitations or failures.

Never claim that documentation, guidance, commands, tests, or other validation were used unless they were actually used.

Never represent an assumption as a verified repository fact.

### Final State

Before finalizing the task:

- confirm the final repository state
- confirm the work stayed within authorized scope
- confirm protected resources were handled correctly
- confirm required Memory Bank maintenance was completed when applicable
- confirm required validation was actually performed
- report any unresolved issue accurately
