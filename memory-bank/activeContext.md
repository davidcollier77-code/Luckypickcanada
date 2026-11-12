# Active Context — Reuse an Environment-Provided Chromium Runtime

- **Updated:** 2026-11-12
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/0fe51d9fb70d7d5eedbd7455-image-aware`
- **Base:** `main` at `d4dc6952`
- **Spec Kit feature:** `specs/148-chromium-runtime-reuse` (continues `specs/146-*` and `specs/147-*`)

## Current Task

Make the Chromium setup scripts use a system-wide runtime or a preinstalled Playwright browser when they are
present, instead of always downloading and unpacking everything into `$HOME`.

## What the environment actually provides

The Cloud image ships nothing Chromium can use: no `/opt/google/chrome`, no browser on `PATH`, no `libnspr4.so`
under `/usr/lib/x86_64-linux-gnu`, no `/etc/fonts`, no `ms-playwright` directory. The repository cannot change that
either — the session is non-root, `sudo` is refused by `no new privileges`, and `/opt`, `/usr/local` and `/etc` are
read-only — so a per-workspace prefix remains the normal path and this feature only removes duplicated work where
the environment is better provisioned (a developer machine, CI, or a future image).

## Implementation

- `scripts/setup-chromium-libs.sh`: `has_system_runtime` accepts a runtime only when every `REQUIRED_LIBS` object
  resolves in `CHROMIUM_SYSTEM_LIB_DIRS` or through a cached `ldconfig -p`, `/etc/fonts/fonts.conf` exists and a
  system font directory exists. In that mode `--env` prints no library variables, `--check` runs `ldd` with an empty
  `LD_LIBRARY_PATH`, `--persist` writes an env file without library keys, and plain provisioning exits 0 before
  `apt-get`. `prebaked_browser_root` considers `PLAYWRIGHT_BROWSERS_PATH` and `/opt/ms-playwright`,
  `/usr/local/share/ms-playwright`, `/usr/share/ms-playwright`, `/ms-playwright`; a read-only root must match the
  revision pinned in `playwright-core/browsers.json` (`chromium-1248`), a writable root may hold any revision.
  `--browser-root` prints the effective root, `--env` exports it as `PLAYWRIGHT_BROWSERS_PATH`, `--persist` stores it
  in the CLI config and deletes keys the workspace no longer needs.
- `scripts/setup-playwright-agent.sh`: `--install-browser` skips the download when `--browser-root` finds a browser.
- `__tests__/setup-chromium-runtime-detect.test.js`: five tests over the four directory overrides.

## Review follow-up on PR #1854

Three Graphite findings and two failing checks were fixed on the same branch. `--browser-root`, the
`--install-browser` skip and the strict `--check` now require the revision pinned by
`playwright-core/browsers.json`, including in Playwright's default `~/.cache/ms-playwright`, so a cache left by another
Playwright version is repaired instead of trusted. The tests cover the pinned read-only root and both wrong-revision
cases, and no longer assume the host has no system Chrome. Separately, `validate-open-next-repair.yml` now installs
pnpm before `actions/setup-node` uses `cache: pnpm`, and `__tests__/workflow-pnpm-setup-order.test.js` guards that
order across every workflow. `--install-browser` now also logs the pinned revision it reused or installed and re-runs
`--browser-root` afterwards, so a download that does not produce the pinned browser fails as a setup error instead of
surfacing at the probe as a misleading library problem; `--browser-revision` exposes the pin for that log.

## Verification

Evidence is in `specs/148-chromium-runtime-reuse/evidence.md`.

## Durable Locations

Everything is still regenerated per workspace from `$HOME`, so a new workspace never inherits a stale path.

- Libraries: `~/.local/chromium-libs` (27 MB, no root) when the system has none; `~/.apt-user` for apt state.
- Browser: `~/.cache/ms-playwright` unless a prebaked root is present.
- Environment: `~/.local/chromium-libs/env.sh`, sourced from `~/.profile` and `~/.bashrc`; empty in system mode.
- Playwright CLI: `~/.playwright/cli.config.json` (browser channel, plus only the environment this workspace needs).
