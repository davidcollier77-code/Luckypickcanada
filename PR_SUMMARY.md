# Live-Traffic Performance Readiness — Homepage Hero Image Delivery

**Branch** `freebuff/c1e1aaa103045da1dc1fde0f` targets `main`. **Status: open and unmerged for review.**

## Task and selected task groups

**Assigned task:** LuckyPickCanada.ca is going live shortly; improve the site's performance as needed to be
ready for public traffic, preserving AVIF-first image delivery and WebP fallback and leaving visual quality
and functionality unchanged.

**Selected task groups:**

- **`polishing`** — the change is a delivery-level performance polish of existing artwork
  (browser resource hints and image format fallback), not a new feature. `.freebuff/polishing.md` also makes
  the MDN image-format reference mandatory for raster-format work, and it was consulted.
- **`testing`** — the change can only be justified with measured evidence, so it is verified with a new
  source guard, the existing Vitest suite, and a repeatable Playwright measurement harness.

## Library / routed documents reviewed

| Document (`.docs/...`) | USED | USEFUL | Contribution |
| --- | --- | --- | --- |
| `polishing/_websites_mdn_image_types.md` | **USED** | **YES** | Confirms AVIF is supported in Chrome, Edge, Opera, Safari and Firefox but must ship a fallback through `<picture>`. That is exactly the structure kept: AVIF `<source>`, WebP `<source>`, WebP `<img>` fallback. It also informed the decision to keep the AVIF hint, because AVIF is the format those browsers paint. |
| `polishing/_websites_developer_chrome.md` | NOT USED | NO | Would document preload/`type` matching, but the duplicate-download behaviour was established by direct measurement (two hero responses in a cold browser context) instead of documentation. |
| `polishing/_websites_web_dev_images.md` | NOT USED | NO | General responsive-image guidance; the responsive `srcSet`/`sizes` handling was already correct and unchanged. |
| `polishing/_vercel_next_js.md` | NOT USED | NO | The change is a React `preload()` call removal in a client-free server component; no Next.js API behaviour needed confirmation. |
| `polishing/_google_eng-practices.md` | NOT USED | NO | Cross-cutting review guidance only; not needed for a one-hint deletion with measured verification. |
| `testing/_microsoft_playwright.md` | NOT USED | NO | The probe uses the API patterns already present in the repository's Playwright suite (`tests/visual/*.spec.ts`). |
| `testing/_vitest-dev_vitest.md` | NOT USED | NO | The new guard follows the existing `__tests__/*.test.js` conventions. |

No other routed document was opened. `.docs/` was not modified.

## What was implemented

The homepage transferred the hero artwork **twice** — 198.6 KiB AVIF plus 293.1 KiB WebP — on every load in
any browser that supports both formats. Cause: `app/homepage/Hero.js` emitted two React `preload()` image
hints, one per format. A preload hint's `type` only filters formats the browser cannot decode; it cannot
express "whichever `<picture>` source wins", so Chromium fetched both and painted the AVIF.

The change removes the WebP preload hint and keeps everything else: the AVIF hint (high priority, responsive
`imageSrcSet`), the AVIF → WebP `<source>` order, and the WebP `<img>` fallback for browsers without AVIF.

**Files changed**

- `app/homepage/Hero.js` — removed the redundant WebP `preload()` hint and documented why only one format is
  hinted.
- `__tests__/homepage-hero-preload.test.js` — new guard: exactly one hero hint, it is AVIF with
  `fetchPriority: "high"` and the responsive `imageSrcSet`; the WebP hint is absent; the AVIF/WebP `<source>`
  order, the WebP `src`, the alt text and both 669w/1024w files are unchanged.
- `specs/088-live-performance-readiness/spec.md`, `plan.md`, `tasks.md`, `checklists/requirements.md` and
  `.specify/feature.json` — Spec Kit artifacts.
- `artifacts/perf-audit/` — probe, screenshot harness, README, baseline and post-change reports and
  screenshots.
- `memory-bank/activeContext.md`, `PR_SUMMARY.md` — task record and this report.

Not changed: artwork files or encoding, CSS, layout, fonts, scripts, routes, APIs, payments, email, database,
dependencies, workflows, deployment configuration.

## Spec Kit stages

| Stage | Artifact |
| --- | --- |
| Specify | `specs/088-live-performance-readiness/spec.md` (+ `checklists/requirements.md`) |
| Plan | `specs/088-live-performance-readiness/plan.md` |
| Tasks | `specs/088-live-performance-readiness/tasks.md` |
| Implement | Tasks T001–T011 executed and marked complete |

