# Implementation Plan: Skill Library and MCP Connection Audit

**Feature**: `specs/087-skill-mcp-audit`
**Branch**: `freebuff/d39d4997e3eae68c62117cc1`

## Technical context

- Audit-only task. No application source, dependency, lockfile, workflow, environment or `.docs/` file is
  modified.
- The audited surfaces are the agent's own capabilities, not repository code:
  - the skill discovery surface: the `cloud_read_skill` tool declares 14 skills by name and description,
    and reads one skill's full instructions (plus declared resources) on demand;
  - the connected-app surface: `search_integration_tools` discovers tool schemas per app account, and
    `run_integration_tools` executes them.
- Repository evidence for governance claims: `AGENTS.md`, `.freebuff/freebuff.md`, `.freebuff/*.md`,
  `.specify/integration.json`, `.specify/init-options.json`, `wrangler.jsonc`, `.github/workflows/`.
- Toolchain: pnpm was absent and `node_modules` was absent at baseline; pnpm 10.30.3 was installed to
  `$HOME/.local` and dependencies restored with `pnpm install --frozen-lockfile`.

## Constitution check

- **Single source of truth**: `AGENTS.md` governs the workflow. It is read, not edited.
- **Audit-only scope**: `.freebuff/deep-dive.md` explicitly authorises report-only tasks; the owner's
  request is report-only, so no implementation is forced.
- **Verify before acting**: every MCP verdict comes from a real call; the failing Cloudflare account was
  called twice to separate a persistent fault from a transient one.
- **Secrets**: failure text is quoted as provider codes and messages only. No key, token or connection
  string is read out, printed or committed.
- **MCP approvals**: `AGENTS.md` §5 permits Neon and Stitch without extra approval, requires approval for
  Context7 and other MCPs. The owner's explicit instruction to verify MCP accessibility authorises the
  read-only calls made here; no write tool was invoked.
- **Resource conservation**: `.docs/` is read-only and unmodified; only the manifest was read.

## Design

1. **Inventory** — read the declared skill list, then load each of the 14 skills to confirm it resolves and
   capture its stated purpose and activation rule.
2. **Connectivity** — call `search_integration_tools` once per app to capture tool schemas, then call one
   read-only tool per account: `GITHUB_GET_THE_AUTHENTICATED_USER`, `CLOUDFLARE_API_KEY_LIST_ZONES`,
   `NEON_RETRIEVE_PROJECTS_LIST`, `GOOGLE_STITCH_LIST_PROJECTS`. Retry a failing account once.
3. **Mechanism** — derive discovery, loading, activation and application from the observed interfaces:
   description-level disclosure, explicit on-demand load, per-skill activation rules, and the repository's
   own instruction files.
4. **Gap analysis** — for each skill, check declared dependencies (sub-skills, scripts, MCPs, CLIs, config)
   against what exists in this workspace; for each MCP, check the exposed tools against the repository's
   documented dependencies.
5. **Recommendations** — recorded as proposals for owner approval in the PR summary; nothing is applied.

## Files

- Added: `specs/087-skill-mcp-audit/{spec,plan,tasks}.md`,
  `specs/087-skill-mcp-audit/checklists/requirements.md`
- Updated: `.specify/feature.json`, `PR_SUMMARY.md`, `memory-bank/activeContext.md`
- No application, dependency, workflow, environment, `.docs/` or `AGENTS.md` change.

## Alternatives rejected

- **Editing `AGENTS.md` to add skill guidance** — explicitly forbidden by the request and requiring owner
  authorization; recommendations are recorded instead.
- **Re-authorising the failing MCP connections** — outside the audit boundary and impossible without the
  owner's credentials.
- **Opening a new feature directory for each finding** — governance requires one feature directory per
  task; one set of artifacts covers the audit.
- **Running the full Vitest suite** — no test-covered code changed; the mandatory gate and type check
  cover a documentation-only diff.

## Follow-up investigation — Cloudflare MCP authentication repair

### Technical context

- The failing call is made through the Freebuff connector, whose request construction and credential store
  are not inspectable from the workspace. The credential cannot be read, replaced or rotated here.
- Cloudflare's public API is reachable from the workspace, so the *meaning* of the error code can be
  established independently of the connector by sending deliberately shaped fake credentials.
