# Active Context — Harden the Chromium Environment Emitter

- **Updated:** 2026-11-12
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/419f8aeeb3f6faf5ad52daa2`
- **Base:** `main`
- **Spec Kit feature:** `specs/150-chromium-env-emitter-hardening` (follows `specs/146-*` … `149-*`)

## Current Task

An investigation of the `eval "$(bash scripts/setup-chromium-libs.sh --env)"` in the startup command and
`scripts/playwright-cli.sh` reproduced command execution through that text. This task closes the sink in the generator
and in what `--persist` writes. The startup script and its settings are a separate task and are unchanged here.

## What changed

- `scripts/setup-chromium-libs.sh`: new `sh_squote` emits one single-quoted POSIX word per value. `print_env` now
  quotes `LIB_PATH`, `FONTS_CONF`, `FONTS_DIR` and the browser root, and runs the `LD_LIBRARY_PATH` dedupe against a
  quoted variable, so a value is compared literally instead of becoming a glob. `--persist` quotes the path in the
  `~/.profile`/`~/.bashrc` source line.
- `scripts/playwright-cli.sh`, `scripts/setup-playwright-agent.sh`: comments record that the output is quoted and the
  `eval` must stay inert. The consumers and the startup command are otherwise unchanged.
- `__tests__/setup-chromium-env-shell-safety.test.js`: 22 tests over four hostile payloads in `CHROMIUM_LIBS_PREFIX`,
  `HOME`, `PLAYWRIGHT_BROWSERS_PATH` and `CHROMIUM_BROWSER_DIRS`, plus spaces, an apostrophe, `sh`/`bash` parsing,
  idempotency, literal glob matching and both `--persist` paths. A canary file is the oracle.
- `__tests__/setup-chromium-runtime-detect.test.js`: the one assertion that pinned the double-quoted
  `PLAYWRIGHT_BROWSERS_PATH` form now expects the single-quoted word.

## Verified behaviour (this workspace)

| Check | Result |
| --- | --- |
| `bash -n` on every `scripts/*.sh` | exit 0 |
| Generated `--env`, parsed by `sh -n` and applied | exit 0, literal paths exported |
| Focused vitest (shell safety, detection, wrapper) | 38 tests, exit 0 |
| Full unit suite | 67 files, 633 tests, exit 0 |
| Spec Kit gate + its tests, `tsc --noEmit`, docs tests | exit 0 |
| Production build | 291.91 MiB (cap 495 MiB) |

## Durable Locations (unchanged by this task)

- Libraries: `~/.local/chromium-libs` (27 MB, no root) when the system has none; `~/.apt-user` for apt state.
- Browser: `~/.cache/ms-playwright` (Chromium 1248) unless an environment-provided root is present.
- Environment: `~/.local/chromium-libs/env.sh`, sourced from `~/.profile` and `~/.bashrc`; Playwright CLI config at
  `~/.playwright/cli.config.json`. Values are single-quoted, so `env.sh` is safe to source from `sh`.

## Known Context Risks

- A chat's `$HOME` is per-chat, so a new chat is cold again (~41 s). The wrapper self-heals on first use.
- An inherited `FONTCONFIG_FILE`/`FONTCONFIG_PATH` naming another workspace still arrives in the container
  environment; the wrapper and the test config repair it by existing-path checks, so it cannot drop the provisioned
  fonts.
- The emitter derives safety from the process environment, so anything that injects environment variables into the
  startup shell is now inert rather than merely unguarded; do not reintroduce an unquoted value in `print_env`.
