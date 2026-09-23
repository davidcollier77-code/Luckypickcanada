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

Jules MUST NOT skip, substitute, rank, reinterpret, or declare a required
document, library, workflow, command, source, system, or check irrelevant.

When uncertain, conflicting, or off-scope:

STOP → RETURN TO AGENTS.md → VERIFY THE GOVERNANCE PATH → CONTINUE ONLY
AS REQUIRED BY AGENTS.md.

NO TASK MAY PROCEED, BE APPROVED, BE FINALIZED, OR BE REPORTED COMPLETE
WITHOUT DEMONSTRATED COMPLIANCE WITH AGENTS.md AND ALL ROUTED REQUIREMENTS.

🔴 AGENTS.md GOVERNANCE IS MANDATORY.
🔴 NO GOVERNANCE = NO TASK.

---

# A — ANALYZE

## 🔴 1. READ AGENTS.md FIRST

Read this file before performing any other task analysis or implementation.

Follow it completely.

## 🔴 2. SELECT THE .docs TASK GROUP

Select EXACTLY ONE applicable task group:

- creation
- troubleshooting
- polishing
- testing
- security
- audio
- deep-dive
- seo

The selected group MUST be reported in the PR Summary.

For the selected group, Jules MUST:

- Read ".jules/<task-group>.md".
- Read ".docs/<task-group>/jules_google_docs.md".
- Read ".docs/<task-group>/_google-gemini_gemini-cli.md".
- Read ".docs/<task-group>/_websites_ai_google_dev_gemini-api.md".
- Check ".docs/manifest.json".
- Use ALL available documents and libraries checked into the repository
  for that group.
- Verify applicable library names, versions, and repository locations.

Jules MUST NOT select, rank, skip, or substitute documents or libraries
within the selected group.

## 🔴 3. READ JULES GOVERNANCE

After AGENTS.md, read:

".jules/jules.md"

Follow its initialization, working, memory-bank, and completion requirements.

## 🔴 4. REQUIRED REPOSITORY SYSTEMS

For EVERY task, Jules MUST use the following repository systems as required
by their applicability and routed governance:

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

No listed repository system may be silently skipped, substituted, ranked,
reinterpreted, or marked "N/A".

### CONTEXT7

Context7 is NOT a required repository system.

It may be used ONLY with explicit user permission or explicit task
authorization.

Its availability, presence, or usefulness does NOT constitute authorization.

## 🔴 5. VERIFY BEFORE EXECUTION

Inspect the actual repository, branch, task path, relevant files,
configuration, code, tests, dependencies, and history before modifying code.

Use the exact repository-routed ".docs/<task-group>/" material.

Do not substitute internet searches, generic documentation, or unverified
external material for required repository-routed guidance.

Classify findings as:

VERIFIED / ASSUMPTION / HYPOTHESIS / UNKNOWN

---

# B — BOUNDARIES + PLAN

Before modification, establish:

- exact requested outcome
- exact scope
- affected/planned files
- required ".jules" documents and commands
- required ".docs" documents and libraries
- library versions
- protected systems/files
- verification requirements
- authorization requirements

🔴 Make the smallest appropriate change.

🔴 Preserve behavior outside scope and repository architecture/conventions.

🔴 Do not refactor, redesign, upgrade dependencies, add unnecessary
dependencies, change unrelated behavior, or expand scope.

🔴 Protected changes require explicit authorization.

🔴 Present verified analysis and plan before modification unless autonomous
execution is explicitly authorized.

---

# C — EXECUTE + VERIFY

## 🔴 ROUTED GOVERNANCE

Follow EVERY requirement routed by AGENTS.md, including:

- ".jules/*.md"
- ".jules/cmds/*.md"
- ".docs/<task-group>/"
- ".docs/manifest.json"
- ".specify/"
- required libraries
- required verification
- all other explicitly routed requirements

No routed requirement may be skipped, substituted, ranked, or marked "N/A".

---

# 🔴 PR SUMMARY — MANDATORY CANONICAL RECORD

The PR Summary is the SINGLE CANONICAL RECORD of governance compliance,
task execution, consultation, verification, and final repository state.

Jules MUST complete the PR Summary before reporting the task complete.

## 🔴 1. SELECTED .docs TASK GROUP — REQUIRED

Jules MUST select EXACTLY ONE applicable ".docs" task group:

creation / troubleshooting / polishing / testing / security / audio /
deep-dive / seo

The PR Summary MUST report:

SELECTED TASK GROUP: <group>
GROUP REASON: <brief, specific reason>

The selected group MUST match the routing actually followed.

Jules MUST use ALL required documents and libraries routed by the selected
group.

Jules MUST NOT select multiple groups, skip required routed material,
substitute external material, or mark a required item "N/A".

## 🔴 2. LIBRARY CONSULTATION REPORT — REQUIRED

EVERY required library routed by the selected group MUST be reported.

For EACH library, report:

LIBRARY: <name>
VERSION: <version>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

USED: YES means the library was actually consulted.

USEFUL: YES means it materially contributed to analysis, implementation,
verification, or validation.

REASON is REQUIRED for every library.

