# 🔴 AGENTS.md — MANDATORY GOVERNANCE

🔴 READ FIRST. FOLLOW COMPLETELY. DEMONSTRATE COMPLIANCE.
🔴 DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

AGENTS.md is the highest repository authority. Jules MUST read it before any
task work. Nothing may bypass or weaken it.
Jules may select exactly ONE applicable .docs task group; that choice never
allows a required instruction, source, system, command, library, or check to
be skipped, substituted, ranked, reinterpreted, or marked N/A.
When uncertain or conflicting: STOP → return here → verify the required path.
No task may be reported complete without demonstrated compliance.

---

# A — ANALYZE

## 1. Select exactly one .docs task group
Choose one: creation / troubleshooting / polishing / testing / security / audio /
deep-dive / seo.

For that group, Jules MUST:
- Read .jules/<task-group>.md.
- Read .docs/<task-group>/jules_google_docs.md.
- Read .docs/<task-group>/_google-gemini_gemini-cli.md.
- Read .docs/<task-group>/_websites_ai_google_dev_gemini-api.md.
- Check .docs/manifest.json.
- Use all available repository documents and libraries for that group.
- Verify relevant library names, versions, and repository locations.

Report the single selected group and specific reason in the PR Summary. Do not
skip, rank, or substitute material within the selected group.

## 2. Read Jules governance
After AGENTS.md, read .jules/jules.md and follow its initialization, working,
Memory Bank, and completion requirements.

## 3. Required repository systems
For every task, use and inspect the relevant content in:
- memory-bank/ and its required files
- CSS_FIX_GUIDE.md, DATABASE_SETUP.md, DEPLOYMENT_CHECKLIST.md,
  QUICK_FIX_GUIDE.md
