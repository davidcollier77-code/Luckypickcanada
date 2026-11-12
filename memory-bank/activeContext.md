# Active Context — Playwright Chromium Runtime Environment

- **Updated:** 2026-11-12
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/0fe51d9fb70d7d5eedbd7455`
- **Base:** `main`
- **Spec Kit feature:** `specs/146-playwright-chromium-runtime`

## Current Task

Make the repository's Playwright installation launch Chromium reliably in the Freebuff workspace: fix the missing
`libnspr4.so`, carry `LD_LIBRARY_PATH`/`FONTCONFIG_FILE`/`FONTCONFIG_PATH` into the shell that launches the browser,
survive workspace restarts, and document the exact startup configuration for Freebuff's project settings.

## Root Cause

The libraries and the Chromium 1248 browser were already provisioned in `~/.local/chromium-libs`, so the missing
`libnspr4.so` was not an install failure. The startup command exported the paths with `eval "$(… --env)"`, which died
with that process; Freebuff tool shells are non-login, non-interactive `bash -c` processes (`$-` = `hBc`, `BASH_ENV`
unset) and `$HOME` had no `.profile`/`.bashrc`, so every later launch started with no library path. A second defect:
`--check` inspected only `chrome`, while a headless `chromium.launch()` runs `chrome-headless-shell`.

## Implementation

- `scripts/setup-chromium-libs.sh`: `--check` validates both Playwright Chromium binaries and the fontconfig files;
  a plain run reuses a complete 27 MB prefix instead of downloading again; `--env` prints idempotent POSIX exports;
  new `--persist` writes `$PREFIX/env.sh` and rewires one marked block in `~/.profile` and `~/.bashrc`.
- `scripts/setup-playwright-agent.sh`: applies `--env` to its own process before the probe, so the probe works with no
  caller setup.
- `playwright.config.ts`: adds the prefix's library and fontconfig paths to the browser environment when
  `libnspr4.so` exists there; a no-op on developer machines and CI runners.
- `README.md` and `__tests__/freebuff-startup-command.test.js`: startup command gains the persist step; the fixture now
  proves the probe inherits the exported paths.

## Verification

- **PASS:** probe with no library environment — `PASS: Chromium launched and rendered a probe page`.
- **PASS:** Playwright Test in a bare shell — `tests/visual/gold-cta.spec.ts --project=desktop`, 4/4.
- **PASS:** real interaction — `playwright cli open/click/screenshot/eval` on the live site, heading `Crystal Ball`.
- **PASS:** cold provisioning into a throwaway prefix (3.3 s, `libnspr4.so` present); documented startup command twice,
  exit 0, idempotent profiles.
- **PASS:** guard test 9/9, `bash -n`, `pnpm exec tsc --noEmit`.
- **PASS:** `./freebuff-verify.sh`.

Evidence is in `specs/146-playwright-chromium-runtime/evidence.md`.

## Durable Locations

- Libraries: `~/.local/chromium-libs` (27 MB, no root); apt cache `~/.apt-user`.
- Browser: `~/.cache/ms-playwright` (Chromium 1248 + headless shell + ffmpeg).
- Environment: `~/.local/chromium-libs/env.sh`, sourced from `~/.profile` and `~/.bashrc`.
