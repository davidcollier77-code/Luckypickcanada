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

## Verification

- `./freebuff-verify.sh` (Spec Kit gate, type check, production build, refresh-docs tests) with
  `SPEC_KIT_BASE_REF` set to the task base if `origin/main` is stale.
- Measure the production build against the 495 MB maximum.
- Inspect the complete final diff and confirm it contains only the artifacts listed above.
