# Active Context — HSTS policy reconciliation

- **Updated:** 2026-11-13
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/c941bc03442fc8f36d8df66f`
- **Base:** `main`
- **Spec Kit feature:** `specs/156-hsts-policy-reconciliation`

## Current Task

The owner approved the security-header hardening and the follow-up correction to Lucky Stories browser QA. The current HSTS source of truth is the one-year policy `max-age=31536000; includeSubDomains` with `preload` disabled. PR #1895 also tightens CSP, uses `strict-origin-when-cross-origin`, removes obsolete `X-XSS-Protection`, and corrects the existing story-form test without changing the dropdown or Turnstile.

## What changed

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

## Known Context Risks

- Until the edge change is applied, production keeps serving `max-age=15552000` without
  `includeSubDomains`, so repository and edge still disagree.
- `includeSubDomains` is not instantly reversible for browsers that have already received it.
- Preload remains deliberately off and the domain is not on any preload list.


## PR #1895 — preserved implementation and QA correction

- Security-header hardening keeps the Next.js inline bootstrap allowance, blocks inline event-handler attributes, retains required Cloudflare Turnstile, Google Analytics, Cloudflare Web Analytics and Stripe origins, removes unused font/Pexels origins, and retains the structural CSP restrictions.
- `Referrer-Policy` is `strict-origin-when-cross-origin`; `X-XSS-Protection` is removed; HSTS remains `max-age=31536000; includeSubDomains` with no `preload`.
- The existing Lucky Stories Province or territory dropdown remains visible, required, and populated with all 13 canonical options. Its explicit label association and browser test validate native required-field behavior without attempting a Turnstile-gated submission.