No existing feature directory covered this task, so none was duplicated or reused; prior perf features
(`specs/perf-fixes`, `specs/homepage-perf`) describe different work.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| New guard test `__tests__/homepage-hero-preload.test.js` | **PASS** | 4/4 tests |
| Full `pnpm exec vitest run` | **PASS** | 38 files / 401 tests |
| `./freebuff-verify.sh` | **PASS** | exit 0 — Spec Kit gate, `tsc --noEmit`, production build, refresh-docs 38/38 |
| Production build size | **PASS** | clean build `.next` 301,017,190 B + `public` 32,840,043 B = 333,857,233 B (318.4 MiB); after the full verify run (incremental cache) `.next` 318,423,866 B + `public` = 351,263,909 B (335.0 MiB). Both far below the 495 MB hard maximum. |
| Cold mobile-emulated load (390x844 @3x) | **PASS** | hero requests 2 → 1; hero bytes 491.7 → 198.6 KiB; total transfer 1,982.6 → 1,688.7 KiB (-14.8%); FCP/LCP 492 → 416 ms; CLS 0 → 0; TBT 24 → 0 ms |
| Cold desktop load (1440x900) | **PASS** | hero requests 2 → 1; hero bytes 491.7 → 198.6 KiB; total transfer 2,142.3 → 1,848.4 KiB (-13.7%); FCP 308 → 304 ms; LCP 308 → 304 ms; CLS 0 → 0 |
| LCP element unchanged | **PASS** | still `/homepage-hero-lucky-pick-canada.avif`, natural 1024x1536, identical `currentSrc` to the live site |
| Delivered image hints | **PASS** | served `<head>` now carries only the AVIF hero hint; the deployed site carried AVIF + WebP |
| Visual parity | **PASS** | 1440x900 and 390x844 first-screen screenshots (`artifacts/perf-audit/after/`, compared with `artifacts/perf-audit/live-before/`); hero `currentSrc`, natural size, rendered box (1052x648 desktop, 360x608 mobile), 0 px horizontal overflow |
| Real device / live network Core Web Vitals | **PENDING** | measurements are Chromium-emulated against a local production build, not field data |
| PR-head CI checks | **PENDING** | not yet run on this head |

## Remaining issues and limitations

- Browsers that cannot decode AVIF (older than Safari 16.4 / Firefox 93) no longer receive an early hint for
  the WebP fallback. They still download and display the WebP from the unchanged `<picture>` source; only the
  start of that download moves from the resource hint to HTML parsing.
- The mobile profile still downloads 174.5 KiB of `crystal-ball-bg-mobile.webp` and 84.7 KiB of third-party
  Turnstile JavaScript. Both are deliberate and unchanged: the backdrop is the visual treatment of the first
  screen (its WebP is smaller than its AVIF), and the Turnstile hint is an intentional low-priority
  homepage-only hint covered by `tests/visual/turnstile-loading.spec.ts`.
- Numbers come from a local `next start` production build; the deployed edge also caches HTML
  (`x-nextjs-cache: HIT`), which this harness does not model.

**USEFUL RESULT: YES** — the requested performance improvement is implemented and measured, and every
mandatory local gate passed.

---

# Skill Library and MCP Connection Audit

**Branch** `freebuff/d39d4997e3eae68c62117cc1` targets `main`. **Audit-only**: no application source,
dependency, workflow, environment, `.docs/` or `AGENTS.md` file is modified.

## Task and task groups

**Assigned task:** audit Freebuff's installed skill library and connected MCPs — inventory skills and their
purposes, inventory connected MCPs and their tools, verify each MCP actually works, determine whether
skills and MCP tools are used automatically or only on explicit instruction, explain the discovery →
load → activation → application path, identify anything Freebuff cannot discover or use, and demonstrate
selection with real examples.

**Selected task groups:**

- **`deep-dive`** — the request is explicitly report-only, and `.freebuff/deep-dive.md` names
  "explicitly authorized audit-only, investigation-only, or report-only tasks" as permitted scope that
  must still produce evidence and limitations rather than a forced code change.
- **`troubleshooting`** — two connections were failing; attributing them required real calls and repeated
  measurement instead of inspection.
- **`security`** — the audit touches live third-party accounts and the request forbids exposing any
  credential, so error text and secret handling needed the strictest review posture.

## Method

Everything below is read from an interface that was actually called. No claim rests on a listing alone.

- Skill inventory: the 14 skills declared by the `cloud_read_skill` tool were each loaded. All 14 returned
  their instructions (14/14).
- MCP inventory: `search_integration_tools` was called for all four app categories to obtain real tool
  schemas; each account then received at least one **read-only** call.
