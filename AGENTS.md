🔴 AGENTS.md — MANDATORY JULES GOVERNANCE

🔴 READ FIRST. FOLLOW COMPLETELY. DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

- "AGENTS.md" is authoritative repository governance.
- No task may proceed, be finalized, or be approved unless this file is followed.
- Current repository state is the source of truth.

---

🔴 ABC WORKFLOW

🔴 A — ANALYZE

1. REQUIRED STARTING ORDER

MUST follow this order:

1. Read "AGENTS.md" first.

2. Identify applicable task group(s): ".jules/creation.md", ".jules/troubleshooting.md", ".jules/polishing.md", ".jules/testing.md", ".jules/security.md", ".jules/audio.md", ".jules/deep-dive.md", ".jules/seo.md".

3. For each applicable task group identified:
   
   - MUST identify the applicable library document(s) assigned to that task group in ".docs/manifest.json".
   - MUST read/consult the applicable document(s) before execution.
   - MUST use the applicable guidance from those document(s).

4. Read the applicable ".docs/.../jules_google_docs.md" file.

5. Establish the applicable official Jules/Gemini documentation baseline.

6. Inspect the actual current repository, branch, files, configuration, code, tests, and task path.

7. Read ".jules/jules.md".

8. Read "memory-bank/projectBrief.md" and "memory-bank/activeContext.md".

9. Read other materially applicable exact repository guidance, ".jules/cmds/*.md" files, runbooks, source, configuration, and tests.

10. Identify exact relevant library/framework/platform/tool name, version, and documentation path.

11. Label findings "Verified", "Assumption", "Hypothesis", or "Unknown".

12. JULES/GEMINI DOCUMENTATION

For every task, MUST identify, read, and follow the applicable Jules/Gemini documentation.

Repository files:

- ".docs/deep-dive/jules_google_docs.md"
- ".docs/troubleshooting/jules_google_docs.md"
- ".docs/creation/jules_google_docs.md"
- ".docs/polishing/jules_google_docs.md"
- ".docs/testing/jules_google_docs.md"
- ".docs/security/jules_google_docs.md"
- ".docs/audio/jules_google_docs.md"
- ".docs/seo/jules_google_docs.md"

Official sources:

- "https://jules.google/docs"

- "https://jules.google/docs/cli/reference"

- "https://jules.google/docs/api/reference/"

- "google-gemini/gemini-cli"

- "https://ai.google.dev/gemini-api/docs"

- "https://ai.google.dev/api"

- Applicable repository Jules/Gemini files MUST be read before execution.

- Applicable official Jules/Gemini sources MUST be consulted and followed.

- Report exact files/sources actually consulted. Never claim consultation that did not occur.

3. SPECIALISTS / SPEC KIT

- ".jules/jules.md" MUST be followed.
- Applicable task-group ".jules/*.md" files MUST be followed.
- When applicable, follow the exact ".jules/cmds/*.md" file(s).
- Report exact ".jules/cmds/*.md" filenames used.

4. MEMORY BANK / RUNBOOKS

Read applicable exact files:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"
- "CSS_FIX_GUIDE.md"
- "DATABASE_SETUP.md"
- "DEPLOYMENT_CHECKLIST.md"
- "QUICK_FIX_GUIDE.md"

"FINAL_REPORT.md" is historical context only and never authority.

---

🔴 B — BOUNDARIES + PLAN

Before modification MUST establish:

- exact requested outcome
- exact scope and files/directories
- exact files planned for modification
- exact applicable ".jules/*.md" files
- exact applicable ".jules/cmds/*.md" files
- exact applicable ".docs/.../jules_google_docs.md" files
- exact relevant libraries/versions and ".docs/manifest.json" paths
- protected systems/files
- verification requirements

MUST use the smallest appropriate change.

MUST NOT perform unrelated refactoring, redesign, dependency changes, upgrades, backend/database/deployment changes, or scope expansion.

Unless autonomous execution is authorized, present verified analysis and the plan before modification.

---

🔴 C — EXECUTE + VERIFY

5. LIBRARY/DOCUMENTATION FLOW

For every materially relevant library/framework/platform/tool:

1. Identify exact name and version.
2. Check ".docs/manifest.json".
3. Identify the exact existing ".docs/..." documentation path.
4. Actually consult that documentation.
5. Apply relevant information.
6. Determine "USEFUL: YES" or "USEFUL: NO".

- Identify the most relevant existing library group/library.
- The approved inventory is currently 53 libraries.
- Preserve the inventory and group structure.
- New libraries MUST enter through the approved documentation workflow.
- Do not add, remove, rename, or regroup libraries merely because they are relevant.
- "package.json", "node_modules", ".docs/manifest.json", or tooling alone does not prove documentation use.

6. CONTEXT7

🔴 CONTEXT7 REQUIRES EXPLICIT AUTHORIZATION AND A REASON BEFORE EVERY USE.

