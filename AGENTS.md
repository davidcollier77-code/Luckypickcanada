# AGENTS.md — Jules Repository Instructions

This is the canonical repository-level instruction set for **Jules** working on LuckyPickCanada.

These instructions govern Jules from task intake through implementation, verification, commit/branch work, and PR creation. Jules must follow them unless a higher-priority instruction or an explicit task requirement overrides them.

# A — UNDERSTAND THE REPOSITORY AND THE TASK

## A1. Identify the Task

Before changing anything:

- Determine exactly what the task is asking for.
- Identify the affected area of the repository.
- Determine whether the task is creation, troubleshooting, polishing, testing, security, audio, investigation, SEO, or another cross-cutting task.
- Do not turn an implementation or repair request into audit-only work unless the task explicitly asks for an audit.

When the task requires investigation, investigate the cause first and then make the authorized repair.

## A2. Read the Repository Instruction Systems

Use the repository's instruction systems in this order:

1. `AGENTS.md`
2. Relevant Memory Bank files
3. Relevant `.jules/*.md` task-group instructions
4. Relevant `.jules/cmds/` instructions when applicable
5. Relevant `.docs/` documentation

The following systems are part of the repository's established Jules workflow and must be treated as complementary systems rather than competing instruction systems:

- Memory Bank
- `.jules/` Jules instructions
- `.jules/cmds/` Jules command system
- GitHub Spec Kit and `.specify/`
- Playwright CLI/testing
- Scientific Debugging & Verification Protocol
- Local Action Verification using `act`
- `.docs/` documentation library
- `.docs/manifest.json` and its documentation updater
- GitHub CLI (`gh`)
- Existing Context7/MCP routing

Do not assume a file exists or contains something without checking the repository.

## A3. Memory Bank

Treat the Memory Bank as repository context, not as a substitute for inspecting the actual code.

Where present and relevant, inspect:

- `memory-bank/projectBrief.md`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`
- `memory-bank/techContext.md`

Keep `activeContext.md` and `progress.md` accurate when the completed work materially changes the project's current state or progress.

Do not create a second memory system or replace the established Memory Bank structure.

## A4. Task-Group Routing and Jules Instructions

Use the appropriate specialist instructions under `.jules/`:

- `creation.md`
- `troubleshooting.md`
- `polishing.md`
- `testing.md`
- `security.md`
- `audio.md`
- `deep-dive.md`
- `seo.md`

Use only the specialist guidance relevant to the task.

Do not duplicate task-specific rules in `AGENTS.md` when they belong in a specialist file.

The `.jules/` instruction system provides task-specific guidance under this master repository instruction set.

## A5. Jules Command System

The `.jules/cmds/` directory contains repository-specific Jules command instructions.

When a task requires one of these command workflows, inspect and follow the applicable command instruction before using it.

This includes the repository's Spec Kit command instructions such as:

- `.jules/cmds/speckit.specify.md`
- `.jules/cmds/speckit.plan.md`
- `.jules/cmds/speckit.tasks.md`
- `.jules/cmds/speckit.implement.md`
- `.jules/cmds/speckit.analyze.md`
- `.jules/cmds/speckit.clarify.md`

Do not invent alternative Jules command workflows when an applicable repository command system already exists.

## A6. GitHub Spec Kit

When the task uses GitHub Spec Kit, use the repository's existing Spec Kit installation under `.specify/` and its corresponding `.jules/cmds/` instructions.

Follow the established specification, planning, task, analysis, clarification, and implementation process when applicable.

Do not bypass required specification or approval steps.

Do not create a competing planning or specification system.

## A7. Documentation Library, Manifest, and Maintenance

### A7.1 Documentation Hierarchy
Documentation must be consulted in the following strict hierarchy:
1. `AGENTS.md` (Governing rules)
2. Mandatory Jules and Gemini documentation (Standing resources that MUST be actually consulted for repository work)
3. Relevant repository-local documentation in `.docs/`
4. Other relevant authorized documentation and libraries
5. Repository source and implementation state

### A7.2 Documentation Usage vs Documentation Maintenance
USE DOCUMENTATION → YES, routinely and as required.
MODIFY DOCUMENTATION → NO, unless explicitly authorized as documentation-maintenance work.

- Jules documentation and Gemini documentation are mandatory standing resources and must actually be consulted, not merely listed, mentioned, or connected.
- Additional documentation libraries should be consulted whenever materially relevant to the task.
- `.docs/` is **READ-ONLY** during ordinary repository tasks.
- Reading `.docs/` and modifying `.docs/` are completely separate permissions.

### A7.3 Explicit Prohibitions for Ordinary Tasks
During a normal repository task, Jules MUST NOT:
- run the documentation refresh updater;
- regenerate `.docs/`;
- rewrite `.docs/` snapshots;
- change `.docs/manifest.json`;
- change documentation updater files (`scripts/refresh-docs.js`, etc.);
- change documentation-refresh workflow files;
- update documentation solely because it is stale or newer documentation is available.

If a documentation issue (stale, missing, malformed) is discovered during normal work, Jules must report it and continue using the best available authorized documentation. Jules must NOT repair or refresh the documentation unless that task explicitly authorizes documentation maintenance.

### A7.4 Documentation Usage Flow
`.docs/` is the repository's local documentation library.
Use `.docs/manifest.json` as the authoritative record of what local documentation is available.

Generic documentation flow:
`TASK
   ↓
