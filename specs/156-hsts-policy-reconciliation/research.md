# Research: HSTS Policy Reconciliation

All findings below were produced in this task from live requests, repository inspection and DNS
queries. Nothing is carried over from memory.

## 1. Live header and provenance

| Request | `Strict-Transport-Security` |
| --- | --- |
| `https://luckypickcanada.ca/` | `max-age=15552000` |
| `https://luckypickcanada.ca/this-page-does-not-exist-xyz` (404) | `max-age=15552000` |
| `https://luckypickcanada.ca/robots.txt` | `max-age=15552000` |
| `https://luckypickcanada.ca/_next/static/chunks/main-app-*.js` | `max-age=15552000` |
| `https://luckypickcanada.ca/api/checkout` (405) | `max-age=15552000` |
| `https://www.luckypickcanada.ca/` (301) | `max-age=15552000` |

`next.config.mjs` declares `max-age=63072000; includeSubDomains; preload`, and the string
`15552000` does not exist anywhere in the repository (`git log -S 15552000 -- next.config.mjs`
returns no commit).

The Next.js header rule targets `/((?!api|_next).*)`, so it cannot produce a header on
`/_next/static/*` or `/api/*`. Those responses carry HSTS anyway, which proves a layer outside the
application adds it.

## 2. Cloudflare behaviour (documented)

- Cloudflare's **HTTP Strict Transport Security (HSTS)** setting "Serves HSTS headers to browsers
  for all HTTPS requests."
- Its **Max Age Header** accepts "Disable, or a range from 1 to 12 months", so 31536000 seconds is
  the maximum selectable value and the repository's 63072000 can never be served through Cloudflare.
- The same panel has a **No-Sniff Header** toggle that sends `X-Content-Type-Options: nosniff`;
  that explains nosniff appearing on asset and API responses that the Next.js rule excludes.
- Community guidance and the Cloudflare community confirm that enabling Cloudflare HSTS
  "will overwrite any HSTS header that your origin sends".
- Preload requires a Max Age of at least 12 months and requires manual submission to
  hstspreload.org; it is a deliberately separate, near-irreversible decision.

Source: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/

## 3. Zone access probe (the blocker)

| Probe | Result |
| --- | --- |
| `GET /client/v4/zones?name=luckypickcanada.ca` with `CLOUDFLARE_API_TOKEN` | `success: true`, `total_count: 0` |
| `GET /user/tokens/verify` with `CLOUDFLARE_API_TOKEN` | active |
| `GET /client/v4/zones?per_page=50` with the second available credential | 1 zone: `luckypickcanada.ca` (`0af2a3985db329cdb671829cb59a41f1`), plan **Free Website**, status active |
| `GET /client/v4/zones/{zone}` with that credential | `success: true` (zone object readable) |
| `GET /client/v4/zones/{zone}/settings` | `success: false`, error **9109** "Unauthorized to access requested resource" |
| `GET /client/v4/zones/{zone}/settings/hsts` | `success: false`, error **9109** |
| `GET /client/v4/zones/{zone}/settings/security_header` | `success: false`, error **9109** |
| `GET /client/v4/zones/{zone}/settings/always_use_https` | `success: false` |

No Cloudflare app integration is connected to this account, and the cloud browser has no signed-in
Cloudflare session. The zone HSTS setting therefore cannot be read or written from this
environment: the credential is scoped to zone read (WAF-level) and lacks **Zone Settings** read/edit.

## 4. `includeSubDomains` surface

| Host | Records | Web service |
| --- | --- | --- |
| `luckypickcanada.ca` | A 172.67.176.218, 104.21.96.104; AAAA 2606:4700:… (Cloudflare) | Yes, HTTPS |
| `www.luckypickcanada.ca` | Same proxied addresses | Yes; `301` to `https://luckypickcanada.ca/` over HTTPS |
| `send.luckypickcanada.ca` | MX `10 feedback-smtp.us-east-1.amazonses.com` only, no A/AAAA | No (Resend bounce domain) |
| random subdomain | No resolution | No wildcard DNS |

Certificate-transparency data (`crt.sh`) lists only `luckypickcanada.ca` and
`www.luckypickcanada.ca`. Enabling `includeSubDomains` therefore covers no HTTP-only host today.
It is not instantly reversible: browsers that receive the directive keep the subdomain policy
until that host's `max-age` expires.

## 5. Preload status

`https://hstspreload.org/api/v2/status?domain=luckypickcanada.ca` returns
`{"status":"unknown","preloadedDomain":""}`, and the domain does not appear in Chromium's
`transport_security_state_static.json`. The domain is not preloaded and `preload` remains out of
scope.

## 6. Repository HSTS definitions

`rg -i "strict-transport-security"` over the repository (excluding `node_modules` and `.git`)
finds exactly one definition: `next.config.mjs:50`. The only other references are the audit notes in
`specs/115-first-screen-clarity-naming-csp/` and the CSP regression test; none of them set HSTS.
There is no `_headers` file, no `_routes.json` and no `middleware.*`, so no second source exists.
