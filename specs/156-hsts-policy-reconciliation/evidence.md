# Verification Evidence: HSTS Policy Reconciliation

**Date:** 2026-11-13

**Branch:** `freebuff/c941bc03442fc8f36d8df66f`

## Result summary

| Check | Status | Evidence |
| --- | --- | --- |
| Focused HSTS regression test | **PASS** | `pnpm exec vitest run __tests__/hsts-policy.test.js` — 1 file, 4 tests, exit 0 |
| Full unit suite | **PASS** | `pnpm exec vitest run` — 70 files, 675 tests, exit 0 |
| Type check | **PASS** | `pnpm exec tsc --noEmit`, run inside `./freebuff-verify.sh` |
| Spec Kit task gate | **PASS** | `scripts/verify-speckit-task.sh` inside `./freebuff-verify.sh` |
| Repository verification gate | **PASS** | `./freebuff-verify.sh` exit 0 (governance tests, type check, production build, docs tests) |
| Production build size | **PASS** | `.next` 306,998,239 B + `public` 34,164,322 B = 341,162,561 B (**325.36 MiB**, cap 495 MiB) |
| Repository HSTS value | **PASS** | resolved config prints `/((?!api|_next).*) => max-age=31536000; includeSubDomains` |
| Single HSTS definition | **PASS** | one match for `Strict-Transport-Security` in `next.config.mjs`; no `_headers`, `_routes.json` or middleware |
| No `preload` / `63072000` remaining | **PASS** | `rg -i 'strict-transport-security|63072000|preload' next.config.mjs` returns only the key line |
| Cloudflare zone HSTS updated | **BLOCKED** | `PATCH /zones/{zone}/settings/hsts` → error **9109** "Unauthorized to access requested resource" |
| Live header verification (apex, www, API, asset) | **BLOCKED** | edge value unchanged; see the live table below |

## Exact header values

**Repository declaration (authoritative only when Cloudflare is not overriding it):**

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Live production value at the time of this PR:**

```text
strict-transport-security: max-age=15552000
```

**Discrepancy:** the live value is still 180 days without `includeSubDomains` because the
Cloudflare zone setting was not changed. This PR does not claim otherwise.

## Live probes

| Request | HSTS before/after this PR |
| --- | --- |
| `https://luckypickcanada.ca/` | `max-age=15552000` |
| `https://luckypickcanada.ca/robots.txt` | `max-age=15552000` |
| `https://luckypickcanada.ca/_next/static/chunks/main-app-*.js` | `max-age=15552000` |
| `https://luckypickcanada.ca/api/checkout` (405) | `max-age=15552000` |
| `https://www.luckypickcanada.ca/` (301) | `max-age=15552000` |

No response path reaches `next.config.mjs` in production, because Cloudflare overwrites the origin
HSTS header. The repository change remains correct for the day the zone policy is disabled and as
the single documented source of truth.

## Cloudflare access evidence

| Probe | Result |
| --- | --- |
| `GET /zones?name=luckypickcanada.ca` (`CLOUDFLARE_API_TOKEN`) | 0 zones |
| `GET /zones?per_page=50` (second credential) | zone `0af2a3985db329cdb671829cb59a41f1`, plan Free |
| `GET /zones/{zone}` | success |
| `GET /zones/{zone}/settings` | 9109 Unauthorized |
| `GET /zones/{zone}/settings/hsts` | 9109 Unauthorized |
| `GET /zones/{zone}/settings/security_header` | 9109 Unauthorized |
| `PATCH /zones/{zone}/settings/hsts` with the approved payload | 9109 Unauthorized |

No Cloudflare integration is connected and no dashboard session exists in this environment, so the
setting cannot be changed or verified here.

## Owner completion steps

1. Cloudflare dashboard → zone `luckypickcanada.ca` → SSL/TLS → Edge Certificates → **HSTS**:
   - Max Age Header: **12 months**
   - Apply HSTS policy to subdomains: **On**
   - Preload: **Off**
   - No-Sniff Header: **On**
2. Or use a token with **Zone Settings: Edit**:

```bash
curl -X PATCH \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":{"strict_transport_security":{"enabled":true,"max_age":31536000,"include_subdomains":true,"preload":false,"nosniff":true}}}' \
  "https://api.cloudflare.com/client/v4/zones/0af2a3985db329cdb671829cb59a41f1/settings/hsts"
```

3. Verify all four paths:

```bash
for u in https://luckypickcanada.ca/ https://www.luckypickcanada.ca/ \
         https://luckypickcanada.ca/api/checkout \
         https://luckypickcanada.ca/_next/static/chunks/main-app-6f8d74703e51b091.js; do
  echo "$u"; curl -sS -D - -o /dev/null "$u" | grep -i '^strict-transport-security'
done
```

Expected on every path: `strict-transport-security: max-age=31536000; includeSubDomains`.

## Limitations

- The deployment of this repository change was not performed; this task does not deploy.
- Playwright/browser checks are not applicable: the change alters one response header and no
  rendered behaviour.
