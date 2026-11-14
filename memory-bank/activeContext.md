# Active Context — Security header hardening

- **Updated:** 2026-11-14
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/f73641c533daecd5ec53698a`
- **Base:** `main`
- **Spec Kit feature:** `specs/156-security-headers-hardening` (follows `specs/155-*`)

## Current Task

A focused follow-up for PR #1895 repairs the Lucky Stories form's browser-test coverage. The captured CI trace showed the modal, accessible combobox and all 13 options rendered; the scoped `getByLabel` locator failed, and the test would then have encountered the intentionally disabled Turnstile submit button because CI has no site key. The follow-up adds an explicit label association and tests native required-field validity without attempting a Turnstile-protected submission.

The owner asked to tighten the remaining security headers without breaking the website: review and
tighten the CSP, restrict inline event handlers where compatible, switch the referrer policy to
`strict-origin-when-cross-origin`, remove obsolete `X-XSS-Protection`, preserve HSTS and the other
existing protections, check the live/Cloudflare edge, and verify headers, CSP violations, tests and
the production build.

## What changed

- `next.config.mjs` — `Content-Security-Policy` keeps `script-src 'unsafe-inline'` for Next.js inline
  scripts and adds `script-src-attr 'none'`; removes the unused `fonts.googleapis.com`,
  `fonts.gstatic.com` and `images.pexels.com` origins; Turnstile, Google Analytics, Cloudflare Web
  Analytics and the Stripe form destination remain allowed. `Referrer-Policy` is now
  `strict-origin-when-cross-origin`. The obsolete `X-XSS-Protection` header is removed. HSTS,
  `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`
  are unchanged.
- `__tests__/security-headers.test.js` — header contract guard for the tightened CSP, preserved
  third-party origins, referrer policy, removed header and preserved protections.
- `tests/visual/security-headers.spec.ts` — response-header check, zero-CSP-violation page visits and
  a real inline-handler-blocked/React-event-working check.
- Spec Kit artifacts and `.specify/feature.json` pointer.

## Verified behaviour (this workspace)

| Check | Result |
| --- | --- |
| Focused unit tests | 2 files, 18 tests, exit 0 |
| Full unit suite | 70 files, 679 tests, exit 0 |
| Type check | `tsc --noEmit`, exit 0 |
| Production build | 358,302,351 bytes (≈341.7 MiB; cap 495 MiB) |
| `./freebuff-verify.sh` | exit 0, including 36 updater tests |
| Playwright security headers — production server | 3/3 passed |
| Playwright security headers — dev server (CI path) | 3/3 passed |
| Public routes | 8 routes, all 200, 0 CSP violations, 0 page errors |
| Turnstile + Google Analytics script load | Both loaded, 0 CSP violations |
| Local production headers | Tightened CSP once, new referrer policy, no `X-XSS-Protection`, preserved protections |

## Edge observation

Live production responses on 2026-11-13 returned one `content-security-policy` matching the
repository value (no edge duplication). The edge replaces origin HSTS with
`max-age=31536000; includeSubDomains` while the repository sets
`max-age=63072000; includeSubDomains; preload`. The repository value must not be weakened; aligning
the edge requires the owner to change Cloudflare → `luckypickcanada.ca` → SSL/TLS → Edge
Certificates → HSTS to max-age 63072000, include subdomains and preload, then submit the domain to
the HSTS preload list. The available Cloudflare API token could not list zones, so edge rulesets
could not be inspected programmatically.

## Known Context Risks

- The change is not deployed; live headers will keep the old CSP until the owner deploys.
- No real Stripe payment was completed; the checkout code, prices and configuration are untouched and
  `form-action https://checkout.stripe.com` is preserved.
- The Chromium browser check needed the repository's library provisioning script in this fresh
  workspace; that is an environment setup step, not a product failure.
