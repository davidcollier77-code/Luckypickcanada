# Active Context — Harden the Remaining Playwright Failure Points

- **Updated:** 2026-11-12
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/78543caa3c21f40958fc74d4`
- **Base:** `main` at `9fbe7a21` (PR #1854, "reuse an environment-provided Chromium runtime")
- **Spec Kit feature:** `specs/149-playwright-workspace-hardening` (continues `specs/146-*`, `147-*`, `148-*`)

## Current Task

A verification assessment of the Playwright setup found it working from a cold workspace and identified three failure
points. This task fixes exactly those three.

## What changed

- `scripts/playwright-cli.sh`: `bootstrap-pnpm.sh` is sourced on every call, before the
  `node_modules/.bin/playwright` guard, because the wrapper always `exec`s a pnpm command. A shell without
  `$HOME/.local/bin` on `PATH` previously died with `exec: pnpm: not found` (exit 127).
- `scripts/playwright-cli.sh`: the Chromium download decision now calls
  `scripts/setup-chromium-libs.sh --browser-root` instead of `compgen -G "$HOME/.cache/ms-playwright/chromium-*"`, so a
  cache from a different Playwright version is repaired instead of trusted.
- `playwright.config.ts`: an inherited `FONTCONFIG_FILE`/`FONTCONFIG_PATH` is trusted only when it exists; otherwise the
  provisioned prefix wins. A shell can carry a stale path from another chat's home.
- Tests: two guard assertions in `__tests__/playwright-cli-wrapper.test.js` and a new
  `__tests__/playwright-config-fontconfig.test.js` that loads the real config module against a temporary prefix fixture.

No dependency, lockfile, workflow, application, hosting or `AGENTS.md` change.

## Verified behaviour (this workspace)

Environment baseline: per-chat `$HOME`, non-root, no system Chromium libraries, no `/etc/fonts`, `pnpm` only in
`~/.local/bin`, and inherited `FONTCONFIG_FILE`/`FONTCONFIG_PATH` pointing at a different chat's home that no longer
exists.

| Check | Result |
| --- | --- |
| Documented startup command (cold, before the change) | exit 0 in 41 s; Chromium 1248 + 27 MB prefix; probe PASS |
| Wrapper in a shell without `~/.local/bin` | exit 0 (was 127) |
| Wrapper with only a foreign-revision browser cache | installs `chromium-1248`, then launches; 11 s |
| Warm launch | 4 s, no download, correct live title |
| Focused tests | 9 tests in 2 files pass |
| Unit suite | 66 files, exit 0 |
| `./freebuff-verify.sh` | exit 0 in 78 s |
| Production build | 306,083,516 bytes = 291.90 MiB (cap 495 MiB) |
| Live full-page capture | PNG 1280 × 9366, 7 images, 0 broken, fonts loaded |

Evidence: `artifacts/playwright-verification/verification.md`.

## Durable Locations (unchanged by this task)

- Libraries: `~/.local/chromium-libs` (27 MB, no root) when the system has none; `~/.apt-user` for apt state.
- Browser: `~/.cache/ms-playwright` (Chromium 1248) unless an environment-provided root is present.
- Environment: `~/.local/chromium-libs/env.sh`, sourced from `~/.profile` and `~/.bashrc`; Playwright CLI config at
  `~/.playwright/cli.config.json`.

## Known Context Risks

- A chat's `$HOME` is per-chat, so a new chat is cold again (~41 s). The wrapper self-heals on first use.
- An inherited `FONTCONFIG_FILE`/`FONTCONFIG_PATH` naming another workspace is now repaired by the wrapper and the test
  config, but the stale variables still arrive in the container environment; clearing them where project environment
  variables are configured would remove the last source of confusion.
