# 🔴 AGENTS.md — MANDATORY GOVERNANCE

🔴 READ FIRST. FOLLOW COMPLETELY. DEMONSTRATE COMPLIANCE.

🔴 DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

AGENTS.md is the HIGHEST and AUTHORITATIVE repository governance.
Jules MUST read it FIRST and MUST follow it COMPLETELY.

NOTHING overrides AGENTS.md.
No task request, urgency, agent instruction, tool, implementation choice,
scope decision, or other guidance may bypass or weaken it.

Jules has ONE allowed governance choice:
SELECT THE SINGLE APPLICABLE .docs TASK GROUP.

That choice does NOT permit Jules to skip anything within that group.
EVERY requirement routed by AGENTS.md is MANDATORY, including every
required document, library, workflow, command, source, system, and check.

Jules MUST NOT SKIP, SUBSTITUTE, RANK, REINTERPRET, OR DECLARE REQUIRED
ITEMS IRRELEVANT.

When uncertain, conflicting, or off-scope:
STOP → RETURN TO AGENTS.md → VERIFY THE GOVERNANCE PATH → CONTINUE ONLY
AS REQUIRED BY AGENTS.md.

NO TASK MAY PROCEED, BE APPROVED, BE FINALIZED, OR BE REPORTED COMPLETE
WITHOUT DEMONSTRATED COMPLIANCE WITH AGENTS.md AND ALL ROUTED REQUIREMENTS.

🔴 AGENTS.md GOVERNANCE IS MANDATORY.
🔴 NO GOVERNANCE = NO TASK.

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
- Use all available documents and libraries that are checked into the repository for that group.
- Record the group, library, version, and exact ".docs" path.

🔴 Do not select, rank, or skip documents or libraries within the selected group.
Use ALL required routed guidance in that group.

🔴 3. Read ".jules/jules.md" after AGENTS.md and follow its initialization,
working, "memory-bank/" and its required files, and completion requirements.

🔴 4. REQUIRED REPOSITORY SYSTEMS — USE ALL.

🔴 CONTEXT7: Context7 may be used ONLY with explicit user permission or explicit task authorization. Its availability, presence, or usefulness does NOT constitute authorization.

For EVERY task, Jules MUST use every listed repository system and report:

- "memory-bank/" and its required files
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

No Jules decision may skip, rank, substitute, reinterpret, or mark a listed
repository system N/A.

Every listed repository system must be reported with:

USED: YES/NO
USEFUL: YES/NO
WHAT WAS USEFUL
EVIDENCE
REASON

🔴 5. VERIFY THE ACTUAL REPOSITORY AND ROUTED LIBRARY CONTENT.

Inspect the actual branch, task path, files, configuration, code, tests,
dependencies, and relevant history before execution.

Use the exact routed ".docs/<task-group>/" documents and libraries identified
by ".docs/manifest.json".

Do not substitute internet searches, generic documentation, or unverified
external material for the required repository-routed documents.

Classify findings:

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

Follow every requirement routed by AGENTS.md, including:

- ".jules/*.md"
- ".jules/cmds/*.md"
- ".docs/<task-group>/"
- ".docs/manifest.json"
- ".specify/"
- ".specify/workflows/speckit/workflow.yml"
- ".specify/memory/constitution.md"
- ".specify/integrations/speckit.manifest.json"
- required libraries
- required verification

🔴 No routed requirement may be skipped, substituted, ranked, or marked N/A.

🔴 PR SUMMARY — CANONICAL RECORD

The PR Summary MUST contain the complete governance, implementation,
consultation, verification, and final Git diff reconciliation.

For every required item, report:

USED: YES/NO
USEFUL: YES/NO
EVIDENCE: <specific evidence>
REASON: <required when NO>
WHAT WAS USEFUL: <required when YES>

Do not report an item as USED or USEFUL without evidence.

🔴 REQUIRED CONSULTATION REPORT

Report every required ".docs" document and library:

TASK GROUP
LIBRARY
VERSION
EXACT PATH
USED
USEFUL
EVIDENCE
REASON

Report every required Jules/Gemini document under ".docs/<task-group>/":

DOCUMENT
EXACT PATH
USED
USEFUL
EVIDENCE
REASON

