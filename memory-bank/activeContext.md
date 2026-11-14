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

The owner approved the security-header hardening and the follow-up correction to Lucky Stories browser QA. The current HSTS source of truth is the one-year policy `max-age=31536000; includeSubDomains` with `preload` disabled. PR #1895 also tightens CSP, uses `strict-origin-when-cross-origin`, removes obsolete `X-XSS-Protection`, and corrects the existing story-form test without changing the dropdown or Turnstile.

## HSTS changes from that task

- `next.config.mjs` — `Strict-Transport-Security` is now
  `max-age=31536000; includeSubDomains` (previously `max-age=63072000; includeSubDomains; preload`,
  a two-year value that Cloudflare can never serve because its HSTS max-age is capped at 12 months).
- `__tests__/hsts-policy.test.js` — pins the value, requires exactly one HSTS definition in the
  header configuration and forbids `preload` or a two-year max-age from returning.
- `specs/156-hsts-policy-reconciliation/` — spec, plan, tasks, research and verification evidence.

## Cloudflare production change — BLOCKED, not applied

The edge half could not be performed from this environment. The available Cloudflare credential can
read the zone (`luckypickcanada.ca`, `0af2a3985db329cdb671829cb59a41f1`, plan Free) but every zone
settings endpoint returns Cloudflare error **9109 "Unauthorized to access requested resource"**,
including `/settings`, `/settings/hsts` and `/settings/security_header`. No Cloudflare integration
is connected and no dashboard session is available.

Required action by the owner, in Cloudflare → SSL/TLS → Edge Certificates → HSTS: Max Age
**12 months**, **Apply HSTS policy to subdomains** on, **Preload** off, **No-Sniff** on. Then verify
with the commands recorded in `specs/156-hsts-policy-reconciliation/evidence.md`.

## Known HSTS context risks

- Until the edge change is applied, production keeps serving `max-age=15552000` without
  `includeSubDomains`, so repository and edge still disagree.
- `includeSubDomains` is not instantly reversible for browsers that have already received it.
- Preload remains deliberately off and the domain is not on any preload list.


## PR #1895 — preserved implementation and QA correction

- Security-header hardening keeps the Next.js inline bootstrap allowance, blocks inline event-handler attributes, retains required Cloudflare Turnstile, Google Analytics, Cloudflare Web Analytics and Stripe origins, removes unused font/Pexels origins, and retains the structural CSP restrictions.
- `Referrer-Policy` is `strict-origin-when-cross-origin`; `X-XSS-Protection` is removed; HSTS remains `max-age=31536000; includeSubDomains` with no `preload`.
- The existing Lucky Stories Province or territory dropdown remains visible, required, and populated with all 13 canonical options. Its explicit label association and browser test validate native required-field behavior without attempting a Turnstile-gated submission.
