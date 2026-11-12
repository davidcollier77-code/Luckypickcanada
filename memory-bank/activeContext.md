# Active Context — Playwright Reliability in a Cold Cloud Workspace

- **Updated:** 2026-11-12
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/db0186c675176d0ca7d8d91e`
- **Base:** `main`
- **Spec Kit feature:** `specs/147-playwright-cloud-reliability`

## Current Task

Make Playwright browser work reliable every time it is needed in a Freebuff Cloud workspace, for an owner who only has
an Android phone: no manual exports, no remembered browser flag, no dependence on a platform startup setting.

## Root Cause

Three independent defects, each sufficient to break a launch:

1. `scripts/setup-chromium-libs.sh` did not parse at HEAD. The reuse branch read `printf '%s\n  echo`; the closing
   quote and `"$check_output"` argument were lost. Every path that could provision, check, export or persist the
   Chromium libraries was therefore dead, and the startup command would have stopped there.
2. Freebuff Cloud did not run the documented startup command for this chat: `$HOME` was created empty, with no
   `node_modules`, no `~/.local/chromium-libs`, no browser cache and no `.profile`/`.bashrc`. Setup therefore has to be
   self-healing at first use rather than platform-dependent.
3. Tool shells are non-interactive `bash -c` processes that never read a profile, so `LD_LIBRARY_PATH` and
   `FONTCONFIG_*` are absent; and `playwright cli` defaults to the system Chrome channel, which this image lacks.

## Implementation

- `scripts/setup-chromium-libs.sh`: restored `printf '%s\n' "$check_output"` so the script parses again.
- `scripts/playwright-cli.sh` (new): one command that installs missing dependencies, provisions missing libraries,
  installs the pinned browser when absent, applies the runtime environment and execs `pnpm exec playwright cli`; adds
  `--browser=chromium` to `open` only when the caller gave no `--browser`; passes `test` through unchanged; supports
  `--dry-run` for its argument tests.
- `__tests__/playwright-cli-wrapper.test.js` (new): `bash -n` guard over every `scripts/*.sh` plus the root entrypoints,
  and the four argument paths. The parse guard is the regression test for defect 1.
- `README.md`, `.agents/skills/playwright-cli/SKILL.md` and `references/lucky-pick-canada.md`: the wrapper is the
  documented command for interactive browser work, so later chats find it without being told.

## Verification

- **PASS:** cold library provisioning after moving the prefix aside — `PASS 2 Chromium binaries link with 0 missing
  shared objects` (27 MB), then the wrapper loaded the live site in 6.3 s.
- **PASS:** live site through the wrapper, `LD_LIBRARY_PATH` unset — title
  `Lucky Pick Canada | Daily Lucky Picks, Cards & Stories`.
- **PASS:** desktop 1280×720 and mobile 390×844 screenshots, inspected: real fonts, correct nav, stacked mobile layout.
  Evidence in `specs/147-playwright-cloud-reliability/evidence/`.
- **PASS:** focused suite 5/5.
- **PASS:** `./freebuff-verify.sh` — governance gate, type check, production build (324.33 MiB), 36/36 docs tests.

## Durable Locations

- Wrapper: `./scripts/playwright-cli.sh` — the only browser command to use in Freebuff Cloud.
- Libraries: `~/.local/chromium-libs` (27 MB, no root); browser: `~/.cache/ms-playwright` (Chromium 1248).