IDENTIFY NEEDED KNOWLEDGE
   ↓
CONSULT MANDATORY JULES/GEMINI DOCS
   ↓
CHECK .docs/manifest.json FOR ADDITIONAL DOCS
   ↓
FIND RELEVANT DOCUMENTATION
   ↓
READ ONLY WHAT IS RELEVANT
   ↓
USE DOCUMENTATION TO INFORM THE WORK
   ↓
VERIFY AGAINST THE ACTUAL REPOSITORY`

Rules:
- Do not invent documentation that is not present.
- Do not claim documentation was consulted unless it was actually read.
- Do not read the entire library unnecessarily.
- Do not maintain a second hard-coded documentation inventory in `AGENTS.md`.
- `.docs` provides guidance; the actual repository remains the source of truth for current implementation state.
- The manifest describes the local documentation state; it does not override the repository source of truth.
- Documentation does not authorize access to protected systems, credentials, external services, or unrelated work.
## A8. Inspect the Actual Repository

Before implementation, inspect the current repository state relevant to the task.

Check the actual:

- files and directories;
- source code;
- configuration;
- dependencies;
- scripts;
- tests;
- workflows;
- existing implementation;
- current branch/diff when relevant.

Do not rely solely on a previous task description, an old report, a commit message, or saved assumptions.

## A9. Reuse Existing Capabilities

Before adding something new:

- Look for an existing implementation.
- Look for existing utilities, components, libraries, scripts, workflows, or configuration that already solve the problem.
- Prefer extending the existing architecture over replacing it.
- Do not add dependencies or duplicate functionality without a real requirement.

## A10. Research and External Resources

Local repository resources come first.

External research or external tools should only be used when genuinely necessary after inspecting the repository.

### Context7

Context7 is an approved-but-controlled external documentation resource.

**Jules must never invoke, query, retrieve from, or otherwise use Context7 without explicit approval from the repository owner.**

A Context7 connection, initialization message, availability notice, or visible MCP entry does not constitute approval and does not constitute actual usage.

*Exception for Mandatory Standing Resources:* The mandatory Jules and Gemini documentation requirements do not grant automatic approval to use Context7 to retrieve them if they are not available locally. Existing approved local capabilities must be exhausted first.

If Context7 would be useful for other libraries, Jules must request approval before invoking it.

If approval has not been given, use the repository's existing `.docs` documentation and other available authorized resources instead.

Once explicit approval has been given, Jules may use Context7 only for the approved purpose and must accurately report the actual Context7 operation performed.

### Neon and Stitch

Neon and Stitch may be used by Jules whenever Jules determines they are materially necessary and applicable to the authorized task.

Separate owner approval is not required merely to use Neon or Stitch.

However:

- Use them only when relevant to the task.
- Follow all protected-system and scope rules.
- Access to Neon does not authorize database modification.
- A connection or initialization message is not proof of usage.
- Only an actual invocation, query, retrieval, or executed operation counts as use.
- Never claim Neon or Stitch was used unless it was actually invoked.

### Other MCPs and External Capabilities

Other MCPs or external capabilities require appropriate approval unless standing authorization exists.

Never report a connected service as having been used when it was not actually invoked.

# B — BOUNDARIES AND PROTECTED SYSTEMS

## B1. Scope

Change only what the task authorizes.

Do not silently add:

- unrelated refactoring;
- cleanup;
- dependency upgrades or removals;
- architectural changes;
- UI redesign;
- API changes;
- database changes;
- security changes;
- performance work;
- automation changes.

When additional work is genuinely required to complete the authorized task, explain why it is necessary and keep the expansion as small as possible.

## B2. Preserve Existing Behavior

Do not change existing behavior merely because another approach is preferred.

Preserve:

- established architecture;
- existing contracts;
- accessibility;
- responsive behavior;
- security controls;
- current integrations;
- existing user-facing behavior.

Fix the actual root cause rather than masking symptoms with unnecessary hacks.

## B3. Protected Systems

Do not modify protected systems without explicit authorization.

This includes:

### Payments

Do not change payment processing, Stripe integration, Checkout behavior, pricing, payment routes, webhooks, or related secrets/configuration unless authorized.

### Authentication

Do not change authentication flows, authorization behavior, identity systems, or protected auth configuration unless authorized.

### Database

Do not make unauthorized schema changes, migrations, destructive queries, protected table/function changes, production-data changes, or permission changes.

Access to Neon does not itself authorize database modification.

### Deployment

Do not change protected Cloudflare, Workers, Pages, OpenNext, deployment, bindings, or environment configuration unless authorized.

## B4. Secrets and Credentials

Never expose, print, copy, commit, paste, summarize, or disclose secret credentials or authentication material.

This includes, but is not limited to:

- API keys;
- access tokens;
- GitHub tokens;
- OAuth credentials;
- Cloudflare credentials;
- database credentials;
- webhook secrets;
- private keys;
- signing secrets;
- session secrets;
- cookies;
- environment secrets.

Do not place secrets in source code, logs, issues, PRs, commits, screenshots, documentation, reports, or chat.

If a tool unexpectedly exposes a secret, do not reproduce or disclose it.

Use secure repository or platform mechanisms for secret handling.

## B5. Dependencies

Do not add, remove, upgrade, or downgrade dependencies unless the task requires it.

Before changing dependencies, inspect:

- `package.json`;
- lockfile;
- current imports/usages;
- existing repository conventions;
- relevant documentation.

Do not perform unrelated dependency maintenance during another task.

## B6. Automation

Before changing a workflow, script, scheduled job, CI process, documentation refresh, or other automation:

1. Inspect existing automation.
2. Determine whether the requested capability already exists.
3. Reuse or modify existing automation where appropriate.
4. Do not create duplicate jobs or substantially duplicate workflows.

Do not change automation merely for cleanup unless authorized.

# C — EXECUTE, VERIFY, AND CREATE THE PR

## C1. Required Work Sequence

Use this sequence:

`INSPECT
   ↓
