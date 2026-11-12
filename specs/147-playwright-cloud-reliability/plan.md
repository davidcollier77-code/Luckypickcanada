# Implementation Plan: Reliable Playwright Browser Work in a Cold Freebuff Cloud Workspace

**Feature**: `specs/147-playwright-cloud-reliability`
**Branch**: `freebuff/db0186c675176d0ca7d8d91e`

## Technical context

- The failing surfaces are the workspace, not the application: a corrupted provisioning script, an image without
  Chromium's shared libraries or a system Chrome, and non-interactive shells that never read `~/.profile`.
- The startup command lives in Freebuff project settings, outside the repository. It did not run for this chat, so the
  plan cannot assume it.
- Toolchain: Node 26.13.0, pnpm 10.30.3, Playwright 1.64.1 (Chromium 1248).

## Constitution check

- **Smallest correct change**: one corrupted line repaired, one wrapper added, one focused test file, documentation.
  No application, dependency, workflow, hosting or secret change.
- **No weakened checks**: the fix adds a parse guard rather than relaxing one; nothing is skipped.
- **Evidence first**: every claim below comes from a command run in this workspace.
- **Governance**: `AGENTS.md` is untouched, so the protected-governance approval path is not triggered; the browser
  guidance lives in the vendored skill that `AGENTS.md` already points at.

## Design

1. **Repair** `scripts/setup-chromium-libs.sh`: the reuse branch lost the closing quote and argument of its `printf`,
   so the file could not parse. Restore `printf '%s\n' "$check_output"` followed by the blank line and echo. This
   alone makes provisioning, `--check`, `--env` and `--persist` reachable again.
2. **Wrapper** `scripts/playwright-cli.sh`: resolve the repository root, then in order ensure `node_modules` (sourcing
   the pnpm bootstrap and running the frozen install), ensure the library prefix (run `--check`, provision on failure),
   ensure the pinned browser (install when no `chromium-*` cache entry exists), apply `--env`, and `exec` the CLI.
   Add `--browser=chromium` to `open` only when the caller gave no `--browser`. Pass `test` through unchanged.
   Support `--dry-run` so the argument logic is testable without launching anything.
3. **Guard test** `__tests__/playwright-cli-wrapper.test.js`: run `bash -n` over every `scripts/*.sh` plus the root
   entrypoints, and assert the four argument paths through `--dry-run`.
4. **Documentation**: `README.md` replaces the manual `eval`/`--browser` paragraph with the wrapper; the vendored skill
   and its project reference name the wrapper as the command to use in Freebuff Cloud.

## Alternatives rejected

- **Editing `AGENTS.md`** — protected governance, unnecessary: the skill it already references is the right home for
  the command.
- **Project-level Variables** for `LD_LIBRARY_PATH` — the prefix sits under a per-chat `$HOME`
  (`/workspace/homes/<workspace-id>`), so a project-wide constant would be wrong for every other chat.
- **A second browser or a system Chrome install** — duplicates a working runtime and needs root the image refuses.
- **Relying on the startup command** — it demonstrably did not run here, so it cannot be the reliability mechanism.

## Verification

- `bash -n` on every script; focused Vitest suite; a cold-provision run with the prefix moved aside; a wrapper launch
  with `LD_LIBRARY_PATH` unset; a screenshot; `./freebuff-verify.sh`.