- Repository evidence: `AGENTS.md`, `.freebuff/*.md`, `.specify/integration.json`,
  `.specify/init-options.json`, `wrangler.jsonc`, `.github/workflows/`, plus counts measured with `grep`
  and `which`.

## Installed skills (14 declared, 14 loaded)

| # | Skill | Purpose | Activation rule | Verified limitation |
|---|---|---|---|---|
| 1 | `frontend-design` | Distinctive visual direction for new or reshaped UI | Description-driven; any design task | None |
| 2 | `web-design-guidelines` | Review UI against the Vercel Web Interface Guidelines | "review my UI", "audit design", "check accessibility" | Fetches the rule set from a live `raw.githubusercontent.com` URL at run time rather than holding it locally |
| 3 | `image-to-code` | **Relocation stub only** | Frontmatter sets `disable-model-invocation: true` | **Cannot be model-invoked.** Body only points at `github.com/Leonxlnx/imagegen-skills` |
| 4 | `shadcn-ui` | shadcn/ui component discovery, install, customisation | shadcn work | Declares `mcp_shadcn*` as an allowed tool; **no shadcn MCP is connected**, and the repo has no `components.json` |
| 5 | `wrangler` | Wrangler CLI dev, preview, deploy and resource operations | Project has `wrangler.jsonc/json/toml` | **Trigger satisfied** — `wrangler.jsonc` exists |
| 6 | `verification-before-completion` | Evidence before any completion or success claim | Before claiming done, fixed or passing | None; aligns with `AGENTS.md` §4 and §7 |
| 7 | `executing-plans` | Execute an implementation plan inline without subagents | Plan execution with no subagent tool | **Broken dependencies**: requires `superpowers:test-driven-development`, `superpowers:using-git-worktrees`, `superpowers:finishing-a-development-branch` and `../subagent-driven-development/scripts/*`; **none are installed** |
| 8 | `security-review` | OWASP-grounded vulnerability review with confidence gating | "security review", "find vulnerabilities", "audit security" | `allowed-tools` lists `Task`, which is not a tool in this environment; 21 reference files load on demand — one was loaded successfully |
| 9 | `github-actions-docs` | Grounds Actions answers in official GitHub docs | Any GitHub Actions question | **Trigger present** — the repo has 11 workflows in `.github/workflows/` |
| 10 | `canvas-design` | Poster/art generation as PNG or PDF | "poster", "piece of art", static design | Needs a `./canvas-fonts` directory and image/PDF rendering; **not exercised here** |
| 11 | `systematic-debugging` | Root-cause-first debugging process | Any bug, test failure or unexpected behaviour | Calls `superpowers:test-driven-development`, **which is not installed** |
| 12 | `workers-best-practices` | Cloudflare Workers production practices and review | Writing, reviewing or configuring Workers | **Trigger present** — the app deploys through OpenNext to Workers; references `durable-objects` and `cf-cli` skills that are not installed |
| 13 | `neon-postgres` | Neon/Lakebase Postgres connections, pooling, branching, diagnostics | Existing `DATABASE_URL`, SQL, schema, search | **Parent `neon` skill is not installed**; the documented fallback `neon` CLI is **absent** (`which neon` → not found). The Neon MCP partly covers this |
| 14 | `extract-design-system` | Extract design tokens from a public site | Design-token extraction request | Runs `npx extract-design-system`, which is **not a project dependency**, plus Playwright Chromium |

Loading mechanism confirmed beyond first-level `SKILL.md`: a declared resource was fetched by path
(`security-review` → `references/injection.md` returned the full injection reference), so skill resources
are readable on demand.

## Connected MCPs (4 accounts) and verification

Tool schemas were discovered for all four apps; every account then received a read-only call.