- Baseline: pnpm 10.30.3 and `node_modules` are present, so the gate can run without reinstall.

### Design

1. **Reproduce** — call the two read-only Cloudflare tools and record the exact code chain. Repeat after
   the connection is replaced, so a stale token can be excluded as the sole cause.
2. **Classify the error** — send fake credentials in five shapes to `/client/v4/zones`: no header, empty
   bearer, token without the `Bearer` scheme, a Global-API-Key-shaped value, and a token-shaped value.
   Record which shape produces which code. This separates "credential absent" from "credential malformed"
   from "credential invalid".
3. **Locate the boundary** — vary the length and character set of the fake value to find what Cloudflare's
   parser accepts as well-formed, so the observed code can be mapped to a shape of credential.
4. **Attribute** — compare the observed MCP error with the differential result. The layer at fault is the
   one whose behaviour reproduces the observed code.
5. **Prescribe** — state the owner's exact corrective action and a secret-free confirmation the owner can
   perform, then record the repair as BLOCKED because it cannot be executed from the workspace.

### Files

- Updated: `specs/087-skill-mcp-audit/{spec,plan,tasks}.md`, `PR_SUMMARY.md`,
  `memory-bank/activeContext.md`.
- No application, dependency, workflow, environment, `.docs/` or `AGENTS.md` change; no Cloudflare resource
  or credential changed.

### Alternatives rejected

- **Re-saving the token from here** — the credential is account-side, and reading or handling it is
  forbidden by the request and by `AGENTS.md` §5.
- **Testing with the real token** — would expose the secret and cannot be done without reading it.
- **Asserting a single cause from one error code** — the differential test exists precisely because the
  code alone is shared by several shapes.

## Verification

- `./freebuff-verify.sh` (Spec Kit gate, type check, production build, refresh-docs tests) with
  `SPEC_KIT_BASE_REF` set to the task base if `origin/main` is stale.
- Measure the production build against the 495 MB maximum.
- Inspect the complete final diff and confirm it contains only the artifacts listed above.

## Follow-up round 2 — header construction, not credential shape

### Technical context

- The owner reports the restricted token authenticates as a direct bearer credential, so the credential is
  treated as valid and the first-round explanation becomes a hypothesis to re-test.
- Cloudflare nests the specific reason in `error_chain`, so a probe that reads only `errors[]` cannot see
  `6111` at all. The second round parses both fields.

### Design

1. **Re-read the payload shape** — capture `errors[]` and `error_chain[]` verbatim for every probe.
2. **Discriminate the paths** — bearer with a token-shaped value (`9109`), bearer with a placeholder or empty
   value (`6003`+`6111`), token in `X-Auth-Key` with an email (`6003`+`6103`), Global-Key shape with an email
   (`9103`), `X-Auth-Key` alone (`9106`), and no credential headers (`9106`+`9107`).
3. **Refute the first round** — the Global-Key and doubled-prefix explanations cannot produce `6111`; record
   the withdrawal with the counter-evidence instead of deleting the old text.
4. **Locate the construction** — search the repository for a Cloudflare API client, `Authorization`
   construction or MCP configuration; a nil result places the defect in the connector runtime.
5. **Prescribe** — the connector must resolve the stored token, send `Authorization: Bearer <token>` and fail
   closed instead of emitting a placeholder; the owner's no-new-token check is the connection type plus a
   clean re-save.

### Measured result

- `Bearer undefined` → `6003`/`6111`; empty bearer → `6003`/`6111`; internal space → `6003`/`6111`;
  scheme-only and non-bearer schemes → `6003`/`6111`; clean 40 characters → `9109`.
