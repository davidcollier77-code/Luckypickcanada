# Tasks: Skill Library and MCP Connection Audit

**Feature**: `specs/087-skill-mcp-audit`

## Phase 1 — Setup and baseline

- [x] **T001** Read `AGENTS.md`, `.freebuff/freebuff.md`, `memory-bank/projectBrief.md`,
  `memory-bank/activeContext.md` and `.docs/manifest.json`; select the task groups.
- [x] **T002** Read `.freebuff/deep-dive.md`, `.freebuff/troubleshooting.md`, `.freebuff/security.md` and
  `.freebuff/testing.md`; confirm audit-only scope is authorised.
- [x] **T003** Inspect branch, worktree and Spec Kit state: `specs/` ends at `086`, `087` was free,
  `.specify/feature.json` pointed at `086`, no MCP configuration file exists in the repository.
- [x] **T004** Restore the toolchain: pnpm 10.30.3 installed to `$HOME/.local`, dependencies restored with
  `pnpm install --frozen-lockfile` (exit 0).

## Phase 2 — Skill inventory (US1)

- [x] **T005** [US1] Enumerate the 14 skills declared by the discovery surface with their descriptions.
- [x] **T006** [US1] Load each of the 14 skills and record its purpose, activation rule and declared
  resources: `frontend-design`, `web-design-guidelines`, `image-to-code`, `shadcn-ui`, `wrangler`,
  `verification-before-completion`, `executing-plans`, `security-review`, `github-actions-docs`,
  `canvas-design`, `systematic-debugging`, `workers-best-practices`, `neon-postgres`,
  `extract-design-system`.
- [x] **T007** [US1] Record per-skill limitations: the `image-to-code` relocation stub with
  `disable-model-invocation: true`; `shadcn-ui`'s `mcp_shadcn*` dependency with no shadcn MCP and no
  `components.json`; `executing-plans` and `systematic-debugging`'s uninstalled `superpowers:*` sub-skills
  and scripts; `neon-postgres`'s missing parent `neon` skill and absent `neon` CLI; `extract-design-system`'s
  external package.

## Phase 3 — MCP verification (US1 + US2)

- [x] **T008** [US2] Discover tool schemas for all four connected accounts with
  `search_integration_tools`.
- [x] **T009** [US2] Verify GitHub with `GITHUB_GET_THE_AUTHENTICATED_USER` — returned the authenticated
  profile (`davidcollier77-code`). VERIFIED WORKING.
- [x] **T010** [US2] Verify Neon with `NEON_RETRIEVE_PROJECTS_LIST` — returned three projects in
  `org-wild-boat-43871967`. VERIFIED WORKING.
- [x] **T011** [US2] Verify Cloudflare with `CLOUDFLARE_API_KEY_LIST_ZONES` — HTTP-level error 6003
  "Invalid request headers" with chain 6111 "Invalid format for Authorization header"; repeated once with
  the same result. FAILING.
- [x] **T012** [US2] Verify Stitch with `GOOGLE_STITCH_LIST_PROJECTS` — "Google Stitch rejected the
  connected API key." FAILING.
- [x] **T013** [US2] Confirm no write, delete, overwrite or deploy tool was invoked.

## Phase 4 — Activation analysis (US3)

- [x] **T014** [US3] Measure repository instruction coverage: `AGENTS.md` contains zero occurrences of
  "skill"; its only MCP sentence is the approval rule on line 57.
- [x] **T015** [US3] Establish that Context7 is not a connected app, so the "Controlled Context7 Libraries"
  approval rule in `AGENTS.md` and every group file currently gates nothing.
- [x] **T016** [US3] Attribute every skill load and MCP call in this session to the explicit task
  instruction that caused it, and record the auto-discovery conclusion.

## Phase 5 — Report and verification

- [x] **T017** Write `spec.md`, `plan.md`, `tasks.md` and `checklists/requirements.md`; point
  `.specify/feature.json` at this feature.
