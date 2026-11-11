# Evidence: Six Cloudflare Issues (#1814, #1821, #1825, #1826, #1827, #1829)

**Date**: 2026-11-11
**Repository**: `davidcollier77-code/Luckypickcanada`
**Worker**: `luckypickcanada-app`
**Branch**: `freebuff/a3ef72773064149acdf6c2ce`

## Method

1. Read each GitHub notification issue and extracted its Cloudflare issue ID.
2. Fetched the authoritative Cloudflare record and retained occurrences with the
   environment's `CLOUDFLARE_API_TOKEN` (value never printed, written or logged):
   - `GET /accounts/{account_id}/workers/observability/issues/{issueId}`
   - `GET /accounts/{account_id}/workers/observability/issues/{issueId}/occurrences?per_page=100`
3. Compared every retained request path with live production responses and with
   `git ls-files` / `public/`.
4. Reproduced the Oracle failure mode from the occurrence payload and the
   provider's documented reasoning-token behaviour, then covered the fix with
   unit and browser tests.

Summarised occurrence data is in
`artifacts/cf-issues-1829-1814/occurrences-summary.json`; live probe results are
in `artifacts/cf-issues-1829-1814/production-probes.tsv`.

## Cloudflare record state (fetched 2026-11-11)

| GitHub | Cloudflare issue | Category | Issue count | Retained occurrences | Response statuses |
| --- | --- | --- | --- | --- | --- |
| #1829 | `555015df…` | secret-files | 327 | 100 | 404 × 100 |
| #1827 | `7e965902…` | known-scanner-path | 15 | 15 | 404 × 15 |
| #1826 | `c17a7103…` | source-control | 63 | 63 | 404 × 63 |
| #1825 | `f8607191…` | debug-endpoints | 39 | 39 | 404 × 39 |
| #1814 | `a94d47c2…` | wordpress | 9 | 9 | 404 × 9 |
| #1821 | `9d04f7f8…` | Oracle log | 1 | 1 | 200 × 1 (fallback path) |

The security counts are higher than the notification payloads because scanner
traffic continued during this investigation. Every retained security occurrence
carries the message: “A request matched `<category>` scanning patterns. No
matching outbound fetch was observed.” No occurrence returned a 2xx.

## The five scan issues — external scanning, no application defect

Representative paths in the retained occurrences:

- secret-files: `/.env`, `/.env.production`, `/backup/.env`,
  `/sendgrid.env`, `/credentials.json`, `/database.sql`, `/web.config`,
  `/.netrc`, `/.docker/config.json`.
- source-control: `/.git/config`, `/.git/HEAD`, `/.git/index`,
  `/.git/logs/HEAD`, `/.gitlab-ci.yml`, `/.git-credentials`, `/.svn/entries`,
  `/.hg/hgrc`.
- debug-endpoints: `/wp-content/debug.log`, `/actuator/env`,
  `/api/actuator/env`, `/_profiler/phpinfo`,
  `/storage/logs/laravel.log`.
- known-scanner-path: `/phpinfo.php`, `/api/phpinfo.php`.
- wordpress: `/wp-login.php`.

Live production probes on 2026-11-11:

| Path | Status | Content type | Bytes |
| --- | --- | --- | --- |
| `/.env` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.env.production` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.git/config` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.git/HEAD` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.git-credentials` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.gitlab-ci.yml` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.svn/entries` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.hg/hgrc` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/.netrc` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/credentials.json` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/database.sql` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/backup/.env` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/sendgrid.env` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/web.config` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/wp-login.php` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/wp-content/debug.log` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/phpinfo.php` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/api/phpinfo.php` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/actuator/env` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/api/actuator/env` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/_profiler/phpinfo` | 404 | `text/html; charset=utf-8` | 22,584 |
| `/storage/logs/laravel.log` | 404 | `text/html; charset=utf-8` | 22,584 |

The identical body size is the application's normal not-found page. The homepage
returned 200 `text/html` during the same run. The `/.env` response contained no
`GROQ_API_KEY`, `DATABASE_URL`, `POSTGRES_URL`, private-key or `root:` marker.

Repository comparison:

- `git ls-files` matches only the repository-root `.env.local`, which is
  gitignored, empty and not a deployed asset. No tracked `.git`, `.svn`, `.hg`,
  `wp-*`, `phpinfo`, `actuator`, `debug.log` or `laravel.log` file exists.
- `public/` contains no `.env`, `.git`, `phpinfo` or `actuator` asset.
- The app has no PHP, WordPress, Laravel, Symfony profiler or Spring actuator
  route and no matching outbound fetch.