🔴 REQUIRED REPOSITORY COMPONENT REPORT

For each required repository component:

COMPONENT
EXACT PATH
USED
CHANGED
VERIFIED
USEFUL
EVIDENCE
REASON

🔴 PROTECTED SYSTEMS

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

🔴 BUILD SAFETY

495 MB is the HARD MAXIMUM BUILD LIMIT. NEVER EXCEED OR BYPASS IT.

Every build MUST be measured and the actual size MUST be reported.

If a build reaches or exceeds 495 MB:
STOP.
Do not continue the build.
Preserve the safe state.
Report the measured size and the exact point where work can safely resume.
Do not claim completion.

🔴 EXECUTION

- Use pnpm. Never use "npm ci".
- Inspect "package.json" before using or claiming package scripts.
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

For every verification command, report:

COMMAND
RESULT
EVIDENCE/OUTPUT SUMMARY

The final Git diff MUST reconcile exactly with the PR Summary:
every changed file listed exactly once, with no omissions or false entries.

Verify:

- no unintended files or dependencies
- no secrets
- no scope drift
- no unauthorized protected changes
- implementation matches the plan
- result matches the requested outcome
- unverifiable items are identified

🔴 PRE-SUBMISSION DOUBLE-CHECK

Before finalizing the PR, Jules MUST verify the requested outcome, scope,
implementation, governance evidence, verification results, and final Git diff.

The PR Summary MUST state that this double-check was completed.

PR SUMMARY

🔴 Report:

- VERIFIED / ASSUMPTION / HYPOTHESIS / UNKNOWN findings
- selected ".docs/<task-group>/"
- required documents and libraries
- required repository components
- implementation performed
- protected-system authorization status
- exact changed files reconciled against the final Git diff
- verification commands, results, and evidence
- final diff inspection
- build size
- remaining issues
- final repository state

🔴 Include:

LIBRARY CONSULTATION REPORT

TASK GROUP
LIBRARY
VERSION
EXACT PATH
USED
USEFUL
WHAT WAS USEFUL
EVIDENCE
REASON

🔴 Include:

ROUTED JULES/GEMINI DOCUMENT CONSULTATION REPORT

DOCUMENT
EXACT PATH
USED
USEFUL
WHAT WAS USEFUL
EVIDENCE
REASON

🔴 Include:

REPOSITORY COMPONENT REPORT

COMPONENT
EXACT PATH
USED
CHANGED
VERIFIED
USEFUL
WHAT WAS USEFUL
EVIDENCE
REASON

🔴 Include:

USEFUL RESULT: YES/NO

USEFUL RESULT: YES only when the requested result was actually verified.

🔴 FINAL GOVERNANCE AUDIT

Before reporting completion, verify:

- AGENTS.md was read FIRST.
- Governance was followed completely.
- The ".docs/<task-group>/" task group was selected and reported.
- Every required routed document was used and reported.
- Every required library was used and reported with evidence.
- Every required Jules/Gemini document under ".docs/<task-group>/" was used and reported with evidence.
- ".jules/jules.md" was followed.
- ".docs/manifest.json" was checked.
- Every ".jules/cmds/speckit.*.md" file required by governance was used and reported.
- ".specify/" was inspected.
- ".specify/workflows/speckit/workflow.yml" was inspected and followed where required.
- ".specify/memory/constitution.md" was consulted and reported.
- ".specify/integrations/speckit.manifest.json" was checked.
- Every required item has USED, USEFUL, EVIDENCE, and REASON.
- Protected systems were not changed without authorization.
- "pnpm" was used and "npm ci" was not used.
- No secrets were exposed or committed.
- The 495 MB build limit was respected.
- Required verification was actually performed and documented.
- Final diff was inspected.
- PR Summary changed-file list exactly matches the final Git diff.
- Required Memory Bank updates were completed.
- Report statements match the actual work.
- PR Summary contains the consolidated governance audit record.
- No unsupported compliance claim or scope drift occurred.

🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.

🔴 AGENTS.md GOVERNANCE IS MANDATORY.
🔴 NO GOVERNANCE = NO TASK.
🔴 NO DEMONSTRATED COMPLIANCE = NO TASK APPROVAL.