| App / account | Tools discovered | Read-only verification call | Result |
|---|---|---|---|
| **GitHub** `github_passen-phenin` (`davidcollier77-code`) | `GET_THE_AUTHENTICATED_USER`, `LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER`, `LIST_ORGANIZATIONS_FOR_THE_AUTHENTICATED_USER`, `FIND_REPOSITORIES`, `GET_A_REPOSITORY`, `LIST_REPOSITORIES_FOR_A_USER` | `GITHUB_GET_THE_AUTHENTICATED_USER` | **VERIFIED WORKING** — returned the authenticated profile, login `davidcollier77-code`, 1 public repo, 0 private |
| **Neon** `neon_wasir-mats` | `RETRIEVE_PROJECTS_LIST`, `GET_USER_ORGANIZATIONS`, `GET_BRANCHES_FOR_PROJECT`, `FETCH_DATABASE_FOR_BRANCH`, `ACCESS_PROJECT_DETAILS_BY_ID`, `RETRIEVE_BRANCH_DATABASE_DETAILS`, `GET_PROJECT_CONNECTION_URI`, `LIST_SHARED_PROJECTS` | `NEON_RETRIEVE_PROJECTS_LIST` | **VERIFIED WORKING** — 3 projects returned (`neon-purple-dog`, `neon-rose-kite`, `neon-fuchsia-tree`), org `org-wild-boat-43871967`, Postgres 17 |
| **Cloudflare Api Key** `cloudflare_api_key_gange-suzy` (reconnected; replaced `cloudflare_api_key_dop-scenic`) | `LIST_ZONES`, `LIST_DNS_RECORDS`, `CREATE_DNS_RECORD`, `OVERWRITE_DNS_RECORD`, `DELETE_DNS_RECORD` | `CLOUDFLARE_API_KEY_LIST_ZONES` ×2 (unfiltered, then name-filtered) | **FAILING** — error `6003 Invalid request headers`, chain `6111 Invalid format for Authorization header`. Identical on both calls after reconnection; the `error_chain` names the **Authorization** header, so the connector's bearer value is at fault (corrected root cause below) |
| **Google Stitch** `google_stitch_coost-namda` | `LIST_PROJECTS`, `GET_PROJECT`, `LIST_SCREENS` | `GOOGLE_STITCH_LIST_PROJECTS` | **FAILING** — "Google Stitch rejected the connected API key." |No write, delete, overwrite or deploy tool was invoked. Failure text is quoted as provider codes and messages only; no credential value was read, printed or stored.

### Cloudflare re-verification after reconnection (2026-11-04T09:28Z)

The owner replaced the Cloudflare connection; the new account handle is `cloudflare_api_key_gange-suzy`.
A read-only re-test produced these results.

1. **Authentication — FAILED.** `CLOUDFLARE_API_KEY_LIST_ZONES` returned `6003 Invalid request headers`
   with chain `6111 Invalid format for Authorization header`, twice (unfiltered, then name-filtered).
   Rejection happens at the header-format stage, before any account or zone is read.
2. **Account — NOT IDENTIFIED.** No account name or ID can be returned until authentication succeeds.
3. **Zone `luckypickcanada.ca` — NOT ACCESSIBLE.** The repository confirms the expected zone through the
   `luckypickcanada.ca` and `www.luckypickcanada.ca` routes in `wrangler.jsonc`, but the zone cannot be
   listed, matched or confirmed by name.
4. **DNS records — NOT RETRIEVABLE.** `CLOUDFLARE_API_KEY_LIST_DNS_RECORDS` requires a `zone_id` that only
   `LIST_ZONES` can supply, so it is blocked by the same failure rather than by a separate problem.
5. **Tools — all five discoverable, none executable:** `LIST_ZONES`, `LIST_DNS_RECORDS` (read-only) and
   `CREATE_DNS_RECORD`, `OVERWRITE_DNS_RECORD`, `DELETE_DNS_RECORD` (mutating, never invoked).

### Root cause — corrected 2026-11-04 (second round): the bearer value is not the saved token

The first round concluded that the saved value was a 37-character Global API Key. **That conclusion is
withdrawn.** The owner reports that a direct bearer call with the restricted token returns the
`luckypickcanada.ca` zone, so the credential is valid and the fault must lie in how the connector builds
the header. A second differential round tested exactly that, parsing the full payload including
`error_chain`, because Cloudflare nests the specific reason there instead of emitting a second top-level
error.

| Request actually sent | Cloudflare response (verbatim codes) |
|---|---|
| `Authorization: Bearer <40 clean chars>` (control) | `errors[9109] Invalid access token` |
| `Authorization: Bearer undefined` | `errors[6003]` + `chain[6111] Invalid format for Authorization header` |
| `Authorization: Bearer ` (empty value) | `errors[6003]` + `chain[6111]` |
| `Authorization: Bearer <40 chars with an internal space>` | `errors[6003]` + `chain[6111]` |
| `Authorization: Bearer` (scheme only) | `errors[6003]` + `chain[6111]` |
| bare value, or `Api-Key` / `Token` / `Basic` scheme | `errors[6003]` + `chain[6111]` |
| token placed in `X-Auth-Key` + `X-Auth-Email` | `errors[6003]` + **`chain[6103] Invalid format for X-Auth-Key header`** |
| genuine 37-hex Global-Key shape + `X-Auth-Email` | `errors[9103] Unknown X-Auth-Key or X-Auth-Email` |
| 37-hex value in `X-Auth-Key`, no email | `errors[9106] Missing X-Auth-Email header` |
| no credential headers at all | `errors[9106]` + `errors[9107]` |
| doubled `Bearer Bearer <40>` | `errors[9109]` (parsed, then rejected as invalid) |

