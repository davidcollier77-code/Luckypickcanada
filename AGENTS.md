🔴 AGENTS.md — MANDATORY GOVERNANCE

🔴 READ FIRST → FOLLOW COMPLETELY → VERIFY.

🔴 AGENTS.md is the authoritative repository governance.

🔴 No urgency, scope, implementation constraint, tool, agent, or other instruction overrides AGENTS.md governance.
🔴 AGENTS.md is mandatory. Jules does not choose which mandatory requirements to follow.
🔴 The only discretionary choices are the .docs task group and the required libraries from that group's documented inventory.

🔴 No task may proceed, be approved, finalized, or reported complete unless
AGENTS.md and all required routed requirements are followed and demonstrated.

🔴 DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

A — ANALYZE

🔴 1. Read AGENTS.md FIRST. Follow it completely.

🔴 2. SELECT THE .docs LIBRARY TASK GROUP.
Jules selects the single task group required for the task's .docs routing:
creation, troubleshooting, polishing, testing, security, audio, deep-dive, or seo.
This is the only governance selection Jules makes.

For the selected group, Jules MUST:

- Read ".jules/<task-group>.md".
- Read ".docs/<task-group>/jules_google_docs.md".
- Read ".docs/<task-group>/_google-gemini_gemini-cli.md".
- Read ".docs/<task-group>/_websites_ai_google_dev_gemini-api.md".
- Check ".docs/manifest.json".
- Use the required documents and libraries in that group's documented inventory.
- Record group, library, version, and exact ".docs" path.

🔴 Do not select, rank, or skip documents or libraries within the selected group.
Use ALL required routed guidance in that group.

🔴 3. Read ".jules/jules.md" after AGENTS.md and follow its initialization,
working, Memory Bank, and completion requirements.

🔴 4. REQUIRED REPOSITORY SYSTEMS — USE ALL.
For EVERY task, Jules MUST use every listed repository system and report:
memory-bank files; CSS_FIX_GUIDE.md; DATABASE_SETUP.md; DEPLOYMENT_CHECKLIST.md;
QUICK_FIX_GUIDE.md; all ".jules/*.md"; all ".jules/cmds/*.md"; Spec Kit; runbooks;
source; configuration; tests; dependencies; and other routed guidance.
No Jules decision is permitted to skip, rank, or mark a listed system N/A.
Every listed system must be reported with USED: YES/NO, USEFUL: YES/NO,
WHAT WAS USEFUL, EVIDENCE, and REASON.

🔴 5. Jules MUST consult and use every ".jules/cmds/*.md" workflow and
Spec Kit workflow on every task. Report USED and USEFUL with evidence for each.
If execution is blocked or fails, report USED: NO with exact evidence and reason;
this is a verification failure, not permission to skip the workflow.
Usefulness is assessed only after use.

🔴 6. CONSULT AND USE ALL LISTED OFFICIAL JULES/GEMINI SOURCES.
Every listed source is mandatory. Jules MUST consult and use every listed source and report the result.
- https://jules.google/docs
- https://jules.google/docs/cli/reference
- https://jules.google/docs/api/reference/
- google-gemini/gemini-cli
- https://ai.google.dev/gemini-api/docs
- https://ai.google.dev/api

🔴 7. Inspect the actual branch, task path, files, configuration, code, tests,
dependencies, and relevant history before execution.

🔴 8. Classify findings:
VERIFIED / ASSUMPTION / HYPOTHESIS / UNKNOWN.

B — BOUNDARIES + PLAN

🔴 Before modification, establish:

- exact requested outcome and scope
- affected and planned files
- required ".jules/*.md" and ".jules/cmds/*.md"
- required ".docs" documents and libraries from the selected task group
- library versions and paths
- protected systems/files
- verification requirements
- authorization requirements

🔴 Make the smallest appropriate change.

🔴 Preserve behavior outside scope and repository architecture/conventions.

🔴 Do not refactor, redesign, upgrade dependencies, add unnecessary dependencies,
change unrelated behavior, or expand scope.

