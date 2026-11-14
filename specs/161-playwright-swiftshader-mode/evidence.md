# Verification Evidence — Selectable Playwright Modes

- **Feature**: `specs/161-playwright-swiftshader-mode`
- **Branch**: `freebuff/38a663e10f412e1b8cba2642-playwright-modes`
- **Base**: `main` (`2e7cd054`)
- **Date**: 2026-11-14
- **Spec Kit stages**: Specify (`spec.md`), Plan (`plan.md`), Tasks (`tasks.md`), Implement (source, tests and docs)

## What was implemented

- **Option A — Standard Playwright** remains the existing `playwright.config.ts`, untouched.
  Normal QA and CI continue to use `pnpm exec playwright test` and its three existing Chromium
  projects.
- **Option B — SwiftShader Playwright** is `playwright.swiftshader.config.ts`. It inherits the
  standard test directory, web server and project definitions and adds only:
  - `--use-gl=angle`
  - `--use-angle=swiftshader`
  - `--enable-gpu`
  - `workers: 1` and `retries: 0` for deterministic, non-competing software-rendered investigation.
  It is selected with
  `pnpm exec playwright test --config=playwright.swiftshader.config.ts`.
- The project Playwright guide and README now state which mode to choose, that CI uses only the
  standard mode, and that investigation runs must not regenerate committed baselines.
- A Vitest guard fails if the standard config gains SwiftShader settings, if the opt-in config
  loses its flags or serial settings, or if the inherited projects drift.

## Changed files

- `playwright.swiftshader.config.ts` — new opt-in SwiftShader configuration.
- `__tests__/playwright-config-modes.test.js` — source coverage for both modes.
- `.agents/skills/playwright-cli/references/lucky-pick-canada.md` — Option A / Option B guidance.
- `README.md` — developer-facing Playwright mode note.
- `.specify/feature.json` — points at this feature.
- `memory-bank/activeContext.md`, `progress.md`, `techContext.md` — task state and verified mode facts.
- `specs/161-playwright-swiftshader-mode/*` — Spec Kit artifacts.

`playwright.config.ts`, `package.json`, `.github/workflows/visual-qa.yml`, all QA checker
scripts and every committed visual baseline are unchanged.

## Checks performed

| Check | Status | Evidence |
| --- | --- | --- |
| Focused Vitest guard | PASS | 3 tests in `__tests__/playwright-config-modes.test.js`; combined focused run 4 files / 22 tests passed |
| Standard Playwright smoke | PASS | `security-headers.spec.ts`, desktop project: 3/3 passed in 9.5 s |
| SwiftShader Playwright smoke | PASS | same spec through the new config: 3/3 passed in 35.9 s; 1 worker |
| SwiftShader renderer | PASS | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device ...), SwiftShader driver)`; `driverVendor: SwANGLE`; WebGL status `enabled` |
| Standard config unchanged | PASS | `git diff -- playwright.config.ts` is empty; the guard asserts no `launchOptions` or `channel` |
| Full Vitest suite | PASS | 686 tests passed, exit 0 |
| `pnpm exec tsc --noEmit` | PASS | exit 0 |
| `./freebuff-verify.sh` | PASS | exit 0; 36/36 isolated documentation tests passed |
| Production build | PASS | `.next` = 438,155,074 bytes (≈417.9 MiB), below the 495 MiB cap |
| Required Visual QA workflow | PENDING — runs after PR creation | Workflow and checker assertions were inspected and left unchanged |

## Notes and limitations

- The SwiftShader mode is intentionally slower; one worker and no retries keep graphics
  investigations deterministic rather than fast.
- The mode forces software rendering even on a machine with a hardware GPU. It is not a hardware
  performance measurement and does not replace normal QA or the committed visual baselines.
- An attempted `--list` convenience probe ran the standard suite instead of listing tests; it was
  stopped after 120 seconds and its dev server was terminated by PID. It is not counted as a
  verification result. The standard smoke above used a direct `pnpm exec playwright test` command.
- No paid service, hosted runner, browser installation or new dependency was introduced.