Three findings, and they are what corrects the first round:

1. **The connector is sending `Authorization`, and its value is wrong.** The MCP's `error_chain` is `6111`,
   which names the *Authorization* header specifically. A token in `X-Auth-Key` produces `6103` instead, and
   an absent header produces `9106/9107` — so the connector is not using the legacy key path and is not
   omitting the header. It attaches a bearer value Cloudflare cannot parse.
2. **A genuine Global API Key cannot produce this error.** In the legacy path it returns `9103` (with an
   email) or `9106` (without). The "37-hex key saved as a token" explanation is therefore not supported.
3. **A doubled `Bearer ` prefix is excluded.** It parses as a well-formed header and returns `9109`, so the
   connector is not double-prefixing.

**Root cause: the Freebuff Cloudflare connector's credential resolution and `Authorization` construction.**
Because a clean 40-character value can never yield `6111`, and the saved restricted token works as a direct
bearer credential, the connector is transmitting an empty, placeholder (the shape of a `Bearer undefined`
produced by an unresolved secret lookup) or whitespace-mutated value in place of the token. It should send
`Authorization: Bearer <token>` and fail closed with a configuration error rather than sending a placeholder.

**What must be corrected, and where:**

1. **In the connector (primary):** resolve the stored token, send it as the bearer value, and refuse the
   request when the secret is missing instead of emitting `Bearer undefined`. This is outside the
   repository: `code_search` finds no `api.cloudflare.com` client and no `Authorization` construction
   anywhere in the workspace, and no MCP configuration file exists, so no repository change can fix it.
2. **In the connection configuration (owner, no new token required):** confirm the connection is an **API
   Token** connection rather than an API Key connection, which expects a 37-hex key plus an account email,
   and re-save the same token without quotes or whitespace.
3. **Confirmation:** only `CLOUDFLARE_API_KEY_LIST_ZONES` returning the `luckypickcanada.ca` zone proves the
   repair. None has succeeded, so the repair remains **BLOCKED**.

### Round 3 — the transport status is 400, not 403 (2026-11-04)

The reported zone ID made a previously impossible call possible: `LIST_DNS_RECORDS` needs a `zone_id`, and
until now only `LIST_ZONES` could supply one. Both endpoints were then called on the real connection:

| Call | Response |
|---|---|
| `CLOUDFLARE_API_KEY_LIST_ZONES` (`name=luckypickcanada.ca`) | `6003 Invalid request headers`, chain `6111 Invalid format for Authorization header` |
| `CLOUDFLARE_API_KEY_LIST_DNS_RECORDS` (`zone_id=0af2a3985db329cdb671829cb59a41f1`) | `9106 Authentication failed (status: 400)` |

Two facts follow, and the second is decisive:

1. **A known zone ID does not help.** Authentication is evaluated before zone membership, so the DNS call
   fails identically and the zone ID cannot be used until the header is accepted.
2. **The transport status is `400`, not `403`.** Every malformed-header case in the probe matrix returns
   **400** (`6003`/`6111`); every well-formed-but-invalid credential returns **403** (`9109`, `9103`,
   `9106`). The connector's requests are rejected as *structurally invalid* before Cloudflare evaluates the
   credential's identity. That excludes an expired, revoked, under-scoped or wrong-type token.

The DNS tool also normalises the provider error to `9106` while preserving `status: 400`, an independent
second confirmation of the same auth-stage rejection.

**Investigation time used:** approximately 13 minutes for this round, inside the 30-minute cap.

### An MCP the repository depends on but which is not connected

`AGENTS.md` line 57 and the "Controlled Context7 Libraries" section of every task-group file govern
Context7 usage ("Context7 requires explicit owner approval before each invocation"). **Context7 is not a
connected app**, and no Context7 tool is exposed. That approval rule therefore currently gates nothing,
and every Context7-routed library in the manifest is unreachable through MCP — only the local `.docs/`
snapshots are available.

### There is no repository-level MCP configuration

`glob **/*mcp*` returns 0 files and no `mcpServers` key exists anywhere in the repository. Connections
therefore live in the Freebuff account, outside version control. The repository cannot configure, inspect
or repair them, and its approval rules are enforceable only by an agent following instructions — not by
configuration.

## How skills are discovered, loaded, activated and applied

1. **Discover** — the 14 skills are declared to the agent as name + description only (progressive
   disclosure). This is the entire automatic surface: the agent sees *what exists and roughly when it is
   for*, not the instructions.
