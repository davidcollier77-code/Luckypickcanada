# 🔴 AGENTS.md — MANDATORY GOVERNANCE

🔴 READ FIRST. FOLLOW COMPLETELY. DEMONSTRATE COMPLIANCE.
🔴 DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

AGENTS.md is the HIGHEST and AUTHORITATIVE repository governance.
Jules MUST read it FIRST and follow it COMPLETELY.

NOTHING overrides AGENTS.md. No request, urgency, agent instruction, tool,
implementation choice, scope decision, or other guidance may bypass or weaken it.

Jules has ONE governance choice:
SELECT THE SINGLE APPLICABLE .docs TASK GROUP.

That choice does NOT permit Jules to skip any routed requirement.

Jules MUST NOT skip, substitute, rank, reinterpret, or declare required
documents, libraries, workflows, commands, sources, systems, or checks irrelevant.

When uncertain, conflicting, or off-scope:
STOP → RETURN TO AGENTS.md → VERIFY THE GOVERNANCE PATH → CONTINUE ONLY
AS REQUIRED BY AGENTS.md.

NO TASK MAY PROCEED, BE APPROVED, BE FINALIZED, OR BE REPORTED COMPLETE
WITHOUT DEMONSTRATED COMPLIANCE.

🔴 AGENTS.md GOVERNANCE IS MANDATORY.
🔴 NO GOVERNANCE = NO TASK.

---

# A — ANALYZE

## 🔴 1. READ AGENTS.md FIRST

Read this file before any other task analysis or implementation.

## 🔴 2. SELECT THE .docs TASK GROUP

Select EXACTLY ONE:
creation / troubleshooting / polishing / testing / security / audio /
deep-dive / seo

For the selected group, Jules MUST:

- Read ".jules/<task-group>.md".
- Read ".docs/<task-group>/jules_google_docs.md".
- Read ".docs/<task-group>/_google-gemini_gemini-cli.md".
- Read ".docs/<task-group>/_websites_ai_google_dev_gemini-api.md".
- Check ".docs/manifest.json".
- Use ALL available documents and libraries checked into the repository for that group.
- Verify applicable library names, versions, and repository locations.

The selected group and reason MUST be reported in the PR Summary.

Jules MUST NOT select multiple groups or skip, rank, or substitute material
within the selected group.

## 🔴 3. READ JULES GOVERNANCE

After AGENTS.md, read ".jules/jules.md" and follow its initialization,
working, memory-bank, and completion requirements.

## 🔴 4. REQUIRED REPOSITORY SYSTEMS — USE ALL

For EVERY task, Jules MUST use:

- "memory-bank/" and required files
- "CSS_FIX_GUIDE.md"
- "DATABASE_SETUP.md"
- "DEPLOYMENT_CHECKLIST.md"
- "QUICK_FIX_GUIDE.md"
- every ".jules/*.md"
- every ".jules/cmds/*.md"
- every ".jules/cmds/speckit.*.md"
- ".specify/"
- ".specify/workflows/speckit/workflow.yml"
- ".specify/memory/constitution.md"
- ".specify/integrations/speckit.manifest.json"
- source, configuration, tests, dependencies
- all other guidance explicitly routed by AGENTS.md

No listed system may be silently skipped, substituted, ranked, reinterpreted,
or marked "N/A".

### CONTEXT7

Context7 is NOT a required repository system.
Use it ONLY with explicit user permission or explicit task authorization.
Its availability, presence, or usefulness does NOT constitute authorization.

## 🔴 5. VERIFY BEFORE EXECUTION

Inspect the actual branch, task path, relevant files, configuration, code, tests,
dependencies, and relevant history.

Use the exact repository-routed ".docs/<task-group>/" material.

Do not substitute internet searches, generic documentation, or unverified
external material for required repository-routed guidance.

Classify findings:
VERIFIED / ASSUMPTION / HYPOTHESIS / UNKNOWN

---

# B — BOUNDARIES + PLAN

Before modification, establish:

- exact requested outcome and scope
- affected/planned files
- required ".jules" documents and commands
- required ".docs" documents and libraries
- library versions
- protected systems/files
- verification requirements
- authorization requirements

🔴 Make the smallest appropriate change.
🔴 Preserve behavior outside scope and repository conventions.
🔴 Do not refactor, redesign, upgrade dependencies, add unnecessary dependencies,
change unrelated behavior, or expand scope.
🔴 Protected changes require explicit authorization.
🔴 Present verified analysis and plan before modification unless autonomous
execution is explicitly authorized.

---

# C — EXECUTE + VERIFY

## 🔴 ROUTED GOVERNANCE

Follow EVERY requirement routed by AGENTS.md, including ".jules", ".jules/cmds",
".docs", ".docs/manifest.json", ".specify", required libraries, and verification.

No routed requirement may be skipped, substituted, ranked, or marked "N/A".

# 🔴 PR SUMMARY — MANDATORY CANONICAL RECORD

The PR Summary is the SINGLE CANONICAL RECORD of governance compliance,
consultation, implementation, verification, and final Git state.

Jules MUST complete it before reporting the task complete.

## 1. SELECTED TASK GROUP — REQUIRED

Report:
SELECTED TASK GROUP: <group>
GROUP REASON: <brief, specific reason>

Exactly ONE group MUST be reported and MUST match the routing actually followed.

## 2. LIBRARY CONSULTATION REPORT — REQUIRED

Report EVERY required library from the selected group:

LIBRARY: <name>
VERSION: <version>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

USED: YES = actually consulted.
USEFUL: YES = materially contributed to analysis, implementation, verification,
or validation.
REASON is REQUIRED for every library.
USEFUL: YES MUST state what it contributed.
USEFUL: NO MUST state why it did not contribute.

No usage or usefulness claim may be made without actual evaluation.

## 3. ROUTED JULES/GEMINI DOCUMENT REPORT — REQUIRED

Report EVERY required routed Jules/Gemini document:

DOCUMENT: <name>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

The same usage and usefulness rules apply.

## 4. REPOSITORY COMPONENT REPORT — REQUIRED

Report EVERY required or task-relevant repository component:

COMPONENT: <name>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

USED: YES = actually inspected or used.
USEFUL: YES = materially contributed to analysis, implementation, verification,
or validation.
REASON is REQUIRED.
USEFUL: YES MUST state what it contributed.
USEFUL: NO MUST state why it did not contribute.

## 5. REPORTING INTEGRITY — MANDATORY

The PR Summary MUST describe work Jules actually performed.

Jules MUST NOT invent consultation, claim unused material was used, claim
usefulness without evaluation, omit required items, replace YES/NO with vague
wording, use "N/A" to avoid a determination, or make unsupported compliance claims.

Every required consultation item MUST answer:
USED: YES/NO
USEFUL: YES/NO
REASON: WHY

## 6. IMPLEMENTATION, AUTHORIZATION, AND SCOPE

Report implementation performed, protected-system changes, authorization status,
scope compliance, and remaining issues.

Unauthorized protected changes are a governance failure.

## 7. EXACT FINAL DIFF RECONCILIATION — REQUIRED

List EVERY actual changed file by EXACT repository path.

Every changed file MUST appear exactly once.
No changed file may be omitted.
No unchanged file may be falsely listed.
The list MUST reconcile exactly with the final Git diff.

## 8. VERIFICATION — REQUIRED

Run every required verification check.
Resolve in-scope failures; report unresolved failures.

For EVERY verification command, report:
COMMAND: <exact command>
RESULT: PASS/FAIL
EVIDENCE/OUTPUT SUMMARY: <actual result>

Never claim a check was run unless it was actually run.

Inspect the final diff and every changed file. Verify no unintended files or
dependencies, no secrets, no scope drift, no unauthorized protected changes,
implementation matches the plan, result matches the request, and unverifiable
items are identified.

## 9. USEFUL RESULT — REQUIRED

Report:
USEFUL RESULT: YES/NO