- every .jules/*.md and .jules/cmds/*.md, including .jules/cmds/speckit.*.md
- .specify/
- .specify/workflows/speckit/workflow.yml
- .specify/memory/constitution.md
- .specify/integrations/speckit.manifest.json
- relevant source, configuration, tests, and dependencies
- all other guidance routed by this file

Do not silently skip, substitute, rank, reinterpret, or mark a listed
requirement N/A.

## 4. Spec Kit is mandatory for every Jules task
For every task—application, CI/CD, documentation, maintenance, or otherwise—
complete these stages in order:

1. /speckit.specify — .jules/cmds/speckit.specify.md
2. /speckit.plan — .jules/cmds/speckit.plan.md
3. /speckit.tasks — .jules/cmds/speckit.tasks.md
4. /speckit.implement — .jules/cmds/speckit.implement.md

The configured integration is generic; .specify/integration.json sets
commands_dir to .jules/cmds and invoke_separator to ".". These Markdown files
are agent command definitions, not shell executables.

- Use native dispatch when the current Jules interface supports it.
- Otherwise, follow each exact definition file's full procedure in order,
  including setup scripts, artifacts, checks, handoffs, and approval gates.
  Merely reading a file or writing a plan from memory is not execution.
- Never skip a stage because a task is small or categorized as CI/CD,
  documentation, troubleshooting, maintenance, or another type. Keep each
  task's artifacts concise and scoped to its actual work.
- Create or update the active feature's spec.md, plan.md, and tasks.md; implement
  the approved tasks; keep .specify/feature.json pointed to that feature.
- If a stage or required approval cannot proceed, STOP and report the exact
  blocker. Do not bypass the requirement.

In the PR Summary, report each stage's command, definition-file path, actual
method (NATIVE DISPATCH or FILE-DRIVEN PROCEDURAL EXECUTION), result, and exact
artifact paths. Never claim native dispatch unless it occurred.

Run ./jules-verify.sh before reporting completion. It must pass the Spec Kit
task-artifact gate; never skip or spoof it.

## 5. Context7
Context7 is not required. Use it only with explicit user permission or task
authorization; availability or usefulness is not authorization.

## 6. Verify before execution
Inspect the actual branch, task path, relevant files, configuration, code,
tests, dependencies, and history. Use the repository-routed .docs/<task-group>/
material; do not replace required material with generic or unverified external
sources. Classify findings as VERIFIED, ASSUMPTION, HYPOTHESIS, or UNKNOWN.

---

# B — BOUNDARIES + PLAN

Before modifying files, establish the requested outcome and scope, planned
files, required .jules and .docs material, libraries and versions, protected
systems, verification, and authorization requirements.

🔴 Make the smallest appropriate change and preserve behavior outside scope.
🔴 Do not refactor, redesign, upgrade dependencies, add unnecessary dependencies,
or change unrelated behavior or expand scope.
🔴 Protected changes require explicit authorization.
🔴 Present verified analysis and the plan before modification unless autonomous
execution is explicitly authorized.

---

# C — EXECUTE + VERIFY

## 1. Follow all routed governance
Follow every applicable .jules, .jules/cmds, .docs, manifest, .specify,
library, and verification requirement. Do not skip, substitute, rank, or mark
a routed requirement N/A.

## 2. PR Summary — mandatory canonical record
Complete the PR Summary before reporting the task complete. It is the canonical
record of governance, consultation, implementation, verification, and final Git
state. Report only work actually performed; never invent usage or results.

Include all of the following:

**Task group**
- SELECTED TASK GROUP: <one group>
- GROUP REASON: <specific reason>

**Every required library**
- LIBRARY: <name>
- VERSION: <version>
- USED: YES/NO
- USEFUL: YES/NO
- REASON: <specific reason>

**Every required routed Jules/Gemini document**
- DOCUMENT: <name>
- USED: YES/NO
- USEFUL: YES/NO
- REASON: <specific reason>

**Every required or task-relevant repository component**
- COMPONENT: <name>
- USED: YES/NO
- USEFUL: YES/NO
- REASON: <specific reason>

For all three reports, USED=YES means actually consulted or inspected.
USEFUL=YES means it materially contributed to analysis, implementation,
verification, or validation; state what it contributed. For USEFUL=NO, explain
why it did not contribute. Evaluate each item; do not use vague wording or N/A
to avoid a decision. Never claim unsupported usage or usefulness.

Also report:
- Implementation, scope compliance, protected-system changes, authorization,
  and remaining issues.
- Every changed file exactly once, by exact repository path; reconcile the list
  with the final Git diff. Do not omit changed files or list unchanged files.
- Every verification command with:
  COMMAND: <exact command>
  RESULT: PASS/FAIL
  EVIDENCE/OUTPUT SUMMARY: <actual result>
- USEFUL RESULT: YES/NO. YES is allowed only when the requested result was
  actually verified.
- Confirmation that the pre-submission double-check was completed.

Run all required checks; resolve in-scope failures or report unresolved ones.
Inspect the final diff and every changed file for unintended changes, files,
dependencies, secrets, scope drift, unauthorized protected changes, mismatch
with the plan/request, and items that remain unverifiable. Never claim a check
was run unless it was.

A missing or incomplete PR Summary is a governance failure. No complete summary
or demonstrated compliance = no task approval.

---

# 🔴 PROTECTED SYSTEMS

Explicit user authorization is required before changing:
- Stripe or payments
- Database or schema
- Authentication or security
- API routes or existing functionality
- Cloudflare, Vercel, or deployment
- Environment variables or secrets
- Accessibility or responsive behavior
- Approved visual or product behavior
- Documentation updater/refresh system
- AGENTS.md

Never expose or commit secrets. Never weaken validation, sanitization,
authentication, authorization, Turnstile/CAPTCHA, rate limiting, duplicate
protection, or environment handling.

---

# 🔴 BUILD SAFETY

495 MB is the hard maximum build size. Never exceed or bypass it. Measure and
report the actual size of every build.

If a build reaches or exceeds 495 MB: STOP; do not continue the build. Preserve
the safe state, report the measured size and exact safe resume point, and do
not claim completion.

---

# 🔴 EXECUTION RULES

- Use pnpm; never use npm ci.
- For visual work, use playwright and playwright-chromium via
  playwright.config.ts for browser-based visual verification.
- Inspect package.json before using or claiming package scripts.
- For audio work, follow .jules/audio.md. Howler.js (/goldfire/howler.js) is
  primary unless repository guidance says otherwise; consult
  .docs/polishing/_goldfire_howler_js.md when available.
- Do not introduce prohibited public MP3 assets.
- Preserve accessibility, keyboard behavior, responsive behavior, and
  prefers-reduced-motion.

---

# 🔴 FINAL GOVERNANCE AUDIT

Before reporting completion, confirm that:
- AGENTS.md was read first; exactly one .docs task group was selected and
  reported with its reason.
- All required routed documents, libraries, components, Memory Bank files,
  Jules governance, Spec Kit commands/files, and .docs/manifest.json were
  handled and truthfully reported.
- Every required Spec Kit stage and approval gate was followed; active artifacts
  are present; ./jules-verify.sh passed.
- Protected systems were not changed without authorization.
- pnpm was used, npm ci was not used, no secrets were exposed, and the 495 MB
  build limit was respected.
- Required checks and the final diff were inspected and accurately reported.
- The changed-file list reconciles exactly with the final diff; remaining issues
  are reported; USEFUL RESULT and the pre-submission double-check are present.

🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.
🔴 NO GOVERNANCE = NO TASK.
🔴 NO DEMONSTRATED COMPLIANCE = NO TASK APPROVAL.
