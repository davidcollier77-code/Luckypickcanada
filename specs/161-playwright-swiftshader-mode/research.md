# Research: Selectable Playwright Modes

**Date**: 2026-11-14 | **Feature**: `specs/161-playwright-swiftshader-mode/`

## Current state (inspected, not assumed)

- `playwright.config.ts` defines one standard configuration: three Chromium projects (`desktop`,
  `mobile-390`, `mobile-412`), no `channel`, no `launchOptions`, `workers: CI ? 2 : undefined`
  and `retries: CI ? 1 : 0`.
- The required Visual QA workflow runs `pnpm exec playwright test --shard=...` and its source
  guard reads `playwright.config.ts`; neither is changed by this feature.
- Playwright 1.64.1 installs Chromium 156 and its headless shell. The headless shell already
  renders WebGL through SwiftShader on a machine without a GPU, but that is an implicit fallback.
- A direct probe showed that adding `--use-gl=angle --use-angle=swiftshader --enable-gpu`
  changes Chromium's feature status from software-disabled to an enabled GPU path while the
  renderer remains `SwiftShader`/`SwANGLE`. `--disable-gpu` would instead disable the GPU
  process and compositing, so it is not the right flag for graphics investigation.

## Decisions

### Separate config instead of an environment switch

Decision: add `playwright.swiftshader.config.ts` and select it with `--config`.

Rationale: A separate file cannot affect `playwright.config.ts`. An environment variable read
by the standard config would create a path where a stray shell value changes normal QA. The
separate file also makes the mode discoverable and lets Playwright merge the standard projects,
web server and base URL without duplication.

Alternative rejected: adding a fourth project to the standard config. That would make the
standard `playwright test` run or list an investigation project and could affect CI selection.

### Explicit SwiftShader flags

Decision: use `--use-gl=angle --use-angle=swiftshader --enable-gpu`.

Rationale: This explicitly selects ANGLE's SwiftShader backend and exercises the GPU process.
It works on a machine with or without a hardware GPU. `--disable-gpu` is deliberately omitted
because it disables the process and compositing path the investigation is meant to inspect.

Alternative rejected: relying on the implicit headless fallback. It is not deterministic across
machines with different GPUs and gives no clear selection signal.

### Serial, retry-free investigation runs

Decision: `workers: 1` and `retries: 0` in the SwiftShader config.

Rationale: Software rendering is CPU-bound; two concurrent browsers compete for the same CPUs
and make graphics timings noisy. A retry can hide a launch or rendering failure and masks the
first-run behaviour being investigated.

### Package scripts and documentation

Decision: expose `test:visual` and `test:visual:swiftshader`, and document both in the project
Playwright guide.

Rationale: The options are then selectable without editing files, and an agent following the
Playwright instructions has an explicit rule: standard for normal QA, SwiftShader for graphics
investigations. CI keeps using `pnpm exec playwright test`, so no workflow changes are needed.

## References consulted

| Document | Used | Contribution |
|---|---|---|
| `.docs/testing/_microsoft_playwright.md` | Useful | Confirmed the existing Playwright Test project structure and command conventions. |
| `.agents/skills/playwright-cli/references/lucky-pick-canada.md` | Useful | Identified the project-specific Playwright guide that must state the mode choice. |
| `playwright.config.ts` and `.github/workflows/visual-qa.yml` | Useful | Established the exact standard configuration and the checker assertions that must remain valid. |
| `.specify/memory/constitution.md` | Useful | Confirmed the core sequence, protected systems and build-size constraint. |

## Freebuff integrations and skills

- Playwright was used directly to inspect the installed Chromium build and verify renderer
  behaviour. No paid service, hosted browser or additional infrastructure was used.