USEFUL RESULT: YES ONLY when the requested result was actually verified.

## 10. PRE-SUBMISSION DOUBLE-CHECK — REQUIRED

Before completion, verify the requested outcome, scope, implementation,
governance compliance, consultation reporting, verification results, and final
Git diff.

The PR Summary MUST state that this double-check was completed.

## 🔴 NO REPORT = NO APPROVAL

The PR Summary MUST contain:
- selected task group and reason
- every required library with VERSION, USED, USEFUL, REASON
- every required routed document with USED, USEFUL, REASON
- every required/relevant component with USED, USEFUL, REASON
- exact changed-file reconciliation
- verification results
- USEFUL RESULT: YES/NO
- completed pre-submission double-check

Failure to provide the required PR Summary is a GOVERNANCE FAILURE.

🔴 NO COMPLETE PR SUMMARY = NO TASK APPROVAL.
🔴 NO LIBRARY USAGE/USEFULNESS REPORT = NO TASK APPROVAL.
🔴 NO COMPONENT USAGE/USEFULNESS REPORT = NO TASK APPROVAL.
🔴 NO DEMONSTRATED GOVERNANCE = NO TASK APPROVAL.

---

# 🔴 PROTECTED SYSTEMS

Explicit authorization is required before changing:
- Stripe/payment
- database/schema
- authentication/security
- API routes/existing functionality
- Cloudflare/Vercel/deployment
- environment variables/secrets
- accessibility/responsive behavior
- approved visual/product behavior
- documentation updater/refresh system
- AGENTS.md

Never expose or commit secrets.

Never weaken validation, sanitization, authentication, authorization,
Turnstile/CAPTCHA, rate limiting, duplicate protection, or environment handling.

---

# 🔴 BUILD SAFETY

495 MB is the HARD MAXIMUM BUILD LIMIT.
NEVER exceed or bypass it.

Every build MUST be measured and its actual size MUST be reported.

If a build reaches or exceeds 495 MB:
STOP.
Do not continue the build.
Preserve the safe state.
Report the measured size and the exact point where work can safely resume.
Do not claim completion.

---

# 🔴 EXECUTION RULES

- Use pnpm. NEVER use "npm ci".
- Inspect "package.json" before using or claiming package scripts.
- Audio tasks follow ".jules/audio.md"; Howler.js ("/goldfire/howler.js") is primary unless repository
  guidance says otherwise. Consult ".docs/polishing/_goldfire_howler_js.md" when available.
- Do not introduce prohibited public MP3 assets.
- Preserve accessibility, keyboard behavior, responsive behavior, and
  prefers-reduced-motion.

---

# 🔴 FINAL GOVERNANCE AUDIT

Before reporting completion, Jules MUST verify:

- AGENTS.md was read FIRST and followed completely.
- EXACTLY ONE .docs task group was selected and reported with its reason.
- Every required routed document was consulted and reported.
- Every required library was consulted and reported with VERSION, USED, USEFUL,
  and REASON.
- Every required/relevant component was reported with USED, USEFUL, and REASON.
- No unsupported usage or usefulness claim was made.
- ".jules/jules.md" was followed.
- ".docs/manifest.json" was checked.
- Required ".jules/cmds/speckit.*.md" files were handled.
- ".specify/" and required Spec Kit files were handled.
- Required Memory Bank work was completed.
- Protected systems were not changed without authorization.
- pnpm was used and npm ci was not used.
- No secrets were exposed or committed.
- The 495 MB build limit was respected.
- Required verification was actually performed and documented.
- Final diff was inspected.
- PR Summary changed-file list exactly matches the final Git diff.
- Remaining issues are reported.
- The pre-submission double-check was completed.
- USEFUL RESULT: YES/NO is present.
- All PR Summary statements match the actual work.

🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.
🔴 AGENTS.md GOVERNANCE IS MANDATORY.
🔴 NO GOVERNANCE = NO TASK.
🔴 NO DEMONSTRATED COMPLIANCE = NO TASK APPROVAL.
