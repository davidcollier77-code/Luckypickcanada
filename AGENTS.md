# AGENTS.md — LuckyPickCanada Repository Workflow

This file defines the authoritative repository workflow for LuckyPickCanada.

## Instruction Hierarchy

When instructions conflict, this precedence order applies:

1. "AGENTS.md" (this file)
2. ".jules/jules.md"
3. Applicable specialist files under ".jules/*.md"
4. Applicable command/workflow files under ".jules/cmds/*.md"
5. "memory-bank/*" files
6. ".docs/*" reference documentation

Higher-level instructions take precedence over lower-level context.

## A — ANALYZE

Before beginning substantive work, establish verified facts.

### Required Documentation

Every substantive task **must** use these four official sources:

1. official Jules Documentation
2. official Jules API documentation
3. official Gemini CLI documentation
4. official Gemini API documentation

These sources must be **actually read and used** to inform and shape the work, not merely acknowledged, listed, cited, or mentioned.

### Repository Guidance

Identify and use applicable repository Jules guidance:

- ".jules/jules.md"
- Applicable specialist file(s) under ".jules/*.md"
- Applicable command/workflow file(s) under ".jules/cmds/*.md"

Use the task requirements to determine which specialist and command/workflow guidance applies. Read, use, and apply their instructions, constraints, decisions, workflow requirements, and technical guidance.

### Project Context

Identify and use applicable project context:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"
- Applicable ".specify/*" files
- Applicable ".specify/memory/*" files
- Other repository-specific guidance required by the workflow

Memory Bank provides project context and history. It is not proof of current implementation. Current repository state is authoritative for implementation facts.

### Reference Documentation

Use ".docs/manifest.json" to identify relevant library and reference documentation. Read the relevant ".docs/" files and use that documentation to inform and shape the work.

### Current Repository State

Inspect the actual current repository state before making substantive changes.

Verify important implementation facts against the actual current source code, configuration, dependencies, and repository state.

Never treat a previous agent report, PR description, memory entry, cached documentation, or prior task result as authoritative when the current repository can establish the fact.

## B — BOUNDARIES AND PLAN

Before changing files or external systems, determine authorization, identify protected resources, define scope, and resolve applicable constraints.

### Authorization

Substantive changes require explicit authorization.

Before changing files or external systems:

1. Determine what the task explicitly authorizes
2. Identify protected systems and resources
3. Define the smallest viable scope
4. Do not expand the task scope without authorization

Service access does not itself constitute authorization to modify that service.

### Protected Resources

The following resources are read-only unless the specific task explicitly authorizes changes:

- ".docs/manifest.json"
- ".docs/" documentation files
- Documentation sources and mappings
- Documentation refresh scripts and workflows
- ".jules/"
- ".jules/cmds/"
- ".specify/"
- "memory-bank/*"

Reading and using these resources when applicable is always permitted and required.

### Documentation-Mapping Work

When documentation-mapping or documentation-updater work is explicitly authorized:

1. Use the actual ".docs/manifest.json"
2. Use the repository's actual documentation updater workflow and scripts
3. Use the corresponding external source as required
4. Report actual verified results
5. Never assume that a mapping or refresh succeeded

Ordinary application work must not be made subject to documentation-refresh behavior.

### Inventory Validation

The repository's library inventory and task groups are defined in ".docs/manifest.json".

When inventory preservation or validation is relevant:

1. Inspect ".docs/manifest.json"
2. Derive the current inventory count from the manifest
3. Preserve the existing manifest-defined inventory unless inventory changes are explicitly authorized
4. Verify any reported inventory count from the actual manifest rather than from a hard-coded number

Do not modify ".docs/manifest.json" unless explicitly authorized.

### ABC Operating Model

Every substantive task follows:

**A — Analyze:** Establish verified facts before acting

**B — Boundaries and Plan:** Determine authorization, constraints, scope, and plan before making changes

**C — Execute, Verify, and Report:** Make only authorized changes, verify actual results, double-check final repository state, and report only evidence-supported results

## C — EXECUTE, VERIFY, AND REPORT

Execute only the work authorized by the specific task.

Make minimal, targeted changes necessary to complete the authorized work.

### Verification

After completing substantive work, verify:

1. The actual final repository state
2. The work is appropriate to the task
3. Changes were within explicitly authorized scope
4. Protected resources were not modified without authorization (or were explicitly authorized when modified)
5. Validation appropriate to the task
6. Specific repository guidance files actually read and used, including applicable ".jules/", ".jules/cmds/", "memory-bank/", or ".specify/" files when relevant
7. Specific documentation actually read and applied, including relevant ".docs/" reference files when they materially informed the work

### Reporting

Report only evidence-supported results.

Include:

- What was actually changed
- Validation performed
- Final verified state
- Specific repository guidance files actually read and used when applicable
- Specific documentation actually read and applied when applicable
- Any unresolved limitations or failures

Never claim something was read, used, applied, checked, or verified unless it actually was.