USEFUL: YES MUST state what the library contributed.
USEFUL: NO MUST state why it did not contribute.

Jules MUST NOT claim usage or usefulness without actual evaluation.

## 🔴 3. ROUTED JULES/GEMINI DOCUMENT REPORT — REQUIRED

EVERY required routed Jules/Gemini document MUST be reported.

For EACH document, report:

DOCUMENT: <name>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

The same usage and usefulness rules apply.

## 🔴 4. REPOSITORY COMPONENT REPORT — REQUIRED

EVERY required or task-relevant repository component MUST be reported.

For EACH component, report:

COMPONENT: <name>
USED: YES/NO
USEFUL: YES/NO
REASON: <brief, specific reason>

USED: YES means the component was actually inspected or used.

USEFUL: YES means it materially contributed to analysis, implementation,
verification, or validation.

REASON is REQUIRED.

USEFUL: YES MUST state what it contributed.
USEFUL: NO MUST state why it did not contribute.

## 🔴 5. REPORTING INTEGRITY — MANDATORY

All PR Summary claims MUST describe work Jules actually performed.

Jules MUST NOT:

- invent consultation
- claim usage that did not occur
- claim usefulness without evaluation
- omit required libraries
- omit required routed documents
- omit required/relevant components
- replace YES/NO with vague wording
- use "N/A" to avoid a required determination
- make unsupported compliance claims

Every required consultation item MUST answer:

USED: YES/NO
USEFUL: YES/NO
REASON: WHY

## 🔴 6. IMPLEMENTATION AND AUTHORIZATION

Report:

- implementation performed
- protected-system changes
- authorization status
- scope compliance
- remaining issues

Unauthorized protected changes are a governance failure.

## 🔴 7. EXACT FINAL DIFF RECONCILIATION — REQUIRED

The PR Summary MUST list EVERY actual changed file using its EXACT repository
path.

Every changed file MUST appear exactly once.

No changed file may be omitted.
No unchanged file may be falsely listed.

The list MUST reconcile exactly with the final Git diff.

## 🔴 8. VERIFICATION — REQUIRED

Run every required verification check.

For EVERY verification command, report:

COMMAND: <exact command>
RESULT: PASS/FAIL
EVIDENCE/OUTPUT SUMMARY: <actual result>

Jules MUST NOT claim a verification command was run unless it was actually run.

Resolve in-scope failures or report them as unresolved.

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

The PR Summary MUST include:

USEFUL RESULT: YES/NO

USEFUL RESULT: YES may be reported ONLY when the requested result was
actually verified.

## 🔴 10. PRE-SUBMISSION DOUBLE-CHECK — REQUIRED

Before reporting completion, Jules MUST verify:

- requested outcome
- scope
- implementation
- governance compliance
- library/document/component reporting
- verification results
- final Git diff

The PR Summary MUST state that this double-check was completed.

## 🔴 NO REPORT = NO APPROVAL

The following are mandatory:

- selected task group and reason reported
- every required library reported
- every required routed document reported
- every required/relevant component reported
- USED: YES/NO provided
- USEFUL: YES/NO provided
- REASON provided
- exact changed files reconciled
- verification results reported
- USEFUL RESULT: YES/NO provided

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

Never weaken:

- validation
- sanitization
- authentication
- authorization
- Turnstile/CAPTCHA
- rate limiting
- duplicate protection
- environment handling

---

# 🔴 BUILD SAFETY

495 MB is the HARD MAXIMUM BUILD LIMIT.

NEVER exceed or bypass it.

Every build MUST be measured and the actual size MUST be reported.

If a build reaches or exceeds 495 MB:

STOP.

Do not continue the build.

Preserve the safe state.

Report the measured size and the exact point where work can safely resume.

Do not claim completion.

---

# 🔴 EXECUTION RULES

- Use "pnpm".
- NEVER use "npm ci".
- Inspect "package.json" before using or claiming package scripts.
- Audio tasks follow ".jules/audio.md"; Howler is primary unless repository
  guidance says otherwise.
- Do not introduce prohibited public MP3 assets.
- Preserve accessibility.
- Preserve keyboard behavior.
- Preserve responsive behavior.
- Preserve "prefers-reduced-motion".

---

# 🔴 FINAL GOVERNANCE AUDIT

Before reporting completion, Jules MUST verify:

- AGENTS.md was read FIRST.
- Governance was followed completely.
- EXACTLY ONE ".docs/<task-group>/" was selected and reported.
- The selected task group reason was reported.
- Every required routed document was consulted and reported.
- Every required library was consulted and reported.
- Every required library has VERSION, USED, USEFUL, and REASON in the PR Summary.
- Every required Jules/Gemini document has USED, USEFUL, and REASON in the PR Summary.
- Every required/relevant repository component has USED, USEFUL, and REASON in the PR Summary.
- No unsupported USED or USEFUL claim was made.
- ".jules/jules.md" was followed.
- ".docs/manifest.json" was checked.
- Required ".jules/cmds/speckit.*.md" files were handled.
- ".specify/" requirements were handled.
- Required Memory Bank work was completed.
- Protected systems were not changed without authorization.
- "pnpm" was used and "npm ci" was not used.
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
