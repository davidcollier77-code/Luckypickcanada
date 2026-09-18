🔴 AGENTS.md — MANDATORY JULES GOVERNANCE

🔴 READ FIRST. FOLLOW COMPLETELY. DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

🔴 GOVERNANCE

- "AGENTS.md" is authoritative repository governance.
- No task may proceed, be approved, finalized, or reported complete unless this file and all routed requirements are followed.
- The current repository state is the source of truth.
- Prefer exact repository files, paths, versions, commands, and source URLs over assumptions or generic labels.

---

🔴 A — ANALYZE

1. REQUIRED START

MUST follow this order:

1. Read "AGENTS.md" first.

2. Identify every applicable TASK GROUP:
   
   - ".jules/creation.md"
   - ".jules/troubleshooting.md"
   - ".jules/polishing.md"
   - ".jules/testing.md"
   - ".jules/security.md"
   - ".jules/audio.md"
   - ".jules/deep-dive.md"
   - ".jules/seo.md"

3. For every applicable TASK GROUP, read and use the mandatory Jules and Gemini documentation:
   
   - ".docs/<task-group>/jules_google_docs.md"
   - ".docs/<task-group>/_google-gemini_gemini-cli.md"
   - ".docs/<task-group>/_websites_ai_google_dev_gemini-api.md"
     These Jules/Gemini documents are mandatory assessment/context sources for every task. They must be consulted before library selection, modification, or execution.

4. Consult the applicable current official Jules/Gemini sources required by the repository documentation:
   
   - "https://jules.google/docs"
   - "https://jules.google/docs/cli/reference"
   - "https://jules.google/docs/api/reference/"
   - "google-gemini/gemini-cli"
   - "https://ai.google.dev/gemini-api/docs"
   - "https://ai.google.dev/api"
     Consult only sources materially applicable to the task. Never claim a source was consulted unless it was actually used.

5. For each applicable TASK GROUP:
   a. Read the exact ".jules/<task-group>.md" file.
   b. Check ".docs/manifest.json".
   c. Identify the exact library documentation assigned to that TASK GROUP.
   d. Read/consult the exact assigned library documentation before execution.
   e. Apply the applicable guidance from that documentation.

6. Identify and use every other materially applicable repository component required by the task, including:
   
   - "memory-bank/projectBrief.md"
   - "memory-bank/activeContext.md"
   - "memory-bank/progress.md"
   - "memory-bank/techContext.md"
   - "CSS_FIX_GUIDE.md"
   - "DATABASE_SETUP.md"
   - "DEPLOYMENT_CHECKLIST.md"
   - "QUICK_FIX_GUIDE.md"
   - exact applicable ".jules/*.md" specialist files
   - exact applicable ".jules/cmds/*.md" command files
   - runbooks, source, configuration, and tests
   - other exact repository guidance routed by "AGENTS.md"

7. For any applicable Spec Kit workflow, use the exact required ".jules/cmds/speckit.*.md" command file(s).

8. Inspect the actual current branch, files, configuration, code, tests, dependencies, and task path.

9. Identify the exact relevant library/framework/platform/tool name, version, manifest entry, and ".docs" path.

10. Label findings: "Verified", "Assumption", "Hypothesis", or "Unknown".

---

🔴 B — BOUNDARIES + PLAN

Before modification, MUST establish:

- exact requested outcome
- exact scope and affected files/directories
- exact files planned for modification
- exact applicable ".jules/.md" and ".jules/cmds/.md"
- exact applicable ".docs/.../jules_google_docs.md", "_google-gemini_gemini-cli.md", and "_websites_ai_google_dev_gemini-api.md" files
- exact relevant libraries, versions, manifest entries, and ".docs" paths
- protected systems/files
- verification requirements
- required authorization gates

MUST:

- make the smallest appropriate change
- preserve existing behavior outside scope
- follow existing architecture and conventions
- present verified analysis and the plan before modification unless autonomous execution is explicitly authorized

MUST NOT:

- refactor, redesign, upgrade, add dependencies, or change unrelated behavior
- change backend/database/deployment systems without explicit authorization
- expand scope because another improvement is noticed

---

🔴 C — EXECUTE + VERIFY

1. LIBRARIES + DOCUMENTATION

For every materially relevant library/framework/platform/tool:

1. Identify exact name and version.
2. Check ".docs/manifest.json".
3. Identify the exact existing ".docs" documentation path.
4. Actually consult the documentation.
5. Apply relevant guidance.
6. Report "USED: YES/NO" and "USEFUL: YES/NO".

Rules:

- ".docs/manifest.json" is the library inventory/source of truth.
- Preserve its existing inventory/group structure during normal tasks.
- Do not add, remove, rename, or regroup libraries merely because they are relevant.
- New libraries follow the approved documentation workflow.
- "package.json", "node_modules", tooling, or manifest presence alone does not prove documentation use.
- Library reporting is status-only; do not modify the inventory just to record usage.

2. MCP / CONTEXT7

- Context7 requires explicit repository-owner approval and a stated reason before every invocation.
- Never invoke Context7 without both.
- Other MCPs require explicit approval unless separately authorized by repository governance.
- MCP availability/connection does not count as usage; actual invocation/query/retrieval does.

