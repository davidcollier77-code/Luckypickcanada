# PR Summary — Safe, Notified Spec Kit Updater

## 1. Selected Task Group
**Selected group:** troubleshooting  
**Reason:** Spec Kit CLI integration upgrade repeatedly fails because two manifest-tracked Jules command files contain intentional local edits.

## 2. Governance and Routed Resources
- `AGENTS.md` — USED=YES; USEFUL=YES. Defines safe scope, verification, reporting, and the 495 MiB ceiling.
- `.jules/jules.md` — USED=YES; USEFUL=YES. Requires one active task/branch/PR and governs MCP approvals.
- `memory-bank/projectBrief.md` — USED=YES; USEFUL=NO. Confirms product context; no application changes are included.
- `memory-bank/activeContext.md` — USED=YES; USEFUL=YES. Records scheduler activation state and prior canary evidence boundary.
- `.jules/troubleshooting.md` — USED=YES; USEFUL=YES. Routes troubleshooting and test expectations.
- `.docs/manifest.json` — USED=YES; USEFUL=YES. Confirms selected task group and routed documentation.
- `.docs/troubleshooting/jules_google_docs.md` — USED=YES; USEFUL=NO. Required routed source; not an implementation dependency.
- `.docs/troubleshooting/developers_google_com_jules_api.md` — USED=YES; USEFUL=NO. Required source; this repair does not call the Jules API.
- `.docs/troubleshooting/_google-gemini_gemini-cli.md` — USED=YES; USEFUL=NO. Required source; Gemini CLI is not in the updater path.
- `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md` — USED=YES; USEFUL=NO. Required source; Gemini API is not in the updater path.
- `.specify/memory/constitution.md` — USED=YES; USEFUL=YES. Reaffirms inspect/plan/implement/test/double-check.
- Official Spec Kit upgrade/integration documentation — USED=YES; USEFUL=YES. Explains local-edit guard and the overwrite risk of `--force`: https://github.github.com/spec-kit/upgrade.html and https://github.github.com/spec-kit/integrations/cli.html
- Context7 and other MCP lookups — USED=NO; USEFUL=NO. Not needed.

## 3. Spec Kit Stages
The connected GitHub interface has no repository shell/native slash-command execution. The four definitions were followed as file-driven procedural execution; literal commands/hooks are not claimed to have run.
1. **/speckit.specify** — `.jules/cmds/speckit.specify.md`; METHOD: FILE-DRIVEN PROCEDURAL EXECUTION; RESULT: complete. Artifact: `.specify/features/039-speckit-updater-customizations/spec.md`.
2. **/speckit.plan** — `.jules/cmds/speckit.plan.md`; METHOD: FILE-DRIVEN PROCEDURAL EXECUTION; RESULT: complete. Artifact: `.specify/features/039-speckit-updater-customizations/plan.md`.
3. **/speckit.tasks** — `.jules/cmds/speckit.tasks.md`; METHOD: FILE-DRIVEN PROCEDURAL EXECUTION; RESULT: written; CI pending. Artifact: `.specify/features/039-speckit-updater-customizations/tasks.md`.
4. **/speckit.implement** — `.jules/cmds/speckit.implement.md`; METHOD: FILE-DRIVEN PROCEDURAL EXECUTION; RESULT: change set prepared; verification pending.

## 4. Verified Root Cause
- `.specify/integrations/generic.manifest.json` records integration v1.2.2 installed on 2026-10-20 at 09:18 UTC.
- The parent versions of both flagged command files match the manifest's exact SHA-256 hashes. Commit `435c4a3a54742487f07df73090bb2d3c596740bf` later added intentional Jules-governance changes.
- Failed CLI 1.2.3 runs stop at `specify integration upgrade generic`; extension update and later verification/PR notification steps are skipped.

## 5. Change Set
- Store upstream baseline and Jules overlay copies for the two customized command files.
- The updater validates overlay integrity, temporarily restores the upstream baseline, runs the ordinary non-forced integration upgrade, then three-way merges Jules instructions onto fresh templates.
- Unknown edits and real merge conflicts fail closed.
- Cloudflare dispatches carry `dispatch_source=cloudflare` and approved `scheduler_slot`; manual Spec Kit dispatches identify as `manual` and bypass the daily-success guard, while Cloudflare retries retain it.
- Both updater workflows post a deduplicated owner mention for created/refreshed PRs with source/slot and Actions run URL.
- Existing cron schedules and Worker slot mappings are unchanged.

## 6. Verification
- **Inspected:** the exact failure, current and parent command files, manifest hashes, workflows, Worker dispatch implementation and Worker tests.
- **Regression coverage added:** upstream additions plus Jules customizations survive; real conflicts fail closed; dispatch metadata, matching workflow inputs, manual bypass, and notifications are asserted.
- **Not run from this connected session:** repository scripts, `./jules-verify.sh`, actual `uvx specify` upgrade, Wrangler dry-run, or a fresh production workflow dispatch. The container cannot resolve github.com, and the connected GitHub interface does not expose a fresh workflow-dispatch action. Current-head CI and the first real post-deployment Worker dispatch remain required.
- **Second error check:** no cron timing changes, no blind `--force`, no secrets or app runtime touched.
- **USEFUL RESULT: NO (pending CI/live dispatch evidence)**
