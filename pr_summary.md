**SELECTED TASK GROUP**: troubleshooting
**GROUP REASON**: This is a workflow migration and GitHub actions setup task replacing a deprecated bot with a new one.

**DOCUMENT**: .jules/jules.md
**USED**: YES
**USEFUL**: YES
**REASON**: To ensure I follow Jules governance, Spec Kit implementation, and memory bank tracking.

**DOCUMENT**: .jules/cmds/speckit.specify.md, .jules/cmds/speckit.plan.md, .jules/cmds/speckit.tasks.md, .jules/cmds/speckit.implement.md
**USED**: YES
**USEFUL**: YES
**REASON**: To ensure the mandatory Spec Kit tasks were run via native execution, generating the spec, plan, and tasks files, as well as properly updating `.specify/feature.json`.

**COMPONENT**: .github/workflows/inori-review.yml
**USED**: YES
**USEFUL**: YES
**REASON**: Needed to read existing Inori logic and confirm what events it tracked, allowing us to recreate similar rules in Robin and safely remove the file.

**COMPONENT**: .github/workflows/robin.yml
**USED**: YES
**USEFUL**: YES
**REASON**: Built and configured this new component following Robin's documentation and failover requirements.

**COMPONENT**: .github/robin.yml
**USED**: YES
**USEFUL**: YES
**REASON**: Configured optional Robin settings, particularly skipping paths to prevent large PR diffs on internal generated/vendor paths.

### Implementation and Constraints
Replaced `inori-review.yml` with `robin.yml` and added `.github/robin.yml` to specify Robin's ignore paths. Implemented Groq (`llama-3.3-70b-versatile`) as the primary code reviewer, and OpenRouter (`openrouter/free`) as the fallback using separate GitHub actions jobs tied via `needs: review` and `if: failure()`. The `request-changes: false` rule is kept based on the repository's rules.

- **495 MB cap**: Followed.
- **Node version & PNPM check**: Executed and passed locally via `./jules-verify.sh`.
- **Zero cost constraint**: Verified that both `llama-3.3-70b-versatile` on Groq and `openrouter/free` on OpenRouter remain on the free tier without generating usage costs.

### Changed Files
- `.github/robin.yml`
- `.github/workflows/robin.yml`
- `.github/workflows/inori-review.yml` (deleted)
- `.specify/feature.json`
- `.specify/features/017-robin-migration/plan.md`
- `.specify/features/017-robin-migration/spec.md`
- `.specify/features/017-robin-migration/tasks.md`

### Verifications Run
- COMMAND: `./jules-verify.sh`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Spec Kit governance gate passed, build check successfully completed (4.9s), Type checks completed, refresh docs tests successfully ran (17 passed).

- COMMAND: `npm run test` (vitest run)
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: 67 passed tests (no regressions on application code).

**USEFUL RESULT**: YES
Double-checked pre-submission steps and verified that the Git state and build constraints all matched safely.