3. PROTECTED SYSTEMS

Do not modify without explicit authorization:

- Stripe/payment
- database/schema
- authentication/security
- API routes/existing functionality
- Cloudflare/Vercel/deployment configuration
- environment variables/secrets
- accessibility/responsive behavior
- approved visual/product behavior
- documentation updater/refresh system
- "AGENTS.md"

MUST:

- never expose or commit secrets
- never weaken validation, sanitization, authentication, authorization, Turnstile/CAPTCHA, rate limiting, duplicate protection, or environment handling

4. DOCUMENTATION UPDATER / SAFETY

- Preserve the documentation updater/refresh system, manifest inventory/group structure, updater workflow/source, freshness, safety, scheduling, and future growth capability.
- Do not rework that system without explicit authorization.
- "495 MB" is a hard documentation safety cap.
- If a build/refresh reaches or would exceed the cap:
  - STOP immediately.
  - Do not bypass, raise, or ignore the cap.
  - Preserve completed work in a safe, resumable state.
  - Update "memory-bank/activeContext.md" and applicable progress.
  - Report completed work, remaining work, current size, changed files, and exact continuation step.
  - Do not claim full completion.

5. EXECUTION RULES

- Follow the applicable exact ".jules/.md", ".jules/cmds/.md", and ".docs" guidance.
- Use "pnpm"; never use "npm ci".
- Inspect "package.json" before using or claiming a script.
- Audio tasks MUST follow ".jules/audio.md"; Howler is primary; no public MP3s.
- Preserve accessibility, keyboard, responsive, and "prefers-reduced-motion" behavior.

6. VERIFICATION

Verification is mandatory.

Run every check applicable to the task, including as relevant:

- runtime/manual
- unit/integration
- build
- lint/type
- accessibility
- security
- API/database
- browser/responsive
- performance/regression
- task-specific automated checks

MUST:

- never claim an unrun check
- resolve failures or report them unresolved
- inspect the final diff and every changed file
- confirm no unintended files, dependencies, secrets, or scope drift
- confirm protected systems/files were untouched unless authorized
- confirm implementation matches the approved plan
- state anything that cannot be verified

---

🔴 FINAL REPORT

The final report MUST contain:

A — VERIFIED ANALYSIS

- verified facts
- exact applicable ".jules/*.md" files
- exact ".jules/cmds/*.md" files
- exact applicable ".docs/.../jules_google_docs.md", "_google-gemini_gemini-cli.md", and "_websites_ai_google_dev_gemini-api.md" files
- exact official Jules/Gemini sources consulted
- exact repository files inspected
- exact relevant library/version + ".docs" path
- "Verified / Assumption / Hypothesis / Unknown"

B — BOUNDARIES + PLAN

- requested outcome
- exact scope/files
- protected systems/files
- guidance/documentation followed
- verification plan
- authorization requirements
- intentional non-changes

C — EXECUTION + VERIFICATION + FINAL STATE

- exact files changed
- exact implementation
- exact checks/commands and actual results
- final diff
- remaining issues
- final state

REQUIRED SOURCE / LIBRARY STATUS

For each relevant source or library actually evaluated:

- exact file/source/path
- library name/version where applicable
- "USED: YES/NO"
- "USEFUL: YES/NO"

REQUIRED COMPONENT STATUS

For each other materially applicable repository component actually evaluated, including memory-bank files, task-group specialists, Spec Kit command files, runbooks, guides, configuration, and tests:

- exact file/path
- "USED: YES/NO"
- "USEFUL: YES/NO"

---

🔴 PR REPORT

MUST contain:

- "USEFUL RESULT: YES" or "USEFUL RESULT: NO"
- exact Jules/Gemini files/sources used + "USEFUL: YES/NO"
- exact relevant libraries + name/version/".docs" path + "USED: YES/NO" + "USEFUL: YES/NO"
- exact other materially applicable components + "USED: YES/NO" + "USEFUL: YES/NO"
- exact files changed
- verification performed and actual results
- remaining issues and final state

"USEFUL RESULT: YES" is prohibited unless the requested result was actually verified.

---

🔴 FINAL GOVERNANCE AUDIT

Before submission, MUST confirm:

- "AGENTS.md" was read first.
- Mandatory Jules/Gemini documentation was used before task-specific routing.
- All applicable routed guidance was followed.
- Exact Jules/Gemini repository files and official sources actually used were reported.
- ".docs/manifest.json" was checked.
- Relevant libraries were identified and status-reported; inventory was not changed merely because they were used.
- All other materially applicable repository components were identified and status-reported.
- Context7 was not used without approval and reason.
- Protected systems/files were untouched unless authorized.
- "pnpm" was used; "npm ci" was not used.
- No secrets were exposed or committed.
- Required verification actually ran.
- Final diff and every changed file were inspected.
- "memory-bank/activeContext.md" was updated.
- Completed milestones were moved to "memory-bank/progress.md" where applicable.
- PR reporting matches actual actions.
- No unsupported claims or scope drift remain.

🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.
