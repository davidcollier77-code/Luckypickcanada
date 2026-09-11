AGENTS.md — Jules Repository Instructions

This is the canonical repository-level instruction set for AI coding work on LuckyPickCanada.

"AGENTS.md" is authoritative for repository routing, scope, safety, implementation order, verification, documentation usage, and reporting.

---

A1. Identify the Task

Before taking action:

1. Determine exactly what the user is asking for.
2. Identify whether the task is creation, troubleshooting, polishing, testing, security, audio, deep-dive/investigation, SEO, documentation/automation, or another clearly defined task type.
3. Inspect the current repository state before making assumptions.
4. Identify the files, systems, dependencies, workflows, tools, integrations, and documentation that are actually relevant.

Do not expand the task beyond the user-authorized objective.

---

A2. Read Repository Instruction Systems

"AGENTS.md" is the repository-level governing instruction set and is loaded/applied first.

Do not treat reading "AGENTS.md" as a step that must be repeated from within "AGENTS.md". Once these instructions are active, continue with the repository's subordinate instruction and context systems in this order:

1. Read ".jules/jules.md".
2. Read "memory-bank/projectBrief.md".
3. Read "memory-bank/activeContext.md".
4. Review additional relevant files in "memory-bank/", especially:
   - "memory-bank/progress.md"
   - "memory-bank/techContext.md"
5. Review the available specialist instruction files in ".jules/".
6. Review any relevant command instruction in ".jules/cmds/".
7. Read ".docs/manifest.json".
8. Review the relevant documentation available throughout ".docs/".
9. Inspect the actual repository files, configuration, dependencies, workflows, tools, integrations, and source code required for the task.

".jules/jules.md" is the baseline Jules/Gemini operating guidance for this repository.

".jules/" is the repository's instruction area for task-specific guidance. Its files may reference Jules documentation, Gemini documentation, APIs, CLI tooling, libraries, or related resources. Treat those references as part of the established Jules/Gemini workflow. Do not invent a separate instruction system that is not present in the repository.

The repository itself is the source of truth for its current implementation state.

---

A3. Memory Bank

The Memory Bank is a permanent repository resource for maintaining project and task context.

Always begin with:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"

These files provide project context, current priorities, constraints, recent decisions, known issues, and active work.

Review additional Memory Bank files when relevant:

- "memory-bank/progress.md"
- "memory-bank/techContext.md"

Use the Memory Bank as an active working resource throughout the task, not merely as an initial reference.

Before making significant implementation decisions, check whether the Memory Bank contains relevant prior decisions, known constraints, completed work, or unresolved issues.

Do not treat stale Memory Bank information as proof of the current repository state. Verify current implementation state in the actual repository.

At task completion, normally update:

- "memory-bank/activeContext.md"
- "memory-bank/progress.md"

When a task explicitly limits the authorized scope to another file or set of files, that task-specific scope takes precedence and the Memory Bank must not be modified unless authorized.

---

A4. Task-Group Routing and Jules/Gemini Instructions

After reading ".jules/jules.md", review the available specialist guidance in ".jules/" and determine which files and capabilities are applicable to the task.

Primary specialist files include:

- ".jules/creation.md"
- ".jules/troubleshooting.md"
- ".jules/polishing.md"
- ".jules/testing.md"
- ".jules/security.md"
- ".jules/audio.md"
- ".jules/deep-dive.md"
- ".jules/seo.md"

These files are not necessarily an exhaustive inventory of ".jules/".

Review broadly, use selectively.

The existence of a specialist file, command, documentation set, tool, MCP, integration, library, workflow, or repository capability is intentional. The agent should actively determine which available resources can improve the current task.

When a capability is relevant, review its instructions and actually use the applicable capability rather than merely acknowledging that it exists.

The purpose of the specialist system is to improve:

- accuracy
- completeness
- consistency
- safety
- implementation quality
- debugging quality
- verification quality
- efficiency

".jules/jules.md" and the applicable files under ".jules/" may direct work to Jules/Gemini documentation or tooling references. Follow those directions as repository guidance.

Do not claim that a Jules/Gemini resource was used merely because a connection, initialization entry, or availability notice exists. Actual use must be supported by an actual invocation, query, execution, retrieval, or other verifiable action.

---

A5. Jules Command System