- Token in `X-Auth-Key` + email → `6003`/**`6103`**; 37-hex key + email → `9103`; `X-Auth-Key` alone →
  `9106`; doubled `Bearer ` prefix → `9109`.
- Repository search: no `api.cloudflare.com` client, no `Authorization` header construction, and zero MCP
  configuration files, so the header cannot be built anywhere in this workspace.

### Alternatives rejected

- **Repeating the first-round credential-shape conclusion** — contradicted by the direct bearer success and
  by the `9103`/`6103` measurements.
- **Asking for a new token** — excluded by the request; the working credential already exists.
- **Editing the connector** — it is platform code outside the workspace; the correction is prescribed, not
  applied.

### Files

- Updated: `specs/087-skill-mcp-audit/{spec,plan,tasks}.md`, `PR_SUMMARY.md`,
  `memory-bank/activeContext.md`. No application, dependency, workflow, environment, `.docs/` or `AGENTS.md`
  change.

## Follow-up round 3 — zone-scoped endpoint and escalation

### Technical context

- A zone ID (`0af2a3985db329cdb671829cb59a41f1`) was supplied, which for the first time allows the DNS
  endpoint to be called directly instead of being blocked by the zone-list failure.
- Success criteria require real provider data from both endpoints, so a connected indicator is insufficient.

### Design

1. Call `LIST_ZONES` with a name filter and `LIST_DNS_RECORDS` with the supplied zone ID, read-only.
2. Classify both failures by HTTP status as well as code: `400` means a structurally invalid header, `403`
   means a well-formed credential was rejected.
3. Compare with the established probe matrix to decide whether the credential can be the cause.
4. Because no connector code or configuration is reachable, produce an engineering escalation instead of
   inventing a repository fix.

### Measured result

- `LIST_ZONES` → `6003` + chain `6111` (HTTP 400); `LIST_DNS_RECORDS` → `9106 (status: 400)`.
- No read-only call has returned zone or DNS data, so the repair is not achieved.

## Follow-up round 4 — credential-shape boundary and a committed verifier

### Technical context

- Revision 2 and revision 3 disagreed with revision 1 about the credential shape, and both used `/zones`
  only. The connector actually calls two endpoints, and in the same session they returned two different
  codes, which no single-endpoint probe can explain.
- Cloudflare validates the `Authorization` header's format before the credential's identity, so the code
  class identifies the *shape* of the transmitted value but not the value itself.
- The repository has no Cloudflare client and no MCP configuration, so no application change can repair the
  connection. A verifier is the only artifact that can be usefully implemented here.

### Design

1. **Reproduce, repeatedly** — four read-only connector calls in separate requests (three zone listings, one
   DNS listing), which also tests the connector's documented "retry resolves the failure" claim.
2. **Sweep the boundary** — send synthetic bearer values of length 1, 8, 9, 31, 32, 36, 37, 38, 39, 40, 41
   and 64, plus a 40-character value containing an off-charset character, to both endpoints, and record HTTP
   status plus the full `error_chain`.
3. **Match the signature** — compare the connector's two errors with the sweep. A shape that reproduces
   both, and only that shape, is the transmitted value's shape.
4. **Re-test the legacy path correctly** — verify whether a 37-hex value works as a bearer (it does not) as
   well as in `X-Auth-Key` (it does), because revision 2 conflated the two transports.
5. **Implement the check** — `scripts/cloudflare-auth-diagnose.mjs`, read-only and dependency-free, classifies
   a credential by shape without printing it and, when given one, performs the two read-only calls the
   connector needs. `--probe` replays the synthetic matrix so the evidence is reproducible.
6. **Prescribe a remedy that is robust** — supply a 40-character scoped API Token through the connector's
   existing bearer path; if the Global API Key must be kept, the connector has to send `X-Auth-Key` plus
   `X-Auth-Email` instead, which is platform work outside this repository.

### Files

- Added: `scripts/cloudflare-auth-diagnose.mjs`
- Updated: `specs/087-skill-mcp-audit/{spec,plan,tasks}.md`, `PR_SUMMARY.md`,
  `memory-bank/activeContext.md`
- No application, test, dependency, workflow, environment, `.docs/` or `AGENTS.md` change; no credential,
  connection, DNS record or account setting touched.

### Alternatives rejected

- **Changing the connection or supplying a new token from here** — the credential is account-side; reading,
  handling or rotating it is forbidden by the request and by `AGENTS.md` §5.
- **Dispatching a workflow with `secrets.CLOUDFLARE_API_TOKEN` to prove read access** — using the repository
  secret for a new purpose is a Cloudflare/secret change requiring owner authorisation, so the successful
  deploy run is cited as evidence instead of being re-used.
- **A vitest unit test for the verifier** — the assertion value would be this script's own constants; running
  it for real against the live read-only endpoint is the stronger evidence the testing group asks for.

### Files

- Updated: `specs/087-skill-mcp-audit/{spec,plan,tasks}.md`, `PR_SUMMARY.md`,
  `memory-bank/activeContext.md`.
