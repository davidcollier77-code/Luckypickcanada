LuckyPickCanada — AGENTS.md Repository Workflow

Use the repository’s actual current state as the source of truth.

A — ANALYZE

Every substantive task begins here.

Instruction Hierarchy

The repository instruction hierarchy is:

1. "AGENTS.md" (this file)
2. ".jules/jules.md"
3. applicable specialist file(s) under ".jules/*.md"
4. applicable command/workflow file(s) under ".jules/cmds/*.md"
5. "memory-bank/*" context
6. relevant ".docs/*" reference documentation

Higher-level instructions take precedence over lower-level context.

Required Documentation

Every substantive task MUST use these four official sources:

1. official Jules Documentation
2. official Jules API documentation
3. official Gemini CLI documentation
4. official Gemini API documentation

These sources are mandatory for every substantive task. They must be actually read and used to inform the work, not merely acknowledged, listed, or referenced.

Repository Guidance

After reading the required official documentation, identify and use applicable repository guidance:

- ".jules/jules.md"
- the applicable specialist file(s) under ".jules/*.md"
- the applicable command/workflow file(s) under ".jules/cmds/*.md"

Use the task to determine which specialist and command/workflow guidance applies. Read, use, and apply their instructions, constraints, decisions, and technical guidance to the actual work.

Project Context

Identify and use applicable repository context and guidance:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"
- applicable ".specify/*"
- applicable ".specify/memory/*"

Memory Bank provides historical context, not proof of current implementation. Current repository state is authoritative for implementation facts.

Reference Documentation

Use ".docs/manifest.json" to identify relevant library/reference documentation for the task. Read the relevant ".docs/" files and use that documentation to inform and shape the work.

Current Repository State

Verify important implementation facts against the actual current source, configuration, dependencies, and repository state.

Never treat a previous agent report, PR description, memory entry, cached documentation, or prior task result as authoritative when the current repository can establish the fact.

B — BOUNDARIES AND PLAN

Every substantive task must work within the repository's governance and authorization requirements.

Authorization

Before changing files or external systems:

1. Determine what the task actually authorizes
2. Identify protected systems and resources
3. Define the smallest viable scope
4. Do not expand scope without authorization

Service access does not itself constitute authorization to modify that service.

Substantive changes require explicit authorization.

Protected Resources

These resources are read-only unless the specific task explicitly authorizes changes:

- ".docs/manifest.json"
- ".docs/" documentation files
- documentation refresh scripts
- documentation refresh workflows
- ".jules/"
- ".jules/cmds/"
- ".specify/"
- "memory-bank/*"

Reading and using these resources when applicable is always permitted and required by the workflow.

Make the smallest wording change necessary to establish the intended behavior.

Do not introduce new workflow concepts unless they are necessary to express the requested documentation-usage requirements.

Documentation-Mapping Work

When documentation-mapping or updater work is explicitly authorized:

1. Use the actual ".docs/manifest.json"
2. Use the repository's actual documentation updater workflow/scripts
3. Use the corresponding external source as required
4. Report actual verified results
5. Do not assume a mapping or refresh succeeded

Ordinary application work is not subject to documentation-refresh behavior.

Inventory Validation

When inventory preservation or validation is required:

1. Inspect ".docs/manifest.json"
2. Derive the current inventory from the manifest
3. Preserve the existing manifest-defined inventory unless the task explicitly authorizes inventory changes
4. Verify any reported inventory count from the actual manifest rather than relying on a hard-coded number

Do not introduce unrelated changes or new concepts outside the scope of the authorized task.
C — EXECUTE, VERIFY, AND REPORT
Update only the authorized documentation-usage wording in "AGENTS.md".
The resulting workflow must clearly establish this sequence:
Verification
Read and follow "AGENTS.md" first → always read and use the four required Jules/Gemini documentation sources → identify all other applicable repository guidance and context → identify relevant library/reference documentation → read, use, and apply those sources → verify against the current repository.
After completing any substantive task, verify:
The resulting wording must make clear that:
1. The actual final repository state
2. The work is appropriate to the task
3. Only authorized changes were made
4. Protected resources were not modified without authorization
5. Results are evidence-supported, not assumed
18. No unrelated governance or workflow rules are changed.
When documentation materially informs a task, identify the specific documentation actually used in reporting.
Keep the wording concise, operational, and non-redundant.
When ".docs/" references materially inform a task, identify the specific ".docs/" files actually read and used in reporting.
Avoid duplicating the same requirement in multiple sections when one clear requirement is sufficient.
Reporting
Do not weaken any existing higher-priority repository instruction.
Report:
Verification
- what was actually changed
- validation performed
- final verified state
- relevant repository guidance actually used
- relevant documentation actually read and applied
- specific ".docs/" files actually used when applicable
- any unresolved limitations or failures
After completing any substantive task:
Do not claim something was read, used, applied, or verified unless it actually was.
Report only evidence-supported results.
Task Groups
Include:
The repository maintains 8 task groups as defined in ".docs/manifest.json":
- the specific repository guidance files actually used, including applicable ".jules/", ".jules/cmds/", Memory Bank, or ".specify/" files when relevant
1. creation
2. troubleshooting
3. polishing
4. testing
5. security
6. audio
7. deep-dive
8. seo
Do not claim a documentation source was used unless it was actually read and applied.
Each group identifies the relevant documentation for that type of work.
Do not claim a repository file was inspected unless it was actually inspected.
The library inventory is defined in ".docs/manifest.json" and must be verified from that authoritative source.
Do not claim validation passed unless it was actually performed.