🔴 Protected changes require explicit authorization.

🔴 Present verified analysis and plan before modification unless autonomous
execution is explicitly authorized.

C — EXECUTE + VERIFY

🔴 ROUTED GOVERNANCE

Follow every required ".jules/*.md", ".jules/cmds/*.md", ".docs" requirement,
repository runbook, library requirement, and verification requirement.

🔴 DOCUMENTATION + LIBRARY CONSULTATION REPORTING

For EVERY required document, library, official source, or repository component
listed by this governance, report:

USED: YES/NO
USEFUL: YES/NO
WHAT WAS USEFUL: <brief concrete value when useful>
EVIDENCE: <specific, auditable consultation/use evidence>
REASON: <brief reason for failed/non-use, or for USEFUL: NO>

🔴 FINAL PR REPORT = CANONICAL GOVERNANCE AUDIT RECORD

The FINAL / PR REPORT is the canonical consolidated record of governance,
consultation, implementation, and verification for the task.

Intermediate run logs, tool traces, plan messages, MCP connection messages,
and agent progress comments are supporting evidence only. They do not replace
the required final PR report.

Before reporting completion, Jules MUST gather the required governance evidence
from the run into the FINAL / PR REPORT. A fact that exists only in an
intermediate log or comment is not sufficient final-report evidence.

🔴 USED: YES requires actual consultation or use AND a corresponding EVIDENCE
entry in the FINAL / PR REPORT.

🔴 USEFUL: YES requires an actual contribution to analysis, planning, execution,
verification, or the final result AND a concrete WHAT WAS USEFUL entry.

🔴 Never silently omit an identified item.

🔴 If not useful for the task, report USEFUL: NO and why.

🔴 If used, confirm USED: YES and provide EVIDENCE.

🔴 If useful, state specifically WHAT WAS USEFUL and how it contributed.

🔴 Jules/Gemini documents and official sources are reported individually with:
DOCUMENT, PATH/SOURCE, USED, USEFUL, WHAT WAS USEFUL, EVIDENCE, REASON.

🔴 Libraries are reported individually for the selected task group:
TASK GROUP, LIBRARY, VERSION, DOCUMENTATION PATH, USED, USEFUL, WHAT WAS USEFUL,
EVIDENCE, REASON.

🔴 Libraries must come from that group's documented inventory.

🔴 No required repository component may be silently omitted.

🔴 MCP GOVERNANCE

🔴 Jules may use available MCP tools as needed.

🔴 Context7 requires explicit repository-owner permission BEFORE EVERY INVOCATION.

🔴 PROTECTED SYSTEMS

Explicit authorization is required before changing:
Stripe/payment; database/schema; authentication/security; API routes/existing
functionality; Cloudflare/Vercel/deployment; environment variables/secrets;
accessibility/responsive behavior; approved visual/product behavior;
documentation updater/refresh system; AGENTS.md.

🔴 Never expose or commit secrets.

🔴 Never weaken validation, sanitization, authentication, authorization,
Turnstile/CAPTCHA, rate limiting, duplicate protection, or environment handling.

🔴 BUILD SAFETY

Jules safety ceiling: 495 MB.
The 495 MB ceiling is a hard safety limit. Do not bypass or raise it.

Normal case:
Verify the output is within the 495 MB safety ceiling and report that it is within the limit.
Routine reports do not require an exact MB measurement.

If output reaches or would exceed 495 MB:
STOP.
Do not continue past the ceiling.
Preserve safe/resumable work.
Update Memory Bank as required.
Report completed work, remaining work, measured size, and continuation point.
Do not claim full completion.

🔴 If the ceiling is triggered or would be exceeded, report:
Verified size: <actual measured size>
Within 495 MB ceiling: NO
Cap triggered: YES

🔴 EXECUTION

- Use pnpm. Never use "npm ci".
- Inspect package.json before using or claiming package scripts.
- Audio tasks follow ".jules/audio.md"; Howler is primary unless repository
  guidance says otherwise.
