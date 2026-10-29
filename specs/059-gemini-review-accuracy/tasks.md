# Tasks

- [x] 1. Add independent adversarial review guidance and prompt construction.
- [x] 2. Run a second review pass for each changed-patch batch, independently of primary-pass success.
- [x] 3. Restrict each pass's findings to the exact batch under review.
- [x] 4. Make failed passes and deterministic document-selection fallback visible as review-coverage gaps.
- [x] 5. Shorten the footer and list only documents explicitly assessed as materially useful.
- [x] 6. Re-check the PR head before publishing and abort on a stale head.
- [x] 7. Add deterministic tests for second-pass guidance, batch scope, footer output, and head freshness.
- [x] 8. Repair malformed reviewer context reporting and restore serialized review-state publication.
- [x] 9. Run the adversarial review pass for every patch batch and report its failures as coverage gaps.
- [x] 10. Add regression assertions for syntax integrity, review-state serialization, and adversarial-pass failure reporting.
- [ ] 11. Run focused and full tests on the final PR head.
- [ ] 12. Run `./jules-verify.sh` and confirm all required CI checks on the final PR head.
- [ ] 13. Run an actual Gemini full review against a controlled regression case; record observed findings and limitations.
- [ ] 14. Inspect the complete final diff and update the PR summary with verified results.
