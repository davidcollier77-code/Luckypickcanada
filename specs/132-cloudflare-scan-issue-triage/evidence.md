# Triage Evidence: Five Open Cloudflare Vulnerability-Scan Issues

**Date**: 2026-11-10
**Repository**: `davidcollier77-code/Luckypickcanada`
**Worker**: `luckypickcanada-app`
**Cloudflare account**: `<cloudflare-account-id>`

## Method

1. Listed open GitHub issues and selected the five labelled `cloudflare-workers-issue` (#1789–#1793).
2. Read each GitHub notification payload to obtain its Cloudflare issue ID.
3. Fetched the authoritative Cloudflare record and retained occurrences for each ID with the existing account API token (value never printed or written):
   - `GET /accounts/{account_id}/workers/observability/issues?per_page=100`
   - `GET /accounts/{account_id}/workers/observability/issues/{issueId}/occurrences`
4. Compared every reported path with the repository route tree, `public/` assets, tracked files and `next.config.mjs`.
5. Requested representative paths from production and recorded status, content type and body size.

## Cloudflare record state at triage

All five records are `type: security`, `status: active`, matching the five GitHub issues exactly. No additional open Cloudflare observability issue existed at the time of review.

| GitHub # | Cloudflare issue ID | Category | Occurrences (issue) | Retained sample |
|---|---|---|---|---|
| #1789 | `a94d47c2-d9e8-468d-ae61-c966c9ab7199` | wordpress | 2 | 3 |
| #1790 | `555015df-36b2-4088-a23d-85e71330d952` | secret-files | 97 | 20 |
| #1791 | `c17a7103-5de8-4df3-a343-4672f7ed3998` | source-control | 13 | 20 |
| #1792 | `f8607191-3b38-4c40-84e3-6ff40a036b1f` | debug-endpoints | 6 | 8 |
| #1793 | `7e965902-ed4e-4a7e-a59b-a5176c230815` | known-scanner-path | 2 | 2 |

## Per-issue findings

### #1789 — wordpress

Requested paths in the retained sample: `/wp-login.php` (3 requests). Every occurrence: `GET`, **404**, message "A request matched wordpress scanning patterns. No matching outbound fetch was observed." Source countries US. The application has no WordPress files or PHP runtime; `app/` contains only Next.js routes and `public/` contains static site assets.

### #1790 — secret-files

Requested paths in the retained sample: `/backup/.env`, `/media/.env`, `/new/.env`, `/old/.env`, `/laravel/.env`, `/sendgrid.env`, `/v1/.env`, `/server/.env`, `/frontend/.env`, `/public/.env`, `/src/.env`, `/staging/.env`, `/test/.env`, `/v2/.env`, `/web/.env`, `/production/.env`, `/web.config`, `/.docker/config.json` (twice), `/.env.production`. Every occurrence: `GET`, **404**, message "A request matched secret-files scanning patterns. No matching outbound fetch was observed." Source countries BE and CA. No `.env` file is served or included in `public/`; the only tracked `.env` path is the empty repository-root `.env.local`, which is not a deployed asset. `next.config.mjs` sets `productionBrowserSourceMaps: false`.

### #1791 — source-control

Requested paths in the retained sample: `/.git/index`, `/.git/HEAD`, `/.git/hooks/*`, `/.git/info/refs`, `/.svn/wc.db`, `/.svn/entries`, `/.hg/hgrc`. Every occurrence: `GET`, **404**, message "A request matched source-control scanning patterns. No matching outbound fetch was observed." Source countries BE and CA. The deployment output contains no `.git`, `.svn` or `.hg` directory, and no such path is tracked as a public asset.

### #1792 — debug-endpoints

Requested paths in the retained sample: `/wp-content/debug.log` (4 requests), `/_profiler/phpinfo`, `/api/actuator/env`, `/actuator/env`, `/storage/logs/laravel.log`. Every occurrence: `GET`, **404**, message "A request matched debug-endpoints scanning patterns. No matching outbound fetch was observed." Source countries IN and BE. The application has no PHP, Laravel, Symfony profiler or Spring actuator routes.

### #1793 — known-scanner-path

Requested paths in the retained sample: `/api/phpinfo.php`, `/phpinfo.php`. Every occurrence: `GET`, **404**, message "A request matched known-scanner-path scanning patterns. No matching outbound fetch was observed." Source country BE. No PHP runtime or `phpinfo` route exists.

## Live production confirmation

Run on 2026-11-10 against `https://luckypickcanada.ca`:

| Path | Status | Content type | Body size |
|---|---|---|---|
| `/wp-login.php` | 404 | text/html | 22,369 B |
| `/.env` | 404 | text/html | 22,369 B |
| `/.env.production` | 404 | text/html | 22,369 B |
| `/.git/HEAD` | 404 | text/html | 22,369 B |
| `/.git/config` | 404 | text/html | 22,369 B |
| `/.svn/entries` | 404 | text/html | 22,369 B |
| `/phpinfo.php` | 404 | text/html | 22,369 B |
| `/api/phpinfo.php` | 404 | text/html | 22,369 B |
| `/actuator/env` | 404 | text/html | 22,369 B |
| `/api/actuator/env` | 404 | text/html | 22,369 B |
| `/wp-content/debug.log` | 404 | text/html | 22,369 B |
| `/storage/logs/laravel.log` | 404 | text/html | 22,369 B |
| `/_profiler/phpinfo` | 404 | text/html | 22,369 B |
| `/backup/.env` | 404 | text/html | 22,369 B |
| `/web.config` | 404 | text/html | 22,369 B |
| `/.docker/config.json` | 404 | text/html | 22,369 B |

The body size is identical for every path and matches the application's normal Not-Found page. No response returned environment values, credentials, source files or directory listings. The homepage returned **200** (`text/html`) during the same run.

## Repository comparison

- `app/` contains only the site's documented Next.js routes (`about`, `crystal-ball`, `map`, `reveal`, `api/*`, etc.). None resembles a WordPress, PHP, `.git`, `.svn`, `.hg`, Spring actuator, Symfony profiler or Laravel log route.
- `public/` contains static images, audio, `robots.txt` and site metadata only.
- `git ls-files` contains no deployed `.env`, `.git`, `.svn`, `.hg`, `wp-*`, `phpinfo`, `actuator` or `debug.log` asset.
- `next.config.mjs` keeps `productionBrowserSourceMaps: false` and the existing security headers.

## Determination

**All five issues are false positives.** They are Cloudflare's "Potential vulnerability scan" detections of inbound requests from external hosts probing for software the site does not run. In every retained occurrence the application answered **404**, produced the standard not-found page, and made **no outbound fetch**. There is no `2xx` response, no secret or source disclosure, and no application route involved, so no application fix is warranted.

**Resolution**: each GitHub issue received an evidence-based comment and was closed; each matching Cloudflare observability issue was marked `resolved`. No application code, dependency, credential, Cloudflare configuration or deployment change was made.

## Resolution results

| GitHub issue | Evidence comment | GitHub state | Cloudflare status |
|---|---|---|---|
| #1789 | [comment](https://github.com/davidcollier77-code/Luckypickcanada/issues/1789#issuecomment-6773677354) | closed — `not_planned` | `resolved` (PATCH 200) |
| #1790 | [comment](https://github.com/davidcollier77-code/Luckypickcanada/issues/1790#issuecomment-6773677628) | closed — `not_planned` | `resolved` (PATCH 200) |
| #1791 | [comment](https://github.com/davidcollier77-code/Luckypickcanada/issues/1791#issuecomment-6773677421) | closed — `not_planned` | `resolved` (PATCH 200) |
| #1792 | [comment](https://github.com/davidcollier77-code/Luckypickcanada/issues/1792#issuecomment-6773677344) | closed — `not_planned` | `resolved` (PATCH 200) |
| #1793 | [comment](https://github.com/davidcollier77-code/Luckypickcanada/issues/1793#issuecomment-6773677315) | closed — `not_planned` | `resolved` (PATCH 200) |

All five issue threads were closed on 2026-11-10 with reason `not_planned`. Each Cloudflare PATCH returned `success: true`, no errors, and `result.status: "resolved"`.

## Residual risk

- Cloudflare retains a bounded occurrence sample. The conclusion rests on all retained occurrences plus the live path checks and the absence of any matching route/asset in the deployed application.
- An internet-exposed site will continue to receive scanner traffic; these are expected detections, not a defect. Reducing the noise would require a Cloudflare WAF/rule change, which is outside this task and would need owner approval.
