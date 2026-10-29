# Tasks

- [x] 1. Add independent adversarial review guidance and prompt construction.
- [x] 2. Run a second review pass for each changed-patch batch, independently of primary-pass success.
- [x] 3. Restrict each pass's findings to the exact batch under review.
- [x] 4. Make failed passes and deterministic document-selection fallback visible as review-coverage gaps.
- [x] 5. Shorten the footer and list only documents explicitly assessed as materially useful.
- [x] 6. Re-check the PR head before publishing and abort on a stale head.
- [x] 7. Add deterministic tests for second-pass guidance, footer output, and head freshness.
- [ ] 8. Confirm focused tests and full pnpm test on the PR head.
- [ ] 9. Confirm ./jules-verify.sh and required CI checks on the PR head.
- [ ] 10. Run an actual Gemini full review against a controlled regression case; record observed findings and limitations.
- [ ] 11. Inspect CI results and the complete final diff; update this checklist and PR summary with verified outcomes.