- [x] **T018** Draft the recommendations section as proposals for owner approval only; apply none.
- [x] **T019** Run `./freebuff-verify.sh` (exit 0: Spec Kit gate verified spec/plan/tasks, type check
  clean, production build succeeded, refresh-docs 19 passed) and measure the build — `.next` 301,017,232 B
  (287.1 MiB) plus `public` 32,840,043 B = 333,857,275 B (318.4 MiB), below the 495 MB maximum.
- [x] **T020** Inspect the complete final diff (3 modified files plus 4 added artifacts; no application,
  test, workflow, dependency, environment or `.docs/` change; secret scan clean), update `PR_SUMMARY.md`
  and `memory-bank/activeContext.md`, commit `debc7d1e`, push, and open PR #1705 unmerged.

## Phase 6 — Post-reconnection re-verification

- [x] **T021** Re-test the replaced Cloudflare connection (`cloudflare_api_key_gange-suzy`) with read-only
  calls only: `CLOUDFLARE_API_KEY_LIST_ZONES` twice (unfiltered then name-filtered) both returned
  `6003 Invalid request headers` / `6111 Invalid format for Authorization header`, so authentication still
  fails, no account can be identified, the `luckypickcanada.ca` zone cannot be reached, and DNS records
  cannot be listed. All five Cloudflare tools remain discoverable; the three mutating ones were never
  invoked. Recorded in `PR_SUMMARY.md` and the PR #1705 body.

## Phase 7 — Cloudflare root-cause repair (follow-up)

- [x] **T022** Reproduce the failure on the current connection and record the error verbatim
  (`6003` / chain `6111`) for two differently-parameterised read-only calls.
- [x] **T023** Classify what the code means by sending deliberately shaped **fake** credentials to the
  public `api.cloudflare.com/client/v4/zones` endpoint: absent header → `9106/9107`; empty bearer, missing
  scheme, 32–39 characters, 37-character hex Global-API-Key shape, quoted value, or 40 characters with an
  internal space or `!` → `6003/6111`; clean 40–41 character token-charset value → `9109 Invalid access
  token`. No real credential was used or read.
- [x] **T024** Attribute the fault to the layer whose behaviour reproduces the observed code: the saved
  credential value in the Freebuff Cloudflare connection, not the repository, the tool schema or Cloudflare
  availability.
- [x] **T025** State the exact owner correction (scoped API Token with Zone:Read + DNS:Read, pasted as one
  unbroken 40-character string) plus a secret-free self-check (37 hex characters means a Global API Key;
  40 characters means a token) and record the repair as **BLOCKED** until a read-only call succeeds.
- [x] **T026** Map the boundary precisely — 39 characters still yields `6111`, 40 yields `9109` — so the
  finding rests on a measured threshold rather than a single sample.

## Phase 8 — Header-construction repair investigation (revision 2)

- [x] **T027** Re-read the provider payload with `error_chain` included and confirm `6111` is a chain child
  of `6003`, not a second top-level error.
- [x] **T028** Probe the discriminating bearer shapes: `Bearer undefined`, empty bearer, an internal space,
  scheme-only and non-bearer schemes all return `6003`/`6111`; a clean 40-character value returns `9109`.
- [x] **T029** Probe the legacy path: a token in `X-Auth-Key` + email returns chain `6103`; a genuine 37-hex
  Global-Key shape returns `9103`; `X-Auth-Key` alone returns `9106`. This **withdraws** the first-round
  claim that a Global API Key produces `6111`, and excludes a doubled `Bearer ` prefix (`9109`).
- [x] **T030** Attribute the fault to the connector's credential resolution and `Authorization`
  construction: a valid token cannot yield `6111`, so the transmitted value is a placeholder, empty or
  whitespace-mutated.
- [x] **T031** Demonstrate that no repository change can fix it: `code_search` finds no `api.cloudflare.com`
  client and no `Authorization` construction, and no MCP configuration file exists in the workspace.
- [x] **T032** Prescribe the correction (connector: resolve the secret, send `Authorization: Bearer <token>`,
  fail closed) plus the owner's no-new-token check (API Token connection, clean re-save), and keep the repair
  **BLOCKED** until a read-only call succeeds.

## Phase 9 — Zone-scoped retest and engineering escalation (revision 3)

