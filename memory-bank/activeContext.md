# Active Context — QA Infrastructure Integrity

- **Updated:** 2026-11-14
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `feat/158-qa-infrastructure-integrity`
- **Base:** `main`
- **Spec Kit feature:** `specs/158-qa-infrastructure-integrity`

## Current Task

Implement the owner-approved QA infrastructure improvements in a separate PR. Keep all work on the branch above and leave PR #1899 and production application features untouched.

## Scope and implementation

- PR descriptions contain a structured exact file-path scope manifest. The trusted, read-only scope workflow compares it with GitHub's actual changed files, reports undeclared paths, handles renames, and requires repository-owner digest approval for scope expansions.
- Screenshot baseline paths must match the declared baseline list and require separate owner approval. Governance instructions under `.freebuff/` and relevant `.specify/` files (apart from the routine active-feature pointer) are identified and require an explicit reason and owner approval.
- Scope evidence accepts Playwright, Firecrawl or Browserless as distinct, accurately recorded tool identities. The automatic visual workflow continues to use its existing Playwright runner.
- DevSkim's raw SARIF is copied before the existing in-place suppression filter. The existing filtered artifact/report path remains, and a separate raw artifact plus remaining-finding summary is added.
- New Python tests are added to PR verification alongside the complete existing Vitest suite. Existing Crystal Ball, Playwright, security, verification-integrity and protected-file checks remain.
- No Agent MD edit is included. Existing protected-file rules require a dedicated governance change; the new checker detects specialist governance paths so they cannot be silently introduced into unrelated PRs.

## Known QA observations (not fixed in this PR)

PR #1899 had a failing unit assertion involving the feature/social-sharing image object-position, a Lucky Stories pagination request returning HTTP 500 on mobile 390, and mobile accessibility text-size assertions below 12px. These are application/test findings and are outside this QA-infrastructure-only PR. Crystal Ball daily-limit and follow-up outage tests are preserved.

DevSkim passed on PR #1899. Its retained finding was DS172411 (ManualReview, high confidence) at `components/DailyResonance.tsx:386`; the fixed timeout callback remains visible for human review, without automatic false-positive classification or suppression.

## Verification limitations and handoff

Firecrawl's Node browser runtime did not provide the `playwright` module, so ChatGPT browser verification could not run. Browserless was not substituted. Repository startup scripts and `freebuff-verify.sh` were not run. GitHub Actions checks are expected to run after PR creation; the new `PR Scope Verification` workflow is activated for subsequent PRs after this workflow is merged to main.

The PR must remain open, non-draft and unmerged. Follow `PR_SUBMISSION.md`; after successful creation, stop immediately and hand off only the PR number/link and full head SHA.

## Previous task: HSTS policy reconciliation (2026-11-13)

The owner-approved repository HSTS policy is `max-age=31536000; includeSubDomains`, with preload disabled. The prior task recorded that the live Cloudflare edge still served `max-age=15552000` without `includeSubDomains`, and the available Cloudflare credential could not change zone settings (error 9109). The owner action remains Cloudflare → SSL/TLS → Edge Certificates → HSTS: 12 months, Apply HSTS to subdomains on, Preload off, No-Sniff on. Verify the live header after that change.

## Preserved PR #1895 work

The security-header hardening retained Next.js inline bootstrap behavior, prohibited inline event-handler attributes, retained Turnstile/analytics/Stripe origins, removed unused font/Pexels origins, used `strict-origin-when-cross-origin`, and removed obsolete `X-XSS-Protection`. The Lucky Stories Province or territory dropdown remains required and populated with all 13 canonical options, with explicit label association and browser checks independent of Turnstile submission.