2. **Load** — nothing is preloaded. The agent decides to call `cloud_read_skill <name>`, which returns the
   full `SKILL.md`; resources named in that file are fetched individually by path. Both levels were
   exercised here (14/14 skills, 1 resource).
3. **Activate** — activation is decided by the loaded text, not by a router. Three mechanisms are visible
   in this library: a free-text `description` used as a trigger hint; hard preconditions in the body
   (`wrangler` requires a Wrangler config; `github-actions-docs` applies to Actions questions); and the
   frontmatter flag `disable-model-invocation: true`, which removes a skill from model-driven activation
   entirely (`image-to-code`).
4. **Apply** — the instructions become guidance for the current task, and for some skills they are
   executable: `verification-before-completion` and `systematic-debugging` impose gates, while
   `executing-plans` and `extract-design-system` require scripts or packages that must already exist.

MCP tools follow the same two-step shape: `search_integration_tools` discloses tool names and input
schemas for a described intent; `run_integration_tools` executes a chosen tool. Connection status is *not*
part of that disclosure — the Cloudflare and Stitch accounts were listed as connected and only failed at
execution.

## Automatic or explicit? — measured

- `AGENTS.md` contains **zero** occurrences of the word "skill" (`grep -ci skill AGENTS.md` → `0`).
  Repository governance says nothing about the skill library, so no repository rule can trigger or forbid
  a skill.
- `AGENTS.md` constrains MCPs only by approval, never by relevance: Neon and Stitch are pre-approved,
  Context7 and "other MCPs" need approval, and "do not use an external MCP merely because it is available".
- **Conclusion (verified by this session):** discovery is automatic, selection is *not*. Every one of the
  14 skill loads and 4 MCP calls in this session happened **because the task text named that subject**. No
  skill or MCP was invoked spontaneously while the repository work ran. Two skills whose preconditions
  this repository satisfies (`wrangler` — `wrangler.jsonc` present; `workers-best-practices` — Workers
  deployment) were still not applied until the audit asked about skills. Explicit instruction is the
  reliable trigger.

**Practical demonstration of selection.** For "audit the skill library" the agent enumerated names, chose
`security-review` for secret handling and loaded `references/injection.md` on demand; for "verify MCPs are
available" it mapped each app to its cheapest read-only endpoint (`GET_THE_AUTHENTICATED_USER`,
`RETRIEVE_PROJECTS_LIST`, `LIST_ZONES`, `LIST_PROJECTS`) rather than a write. The selection rule was
relevance stated in the request, and the retrieval was on demand — not a fixed pipeline.

## Skills or MCPs Freebuff cannot discover or use

| Item | Status | Cause |
|---|---|---|
| `image-to-code` | **Discovered, cannot be used** | `disable-model-invocation: true` and the body is a relocation stub |
| `executing-plans` | **Cannot run as written** | `superpowers:*` sub-skills and `subagent-driven-development` scripts are not installed |
| `systematic-debugging` | **Partially usable** | Core process is self-contained; its `superpowers:test-driven-development` hand-off is absent |
| `neon-postgres` | **Partially usable** | Parent `neon` skill missing and `neon` CLI absent; guidance still readable, diagnostics path limited |
| `shadcn-ui` | **Not applicable here** | Its `mcp_shadcn*` dependency is not connected and the repo has no shadcn setup |
| `web-design-guidelines`, `canvas-design`, `extract-design-system` | **Unverified** | Each needs a live fetch, font/rendering assets or an external package; none was exercised |
| Cloudflare MCP | **Connected, unusable** | `6003/6111` malformed `Authorization` header |
| Google Stitch MCP | **Connected, unusable** | Connected API key rejected |
| Context7 | **Not connected** | Referenced by `AGENTS.md` and every group file, but absent from the account |

### Engineering escalation for Freebuff support

**Subject:** Cloudflare connector sends a structurally invalid `Authorization` value — Cloudflare returns
HTTP 400 / `6003` / `6111` before credential validation

**Impact:** All five Cloudflare tools are unusable on a connection whose credential is reported valid. No
zone, DNS record or account can be read; the three mutating tools cannot be used at all.

**Reproduction (read-only; no credential handled or logged):**
1. `CLOUDFLARE_API_KEY_LIST_ZONES` → `6003` + `error_chain[6111]`.
2. `CLOUDFLARE_API_KEY_LIST_ZONES` with `name=luckypickcanada.ca` → identical.
3. `CLOUDFLARE_API_KEY_LIST_DNS_RECORDS` with `zone_id=0af2a3985db329cdb671829cb59a41f1` →
   `9106 Authentication failed (status: 400)`.