- [x] **T033** Call `CLOUDFLARE_API_KEY_LIST_ZONES` with a `luckypickcanada.ca` name filter — `6003` with
  chain `6111`, HTTP 400.
- [x] **T034** Call `CLOUDFLARE_API_KEY_LIST_DNS_RECORDS` with the supplied zone ID
  `0af2a3985db329cdb671829cb59a41f1` — `9106 Authentication failed (status: 400)`, so a known zone ID does
  not bypass authentication.
- [x] **T035** Classify by transport status: `400` accompanies every malformed-header case and `403` every
  invalid-credential case, so the request is structurally invalid before identity is evaluated.
- [x] **T036** Confirm no accessible connector surface exists (no MCP configuration, no Cloudflare client, no
  secret store) and that the connector must not be disconnected.
- [x] **T037** Decide that no repository-side fix is possible; the correction is Freebuff platform work.
- [x] **T038** Write the engineering escalation — reproduction, evidence, four candidate defects, the
  length/character-class diagnostic to run, and the expected fail-closed behaviour.

## Phase 10 — Fresh re-test, boundary measurement and committed verifier (revision 4)

- [x] **T039** Re-read `AGENTS.md`, `.freebuff/freebuff.md`, the Memory Bank and the selected group files;
  groups for this round: `troubleshooting` + `deep-dive` + `security` + `testing`.
- [x] **T040** Reproduce on the live connection in four separate calls: `LIST_ZONES` ×3 (unfiltered,
  name-filtered, unfiltered again) and `LIST_DNS_RECORDS` ×1 — all failed, no retry succeeded, so the
  connector's documented "failing auth resolves on retry" claim does not apply.
- [x] **T041** Sweep synthetic bearer values (length 1, 8, 9, 31, 32, 36, 37, 38, 39, 40, 41, 64, plus a
  40-character off-charset value) against `/zones` and `/zones/{id}/dns_records`, recording HTTP status and
  the full `error_chain`.
- [x] **T042** Match the signature: a 37-hex bearer reproduces `6003`+`6111` on `/zones` and
  `9106 Authentication failed (status: 400)` on the DNS endpoint — both connector errors from one value.
- [x] **T043** Withdraw revision 2's withdrawal with the refuting measurement (it tested the Global-API-Key
  shape only in `X-Auth-Key`, never as a bearer, and 37 characters cannot satisfy the 40-character bearer
  format); record that both the 37-hex and short-placeholder hypotheses remain open.
- [x] **T044** Confirm the repository still offers no Cloudflare client or MCP configuration, so no
  application change can repair the connection; corroborate the account's working token path with GitHub
  Actions run `41822284071` (`success`, `CLOUDFLARE_API_TOKEN` only).
- [x] **T045** Implement `scripts/cloudflare-auth-diagnose.mjs` — read-only, dependency-free, never prints
  the credential, classifies its shape and verifies the two read-only calls; `--probe` replays the matrix.
- [x] **T046** Execute the verifier for real: `node --check` passed; no-credential path reports `absent` and
  exits 2; a synthetic 37-hex value is refused without a network call (exit 2); a synthetic 40-character
  value reaches identity validation (`/user/tokens/verify` 401/`1000`, `/zones` 403/`9109`,
  `/dns_records` 401/`10000`) and exits 2; `--probe` replayed the full matrix on both endpoints.
- [x] **T047** `SPEC_KIT_BASE_REF=HEAD ./freebuff-verify.sh` exit 0 (Spec Kit gate verified spec/plan/tasks;
  type check clean; production build succeeded; refresh-docs 19 passed). Build `.next` 301,019,497 B plus
  `public` 32,840,043 B = 333,859,540 B (318.4 MiB), below the 495 MB maximum.
- [x] **T048** Audit the complete final diff (6 files: the verifier, three Spec Kit artifacts, the PR
  summary and the Memory Bank entry; no application, test, dependency, workflow, environment, `.docs/` or
  `AGENTS.md` change; secret scan clean), commit `78d63c60`, push to
  `freebuff/470e1a482c31244d064438de` and open PR #1707, left open and unmerged.
