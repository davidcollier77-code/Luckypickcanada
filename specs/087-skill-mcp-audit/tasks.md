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
