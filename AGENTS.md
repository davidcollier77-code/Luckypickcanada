🔴 AGENTS.md — MANDATORY GOVERNANCE

🔴 AGENTS.md is the authoritative repository governance.

🔴 READ FIRST → FOLLOW COMPLETELY → VERIFY COMPLIANCE.

🔴 No task may proceed, be approved, finalized, or reported complete unless AGENTS.md and all applicable routed requirements are followed.

🔴 No urgency, scope, implementation constraint, tool, agent, or other instruction overrides AGENTS.md governance.

🔴 DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

---

A — ANALYZE

🔴 Read AGENTS.md FIRST.

🔴 Identify every applicable task group:

- ".jules/creation.md"
- ".jules/troubleshooting.md"
- ".jules/polishing.md"
- ".jules/testing.md"
- ".jules/security.md"
- ".jules/audio.md"
- ".jules/deep-dive.md"
- ".jules/seo.md"

🔴 For every applicable task group, consult:

- ".docs/<task-group>/jules_google_docs.md"
- ".docs/<task-group>/_google-gemini_gemini-cli.md"
- ".docs/<task-group>/_websites_ai_google_dev_gemini-api.md"

🔴 Check ".docs/manifest.json".

🔴 For each applicable task group:

- Read the exact ".jules/<task-group>.md".
- Identify the library/documentation sources assigned to that group.
- Select the exact library documentation applicable to the task FROM THAT GROUP.
- Consult the selected library documentation before execution.
- Apply the applicable guidance.
- Record the exact task group, library, version, and ".docs" path.

🔴 Explicitly identify the selected task group and library in the final report.

🔴 Consult materially applicable official Jules/Gemini sources:

- "https://jules.google/docs"
- "https://jules.google/docs/cli/reference"
- "https://jules.google/docs/api/reference/"
- "google-gemini/gemini-cli"
- "https://ai.google.dev/gemini-api/docs"
- "https://ai.google.dev/api"

🔴 Identify all other materially applicable repository requirements, including:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"
- "CSS_FIX_GUIDE.md"
- "DATABASE_SETUP.md"
- "DEPLOYMENT_CHECKLIST.md"
- "QUICK_FIX_GUIDE.md"
- applicable ".jules/*.md"
- applicable ".jules/cmds/*.md"
- runbooks, source, configuration, tests, dependencies, and other routed guidance

🔴 Spec Kit workflows follow the applicable ".jules/cmds/speckit.*.md".

🔴 Inspect the actual current branch, files, configuration, code, tests, dependencies, and task path.

🔴 Classify findings: "VERIFIED / ASSUMPTION / HYPOTHESIS / UNKNOWN".

---

B — BOUNDARIES + PLAN

🔴 Before modification, establish:

- exact requested outcome
- exact scope and affected files/directories
- exact files planned for modification
- exact applicable ".jules/*.md" and ".jules/cmds/*.md"
- exact applicable ".docs" Jules/Gemini documents
- exact selected library, version, and ".docs" path
- protected systems/files
- verification requirements
- authorization requirements

🔴 Make the smallest appropriate change.

🔴 Preserve existing behavior outside scope and follow repository architecture/conventions.

🔴 Present verified analysis and plan before modification unless autonomous execution is explicitly authorized.

🔴 Do not refactor, redesign, upgrade dependencies, add unnecessary dependencies, change unrelated behavior, change backend/database/deployment without authorization, or expand scope.

---

C — EXECUTE + VERIFY

🔴 Documentation + Library Evidence

🔴 Every applicable Jules/Gemini document is individually reported:

- "DOCUMENT: <exact filename>"
- "PATH/SOURCE: <exact path or URL>"
- "USED: YES/NO"
- "USEFUL: YES/NO"
- "REASON: <brief reason>"

🔴 Every materially applicable official Jules/Gemini source actually consulted is individually reported using the same fields.

🔴 "USED: YES" requires actual consultation. "USEFUL: YES" requires an actual contribution.

🔴 For each applicable task group, individually report the library selected FROM THAT GROUP:

- "TASK GROUP: <exact group>"
- "LIBRARY: <exact library>"
- "VERSION: <exact version>"
- "DOCUMENTATION PATH: <exact .docs path>"
- "USED: YES/NO"
- "USEFUL: YES/NO"
- "REASON: <brief reason>"

🔴 The selected library must come from the applicable task group's documented inventory.

🔴 Package presence, "node_modules", tooling, or manifest presence does not prove documentation usage.

🔴 If an applicable source was not consulted, report "USED: NO", "USEFUL: NO", and the reason.

---

🔴 Manifest + MCP

🔴 ".docs/manifest.json" is checked and is the documentation inventory/source of truth.

🔴 Preserve the existing documentation inventory/group structure during normal tasks.

🔴 New libraries follow the approved documentation workflow.

🔴 Context7 requires explicit repository-owner approval and a stated reason before every invocation.

🔴 Other MCP tools require explicit approval unless separately authorized.

🔴 Tool availability or connection does not prove usage.