When a repository task requires a command workflow, review the appropriate files under ".jules/cmds/".

Examples include:

- ".jules/cmds/speckit.specify.md"
- ".jules/cmds/speckit.plan.md"
- ".jules/cmds/speckit.tasks.md"
- ".jules/cmds/speckit.implement.md"
- ".jules/cmds/speckit.analyze.md"
- ".jules/cmds/speckit.clarify.md"
- ".jules/cmds/speckit.checklist.md"
- ".jules/cmds/speckit.constitution.md"
- ".jules/cmds/speckit.converge.md"
- ".jules/cmds/speckit.taskstoissues.md"

These examples are not an exhaustive inventory.

Review the available command guidance whenever the task may benefit from a structured command workflow.

Do not assume a command file exists without verifying the path.

Use the repository's existing command guidance rather than inventing equivalent instructions.

---

A6. GitHub Spec Kit

When Spec Kit is relevant, inspect the actual ".specify/" structure and the applicable command guidance under ".jules/cmds/".

Review and use the existing Spec Kit capabilities when they materially improve task definition, planning, analysis, task breakdown, implementation, convergence, or verification.

Do not invent missing Spec Kit files or workflows.

Do not bypass an applicable existing Spec Kit workflow merely because an ad hoc process appears easier.

---

A7. Documentation Library, Manifest, and Updater

The repository maintains a local documentation library under:

- ".docs/"
- ".docs/manifest.json"

This documentation library exists specifically so repository work can use maintained local technical references instead of unnecessarily relying on external research.

Treat ".docs/manifest.json" as the authoritative inventory of the current local documentation snapshot.

Do not hard-code the entire ".docs" inventory into "AGENTS.md". The manifest is intentionally dynamic.

Documentation usage rule

Review the library first. Use it actively.

When beginning a task that could benefit from technical documentation:

1. Read ".docs/manifest.json".
2. Identify all documentation entries that may materially apply to the task.
3. Review the relevant local documentation files under ".docs/".
4. Use the applicable documentation to guide implementation, troubleshooting, configuration, testing, verification, or decision-making.
5. For broad or deep tasks, review the library broadly enough to avoid overlooking relevant documentation.
6. Prefer the local documentation library whenever it provides sufficient and applicable information.
7. Only use external documentation when the local library is missing, inadequate, stale for the specific question, or the task explicitly requires current external information.

Do not merely note that the documentation library exists. Use it as an active repository resource.

The local library may contain documentation for frameworks, platforms, services, APIs, testing tools, security systems, databases, deployment systems, Jules/Gemini resources, and other technologies used or potentially used by the project.

When a task involves a documented technology such as Cloudflare, Neon, testing, security, analytics, Spec Kit, or another supported system, actively check the local library for applicable guidance.

Documentation updater

The updater consists of:

- "scripts/refresh-docs.js"
- ".github/workflows/refresh-docs.yml"

The updater maintains the local documentation snapshot and manifest.

A successful no-op refresh is valid when the tracked documentation is already current.

The updater should update documentation that actually requires updating rather than unnecessarily replacing already-current files.

The updater must preserve the repository's intended documentation snapshot/cache model.

The updater must not silently become an application-code deployment mechanism.

Do not claim that documentation was refreshed merely because the updater workflow exists. Verify actual execution and results.

---

A8. Inspect the Actual Repository

Before changing implementation files:

1. Verify the current branch/worktree state.
2. Verify relevant file paths.
3. Inspect the current source and configuration.
4. Inspect relevant package/dependency versions.
5. Inspect relevant GitHub workflows.
6. Inspect existing tests and verification scripts.
7. Confirm that the proposed change matches the current implementation rather than relying on memory, assumptions, or historical summaries.
8. Identify existing integrations and capabilities that can be reused.

The actual repository is the final authority for current implementation state.

Relevant local verification tooling may include:

- "scripts/act/install-act.sh"
- "scripts/act/run-act.sh"
- "jules-verify.sh"

Use the actual available tooling and verify that paths exist before depending on them.

---

A9. Reuse Existing Capabilities

The repository contains specialized instructions, Memory Bank context, documentation, commands, tools, scripts, integrations, workflows, libraries, and supporting systems specifically to improve implementation quality.

Actively look for applicable existing capabilities before creating new ones.

Do not merely acknowledge that a capability exists. When it is relevant, review its guidance and use it appropriately.

