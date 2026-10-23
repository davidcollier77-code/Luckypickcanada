### Restore CodeQL Python Analysis

- **Task Group:** Security.
- **Reason:** The supplied GitHub video shows CodeQL's `language:python` configuration warning that some files could not be processed due to syntax errors. The current source contains a malformed checksum-metadata `elif` block.
- **VERIFIED baseline:** In `.github/scripts/suppress_devskim_false_positives.py`, a stray source-line extraction sits where the checksum branch's `justification = (` should begin, leaving invalid Python. The helper `_source_line_from_text` already exists. The DevSkim workflow currently marks its unittest step `continue-on-error: true`, so a dedicated syntax gate is warranted.
- **Changes:** Repair the malformed conditional; use the already-read `source_text` for snippet extraction; add a non-tolerated `python3 -m py_compile` step ahead of the existing suppression tests. No suppression predicates, allowlists, reviewed justification strings, dependencies, application routes, UI, or deployment settings are changed.
- **Exact implementation files:** `.github/scripts/suppress_devskim_false_positives.py`; `.github/workflows/devskim.yml`.
- **Task artifacts:** `specs/043-codeql-python-syntax-repair/spec.md`, `specs/043-codeql-python-syntax-repair/plan.md`, `specs/043-codeql-python-syntax-repair/tasks.md`.

#### Repository guidance and task-relevant material

- `AGENTS.md` — USED=YES, USEFUL=YES; mandatory workflow, narrow-scope and verification requirements.
- `.jules/jules.md` — USED=YES, USEFUL=YES; sequential Spec Kit pass and no duplicate branch/PR.
- `memory-bank/projectBrief.md` — USED=YES, USEFUL=NO; established product context, no runtime product changes.
- `memory-bank/activeContext.md` — USED=YES, USEFUL=YES; updated with the currently unresolved CodeQL analysis warning and verification status.
- `.jules/security.md` — USED=YES, USEFUL=YES; reinforces testing and preservation of security controls.
- `.docs/manifest.json` — USED=YES, USEFUL=YES; selected the security task group and confirmed its routed references.
- `.docs/security/jules_google_docs.md` — USED=YES, USEFUL=NO; mandatory local reference inspected; no special Jules behavior was needed for the syntax repair.
- `.docs/security/_google-gemini_gemini-cli.md` — USED=YES, USEFUL=NO; mandatory local CLI reference inspected; no CLI behavior affects this Python correction.
- `.docs/security/_websites_ai_google_dev_gemini-api.md` — USED=YES, USEFUL=NO; mandatory local API reference inspected; no API integration is involved.
- `.specify/memory/constitution.md` — USED=YES, USEFUL=YES; confirms minimal changes and verification-before-claims.
- `.specify/templates/spec-template.md`, `.specify/templates/plan-template.md`, `.specify/templates/tasks-template.md` — USED=YES, USEFUL=YES; artifact structure.
- `scripts/verify-speckit-task.sh` and `scripts/test-verify-speckit-task.sh` — USED=YES, USEFUL=YES; confirmed that this PR must change one complete feature directory's spec, plan, and tasks.
- `.github/scripts/test_suppress_devskim_false_positives.py` — USED=YES, USEFUL=YES; existing regression suite imports and exercises this helper.
- `.github/workflows/devskim.yml` — USED=YES, USEFUL=YES; identifies the test and suppression steps and their failure-tolerance behavior.
- `package.json` — USED=YES, USEFUL=NO; checked that this Python-only change does not warrant dependency or build changes.

#### Spec Kit stage record

The native slash-command dispatcher and a local working tree were not available in this connector session. The four stages were processed sequentially as **FILE-DRIVEN PROCEDURAL EXECUTION**, using the corresponding command definitions and templates. The scripts that normally initialize a local feature directory could not be run here; CI's changed-artifact gate is expected to verify the committed artifacts.

- `/speckit.specify` — definition `.jules/cmds/speckit.specify.md`; result: `spec.md` created.
- `/speckit.plan` — definition `.jules/cmds/speckit.plan.md`; result: `plan.md` created.
- `/speckit.tasks` — definition `.jules/cmds/speckit.tasks.md`; result: `tasks.md` created with completed implementation and pending verification items.
- `/speckit.implement` — definition `.jules/cmds/speckit.implement.md`; result: source and workflow correction prepared for CI.

#### Verification and limits

- **VERIFIED:** The current main-branch file contains the malformed block shown in the video; the patch restores the intended conditional structure.
- **Not run locally:** `python3 -m py_compile .github/scripts/suppress_devskim_false_positives.py`, the unittest suite, and `./jules-verify.sh`. A local clone attempt was blocked because the execution container could not resolve `github.com`. No local test/build success is claimed.
- **Pending CI:** The DevSkim workflow's new syntax-check step, existing unittest suite, PR checks, and a completed CodeQL analysis confirming the warning is cleared.
- **Behavior preserved:** Current allowlisted paths, checksum-validation predicates, exact false-positive justification strings, and all unrelated application behavior.
- **Pre-submission double-check:** Reviewed source replacement boundaries and workflow insertion location; no dependencies, secrets, protected systems, build artifacts, visuals, copy, audio, or deployment configuration added or changed.
- **USEFUL RESULT: NO** — the repair is submitted for verification, but the user-requested result is not marked verified until CI and CodeQL confirm it.
