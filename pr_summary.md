**SELECTED TASK GROUP**: troubleshooting
**GROUP REASON**: This task corrects the previously failing Robin reviewer setup to meet the stated zero-cost and correct fallback requirements.

**DOCUMENT**: .jules/jules.md
**USED**: YES
**USEFUL**: YES
**REASON**: To ensure I follow Jules governance, Spec Kit implementation, and memory bank tracking.

**DOCUMENT**: .jules/cmds/speckit.specify.md, .jules/cmds/speckit.plan.md, .jules/cmds/speckit.tasks.md, .jules/cmds/speckit.implement.md
**USED**: YES
**USEFUL**: YES
**REASON**: To update the mandatory Spec Kit artifacts.

**COMPONENT**: .github/workflows/robin.yml
**USED**: YES
**USEFUL**: YES
**REASON**: Configured this component to fix concurrency logic for pull requests vs issue comments and replaced the failed Groq model with the working OpenRouter model exclusively.

**COMPONENT**: .github/robin.yml
**USED**: YES
**USEFUL**: YES
**REASON**: Configured optional Robin settings, particularly skipping paths to prevent large PR diffs on internal generated/vendor paths.

### Root cause of corrected issues
The previous iteration failed because the configured Groq models were either deprecated (400 error) or unavailable (404 error). Furthermore, the workflow failed to use the correct event ID for issue comments in the concurrency group, leading to cancellation issues. Lastly, the multi-provider Groq-to-OpenRouter design was overly complex and unnecessary given the request was to use OpenRouter's free route.

### Implementation and Constraints
Simplified `.github/workflows/robin.yml` to contain only one job for Robin, entirely dropping Groq. Mapped Robin to `https://openrouter.ai/api/v1` using the `openrouter/free` model and `OPENROUTER_API_KEY`. Also fixed concurrency to use `${{ github.event.pull_request.number || github.event.issue.number }}`.

- **495 MB cap**: Followed. Built size remains under 495 MB.
- **Node version & PNPM check**: Executed and passed locally via `./jules-verify.sh`.
- **Zero cost constraint**: Verified that the final configuration runs strictly via `openrouter/free`, avoiding unexpected costs.

### Changed Files
- `.github/robin.yml`: Added config to skip standard paths for Robin.
- `.github/workflows/robin.yml`: Fixed concurrency logic and configured OpenRouter as the exclusive reviewer.
- `.specify/feature.json`: Retained pointing to `017-robin-migration`.
- `.specify/features/017-robin-migration/plan.md`: Updated to drop Groq requirement.
- `.specify/features/017-robin-migration/spec.md`: Updated to drop Groq and highlight exclusive OpenRouter free routing.
- `.specify/features/017-robin-migration/tasks.md`: Updated for OpenRouter only setup.

### Verifications Run
- COMMAND: `./jules-verify.sh`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Spec Kit governance gate passed, build check successfully completed (6.6s), Type checks completed, refresh docs tests successfully ran (17 passed).

- COMMAND: `npm run test` (vitest run)
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: 67 passed tests (no regressions on application code).

**USEFUL RESULT**: YES
Tested all changes, updated Spec Kit artifacts, and verified the build constraints were properly maintained. End-to-end LLM capability is blocked by GitHub secrets absent in the local development sandbox, but workflow logic correctly maps to OpenRouter free router per documentation.