🔴 DO NOT INVOKE CONTEXT7 WITHOUT BOTH.

7. PROTECTED SYSTEMS

MUST NOT modify without explicit authorization:

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

MUST NOT expose or commit secrets.

MUST NOT weaken validation, sanitization, authentication, authorization, Turnstile/CAPTCHA, rate limiting, duplicate protection, or environment handling.

8. DOCUMENTATION UPDATER

MUST preserve the documentation updater/refresh system, current 53-library inventory, future growth capability, task-group structure, updater workflow/source, freshness, safety, and scheduling.

MUST NOT modify or rework it without explicit authorization.

🔴 DOCUMENTATION CAP — HARD STOP

- 495 MB is the hard documentation safety cap.
- MUST NOT exceed 495 MB.
- If a build/refresh reaches or would exceed the cap:
  - 🔴 STOP immediately.
  - DO NOT bypass, raise, or ignore the cap.
  - Preserve completed work and leave the repository in a safe, resumable state.
  - MUST report: completed tasks, remaining tasks, current size, changed files, and exact next step.
  - MUST update "memory-bank" progress/context for continuation.
- MUST NOT claim full completion unless the requested result was actually verified.
- The final report MUST explicitly state the cap caused the stop and provide the continuation handoff.

9. EXECUTION

- Follow applicable exact ".jules/*.md" files.
- Follow applicable exact ".docs/.../jules_google_docs.md" files and official Jules/Gemini sources.
- Follow existing architecture and conventions.
- Use "pnpm"; never use "npm ci".
- Inspect "package.json" before using or claiming a script.
- Audio work MUST follow ".jules/audio.md"; Howler is primary; no public MP3s.
- Preserve accessibility, keyboard, responsive, and "prefers-reduced-motion" behavior.

10. VERIFICATION

Verification is mandatory. Run every check applicable to the task: runtime/manual, unit/integration, build, lint/type, accessibility, security, API/database, responsive/browser, performance/regression, and task-specific automated checks.

- Never claim a check was run unless actually run.
- Resolve failures or report them unresolved.
- Inspect the final diff and every changed file.
- Confirm no unintended files, dependencies, secrets, or scope drift.
- Confirm protected systems/files were untouched unless authorized.
- Confirm the finished implementation matches the approved plan.
- State anything that cannot be verified.

---

🔴 FINAL REPORT

The final report MUST contain exactly:

A — VERIFIED ANALYSIS

- verified facts
- exact applicable ".jules/*.md" files
- exact ".docs/.../jules_google_docs.md" files
- exact official Jules/Gemini sources
- exact repository files inspected
- exact relevant libraries/versions
- exact ".docs/manifest.json" paths
- exact ".jules/cmds/*.md" files
- "Verified / Assumption / Hypothesis / Unknown"

B — BOUNDARIES + PLAN

- requested outcome
- exact scope/files
- protected files/systems
- exact guidance/documentation followed
- verification plan
- authorization requirements
- intentional non-changes

C — EXECUTION + VERIFICATION + FINAL STATE

- exact files changed
- exact implementation
- exact checks/commands run
- actual results
- final diff
- remaining issues
- final state

---

🔴 PR REPORT — MANDATORY

The PR report MUST contain exactly:

"USEFUL RESULT: YES" or "USEFUL RESULT: NO"

- "YES" is prohibited unless the requested result was actually verified.
- Report every exact Jules/Gemini documentation file/source used and mark "USEFUL: YES/NO".
- Report every relevant library with exact name/version, exact ".docs" path, and "USEFUL: YES/NO".
- Never claim "USEFUL: YES" unless the source materially contributed to the task.
- Report exact files changed, verification performed, actual results, remaining issues, and final state.
- Never use generic labels where an exact filename/path is available.

---

🔴 FINAL GOVERNANCE AUDIT

Before submission, MUST confirm:

- "AGENTS.md" was read first.
- Exact applicable ".jules/*.md" files were followed.
- Exact applicable ".docs/.../jules_google_docs.md" files were followed.
- Applicable official Jules/Gemini sources were actually consulted.
- Current repository state was inspected.
- Exact relevant libraries/versions were identified.
- ".docs/manifest.json" was checked.
- Exact library documentation paths were consulted.
- Library usefulness was reported YES/NO.
- Context7 was not used without explicit authorization and a stated reason.
- Protected systems/files were untouched unless authorized.
- "pnpm" was used; "npm ci" was not used.
- No secrets were exposed or committed.
- Required verification was actually performed.
- Final diff and every changed file were inspected.
- "memory-bank/activeContext.md" was updated.
- Completed milestones were moved to "memory-bank/progress.md" where applicable.
- PR YES/NO reporting matches actual actions.
- No unsupported claims or scope drift remain.

🔴 DO NOT CLAIM COMPLIANCE. DEMONSTRATE IT.