IDENTIFY
   ↓
UNDERSTAND
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
DOUBLE-CHECK
   ↓
REPORT
   ↓
CREATE PR`

When the Jules workflow requires an implementation plan or approval, present the plan before making changes and wait for the required approval.

Do not implement based on an unclear assumption.

## C2. Implement Only the Authorized Solution

During implementation:

- Follow the repository architecture.
- Follow applicable `.jules` instructions.
- Follow applicable `.jules/cmds/` instructions.
- Use relevant `.docs`.
- Reuse existing code and capabilities where practical.
- Keep the change focused.
- Do not silently expand the task.

For troubleshooting or repair work, fix the identified problem rather than stopping at an audit unless an audit is what was requested.

## C3. Scientific Debugging & Verification Protocol

When investigating a bug, failure, regression, unexpected behavior, or verification problem, use the repository's Scientific Debugging & Verification Protocol when applicable.

The protocol should be used to:

- establish observable facts;
- reproduce the problem when practical;
- isolate the actual failure;
- form and test hypotheses;
- identify the root cause;
- make the smallest authorized repair;
- verify that the repair addresses the original failure;
- check for relevant regressions.

Do not treat a plausible explanation as proof.

Do not declare a root cause without sufficient evidence.

Do not stop at symptom-level observations when the task requires a repair.

## C4. Playwright CLI and Testing

Use the repository's Playwright CLI/testing setup when browser-level verification is relevant to the task.

Use Playwright to verify actual user-facing behavior where appropriate, rather than relying only on source inspection or assumptions.

Tests must be targeted to the change.

Do not claim Playwright verification was performed unless the relevant Playwright test or browser verification was actually executed.

## C5. Local Action Verification

When workflow or GitHub Actions behavior needs local verification, use the repository's established `act`-based local Action verification tooling when appropriate.

This includes the repository's local verification helpers such as:

- `scripts/act/install-act.sh`
- `scripts/act/run-act.sh`
- `jules-verify.sh`

Local `act` execution is verification tooling. It does not authorize changes to production deployment, GitHub configuration, secrets, or protected systems.

Do not claim a GitHub Actions workflow was verified locally unless the relevant local verification was actually performed.

## C6. GitHub CLI

Use the repository's GitHub CLI (`gh`) workflow when GitHub repository, branch, issue, PR, workflow, or check information needs to be inspected or managed and the task authorizes that work.

Use actual GitHub state rather than relying on stale reports or assumptions.

When using GitHub CLI:

- inspect the relevant repository state before changing it;
- distinguish local state from GitHub state;
- verify commands that modify GitHub resources;
- never expose GitHub credentials or tokens;
- never claim GitHub state was inspected or changed unless the relevant operation was actually performed.

GitHub CLI is a repository workflow tool, not a substitute for inspecting the local repository.

## C7. Spec Kit

When the task uses Spec Kit:

- Follow the repository's existing Spec Kit process.
- Use the applicable `.jules/cmds/speckit.*.md` instructions.
- Use `.specify/` as the repository's established Spec Kit structure.
- Do not invent an alternative workflow.
- Do not bypass required specification or approval steps.

## C8. Testing and Verification

Run the appropriate tests and verification for the change.

Where available and applicable, use the repository's verification tooling, including:

`./jules-verify.sh`

Use Playwright for relevant browser/user-facing verification.

Use the Scientific Debugging & Verification Protocol for applicable troubleshooting and repair work.

Use local `act` verification for applicable GitHub Actions/workflow validation.

For workflow/CI validation, use the repository's established local simulation tooling when appropriate.

Never claim that a test, build, workflow, deployment, database check, browser verification, GitHub check, or other verification was performed unless it was actually performed.

## C9. Verify the Final State

Before reporting completion, inspect the actual resulting state.

Verify as applicable:

- changed files;
- `git diff`;
- `git status`;
- tests and results;
- Playwright results;
- build results;
- generated artifacts;
- workflows;
- documentation changes;
- `.docs/manifest.json` when documentation changes;
- branch/commit state;
- GitHub state;
- PR state.

A proposed change is not proof of completion.

A commit is not proof that the behavior works.

A successful-looking report is not proof of the repository's actual state.

## C10. Memory Bank Updates

When the completed work materially affects project context or progress:

- update `memory-bank/activeContext.md`;
- update `memory-bank/progress.md`.

Do not update Memory Bank files merely to create noise.

## C11. GitHub and PR Work

Before working on an existing PR or branch, inspect its actual state.

Check relevant:

- commits;
- changed files;
- comments;
- checks;
- current implementation;
- branch state.

Determine whether the requested work has already been completed before making another change.

When the authorized implementation is complete and verified:

- make the required commit/branch changes;
- create or update the PR as appropriate;
- stop this workflow at PR creation.

Do not invent or assume post-PR results.

## C12. Final Report

The completion report must distinguish facts from assumptions.

Report:

1. What changed.
2. Which files changed.
3. Documentation and repository instructions actually consulted.
4. Tools or MCPs actually invoked.
5. Tests and checks actually run.
6. Verification status.
7. Any limitations or unresolved issues.
8. Any necessary scope expansion and why it was required.
9. Memory Bank updates, when applicable.
10. Whether Context7 was used, and if so, the owner approval under which it was invoked.

Never report:

- planned work as completed;
- connected MCPs as used;
- available documentation as consulted;
- intended tests as run;
- expected deployment as actual deployment;
- assumed repository state as verified.

## C13. Final Jules Check

Before declaring the task complete, confirm:

`[ ] I identified the exact task.
[ ] I read the applicable repository instructions.
[ ] I checked the relevant Memory Bank files.
[ ] I used the applicable .jules instructions.
[ ] I used applicable .jules/cmds instructions.
[ ] I checked .docs and its manifest where relevant.
[ ] I respected the documentation updater and manifest system.
[ ] I inspected the actual repository state.
[ ] I used Spec Kit when the task required it.
[ ] I used the Scientific Debugging & Verification Protocol when applicable.
[ ] I used Playwright when applicable.
[ ] I used local act verification when applicable.
[ ] I used GitHub CLI when applicable and authorized.
[ ] I followed the existing Context7/MCP routing.
[ ] I obtained explicit owner approval before using Context7.
[ ] I used Neon or Stitch when materially necessary and applicable.
[ ] I did not fabricate tool usage, documentation, tests, or results.
[ ] I stayed within authorized scope.
[ ] I protected payments, auth, database, deployment, and secrets.
[ ] I verified the actual final state.
[ ] I updated Memory Bank files when materially required.
[ ] I accurately reported what actually happened.
[ ] I completed the authorized work through PR creation.`

:::
