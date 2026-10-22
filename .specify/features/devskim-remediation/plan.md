# DevSkim Remediation Plan

1. Inspect the current PR head, complete review threads, DevSkim workflow, suppression script, route source template, and repository governance.
2. Replace broad substring/key matching with an explicit allowlist and full SHA/UUID validators. Read the actual source line from the validated artifact path rather than trusting SARIF's matched-slice snippet. Tie suppression to the finding's column range and require the complete range to fit inside the safe value; without a usable range, require an unambiguous single-field source line.
3. Normalize each candidate SARIF URI and verify it resolves inside the workspace and to an approved path before opening it. Keep all file reads narrowly scoped.
4. Make SARIF rewriting atomic. Add focused Python regression tests. Run the tests before suppression; if they fail, skip suppression and upload the original SARIF with an explicit workflow warning.
5. Remove unnecessary `sudo`. Restore the existing source-level payment-link matcher to a clear regex with an explicit DevSkim false-positive annotation; document that it checks source representation.
6. Restore `.specify/feature.json` to its base-branch content because it is local checkout state, not shared PR metadata.
7. Update `PR_SUMMARY.md` to list actual files and verified results without claiming tests/build/governance checks passed unless current evidence confirms them. Run available checks, inspect the complete diff a second time, and leave the PR open and unmerged.
