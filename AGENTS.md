# 🔴 AGENTS.md — Mandatory Governance

🔴 READ FIRST. Verify; never assume, guess, or claim without evidence.

## 1. Initialization and routing
This file is the repository's canonical governance and routing authority. Read it before task work. Then read `.jules/jules.md`, `memory-bank/projectBrief.md`, and `memory-bank/activeContext.md`. Select the task group or groups that apply: creation, troubleshooting, polishing, testing, security, audio, deep-dive, or seo. Read each selected `.jules/<group>.md`, plus any other specialist explicitly required by a documented dependency or route. Follow applicable `.jules/cmds/` definitions.

## 2. Mandatory documentation and library selection
For EVERY task, consult all four mandatory resources:
- Jules Documentation: `jules.google/docs`
- Jules API: `developers.google.com/jules/api`
- Gemini CLI: `/google-gemini/gemini-cli`
- Gemini API: `/websites/ai_google_dev_gemini-api`

Read the required local snapshots for each selected group:
- `.docs/<group>/jules_google_docs.md`
- `.docs/<group>/_google-gemini_gemini-cli.md`
- `.docs/<group>/_websites_ai_google_dev_gemini-api.md`

Check `.docs/manifest.json`. It is an inventory and routing aid—not a command to consult every source. Choose task-relevant libraries from the selected group or groups' registered sources, and follow any source-specific requirements in its specialist instructions. Do not skip a relevant required source or consult unrelated sources merely because they are listed. `.docs/` is READ-ONLY. Context7 requires explicit owner approval before EVERY invocation; mandatory documentation does not itself authorize Context7. Other MCPs require approval unless already explicitly authorized.

## 3. Spec Kit is mandatory
Every task, regardless of size or type, MUST complete these stages in order using the matching definitions:
1. `/speckit.specify` — `.jules/cmds/speckit.specify.md`
2. `/speckit.plan` — `.jules/cmds/speckit.plan.md`
3. `/speckit.tasks` — `.jules/cmds/speckit.tasks.md`
4. `/speckit.implement` — `.jules/cmds/speckit.implement.md`

Use native dispatch when available; otherwise follow each definition's full procedure. Reading a definition or drafting from memory is not execution. Maintain the active feature's `spec.md`, `plan.md`, and `tasks.md`. If a stage or approval is blocked, STOP and report the exact blocker. Run `./jules-verify.sh`; do not bypass its gates.

## 4. Scope and safety
Inspect actual files, configuration, dependencies, tests, and repository state before acting. Establish scope, plan, resources, verification, and authorization before modifying files unless autonomous execution was explicitly authorized. Make the smallest appropriate change; preserve unrelated behavior. Explicit user authorization is required for changes to payments, databases/schema, authentication/security, APIs or existing functionality, deployment, secrets/environment, accessibility/responsive behavior, approved visuals/product behavior, documentation refresh systems, or this file. Never expose secrets or weaken safeguards. Use pnpm, never `npm ci`. Measure every build; 495 MB is the hard maximum. At or above 495 MB, stop and report the safe resume point.

## 5. Verification and reporting
Test relevant changes; use configured Playwright verification for visual work. Inspect the final diff and every changed file. The PR Summary must truthfully report the selected group and reason; consulted resources/libraries (including version, USED, USEFUL, and specific reason); relevant components; exact changed-file paths; each verification command, result, and evidence; scope and authorization; remaining issues; `USEFUL RESULT: YES/NO`; and the pre-submission double-check. USED=YES means actually consulted or inspected; USEFUL=YES requires a concrete contribution. Never invent results. Update `memory-bank/activeContext.md` and `memory-bank/progress.md` as required. No demonstrated governance or complete PR Summary = no task approval.
