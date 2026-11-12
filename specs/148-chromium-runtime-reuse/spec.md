# Feature Specification: Reuse an Environment-Provided Chromium Runtime

**Feature Branch**: `freebuff/0fe51d9fb70d7d5eedbd7455-image-aware`
**Created**: 2026-11-12
**Status**: Implemented

**Input**: Owner request to make the Chromium setup scripts use system-wide libraries and any preinstalled Playwright
browser when they are present, instead of always provisioning into the home directory.

## Verified baseline (before this change)

- The Cloud image ships nothing Chromium can use: `/opt/google/chrome/chrome`, `/usr/bin/google-chrome`,
  `/usr/bin/chromium` and `/usr/bin/chromium-browser` are absent, no browser is on `PATH`, `/usr/lib/x86_64-linux-gnu`
  has no `libnspr4.so`, and `/etc/fonts` does not exist. Provisioning therefore remains the normal path today.
- Both setup scripts assumed the private prefix and `~/.cache/ms-playwright` are the only possible sources.
  `check_libs` tested only `~/.local/chromium-libs`; `chromium_binaries` searched only `~/.cache/ms-playwright`;
  `--env` always printed `LD_LIBRARY_PATH` and the two `FONTCONFIG_*` values; `--persist` always wrote them into
  `~/.playwright/cli.config.json`; and `--install-browser` always ran `pnpm exec playwright install chromium`.
- Consequence on a machine or future image that installs the packages system-wide, or ships `/opt/ms-playwright`:
  the workspace would still download 18 debs (246 MB of apt state) plus 313 MB of browser archives, shadow the
  system libraries with an `LD_LIBRARY_PATH` prefix, and persist paths it no longer needed.
- Playwright only reads a prebaked browser root from `PLAYWRIGHT_BROWSERS_PATH` (verified in
  `playwright-core@1.64.1` `lib/coreBundle.js`), and honours `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` at install time.
  A revision mismatch does not fall back: `chromium.launch()` fails with "executable doesn't exist".

## User Scenarios & Testing

### User Story 1 — A system-wide runtime is used as it is (Priority: P1)

On a machine or image that already provides every Chromium shared object and fontconfig, a workspace downloads
nothing and exports nothing.

**Independent Test**: with the detection directories pointed at a fixture that holds all 15 objects plus
`fonts.conf` and a font directory, `--check-libs` reports `system-wide`, plain provisioning reports that it is
skipping the download, and `--env` prints no `LD_LIBRARY_PATH`.

**Acceptance Scenarios**:

1. Given a complete system runtime, when `--check` runs, then `ldd` is invoked with an empty `LD_LIBRARY_PATH`, so a
   pass proves the loader resolves the objects by itself.
2. Given a complete system runtime, when `--persist` runs, then the env file and the CLI config contain no library or
   font variables, and stale ones from an earlier prefix are removed.

### User Story 2 — A prebaked Playwright browser is used as it is (Priority: P1)

An image that ships a Playwright browser install costs no download, and every tool launches that browser.

**Independent Test**: a read-only root holding `chromium-1248` (the revision `playwright-core/browsers.json` pins) is
printed by `--browser-root`, exported by `--env`, recorded in the CLI config by `--persist`, launched by
`pnpm exec playwright cli`, and reused by `setup-playwright-agent.sh --install-browser` without downloading.

**Acceptance Scenarios**:

1. Given a read-only root whose revision differs from the pin, when `--browser-root` runs, then the root is ignored
   and the default cache is reported, because a mismatch would fail at launch instead of falling back.
2. Given a writable root of any revision, when `--browser-root` runs, then it is used, because `playwright install`
   can repair it in place.

### User Story 3 — Nothing changes when neither is present (Priority: P1)

The current Cloud workspace keeps its exact behavior: prefix provisioning, the same exports, the same CLI config.

**Independent Test**: in this workspace (no system runtime, no prebaked root), `--check-libs`, `--check`,
`--env`, `--persist` and the CLI launch produce the same artifacts and the same successful launch as before.