Persistent across two separate connection records (`cloudflare_api_key_dop-scenic`, then
`cloudflare_api_key_gange-suzy`).

**Proof the credential is not the problem:** against the public `/client/v4/zones` endpoint a clean
40-character value returns `403 / 9109 Invalid access token`, a 37-hex Global Key returns `403 / 9103`, and a
missing header returns `403 / 9106`+`9107`. Only empty, placeholder (`Bearer undefined`, `Bearer null`,
`Bearer [object Object]`), whitespace-bearing, quoted or scheme-only values return the observed
`400 / 6003 / 6111` pair. A well-formed token cannot produce this error.

**Candidate defects, most likely first:**
1. The secret lookup resolves to `undefined`, `null` or an object and is interpolated into the header,
   producing `Bearer undefined` or `Bearer [object Object]`.
2. The stored value is JSON-quoted or carries a trailing newline/space from the vault read; a wrapping quote
   or an internal space reproduces `6111` exactly.
3. A connection typed as API-Key routes the token through the legacy path or reformats it (the legacy slot
   returns chain `6103`, so the observed `6111` shows the Authorization path with a bad value).
4. The value is truncated below 40 characters.

**Requested safe diagnostic:** log the outgoing header's **length and character classes only**, never its
value. Lengths 0, 9 (`undefined`), 14 (`null`), 15 (`[object Object]`), 40/41, 42 (quoted) or 41 with a
trailing newline identify the defect immediately without exposing the secret.

**Expected behaviour:** send `Authorization: Bearer <token>` from the token field and fail closed with a
configuration error when the secret is missing, instead of transmitting a placeholder.

**Note:** zone `0af2a3985db329cdb671829cb59a41f1` is known and works with a direct bearer credential, so once
the header is correct both `LIST_ZONES` and `LIST_DNS_RECORDS` should return data with no other change.

## Recommended improvements — for owner approval, not applied

Presented separately because every item is outside an audit-only scope; nothing below was changed.

1. **Cloudflare — the connector sends a bearer value that is not the saved token; the fix is in the
   connector, not the credential.** The `error_chain` names the *Authorization* header (`6111`), which
   excludes the legacy key path (`6103`) and a missing header (`9106/9107`), and a genuine Global API Key
   returns `9103` in that path — never `6111`. Since the same restricted token is reported working as a
   direct bearer credential, the connector must resolve the stored secret, send
   `Authorization: Bearer <token>`, and fail closed instead of emitting a placeholder. Owner check needing
   no new token: confirm the connection is an **API Token** (an API Key connection expects a 37-hex key plus
   an account email) and re-save the same token without quotes or whitespace. Every Cloudflare tool stays
   unusable until a read-only call succeeds.
2. **Reconnect the Google Stitch MCP.** The key is rejected outright, so no Stitch project, screen or
   design-system read can succeed.
3. **Resolve the Context7 governance gap — either connect Context7 or remove the dead references.**
   `AGENTS.md` line 57 plus 8 group files instruct approval before Context7 use, but the tool does not
   exist. Connecting it restores the documented path; removing the sections stops the instructions from
   describing a capability the environment lacks. Both are governance edits needing approval.
4. **Add a short capabilities clause to `AGENTS.md` (optional).** One or two sentences — for example that
   skill selection is not automatic, and that `wrangler`, `workers-best-practices` and `github-actions-docs`
   apply to this repository — would convert an implicit model judgement into a repository rule. Measured
   evidence for the gap: `AGENTS.md` mentions skills zero times.
5. **Prune or replace the unusable skills.** `image-to-code` (relocation stub) and `executing-plans`
   (missing `superpowers` dependencies) cannot work as installed; removing them keeps the library honest,
   and `neon-postgres` would benefit from its parent `neon` skill being installed.

## Library documents reviewed

| Document | USED | USEFUL | Explanation |
|---|---|---|---|
| `.docs/manifest.json` | YES | YES | Enumerated the routed documents per group and showed the Context7 source URLs, which is how the Context7 gap was identified |
| `.docs/deep-dive/_google_eng-practices.md` | NO | NO | No code review guidance was needed for a report-only audit |
| `.docs/troubleshooting/_google_eng-practices.md` | NO | NO | Diagnosis came from live provider error codes, not review guidance |
| `.docs/security/_google_eng-practices.md` | NO | NO | Secret handling was governed by `AGENTS.md` and the `security-review` skill already loaded |
| Context7-routed library entries (`/github/docs`, `/neondatabase/neon`, …) | NO | NO | Unreachable — Context7 is not connected; only local `.docs/` snapshots exist and none was needed |

## Files changed

