AGENTS.md — LuckyPickCanada Repository Workflow

This file defines the authoritative repository workflow for LuckyPickCanada.

Instruction Hierarchy

When instructions conflict, this precedence order applies:

1. "AGENTS.md" (this file)
2. ".jules/jules.md"
3. Applicable specialist files under ".jules/*.md"
4. Applicable command/workflow files under ".jules/cmds/*.md"
5. "memory-bank/*" files
6. ".docs/*" reference documentation

Higher-level instructions take precedence over lower-level context.

A — ANALYZE

Before beginning substantive work, establish verified facts.

Required Documentation

Every substantive task must use these four official sources:

1. Official Jules Documentation
   - Canonical location: "https://jules.google/docs"
2. Official Jules API Documentation
   - Canonical API reference: "https://jules.google/docs/api/reference/"
3. Official Gemini CLI Documentation
   - Use the official Google Gemini CLI documentation.
4. Official Gemini API Documentation
   - Use the official Google Gemini API documentation.

These four sources are mandatory.

They must be actually read and used to inform and shape the work, not merely acknowledged, listed, cited, or mentioned.

When an official documentation source has a repository-local documentation/reference entry under ".docs/", use that repository-local reference when applicable and identify the specific file actually read.

Do not substitute unofficial articles, third-party summaries, cached explanations, or assumptions for the required official sources.

Repository Guidance

Identify and use the repository guidance applicable to the task, including:

- ".jules/jules.md"
- Applicable specialist files under ".jules/*.md"
- Applicable command/workflow files under ".jules/cmds/*.md"

Use the task requirements and repository state to determine which specialist and command/workflow guidance applies.

Applicable guidance must be actually read, used, and applied, including its instructions, constraints, decisions, workflow requirements, and technical guidance.

The established specialist/task-group structure under ".jules/" is authoritative. Do not replace it with a hard-coded task-group count or duplicate its contents in this file.

Project Context

Identify and use applicable project context and repository guidance, including:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"
- Applicable ".specify/*" files
- Applicable ".specify/memory/*" files
- Other repository-specific guidance required by the workflow

The Memory Bank is an agent-maintained project context and history layer.

It records verified project facts, current context, completed work, technical context, lessons, and relevant historical state.

Memory Bank does not establish repository governance and must not override, replace, or duplicate "AGENTS.md".

Memory Bank is not proof of current implementation.

Current repository state is authoritative for implementation facts.

Memory Bank entries must be based on verified information. Unknown or unverified information must be identified honestly rather than recorded as fact.

Routine Memory Bank maintenance required by the repository workflow is part of completing the task and does not require separate authorization each time.

Agents must maintain applicable Memory Bank files as part of the normal task lifecycle:

- "memory-bank/activeContext.md" — maintain current project/task state and important current context.
- "memory-bank/progress.md" — record completed milestones and durable progress when applicable.
- "memory-bank/techContext.md" — update when durable technical facts or architecture context materially changes.
- "memory-bank/projectBrief.md" — update when stable project identity, scope, goals, or other durable project-level facts materially change.

Only Memory Bank content relevant to the work and durable project state should be updated.

Do not rewrite unrelated historical context.

Never store secrets, credentials, private keys, tokens, or other sensitive authentication material in Memory Bank.

Reference Documentation

Use ".docs/manifest.json" to identify relevant library and reference documentation.

The actual contents of ".docs/manifest.json" define the current repository documentation inventory.

Do not assume a library, mapping, document, or reference exists solely because it appears in a prior report, prompt, memory entry, or historical task result.

Read the relevant ".docs/" files and use that documentation to inform and shape the work when documentation is applicable.

Do not treat ".docs/" as a substitute for the four mandatory official documentation sources when those sources are required.

When a task depends on a specific library or reference, identify and use the corresponding actual repository-local ".docs/" file or entry and report the specific path used.

Current Repository State

Inspect the actual current repository state before making substantive changes.

Verify important implementation facts against the current source code, configuration, dependencies, workflows, and repository state.

Never treat a previous agent report, PR description, memory entry, cached documentation, or prior task result as authoritative when the current repository can establish the fact.

Distinguish verified facts from assumptions.

B — BOUNDARIES AND PLAN

Before changing files or external systems, determine authorization, identify protected resources, define scope, and resolve applicable constraints.

Authorization

Substantive changes require explicit authorization.

Before changing files or external systems:

1. Determine what the task explicitly authorizes.
2. Identify protected systems and resources.
3. Define the smallest viable scope.
4. Do not expand the task scope without authorization.

Service access does not itself constitute authorization to modify that service.

Read-only access, repository visibility, connected tools, installed integrations, or available credentials do not by themselves authorize changes.

Routine maintenance of "memory-bank/*" required by the repository workflow is authorized as part of normal task completion and is not considered an unrelated substantive scope expansion.

Protected Resources

The following resources are read-only unless the specific task explicitly authorizes changes:

- ".docs/manifest.json"
- ".docs/"
- Documentation sources and mappings
- Documentation refresh scripts and workflows
- ".jules/"
- ".jules/cmds/"
- ".specify/"

The "memory-bank/*" files are not protected read-only resources. They are agent-maintained project memory and should be updated when required by the repository workflow.

Reading and using protected resources when applicable is permitted and required.

When a task explicitly authorizes a protected-resource change, the change must remain within the authorized scope and must be verified as part of the final repository state.

Updating "memory-bank/*" as required by the normal task lifecycle does not constitute authorization to modify unrelated repository files.

Documentation-Mapping and Documentation-Updater Work

Documentation-mapping or documentation-updater behavior applies only when that work is explicitly authorized.

When explicitly authorized:

1. Use the actual ".docs/manifest.json".
2. Use the repository's actual documentation updater workflow and scripts.
3. Use the corresponding external source as required.
4. Verify the resulting repository state.
5. Report actual results.
6. Never assume that a mapping, refresh, or update succeeded without verification.

When normal upstream documentation mechanisms are available and designated by the repository workflow, use those mechanisms as the normal update path.

Context7 may be used only where permitted by repository governance and only when the normal designated mechanism cannot provide the required documentation or reference.

Do not automatically substitute Context7 for the repository's designated upstream documentation-update mechanism.

Ordinary application work must not be forced through documentation-refresh behavior.

Inventory Validation

The authoritative documentation inventory is defined by the actual ".docs/manifest.json".

When inventory preservation or validation is relevant:

1. Inspect ".docs/manifest.json".
2. Derive the current inventory from the manifest.
3. Preserve the existing manifest-defined inventory unless inventory changes are explicitly authorized.
4. Verify any reported inventory count from the actual manifest rather than from a hard-coded number.

Do not hard-code a permanent library count in workflow rules.

Do not modify ".docs/manifest.json" unless explicitly authorized.

Plan Before Execution

Before making substantive changes, determine:

- what is authorized
- what is protected
- what guidance applies
- what documentation is required
- what the smallest viable change is
- what validation is appropriate

Do not introduce new workflow behavior merely to satisfy a local preference or speculative concern.

C — EXECUTE, VERIFY, AND REPORT

Execute only the work authorized by the specific task.

Make minimal, targeted changes necessary to complete the authorized work.

Checker, Review, and Validation Layers

Use the repository's applicable checker, review, testing, and validation layers according to their actual repository configuration and documentation.

Where Amazon Q, Cubic, Skepkit, or another checker/reviewer is actually configured or otherwise available for the repository, use it according to its verified capabilities and applicable workflow guidance.

Skepkit is part of the repository's general checker/review/verification ecosystem when it is available and applicable.

Do not invent Skepkit commands, integrations, guarantees, capabilities, ordering, or mandatory usage requirements.

Use only behavior supported by the actual repository configuration or applicable documentation.

Reviewer findings identify potential issues; the agent performing the work must validate those findings against the actual repository, task intent, scope, and applicable governance before implementing them.

Do not blindly implement reviewer suggestions that are unsupported, contradictory, out of scope, or purely stylistic.

When work is being performed on an existing pull request and the repository workflow assigns that corrective work to Amazon Q, follow that workflow rather than starting an unrelated parallel implementation through another agent.

Verification

After completing substantive work, verify:

1. The actual final repository state.
2. The work is appropriate to the authorized task.
3. Changes remain within explicitly authorized scope.
4. Protected resources were not modified without authorization, or were explicitly authorized when modified.
5. Required Memory Bank maintenance was completed when applicable.
6. Validation appropriate to the work was actually performed.
7. The specific repository guidance files actually read and used are identified when applicable, including concrete paths under ".jules/", ".jules/cmds/", "memory-bank/", or ".specify/".
8. The specific documentation actually read, used, and applied is identified when applicable, including relevant ".docs/" reference files when they materially informed the work.

Verification must distinguish confirmed facts from assumptions.

Verification requirements must respect legitimate authorization exceptions for protected resources.

Reporting

Report only evidence-supported results.

Include:

- What was actually changed
- Validation actually performed
- Final verified repository state
- Specific repository guidance files actually read and used when applicable
- Specific documentation actually read, used, and applied when applicable
- Specific ".docs/" files actually read and used when they materially informed the work
- Relevant Memory Bank updates actually made
- Relevant checker or review validation actually performed, including Skepkit when it was actually used
- Any unresolved limitations, failures, or findings

Never claim that something was read, used, applied, checked, validated, or verified unless it actually was.

Never represent an assumption as a verified repository fact.

Final State

Before finalizing work:

- confirm the resulting repository state against the authorized scope
- confirm required validation has actually been performed
- confirm protected-resource changes, if any, were explicitly authorized
- confirm required Memory Bank maintenance was completed when applicable
- confirm unresolved limitations or review findings are reported accurately
- confirm the final report matches the evidence available from the repository and validation results