**Acceptance Scenarios**:

1. Given the current image, when the documented startup command runs, then it still ends with a launched browser and
   the downloaded Chromium is used.

## Requirements

- **FR-001**: A system runtime is complete only when every object in `REQUIRED_LIBS` resolves in
  `CHROMIUM_SYSTEM_LIB_DIRS` (default `/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:/usr/lib:/lib`) or through
  `ldconfig -p`, `CHROMIUM_SYSTEM_FONTS/fonts.conf` (default `/etc/fonts/fonts.conf`) exists and at least one
  directory in `CHROMIUM_SYSTEM_FONT_DIRS` exists. A partial system set MUST NOT be used.
- **FR-002**: `check_libs` MUST report `PASS … system-wide (<directories>)` and plain provisioning MUST exit 0 without
  running `apt-get` when the system runtime is complete.
- **FR-003**: In system mode `--env` MUST NOT print `LD_LIBRARY_PATH`, `FONTCONFIG_FILE` or `FONTCONFIG_PATH`.
- **FR-004**: `--check` MUST use an empty `LD_LIBRARY_PATH` in system mode and the prefix path otherwise.
- **FR-005**: Prebaked browser roots MUST be considered from `PLAYWRIGHT_BROWSERS_PATH` and, in order,
  `/opt/ms-playwright`, `/usr/local/share/ms-playwright`, `/usr/share/ms-playwright`, `/ms-playwright`, overridable
  with `CHROMIUM_BROWSER_DIRS`.
- **FR-006**: A root is usable only when it contains a `chrome` or `chrome-headless-shell` binary (symlinks followed).
  A read-only root MUST also hold the revision pinned by the repository's `playwright-core/browsers.json`; a writable
  root may hold any revision.
- **FR-007**: The chosen prebaked root MUST be exported as `PLAYWRIGHT_BROWSERS_PATH` by `--env` and stored in
  `launchOptions.env` by `--persist`, so `playwright install`, the launch probe and the CLI all use it.
- **FR-008**: `--browser-root` MUST print the effective root and exit 0 when a browser is present, and exit 1 with a
  diagnostic when none is.
- **FR-009**: `scripts/setup-playwright-agent.sh --install-browser` MUST skip `pnpm exec playwright install chromium`
  when `--browser-root` succeeds, and keep installing otherwise.
- **FR-010**: `--persist` MUST remove the library, font and browser-root keys this workspace no longer needs from an
  existing CLI config while preserving every unrelated key.
- **FR-011**: With no system runtime and no prebaked root, the artifacts and the launch behavior MUST be unchanged.
- **FR-012**: No application code, dependency, lockfile, workflow, hosting, deployment, secret, `AGENTS.md` or
  `.docs/` change.

## Success Criteria

- **SC-001**: Five detection tests pass in `__tests__/setup-chromium-runtime-detect.test.js`.
- **SC-002**: A read-only symlinked root holding the pinned revision is selected, exported, persisted and launched by
  the CLI with no environment variables and no `--browser` flag.
- **SC-003**: A read-only root holding a different revision is ignored and the default cache is reported.
- **SC-004**: In the current Cloud workspace, `--check-libs`, `--check` and the documented startup command still pass,
  and `--install-browser` reports the browser as already installed instead of downloading it.
- **SC-005**: `./freebuff-verify.sh`, `tsc --noEmit` and the full unit suite pass; the production build stays below
  495 MiB.

## Assumptions

- A future image that ships the runtime would install it under the standard Debian paths covered by
  `CHROMIUM_SYSTEM_LIB_DIRS`, or register it with `ldconfig`.
- A prebaked browser would be updated together with the Playwright version in `package.json`; the revision gate keeps
  a stale image from breaking startup, at the cost of falling back to the download.
- `PLAYWRIGHT_BROWSERS_PATH` is Playwright's documented mechanism for a browser install outside `$HOME`, so exporting
  it is enough for every entry point (CLI, probe, test runner) without touching `playwright.config.ts`.
