# Implementation Plan: DevSkim Regression Test and Checksum Span Repair

## Scope
Repair two malformed fixture string literals and make the known checksum suppression use a verified absolute source span when DevSkim supplies one. Do not alter scan rules, allowlists, workflow triggers/permissions, report deduplication, or unrelated application/deployment code.

## Steps
1. Restore newline-terminated UTF-8 fixture writes in both affected unit tests.
2. Update checksum suppression to prefer the checked absolute span/snippet when available, while requiring the span to remain inside the exact quoted checksum.
3. Update the regression test to model the historical off-by-one SARIF columns alongside a correct absolute offset and snippet; retain the strict span-boundary condition.
4. Verify Python syntax, run the complete suppression suite, and inspect the fresh GitHub Actions results.
5. Audit every changed file and update the PR Summary with verified results and remaining checks.

## Safety
Do not make the old off-by-one column alone sufficient for suppression. If absolute source evidence is absent or inconsistent, the normal strict coordinate validation must reject out-of-range regions.