**Determination**: all five are inbound vulnerability-scanner probes against
software the site does not run. They are not application defects. They recur
because the site is internet-facing; suppressing the detections would require a
Cloudflare WAF/security rule, which is a separate owner-authorised change.

## #1821 — Oracle “Missing content in Groq API response”

The retained occurrence is a production `POST /api/oracle` from Canada with a
72-byte JSON body and HTTP 200. The ping-pong of two fetch spans is the route's
single Groq call. A 200 with this log line is the route's fallback branch: the
provider answered, but `choices[0].message.content` was empty.

Root cause: `openai/gpt-oss-20b` is a reasoning model. Its reasoning trace and
visible answer share the completion budget, and the route sent the deprecated
`max_tokens: 250`. That budget can be consumed entirely by reasoning, yielding
HTTP 200 with empty content and `finish_reason: "length"`. Groq's API reference
marks `max_tokens` deprecated in favour of `max_completion_tokens` and supports
`reasoning_effort: low|medium|high` for gpt-oss models.

Fix (`app/api/oracle/route.js`):

- `max_completion_tokens: 1024` instead of `max_tokens: 250`.
- `reasoning_effort: 'low'` for short creative readings.
- Structured missing-content log with mode, `finish_reason`, completion tokens
  and reasoning tokens; no prompt, reading or credential is logged.
- The existing 200 fallback is preserved, so a provider failure still returns a
  usable Canadian reading.
- Signature and contract unchanged for the client.

Post-deploy resolution uses the repository's existing mechanism: the PR body
names `Cloudflare-Issue: 9d04f7f8-510c-4719-b8ab-cf17bf7a7e06`, and the
`resolve-observability-issues` job resolves that issue only after a successful
deploy on `main`.

## Crystal Ball daily fortune and follow-up

| Requirement | State before | Action |
| --- | --- | --- |
| Date and weekday | Derived from the visitor's validated `localDate` | Preserved |
| Local time | Only the IANA time-zone name reached the prompt; the wall-clock time did not | Added `localTime` (`HH:MM`, validated) to the calendar facts |
| Four seasons | Astronomical boundaries for spring/summer/autumn/winter | Preserved and covered by tests |
| Canadian holidays | 10 occasions, missing Labour Day and the National Day for Truth and Reconciliation | Added both, including fallback readings |
| Canadian humour/voice | Shared prompt requires weather, hockey, maple syrup, coffee, expressions and friendly sarcasm | Preserved |
| Daily fortune | One per visitor-local day; falls back safely | Preserved |
| Follow-up | One per day, answers the specific question with the original fortune and calendar facts | Preserved |

The client now sends `localDate` and `localTime` from the visitor's browser. The
server never derives calendar facts from the time, and the local date remains
the sole source for weekday, season and holiday facts.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Targeted Vitest (`oracle-route-validation`, `crystal-ball-daily-usage`, `crystal-ball-greetings`) | PASS | 38/38 tests, exit 0 |
| Full Vitest suite | FAIL (pre-existing) | 496 tests pass; `__tests__/agent-governance-single-source.test.js` fails to parse at line 108. The file is unchanged by this task and `node --check` fails identically on the `HEAD` version. |
| Playwright `tests/visual/crystal-ball-interactions.spec.ts` (desktop) | PASS | 1 passed (23.7 s): daily fortune, leaf reveal, one follow-up, refresh restore |
| `./freebuff-verify.sh` | PASS | exit 0: Spec Kit gate, type check, production build, 36 documentation tests |
| Production build size | PASS | 373,014,916 bytes = 355.73 MiB, below 495 MiB |
| `git diff --check` | PASS | exit 0 |
| Cloudflare issue/occurrence reads | PASS | HTTP 200 for all six issue IDs |
| Live production scanner probes | PASS | 404 for all 22 probed paths, homepage 200 |
| Live Groq request | NOT RUN | No `GROQ_API_KEY` exists in this workspace; the reasoning-budget response is covered by mocked route tests |
| Deployed fix | PENDING | Requires the owner to merge and the deploy workflow to run |

## Limitations

- Cloudflare retains a bounded occurrence sample; conclusions rely on all
  retained occurrences plus live probes and the repository asset inventory.
- Scanner traffic will continue. No edge rule was added because Cloudflare
  security configuration changes need explicit owner authorisation.
- The Oracle fix is verified locally, not in production, because this workspace
  cannot deploy and holds no provider key.
- The pre-existing `agent-governance-single-source.test.js` syntax error is
  outside this task and is reported for a separate change.
