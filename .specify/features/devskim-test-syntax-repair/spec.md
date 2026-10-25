# Feature Specification: DevSkim Regression Test and Checksum Span Repair

**Feature Branch**: `fix/devskim-test-syntax`
**Status**: In progress
**Task Group**: `security` — repairs the security scanner's regression gate and the strict checksum-span validation path without changing the scan rules.

## Verified problem
DevSkim runs #246–#249 failed at `Test DevSkim suppression filter`. The scanner and SARIF upload succeeded, but the test module initially failed to import because two lockfile fixture writes contained unterminated string literals. After repairing those literals, the PR run imported the module and ran 51 tests, of which 50 passed and one failed: `test_speckit_file_checksum_is_suppressed_with_devskim_offset`. That test exposed an old fixture relying only on the historically off-by-one SARIF column rather than a verified absolute source span.

## Requirements
- Repair both malformed string literals in the lockfile regression fixtures.
- When DevSkim supplies absolute source offsets, validate them against the actual source text and reported snippet; use that validated span for the known checksum exception.
- Keep the accepted region entirely within the exact quoted checksum value. Do not broaden the suppression range or trust the inaccurate column by itself.
- Keep existing behavior fail-safe: malformed/missing/contradictory source evidence must not be suppressed.
- Do not change unrelated suppression rules, scan coverage, exclusions, workflow permissions/triggers, SARIF upload, application code, dependencies, secrets, or deployment settings.

## Acceptance criteria
1. The regression test module compiles.
2. The complete suppression unit suite passes, including positive and negative checksum-span cases.
3. A fresh DevSkim workflow passes the suppression/filter step; SARIF and artifact uploads still succeed.
4. The dependent report-update job is eligible to run and is not skipped due to the previous failures.
5. Full diff confirms no unrelated changes or widened allowlists.

## Evidence
- Historical runs #246–#249: repeated test-module syntax failure; latest main failure: https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40183792859
- First repair run #250: syntax-validation passed; 50/51 tests passed; the remaining failure identified the checksum-span regression.
- PR: https://github.com/davidcollier77-code/Luckypickcanada/pull/1597
