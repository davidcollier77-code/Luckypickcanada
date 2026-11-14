# Research: Security Header Hardening

## Current header source

`next.config.mjs` is the only repository source of response headers. Its `headers()` block applies the
security headers to every path except `/api` and `/_next`. No `public/_headers`, `_routes.json` or
worker header logic adds a second copy.

Live production responses on 2026-11-13 returned one `content-security-policy` that matched the
repository value exactly, so the edge is not duplicating or rewriting the CSP. The same responses
returned:

- `strict-transport-security: max-age=31536000; includeSubDomains` while the repository config sets
  `max-age=63072000; includeSubDomains; preload`.
- `x-xss-protection: 1; mode=block`
- `referrer-policy: origin-when-cross-origin`
- `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `permissions-policy` and
  `cross-origin-opener-policy` matching the repository values.

The HSTS difference proves the Cloudflare edge replaces the origin HSTS value. The repository value is
stronger (two years plus `preload`); the repository must not be weakened to match the edge, and the
edge setting cannot be changed from this repository. The exact owner action is recorded in the PR:
Cloudflare dashboard → the `luckypickcanada.ca` zone → SSL/TLS → Edge Certificates → HSTS. To honor
the repository's `preload` intent, enable HSTS with max-age 63072000, include subdomains and preload,
then submit the domain to the HSTS preload list. The available Cloudflare API token could list no
zones, so the edge ruleset could not be inspected programmatically; this is reported as a limitation,
not guessed at.

## Content-Security-Policy origin inventory

| Origin | Directive | Evidence | Decision |
| --- | --- | --- | --- |
| `'self'` | default/script/style/font/img/connect/frame/media/form/base/frame-ancestors | Next.js assets and same-origin API/form posts | Keep |
| `'unsafe-inline'` | `script-src` | Next.js emits inline bootstrap/flight scripts; no nonce implementation is tested | Keep (required) |
| `'unsafe-inline'` | `style-src` | React inline styles and the existing UI | Keep |
| `https://challenges.cloudflare.com` | script, connect, frame | Turnstile loader and verification | Keep |
| `https://www.googletagmanager.com` | script | GA `gtag/js` loader in `app/layout.js` | Keep |
| `https://static.cloudflareinsights.com` | script | Cloudflare Web Analytics beacon injected by the edge | Keep |
| `https://fonts.googleapis.com` | style | All four fonts come from `next/font/google` and are self-hosted at build time; no source or rendered page requests this host | Remove |
| `https://fonts.gstatic.com` | font | Same evidence | Remove |
| `https://images.pexels.com` | img | No current source, stylesheet or rendered page references it; only an old spec mentions it | Remove |
| `https://www.google-analytics.com` | img, connect | GA collection endpoint | Keep |
| `https://region1.google-analytics.com` | connect | GA regional collection endpoint | Keep |
| `https://checkout.stripe.com` | form-action | The checkout form posts to `/api/checkout`, which 303-redirects to the Stripe session URL; the existing policy and Stripe flow allow this redirect | Keep |
| `data:`, `blob:` | img, media | Existing generated/share images and audio handling | Keep |

## Inline event handlers and `script-src-attr`

The live homepage HTML contained no `on*=` attributes and no `javascript:` URLs. The repository's
forms post only to same-origin routes. React attaches events through its delegated event system, so
adding `script-src-attr 'none'` does not affect React `onClick`/`onSubmit` handlers; it only refuses
inline handler attributes and therefore closes an XSS sink. `script-src 'unsafe-inline'` remains
because Next.js inline scripts are not nonce-based here, and the task explicitly rules out an
unproven nonce rewrite.

## Referrer policy

`strict-origin-when-cross-origin` sends the full URL for same-origin requests and only the origin for
cross-origin HTTPS requests, and sends no referrer on an HTTPS-to-HTTP downgrade. The site has no
feature that depends on sending a path to an insecure destination, so this is compatible and strictly
safer than `origin-when-cross-origin`.

## Alternatives rejected

- **Nonce-based CSP**: Rejected. Next.js inline bootstrap/flight scripts would need a fully tested
  nonce integration across the app, and the task requires not breaking the site if that cannot be
  proven.
- **Keeping unused origins "just in case"**: Rejected. The task asks for unnecessary permissions to
  be removed where safe, and the unused origins are not referenced by current code or rendered HTML.
- **Changing HSTS to match the live edge**: Rejected. It would weaken HSTS and is prohibited.
- **Editing Cloudflare rules or DNS**: Rejected. The task forbids unrelated Cloudflare/DNS changes;
  the observed edge behavior is reported instead.
