# DevSkim Remediation Tasks

## Review and Specification
- [x] Read repository governance and relevant security-task instructions.
- [x] Inspect the current PR branch, changed files, complete review threads, and the route/configuration involved.
- [x] Specify the false-positive suppression safety requirements.
- [x] Plan the minimal implementation and regression checks.

## Implementation
- [ ] Restrict DS173237 to an explicit allowlist of safe metadata keys and complete SHA/UUID values.
- [ ] Tie suppression to the finding's field/range; decline ambiguous snippets.
- [ ] Validate and confine SARIF artifact paths before fallback reads.
- [ ] Rewrite SARIF atomically and ensure a failed suppression does not block raw SARIF upload.
- [ ] Add regression tests for positive and negative matcher/path cases.
- [ ] Remove unnecessary workflow `sudo`.
- [ ] Make the payment-link source matcher readable and accurately document its scope.
- [ ] Restore `.specify/feature.json` to the base-branch version.
- [ ] Reconcile `PR_SUMMARY.md` with current code and actual verification evidence.

## Verification and Final Review
- [ ] Run the focused Python regression suite.
- [ ] Run applicable repository tests and `./jules-verify.sh` where the environment permits.
- [ ] Review the complete final diff for scope drift, false suppression, unsafe paths, and inaccurate claims.
- [ ] Confirm current-head CI results; explicitly report anything unavailable or still pending.
- [ ] Leave PR #1558 open and unmerged.