- Do not introduce prohibited public MP3 assets.
- Preserve accessibility, keyboard behavior, responsive behavior, and
  prefers-reduced-motion.

🔴 VERIFICATION

Run every required verification check.

Never claim a check was run if it was not run.

Resolve in-scope failures; report unresolved failures.

Inspect the final diff and every changed file.

🔴 The FINAL / PR REPORT must reconcile exactly to the final Git diff:
every changed file must be listed exactly once, no changed file may be omitted,
and no file may be listed as changed if it is not in the final diff.

🔴 For each verification command, report:
COMMAND, RESULT, and EVIDENCE/OUTPUT SUMMARY.

Verify:

- no unintended files or dependencies
- no secrets
- no scope drift
- no unauthorized protected changes
- implementation matches plan
- result matches requested outcome
- unverifiable items are identified

🔴 PRE-SUBMISSION DOUBLE-CHECK
Before submitting or finalizing the PR, Jules MUST double-check the completed work against the requested outcome, scope, implementation, and final diff.
Jules MUST explicitly confirm in the FINAL / PR REPORT that this pre-submission double-check was completed.

FINAL / PR REPORT

🔴 Report:

- VERIFIED / ASSUMPTION / HYPOTHESIS / UNKNOWN findings
- the selected .docs task group
- every required ".jules/*.md"
- every required ".jules/cmds/*.md"
- USED / USEFUL / WHAT WAS USEFUL / EVIDENCE / REASON
- exact required repository components and status
- requested outcome and scope
- protected systems and authorization status
- exact changed files reconciled against the final Git diff
- implementation performed
- verification actually run, results, and evidence/output summary
- final diff inspection
- build size status
- remaining issues
- final repository state

🔴 Include a clearly labeled:
LIBRARY CONSULTATION REPORT

For every library document in the selected task group's documented inventory, include:
TASK GROUP
LIBRARY
VERSION
EXACT ".docs" DOCUMENTATION PATH
USED
USEFUL
WHAT WAS USEFUL
EVIDENCE
REASON

🔴 Include a clearly labeled:
OFFICIAL SOURCE / DOCUMENT CONSULTATION REPORT

For every listed Jules/Gemini document or official source, include:
DOCUMENT / SOURCE
EXACT PATH / SOURCE
USED
USEFUL
WHAT WAS USEFUL
EVIDENCE
REASON

🔴 For EACH required repository component report:
COMPONENT: <name>
PATH: <exact path>
USED: YES/NO
CHANGED: YES/NO
VERIFIED: YES/NO
USEFUL: YES/NO
WHAT WAS USEFUL: <brief concrete value>
EVIDENCE: <specific verification/use evidence>
REASON: <brief reason>

🔴 Include:
USEFUL RESULT: YES/NO

🔴 USEFUL RESULT: YES only when the requested result was actually verified.

🔴 FINAL GOVERNANCE AUDIT

Before reporting completion, verify:

- AGENTS.md was read FIRST.
- Governance was followed completely.
- The .docs library task group was selected and reported.
- Every required routed document was used and reported.
- Every library document in the selected group was used and reported with evidence.
- Every listed Jules/Gemini source was used and reported with evidence.
- ".jules/jules.md" was followed.
- ".docs/manifest.json" was checked.
- Spec Kit workflows were used and reported.
- Context7 permission was obtained before every invocation.
- Every required item has USED, USEFUL, WHAT WAS USEFUL, EVIDENCE, and REASON.
- Protected systems were not changed without authorization.
- pnpm was used and npm ci was not used.
- No secrets were exposed or committed.
- The 495 MB safety ceiling was respected. If triggered, the measured size and continuation point were reported.
- Required verification was actually performed and documented with results.
- Final diff was inspected.
- Final report changed-file list exactly matches the final Git diff.
- Required Memory Bank updates were completed.
- Report statements match the actual work.
- Final / PR Report contains the consolidated governance audit record.
- No unsupported compliance claim or scope drift occurred.

🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.

🔴 AGENTS.md GOVERNANCE IS MANDATORY. NO GOVERNANCE = NO TASK.
