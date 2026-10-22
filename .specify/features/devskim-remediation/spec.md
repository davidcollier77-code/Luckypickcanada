# DevSkim Remediation Spec

## Objective
Correct the verified review defects in the existing DevSkim false-positive remediation without suppressing genuine findings or preventing scan results from reaching GitHub Security.

## Requirements
- R1: Suppress DS173237 only for an explicit allowlist of metadata keys and complete SHA-1, SHA-256, or UUID values. A generic `id`, `hash`, or arbitrary key must not qualify by substring.
- R2: Use the actual source line at the validated path rather than trusting the SARIF snippet. When SARIF columns are available, require the complete finding range to be contained inside the allowlisted field's value. When the range is unavailable, suppress only an unambiguous single-field source line.
- R3: Validate and normalize SARIF artifact URIs before any fallback file read. Reads must remain within the workspace and be limited to specifically allowed metadata/lockfile paths.
- R4: Write modified SARIF atomically. If suppression fails or its regression tests fail, preserve and upload the unmodified scan results instead of blocking the upload.
- R5: Keep the payment-link test readable and state clearly that it checks the route's source template, not rendered email HTML.
- R6: Preserve unrelated application behavior and all existing, verified inline suppressions. Do not modify deployment configuration or require new runtime secrets without verified need and an authorized configuration path.
- R7: Add regression coverage for unrelated fields, invalid/trailing characters, unsafe paths, column overlap, ambiguous snippets, and suppression failure. Report only verification actually observed.

## Acceptance Criteria
- A safe metadata value elsewhere in a snippet cannot suppress a finding on another field, and a broad finding range spanning multiple fields is rejected.
- Values with trailing non-hex characters cannot pass the SHA/UUID matcher.
- Untrusted or out-of-workspace SARIF paths are never opened.
- The raw SARIF remains valid and uploadable if suppression logic or its tests fail.
- The test matcher remains understandable and the PR summary makes accurate claims.
- No merge or deployment is performed as part of this task.
