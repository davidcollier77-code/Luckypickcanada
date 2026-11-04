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
| **Cloudflare Api Key** `cloudflare_api_key_gange-suzy` (reconnected; replaced `cloudflare_api_key_dop-scenic`) | `LIST_ZONES`, `LIST_DNS_RECORDS`, `CREATE_DNS_RECORD`, `OVERWRITE_DNS_RECORD`, `DELETE_DNS_RECORD` | `CLOUDFLARE_API_KEY_LIST_ZONES` ×2 (unfiltered, then name-filtered) | **FAILING** — error `6003 Invalid request headers`, chain `6111 Invalid format for Authorization header`. Identical on both calls after reconnection, so the fault is the credential format, not the previous connection |
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

### Root cause — the saved value is not a well-formed API token (demonstrated)

Cloudflare classifies a credential's shape before it validates its identity, so the error code itself
identifies the fault. Deliberately shaped **fake** credentials were sent from the workspace to the public
`/client/v4/zones` endpoint — no real credential was used, read or transmitted — giving this mapping:

| `Authorization` value shape | Cloudflare response |
|---|---|
| header absent entirely | `9106 Missing X-Auth-Email` + `9107 Missing X-Auth-Key` |
| `Bearer` with empty value | `6003 / 6111 Invalid format for Authorization header` |
| value with no `Bearer` scheme | `6003 / 6111` |
| `Bearer` + 32, 36, 37, 38 or 39 characters | `6003 / 6111` |
| `Bearer` + 37-character hex (Global API Key shape) | `6003 / 6111` |
| `Bearer` + 40 characters containing `!`, an internal space, or wrapping quotes | `6003 / 6111` |
| `Bearer` + 40 or 41 characters from `[A-Za-z0-9_-]` | **`9109 Invalid access token`** |

Two conclusions follow directly from that table:

1. **A credential is being sent.** An absent header returns `9106/9107`; an empty, schemeless or malformed
   value returns `6003/6111`. The MCP returns `6003/6111`, so Freebuff *is* attaching an
   `Authorization: Bearer …` header, and Cloudflare refuses its **value** — this is not a missing token and
   not a scope problem.
2. **The value is not a clean API token.** A syntactically valid 40-character token, even a completely
   fake one, is parsed and rejected as *invalid* (`9109`). Anything shorter than 40 characters, carrying a
   quote or an internal space, or shaped like a 37-character Global API Key is rejected as *malformed*
   (`6111`) — the exact error the MCP reports.

**Root cause: the credential value stored in the Freebuff Cloudflare connection**, not the repository, not
the tool schema, and not Cloudflare availability. The most likely specific cause is a **Global API Key
(37 hex characters) saved where an API Token is expected** — the classic confusion for a connector named
"Cloudflare Api Key" — with a quoted, spaced or truncated paste as the other shape that reproduces the
identical code.

**Exactly what needs correcting** (owner action; not performable from this workspace):

1. Use a **scoped API Token**, not a Global API Key, carrying **Zone:Read** and **DNS:Read** for
   `luckypickcanada.ca`.
2. Paste it into the Freebuff Cloudflare connection as one unbroken 40-character string — no quotes, no
   spaces, no trailing newline.
3. Secret-free self-check the owner can do alone: **37 hex characters means a Global API Key** (wrong
   credential type); **40 characters means an API Token** (correct). A clean 40-character token cannot
   produce `6111`, so if `6111` persists after saving one, the connector itself is corrupting the value.
4. Re-run `CLOUDFLARE_API_KEY_LIST_ZONES`; a successful zone list is the only thing that confirms the
   repair. Until that call succeeds the repair is **BLOCKED**, not complete.

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

## Recommended improvements — for owner approval, not applied

Presented separately because every item is outside an audit-only scope; nothing below was changed.

1. **Cloudflare — replace the saved credential; reconnecting alone did not help.** The reconnected account
   reproduced `6003/6111` exactly, and the error-code differential above shows that code means a
   *malformed* bearer value. Save a scoped **API Token** (40 characters from `[A-Za-z0-9_-]`, Zone:Read +
   DNS:Read) instead of a 37-character Global API Key, with no quotes or whitespace. Every Cloudflare tool
   stays unusable until a read-only call succeeds.
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
| Cloudflare root-cause differential | **PASS** | 11 deliberately shaped fake credentials to the public API mapped every error class; a clean 40-character value returns `9109`, everything malformed returns `6003/6111`. No real credential used |
| Cloudflare authentication repair | **BLOCKED** | The credential is stored account-side; it cannot be read or replaced from the workspace, so the fix is owner action |
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
- The Cloudflare root cause is identified (a malformed bearer value — see the differential), but the value
  itself cannot be inspected, corrected or replaced from this workspace, so the connection still cannot
  authenticate. The claim rests on Cloudflare's measured error classes, not on knowledge of what the owner's
  specific string contains. Stitch is still undiagnosed beyond its rejection message.
- The repair is **BLOCKED** on owner action: a scoped API Token must be saved in Freebuff before any
  Cloudflare read can succeed, and only a successful read-only call can confirm it.
- `web-design-guidelines`, `canvas-design` and `extract-design-system` were read but not executed, so their
  runtime dependencies are reported as unverified rather than broken.
- GitHub results reflect a free-tier personal account with 1 public repository; no organisation scopes were
  exercised.

**USEFUL RESULT: YES** — every requested question is answered and every claim is backed by a real tool
call: 14/14 skills loaded, 4/4 MCP accounts exercised, and the two failures are proven with provider error
text rather than inferred. The two broken connections are **findings about the audited systems**, not unmet
audit criteria; repairing them needs the owner's credentials and is listed as an approval-gated
recommendation.