- Added: `specs/087-skill-mcp-audit/spec.md`, `plan.md`, `tasks.md`, `checklists/requirements.md`
- Modified: `.specify/feature.json`, `PR_SUMMARY.md`, `memory-bank/activeContext.md`
- **No application, test, workflow, dependency, environment, `.docs/` or `AGENTS.md` change.**

## Spec Kit

Specify → Plan → Tasks → Implement, one directory: `specs/087-skill-mcp-audit/`. `087` was the next free
number and no prior feature covered a capability audit, so nothing was duplicated and no earlier artifacts
were reused.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Toolchain restore | **PASS** | pnpm 10.30.3 installed to `$HOME/.local`; `pnpm install --frozen-lockfile` exit 0 (21.3 s) |
| Skill load coverage | **PASS** | 14/14 declared skills returned instructions |
| Skill resource load | **PASS** | `security-review` → `references/injection.md` returned in full |
| MCP discovery | **PASS** | Tool schemas retrieved for all 4 accounts |
| MCP execution | **FAIL (2 of 4 accounts)** | GitHub and Neon returned data; Cloudflare and Stitch returned provider errors. Cloudflare re-tested on the reconnected account at 09:28Z — unchanged `6003/6111` |
| Cloudflare root-cause differential | **PASS** | 20 deliberately shaped fake credentials sent to the public API, reading `errors[]` **and** `error_chain[]`; a clean 40-character value returns `9109`, placeholder/empty/malformed bearer values return `6003`+`6111`, the legacy key slot returns chain `6103`. No real credential used |
| Cloudflare credential-shape hypothesis | **RETRACTED** | The first-round "37-character Global API Key" explanation is refuted by measurement: that shape returns `9103` (with an email) or `9106` (without), and the legacy slot returns `6103`, not `6111` |
| **Cloudflare authentication (LIST_ZONES)** | **FAIL** | `6003` + chain `6111`, HTTP 400 — on every call |
| **Cloudflare authentication (LIST_DNS_RECORDS)** | **FAIL** | zone `0af2a3985db329cdb671829cb59a41f1` passed directly → `9106 Authentication failed (status: 400)` |
| **Cloudflare repair** | **BLOCKED** | defect is in Freebuff's hosted connector; no accessible code or configuration |
| Repository gate | **PASS** | `SPEC_KIT_BASE_REF=0320d475… ./freebuff-verify.sh` exit 0 — Spec Kit gate verified all three artifacts, `tsc --noEmit` clean, production build succeeded, refresh-docs 19 passed / 0 failed |
| Build size | **PASS** | `.next` 301,017,232 B (287.1 MiB) + `public` 32,840,043 B = 333,857,275 B (318.4 MiB) < 495 MB |
| Full Vitest suite | **NOT RUN** | No test-covered code changed; the gate's type check and build cover a documentation-only diff |
| PR-head CI | **PENDING** | Not observed in this session |
| Owner review/merge | **PENDING** | PR left open and unmerged |

## Remaining issues and limitations

- The Freebuff client's internal skill router and connection storage are not inspectable from the
  workspace. All mechanism findings are derived from the interfaces that are exposed, and no claim is made
  about the client's internals.
- Whether a *different* unstated task would trigger a skill was not tested; the conclusion about explicit
  instruction rests on this session, where every invocation traced to the task text plus the measured
  absence of skill guidance in `AGENTS.md`.
- The Cloudflare failure is localised to the connector's bearer value, not to the credential: the same
  restricted token is reported working as a direct bearer credential. The connector's request construction
  and secret lookup are not inspectable from this workspace, so the defect cannot be corrected here and no
  repository change can affect it. Stitch is still undiagnosed beyond its rejection message.
- The repair is **BLOCKED**: the correction belongs to the Freebuff Cloudflare connector's credential
  resolution and header construction, and secondarily to its API-Token vs API-Key configuration. Only a
  successful read-only call can confirm it; none has been made.
- `web-design-guidelines`, `canvas-design` and `extract-design-system` were read but not executed, so their
  runtime dependencies are reported as unverified rather than broken.
- GitHub results reflect a free-tier personal account with 1 public repository; no organisation scopes were
  exercised.

**USEFUL RESULT (audit): YES** — every requested question is answered and every claim is backed by a real
tool call: 14/14 skills loaded, 4/4 MCP accounts exercised, and the two failures are proven with provider
error text rather than inferred.

**USEFUL RESULT (Cloudflare repair follow-up): NO** — the failure is localised with demonstrated evidence and
the earlier explanation is withdrawn, but Freebuff still cannot authenticate, no read-only Cloudflare call
has succeeded, and the correction lies outside the repository.