This includes, when applicable:

- Memory Bank context and project history.
- Specialist ".jules/*.md" guidance.
- ".jules/cmds/*.md" command workflows.
- Spec Kit through ".specify/".
- ".docs/manifest.json".
- Relevant ".docs/..." documentation.
- Cloudflare and edge/deployment capabilities.
- Neon/database capabilities.
- Testing and Playwright capabilities.
- Security, authentication, Turnstile, bot protection, and rate-limiting capabilities.
- Analytics and event-tracking capabilities.
- Audio capabilities.
- SEO capabilities.
- Existing scripts, utilities, components, libraries, workflows, and verification tools.
- Any other documented repository capability relevant to the task.

The agent should routinely evaluate:

“What existing repository capability can make this task safer, more accurate, more complete, more consistent, or easier to verify?”

Then use the applicable capability when justified.

Do not introduce a new dependency, tool, workflow, or duplicate system when an appropriate existing repository capability already solves the problem.

Do not use a capability merely for the sake of using it.

---

A10. Research and External Resources

Use external research only when it materially improves correctness.

Before going outside the repository, first determine whether the required information or capability already exists in:

1. "AGENTS.md"
2. ".jules/jules.md"
3. "memory-bank/"
4. relevant ".jules/*.md"
5. relevant ".jules/cmds/*.md"
6. ".docs/manifest.json"
7. relevant ".docs/..."
8. the actual repository implementation and configuration

The repository's existing instruction files, Memory Bank, specialist system, command system, documentation library, and integrations should be treated as active resources rather than passive references.

Prefer the existing local capability whenever it is sufficient.

Context7 approval gate

Context7 is a controlled fallback resource.

Because this repository maintains its own local documentation library under ".docs/", the local library must be checked and used first whenever it can answer the question or guide the task.

If Context7 would still be useful or necessary after the repository's existing resources have been reviewed:

1. Stop before invoking Context7.
2. Ask the repository owner for explicit permission.
3. Do not query Context7, retrieve Context7 documentation, or otherwise use Context7 until that permission is received.

This approval is required before every actual Context7 invocation, even when Context7 was previously used on an earlier task.

A connection, initialization message, availability message, MCP connection, or detected tool does not constitute owner approval and does not count as actual Context7 usage.

Do not use Context7 simply because it is available.

Neon and Stitch may be used when materially necessary and applicable to the task, subject to the repository's existing instructions and access permissions.

Other external MCPs or connected services require appropriate approval unless standing authorization already exists.

---

B. Boundaries and Constraints

B1. Scope

Change only what the user has authorized.

Do not turn a narrowly scoped implementation request into unrelated cleanup, refactoring, redesign, dependency upgrades, documentation rewrites, or architectural changes.

For a full-file replacement task, replace the complete authorized file rather than reconstructing it through scattered edits.

---

B2. Preserve Existing Behavior

Do not remove or alter unrelated working behavior.

Preserve existing functionality, styling, content, accessibility, security controls, deployment behavior, user-facing behavior, integrations, and project conventions unless the task explicitly authorizes a change.

---

B3. Protected Systems

Treat existing critical systems as protected unless specifically authorized to change them.

This includes, where applicable:

- authentication and authorization
- database access
- payment and donation systems
- rate limiting and abuse protection
- Turnstile and bot protection
- secrets handling
- production deployment configuration
- analytics and telemetry
- existing audio systems
- existing theme systems
- existing routing
- existing legal/disclaimer content

Do not make unrelated modifications to protected systems while completing another task.

---

B4. Secrets and Credentials

Never expose, print, commit, echo, log, copy, summarize, or disclose secrets, credentials, private keys, API tokens, environment secrets, database credentials, authentication material, or other sensitive access information.

Do not place secrets into source code, documentation, Memory Bank files, commit messages, issue comments, logs, test output, PR descriptions, or any other repository-visible location.

If a secret is accidentally exposed during work, do not reproduce it.

Use the repository's existing secret-management mechanisms.

---

B5. Dependencies

Respect the repository's current dependency strategy and lockfile.

Do not add, remove, replace, or upgrade packages unless the task requires it.

Verify dependency compatibility before making dependency changes.

---

B6. Automation

Automation must be deterministic, reviewable, and limited to its intended purpose.

For documentation automation, preserve the distinction between:

- documentation discovery
- documentation snapshot/cache
- manifest tracking
- application source code
- deployment workflows

Do not make a documentation refresh workflow modify application code unless explicitly authorized.

---

C. Required Work Sequence

C1. Required Work Sequence

For implementation work:

1. Apply "AGENTS.md" as the governing repository instruction set.
2. Read ".jules/jules.md".
3. Review applicable Memory Bank information.
4. Review applicable specialist guidance in ".jules/".
5. Review applicable command guidance in ".jules/cmds/".
6. Check ".docs/manifest.json".
7. Review applicable documentation from ".docs/".
8. Identify applicable existing tools, integrations, workflows, and repository capabilities.
9. Inspect the actual repository state.
10. Identify the smallest correct implementation.
11. Present the implementation plan before making authorized changes unless immediate implementation was explicitly authorized.
12. Wait for required owner approval.
13. Implement only the approved solution.
14. Test the result.
15. Double-check the final state.
16. Update Memory Bank files when permitted and required.
17. Report exactly what changed and what was verified.

---

C2. Implement Only the Authorized Solution

Do not infer extra authorization from a general request.

If the owner authorizes a specific file replacement, do not modify neighboring files merely because they appear related.

For a task that explicitly authorizes only "AGENTS.md", only "AGENTS.md" may be changed.

When replacing a complete file, use the intended complete final content as the replacement rather than creating an incremental patch that leaves old fragments behind.

---

C3. Scientific Debugging and Verification Protocol

For troubleshooting:

1. Reproduce or inspect the reported problem.
2. Gather concrete evidence.
3. Review applicable Memory Bank history.
4. Review applicable specialist guidance.
5. Review relevant local documentation.
6. Identify the root cause.
7. Distinguish symptoms from causes.
8. Implement the smallest appropriate fix.
9. Test the fix.
10. Verify that the fix did not create regressions.
11. Report the evidence and result.

Do not guess at the cause when repository evidence can establish it.

---

C4. Playwright CLI and Testing

When Playwright is relevant, use the repository's installed Playwright tooling and applicable local Playwright documentation under ".docs/".

The currently tracked Playwright documentation may be located through ".docs/manifest.json" and, where applicable:

".docs/testing/_microsoft_playwright.md"

Do not substitute an unrelated browser automation stack without authorization.

---

C5. Local Action Verification

When repository scripts provide a local verification path, use them when appropriate.

Where applicable, inspect and use:

- "scripts/act/install-act.sh"
- "scripts/act/run-act.sh"
- "jules-verify.sh"

Do not claim a workflow or check passed unless it was actually executed or otherwise directly verified.

---

C6. GitHub CLI

Use GitHub CLI only when relevant to the task and available.

Verify repository, branch, PR, workflow, issue, and check information from actual GitHub state rather than relying on stale summaries.

Do not create or modify GitHub resources outside the authorized task.

---

C7. Spec Kit

When using Spec Kit, follow the applicable command guidance under ".jules/cmds/" and the actual ".specify/" repository structure.

Use Spec Kit when it is applicable and materially improves task definition, planning, breakdown, implementation, analysis, convergence, or verification.

Do not invent missing Spec Kit files or workflows.

---

C8. Testing and Verification

Use the most relevant available tests and checks.

At minimum, verify the specific behavior affected by the change.

When practical, also verify:

- build correctness
- type correctness
- lint correctness
- relevant automated tests
- affected workflows
- affected integration points
- documentation/configuration correctness

Use the repository's existing testing and verification capabilities whenever applicable.

Report failures honestly. Do not hide, reinterpret, or omit a meaningful failure.

---

C9. Verify Final State

After implementation:

1. Inspect the final changed files.
2. Confirm only authorized files changed.
3. Confirm the requested behavior is present.
4. Confirm unrelated behavior was preserved.
5. Confirm documentation and configuration references remain valid.
6. Confirm the Jules/Gemini relationship is represented using actual repository files and paths rather than invented instruction systems.
7. Confirm no secrets were exposed.
8. Confirm testing and verification results.
9. Confirm applicable specialist capabilities were actually used when warranted.
10. Confirm the final repository state matches the approved plan.

For a complete file replacement, verify the entire final file after replacement.

---

C10. Memory Bank Updates

Normally update:

- "memory-bank/activeContext.md"
- "memory-bank/progress.md"

Record meaningful completed work, current state, important decisions, and unresolved issues.

Memory Bank should preserve useful task context so future work does not unnecessarily repeat investigation.

Do not update Memory Bank files when the current task explicitly limits authorization to another file or set of files.

---

C11. GitHub and PR Work

Do not create commits, branches, pull requests, issues, releases, or other GitHub changes unless authorized by the task.

When working on an existing PR, verify the actual current PR state before making changes.

When checks fail, investigate the real failure rather than assuming the cause.

---

C12. Final Report

The final report must clearly state:

1. What was changed.
2. What was intentionally not changed.
3. What was tested or verified.
4. Any failures, limitations, or remaining risks.
5. Which relevant ".jules/" guidance was followed.
6. Which relevant ".docs/" documentation was actually consulted.
7. Which repository capabilities were actually used.
8. Whether any external tool or documentation service was actually used.
9. Whether Jules/Gemini documentation or tooling references were actually consulted or used, when applicable.

Never claim a tool, documentation source, MCP, workflow, test, or verification step was used unless it actually was.

---

C13. Final Jules/Gemini Check

Before reporting completion, verify:

- "AGENTS.md" was followed.
- ".jules/jules.md" was followed.
- The relevant ".jules/*.md" specialist guidance was followed.
- The relevant ".jules/cmds/*.md" command guidance was followed when applicable.
- ".docs/manifest.json" was checked when documentation routing was relevant.
- Relevant ".docs/..." documentation was reviewed and used when applicable.
- The Jules/Gemini documentation and tooling references contained in ".jules/" and ".docs/" were treated as part of the established Jules/Gemini workflow.
- No nonexistent ".gemini/" instruction file or other invented instruction system was assumed.
- Context7 was not invoked without explicit owner approval.
- The local documentation library was considered before external documentation.
- Connection or initialization messages were not falsely reported as actual tool usage.
- Applicable specialist capabilities were actually used when warranted.
- The final implementation matches the approved scope.
- The final repository state was verified.

---

A14. Documentation Usage Flow

Use the following documentation and repository flow:

"AGENTS.md"
→ ".jules/jules.md"
→ "memory-bank/projectBrief.md"
→ "memory-bank/activeContext.md"
→ relevant additional "memory-bank/*.md"
→ relevant ".jules/*.md"
→ relevant ".jules/cmds/*.md"
→ ".docs/manifest.json"
→ relevant ".docs/..."
→ existing repository tools/integrations/workflows
→ actual repository source/configuration
→ testing and verification

The purpose of this flow is not simply to read files in sequence. It is to identify and use the best available repository resource for the task.

Review broadly, use selectively.

Do not ignore a relevant specialist file, Memory Bank resource, command workflow, local local documentation entry, existing integration, or verification capability when it can materially improve the work.

Do not blindly use every available resource when it is unrelated to the task.

Use the repository's available resources intelligently and deliberately.

---

Governing Rule

INSPECT FIRST. FOLLOW THE ACTUAL REPOSITORY INSTRUCTION FILES. USE THE MEMORY BANK AS ACTIVE TASK CONTEXT. REVIEW THE SPECIALIST SYSTEM. REVIEW AND USE THE LOCAL DOCUMENTATION LIBRARY. REUSE EXISTING CAPABILITIES. ROUTE THROUGH THE REAL FILE PATHS. PRESERVE SCOPE. GET REQUIRED APPROVAL BEFORE AUTHORIZED-GATE TOOLS. IMPLEMENT ONLY THE APPROVED SOLUTION. TEST IT. VERIFY THE FINAL STATE. REPORT ONLY WHAT WAS ACTUALLY DONE AND VERIFIED.

Treat these repository files as the governing instruction system:

- "AGENTS.md"
- ".jules/jules.md"
- relevant files under ".jules/"
- relevant files under ".jules/cmds/"
- relevant "memory-bank/*.md"
- ".docs/manifest.json"
- relevant files under ".docs/"

Treat the Jules/Gemini documentation and tooling references contained in ".jules/" and ".docs/" as part of that established workflow.

Treat the local ".docs/" documentation library as the repository's first documentation resource before considering Context7 or other external documentation.

Do not invent repository instruction files, agent files, undocumented paths, tool usage, approvals, test results, or implementation state.
