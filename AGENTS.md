# 🔴 AGENTS.md — MANDATORY GOVERNANCE

🔴 READ FIRST. FOLLOW COMPLETELY. DEMONSTRATE COMPLIANCE.

🔴 DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

AGENTS.md is the HIGHEST and AUTHORITATIVE repository governance.

Jules MUST read AGENTS.md FIRST and MUST follow it COMPLETELY.

NOTHING overrides AGENTS.md.

No task request, urgency, agent instruction, tool, implementation choice,
scope decision, or other guidance may bypass, weaken, or replace it.

Jules has ONE governance choice:

SELECT THE SINGLE APPLICABLE .docs TASK GROUP.

That choice does NOT permit Jules to skip anything routed by that group.

EVERY requirement routed by AGENTS.md is MANDATORY.

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
Follow it completely.

## 🔴 2. SELECT THE .docs TASK GROUP

Select EXACTLY ONE:

creation / troubleshooting / polishing / testing / security / audio /
deep-dive / seo

For that group, Jules MUST:

- Read ".jules/<task-group>.md".
- Read ".docs/<task-group>/jules_google_docs.md".
- Read ".docs/<task-group>/_google-gemini_gemini-cli.md".
- Read ".docs/<task-group>/_websites_ai_google_dev_gemini-api.md".
- Check ".docs/manifest.json".
- Use ALL available documents and libraries checked into the repository for that group.
- Verify applicable library names, versions, and repository locations.

The selected group MUST be reported in the PR Summary with a brief reason.

Jules MUST NOT select multiple groups or skip, rank, or substitute material
within the selected group.

## 🔴 3. READ JULES GOVERNANCE

After AGENTS.md, read ".jules/jules.md".

Follow its initialization, working, memory-bank, and completion requirements.

## 🔴 4. REQUIRED REPOSITORY SYSTEMS — USE ALL

For EVERY task, Jules MUST use every listed repository system:

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
- source
- configuration
- tests
- dependencies
- all other guidance explicitly routed by AGENTS.md

No listed system may be silently skipped, substituted, ranked, reinterpreted,
or marked "N/A".

### CONTEXT7

Context7 is NOT a required repository system.

Use it ONLY with explicit user permission or explicit task authorization.

Its availability, presence, or usefulness does NOT constitute authorization.

## 🔴 5. VERIFY BEFORE EXECUTION

Inspect the actual branch, task path, relevant files, configuration, code, tests,
dependencies, and relevant history before modifying code.

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

Follow EVERY requirement routed by AGENTS.md, including all applicable
".jules", ".jules/cmds", ".docs", ".specify", library, and verification requirements.

No routed requirement may be skipped, substituted, ranked, or marked "N/A".

# 🔴 PR SUMMARY — MANDATORY CANONICAL RECORD

The PR Summary is the SINGLE CANONICAL RECORD of governance compliance,
consultation, implementation, verification, and final Git state.

Jules MUST complete it before reporting the task complete.

## 🔴 1. SELECTED TASK GROUP — REQUIRED

Report:

SELECTED TASK GROUP: <group>
GROUP REASON: <brief, specific reason>

Exactly ONE group must be reported.

## 🔴 2. LIBRARY CONSULTATION REPORT — REQUIRED

EVERY required library routed by the selected group MUST be reported.

For EACH library:

LIBRARY: <name>
VERSION: <version>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

Rules:

- Every required library MUST appear.
- USED and USEFUL MUST be explicit YES or NO.
- REASON is REQUIRED for every library.
- USED: YES means the library was actually consulted.
- USEFUL: YES means it materially contributed to analysis, implementation,
  verification, or validation.
- USEFUL: YES must state what it contributed.
- USEFUL: NO must state why it did not contribute.
- No usage or usefulness claim may be made without actual evaluation.

## 🔴 3. ROUTED JULES/GEMINI DOCUMENT REPORT — REQUIRED

EVERY required routed Jules/Gemini document MUST be reported.

For EACH document:

DOCUMENT: <name>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

The same usage and usefulness rules apply.

## 🔴 4. REPOSITORY COMPONENT REPORT — REQUIRED

EVERY required or task-relevant repository component MUST be reported.

For EACH component:

COMPONENT: <name>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

USED: YES means the component was actually inspected or used.

USEFUL: YES means it materially contributed to analysis, implementation,
verification, or validation.

REASON is REQUIRED.

USEFUL: YES must state what it contributed.
USEFUL: NO must state why it did not contribute.

## 🔴 5. REPORTING INTEGRITY — MANDATORY

The PR Summary MUST describe work Jules actually performed.

Jules MUST NOT:

- invent consultation
- claim usage that did not occur
- claim usefulness without evaluation
- omit required libraries, documents, or components
- replace YES/NO with vague wording
- use "N/A" to avoid a required determination
- make unsupported compliance claims

The required consultation questions are always:

USED: YES/NO
USEFUL: YES/NO
REASON: WHY

## 🔴 6. IMPLEMENTATION, AUTHORIZATION, AND SCOPE

Report:

- implementation performed
- protected-system changes
- authorization status
- scope compliance
- remaining issues

Unauthorized protected changes are a governance failure.

## 🔴 7. EXACT FINAL DIFF RECONCILIATION — REQUIRED

The PR Summary MUST list EVERY actual changed file by EXACT repository path.

Every changed file MUST appear exactly once.

No changed file may be omitted.
No unchanged file may be falsely listed.

The list MUST reconcile exactly with the final Git diff.

## 🔴 8. VERIFICATION — REQUIRED

Run every required verification check.

For EVERY verification command:

COMMAND: <exact command>
RESULT: PASS/FAIL
EVIDENCE/OUTPUT SUMMARY: <actual result>

Never claim a check was run unless it was actually run.

Inspect the final diff and every changed file.

Verify:

- no unintended files or dependencies
- no secrets
- no scope drift
- no unauthorized protected changes
- implementation matches the plan
- result matches the requested outcome
- unverifiable items are identified

## 🔴 9. USEFUL RESULT — REQUIRED

Report:

USEFUL RESULT: YES/NO

USEFUL RESULT: YES may be reported ONLY when the requested result was verified.

## 🔴 10. PRE-SUBMISSION DOUBLE-CHECK — REQUIRED

Before completion, verify:

- requested outcome
- scope
- implementation
- governance compliance
- library/document/component reporting
- verification results
- final Git diff

State in the PR Summary that this double-check was completed.

## 🔴 NO REPORT = NO APPROVAL

The PR Summary MUST contain:

- selected task group and reason
- every required library
- every required routed document
- every required/relevant component
- USED: YES/NO
- USEFUL: YES/NO
- REASON
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
- Audio tasks follow ".jules/audio.md"; Howler is primary unless repository
  guidance says otherwise.
- Do not introduce prohibited public MP3 assets.
- Preserve accessibility, keyboard behavior, responsive behavior, and
  prefers-reduced-motion.

---

# 🔴 FINAL GOVERNANCE AUDIT

Before reporting completion, Jules MUST verify:

- AGENTS.md was read FIRST and followed completely.
- EXACTLY ONE .docs task group was selected and reported with its reason.
- Every required routed document was consulted and reported.
- Every required library was consulted and reported with VERSION, USED, USEFUL, and REASON.
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