---

🔴 Protected Systems

🔴 Explicit authorization is required before changing:

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

🔴 Never expose or commit secrets.

🔴 Never weaken validation, sanitization, authentication, authorization, Turnstile/CAPTCHA, rate limiting, duplicate protection, or environment handling.

---

🔴 Documentation Build Safety

🔴 GitHub build limit: "500 MB per build".

🔴 Repository safety ceiling: "495 MB".

🔴 Safety margin: "5 MB".

🔴 Measure and verify the applicable build/documentation output before claiming it is within the limit.

🔴 The verified result must remain at or below "495 MB".

🔴 If the applicable output reaches or would exceed "495 MB":

- STOP immediately.
- Do not bypass the limit or raise the "495 MB" ceiling.
- Preserve completed work in a safe/resumable state.
- Update "memory-bank/activeContext.md" and/or "memory-bank/progress.md" as applicable.
- Report completed work, remaining work, current measured size, and exact continuation point.
- Do not claim full completion.

🔴 Final reporting states:

- "GitHub build limit: 500 MB"
- "Repository safety ceiling: 495 MB"
- "Safety margin: 5 MB"
- "Verified size: <actual measured size>"
- "Within 495 MB ceiling: YES/NO"
- "Cap/ceiling triggered: YES/NO"

---

🔴 Execution Rules

🔴 Follow every applicable ".jules/*.md", ".jules/cmds/*.md", ".docs" requirement, repository runbook, tool requirement, and verification requirement.

🔴 Use "pnpm". Never use "npm ci".

🔴 Inspect "package.json" before using or claiming any package script.

🔴 Audio tasks follow ".jules/audio.md"; Howler is primary unless repository guidance says otherwise.

🔴 Do not introduce public MP3 assets where repository audio guidance prohibits them.

🔴 Preserve accessibility, keyboard behavior, responsive behavior, and "prefers-reduced-motion".

---

🔴 VERIFICATION

🔴 Run every applicable verification check.

🔴 Never claim a check was run if it was not run.

🔴 Resolve verification failures where within scope; report unresolved failures explicitly.

🔴 Inspect the final diff and every changed file.

🔴 Verify:

- no unintended files changed
- no unintended dependencies changed
- no secrets introduced
- no scope drift
- protected systems untouched unless authorized
- implementation matches the plan
- actual result matches the requested outcome
- unverifiable items are explicitly identified

---

🔴 FINAL / PR REPORT

🔴 Report:

- verified facts and findings ("VERIFIED / ASSUMPTION / HYPOTHESIS / UNKNOWN")
- exact task group selected
- exact ".jules/*.md" and ".jules/cmds/*.md"
- exact Jules/Gemini documents and source status
- exact selected library FROM THAT GROUP
- exact library version and ".docs" path
- library "USED / USEFUL / REASON"
- exact other materially applicable components and their status
- requested outcome and scope
- protected systems and authorization status
- exact changed files
- implementation performed
- verification commands/checks actually run and results
- final diff inspection
- build/documentation size status
- remaining issues
- final repository state

🔴 For each materially applicable repository component, report:

- "COMPONENT: <name>"
- "PATH: <exact path>"
- "APPLICABLE: YES/NO"
- "USED: YES/NO"
- "CHANGED: YES/NO"
- "VERIFIED: YES/NO"
- "REASON: <brief reason>"

🔴 Include "USEFUL RESULT: YES/NO".

🔴 "USEFUL RESULT: YES" is permitted ONLY when the requested result was actually verified.

🔴 Do not claim completion based on intention, assumptions, tool availability, or unverified output.

---

🔴 FINAL GOVERNANCE AUDIT

Before reporting completion, verify:

- 🔴 AGENTS.md was read FIRST.
- 🔴 Governance was followed completely.
- 🔴 Every applicable task group was identified.
- 🔴 Required Jules/Gemini documents were consulted and individually status-reported.
- 🔴 Every materially applicable official Jules/Gemini source used was individually status-reported.
- 🔴 ".docs/manifest.json" was checked.
- 🔴 Library was selected FROM the applicable task group.
- 🔴 Selected library documentation was consulted and individually status-reported.
- 🔴 Every required status includes "USED", "USEFUL", and "REASON".
- 🔴 Other materially applicable components were status-reported.
- 🔴 Context7/MCP approval rules were followed.
- 🔴 Protected systems were not changed without authorization.
- 🔴 "pnpm" was used and "npm ci" was not used.
- 🔴 No secrets were exposed or committed.
- 🔴 Applicable size was measured and the "500 MB / 495 MB / 5 MB" limits were accounted for.
- 🔴 Required verification was actually performed.
- 🔴 Final diff was inspected.
- 🔴 "memory-bank/activeContext.md" and "memory-bank/progress.md" were updated when required.
- 🔴 Report statements match the actual work.
- 🔴 No unsupported compliance claims or scope drift occurred.

🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.

🔴 AGENTS.md GOVERNANCE IS MANDATORY. NO GOVERNANCE = NO TASK.
