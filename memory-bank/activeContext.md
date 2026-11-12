# Active Context — Portable Playwright Chromium Runtime

- **Updated:** 2026-11-12
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/0fe51d9fb70d7d5eedbd7455`
- **Base:** `main`
- **Spec Kit feature:** `specs/147-playwright-portable-runtime` (continues `specs/146-playwright-chromium-runtime`)

## Current Task

Make the Chromium and Playwright setup provision itself in a brand-new workspace instead of depending on state left
behind by earlier sessions, with no workspace-specific environment variables to add by hand.

## Root Cause

The libraries and the Chromium 1248 browser were already provisioned in `~/.local/chromium-libs`, so the missing
`libnspr4.so` was not an install failure. The startup command exported the paths with `eval "$(… --env)"`, which died
with that process; Freebuff tool shells are non-login, non-interactive `bash -c` processes (`$-` = `hBc`, `BASH_ENV`
unset) and `$HOME` had no `.profile`/`.bashrc`, so every later launch started with no library path. A second defect:
`--check` inspected only `chrome`, while a headless `chromium.launch()` runs `chrome-headless-shell`.

## Implementation

- `scripts/setup-chromium-libs.sh`: `check_libs` is a browser-independent file test over the required shared objects,
  fontconfig and fonts; `--check-libs` exposes it, `--check` stays strict (both Chromium binaries, `ldd`);
  provisioning gates and verifies on `check_libs`, so an empty workspace exits 0 before any browser exists; `--persist`
  writes `$PREFIX/env.sh`, the guarded profile blocks **and** `~/.playwright/cli.config.json` with the bundled Chromium
  channel and the library environment, all derived from `$HOME` and merged over existing keys.
- `scripts/setup-playwright-agent.sh`: still applies `--env` to its own process before the probe.
- `playwright.config.ts`: still injects the paths for Playwright Test.
- `README.md`, `__tests__/freebuff-startup-command.test.js`, `.agents/skills/playwright-cli/references/lucky-pick-canada.md`:
  new startup command ending with the strict `--check`, and the statement that no environment variables are needed.

## Verification

- **PASS:** empty-home provisioning — gate exits 1, provisioning exits 0 in 7.7 s with `libnspr4.so` present and the
  browser note, then `--persist` writes `env.sh`, both profile blocks and the CLI config.
- **PASS:** `pnpm exec playwright cli open` with `LD_LIBRARY_PATH` unset and no `--browser` flag; click reached
  `/crystal-ball`; `h1` = `Crystal Ball`, width 520 px, `Cinzel`.
- **PASS:** documented startup command twice, exit 0, 11.4 s warm, no download on the second run, one profile block per
  file, strict `--check` reporting both binaries.
- **PASS:** guard test 9/9, `bash -n`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`.

Evidence is in `specs/147-playwright-portable-runtime/evidence.md`.

## Durable Locations

Everything is regenerated per workspace from `$HOME`, so a new workspace never inherits a stale path.

- Libraries: `~/.local/chromium-libs` (27 MB, no root); apt cache `~/.apt-user`.
- Browser: `~/.cache/ms-playwright` (Chromium 1248 + headless shell + ffmpeg).
- Environment: `~/.local/chromium-libs/env.sh`, sourced from `~/.profile` and `~/.bashrc`.
- Playwright CLI: `~/.playwright/cli.config.json` (browser channel + browser environment).
