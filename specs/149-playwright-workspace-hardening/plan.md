# Implementation Plan: Playwright Workspace Hardening

**Feature**: `specs/149-playwright-workspace-hardening` · **Branch**: `freebuff/78543caa3c21f40958fc74d4` · **Date**: 2026-11-12

## Technical Context

| Item | Value |
| --- | --- |
| Language / runtime | Bash 5 (POSIX-style scripts), TypeScript config loaded by Playwright/vitest, Node.js 26.x |
| Browser tooling | `playwright` / `@playwright/test` / `playwright-chromium` 1.64.1, Chromium revision 1248 |
| Package manager | pnpm 10.30.3, pinned in `package.json#packageManager`, bootstrapped into `$HOME/.local` |
| Affected files | `scripts/playwright-cli.sh`, `playwright.config.ts`, two test files |
| Unaffected | Dependencies, lockfile, workflows, application code, hosting, `AGENTS.md` |
| Verification | `bash -n`, wrapper dry-runs, focused vitest, scrubbed-`PATH` execution, live launch, `freebuff-verify.sh`, build size |

No dependency or platform change is involved, so no research artifact was needed. The existing scripts already contain
the primitives the fixes reuse (`bootstrap-pnpm.sh`, `setup-chromium-libs.sh --browser-root`, the prefix paths in
`configureChromiumRuntime`), which keeps the change small.

## Constitution Check

- **Smallest correct change**: three targeted edits; no refactor of the wrapper's argument handling.
- **Preserved behaviour**: dry-run strings, `--browser` passthrough, `test` routing, system-runtime and prebaked-root
  handling, and `setup-playwright-agent.sh`'s existing contract are unchanged.
- **Protected areas**: no change to security, payments, data, authentication, hosting, deployment, environment
  configuration or secrets.
- **Build size**: no application or asset change; the 495 MiB cap is unaffected and is measured anyway.
- **One feature directory**: all Spec Kit artifacts live under `specs/149-playwright-workspace-hardening/`.

## Phase 0 — Research

Not required. Each fix reuses an existing, already-tested mechanism in the repository; the only design decision is to
delegate the revision decision to `--browser-root` instead of duplicating the pin logic in the wrapper.

## Phase 1 — Design

### FR-001 / FR-002 — `scripts/playwright-cli.sh`

1. Move `source "$ROOT/scripts/bootstrap-pnpm.sh"` above the `node_modules/.bin/playwright` guard so the pinned pnpm is
   always resolved (idempotent; installs only when the pin is absent). Keep the frozen install conditional.
2. Replace `compgen -G "$HOME/.cache/ms-playwright/chromium-*"` with
   `bash "$ROOT/scripts/setup-chromium-libs.sh" --browser-root`; install only when it reports failure.

### FR-003 — `playwright.config.ts`

Treat both variables as usable only when `fs.existsSync` accepts them; otherwise assign the provisioned prefix value.
A valid inherited configuration (developer machine, CI, environment-provided prefix) is left untouched.

### FR-006 — tests

- `__tests__/playwright-cli-wrapper.test.js`: assert the bootstrap precedes the dependency guard and that the browser
  step delegates to `--browser-root` instead of a revision-agnostic glob.
- `__tests__/playwright-config-fontconfig.test.js`: load the real config module against a temporary prefix fixture and
  assert the stale-inherited and valid-inherited cases.

## Phase 2 — Verification

| Check | Command |
| --- | --- |
| Shell syntax | `bash -n scripts/playwright-cli.sh` |
| Wrapper contract | `./scripts/playwright-cli.sh --dry-run open … / test / --browser=firefox` |
| Scrubbed shell (FR-001) | `env -i HOME=$HOME PATH=/usr/local/bin:/usr/bin:/bin ./scripts/playwright-cli.sh --raw list` |
| Pinned browser gate (FR-002) | browser root holding only a foreign revision → wrapper installs Chromium 1248 |
| Fontconfig (FR-003) | focused `vitest run __tests__/playwright-config-fontconfig.test.js` |
| Live workflow | `./scripts/playwright-cli.sh open https://luckypickcanada.ca` + full-page screenshot |
| Repository gate | `./freebuff-verify.sh` (type check, build, governance tests, docs tests) |
| Build size | `du -sb .next` against the 495 MiB cap |

## Risks and Mitigations

- **Extra output on every call**: `bootstrap-pnpm.sh` prints one status line to stderr when it resolves pnpm. Accepted;
  stdout, `--raw` pipelines and dry-run output are unchanged.
- **An extra `--browser-root` call per invocation**: a few `stat` calls plus one node evaluation of the pin. Measured
  against the previous warm-start time; the download decision stays correct.
- **Config import in tests**: guarded to Linux and restored to the pre-test environment afterwards so the suite itself
  cannot leak a font path.
