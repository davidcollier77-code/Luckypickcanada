# Implementation Plan: Selectable Playwright Modes

**Branch**: `freebuff/38a663e10f412e1b8cba2642-playwright-modes` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/161-playwright-swiftshader-mode/spec.md`

## Summary

Keep `playwright.config.ts` as the unchanged standard option for normal QA and CI. Add a
separate `playwright.swiftshader.config.ts` that imports the standard config, sets the
SwiftShader-specific launch arguments, and runs one worker with no retries for deterministic
graphics investigations. Expose both options as package scripts and document the choice in the
project Playwright guide. Add a Vale-free Vitest guard that fails if either mode drifts. No
browser, CI checker, workflow or infrastructure changes are needed.

## Technical Context

**Language/Version**: Node.js 26.x, TypeScript 5.x

**Primary Dependencies**: Existing Playwright 1.64.1 (`playwright`, `@playwright/test`,
`playwright-chromium`); no new packages.

**Storage**: N/A. This is test tooling configuration only.

**Testing**: Vitest source guard for the two configurations and package commands; a focused
Playwright run through the SwiftShader configuration to prove the browser launches; the
existing full suite, type check and repository gate.

**Target Platform**: Developer machines and the existing Linux Chromium runtime; no hosted
runner or paid service.

**Project Type**: Next.js web application with a Playwright Test suite at the repository root.

**Performance Goals**: The standard path remains unchanged. The SwiftShader path is expected to
be slower; it uses one worker to avoid competing software renderers.

**Constraints**: Do not change `playwright.config.ts`, `.github/workflows/visual-qa.yml`, QA
checker scripts, committed visual baselines or app behaviour. No new infrastructure or
dependencies. Production build strictly below 495 MiB.

**Scale/Scope**: Two Playwright configurations, two package commands, one project guide section,
one focused Vitest guard and one targeted runtime check.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Single Source of Truth** — PASS. `AGENTS.md` remains authoritative; the new guide
  section supplements it and the standard config remains the default.
- **II. Verify Before Acting** — PASS. The current configuration, Chromium build, visual QA
  workflow, checker assertions and package scripts were inspected before design.
- **III. Implementation Sequence** — PASS. INSPECT → IDENTIFY → UNDERSTAND → PLAN →
  IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → CREATE PR.
- **IV. Protect Core Systems** — PASS. No payment, auth, database, secrets, hosting or
  deployment configuration is touched.
- **V. Resource Conservation & Control** — PASS. `.docs/` stays read-only and no external
  service or runner is introduced.

**Post-design re-check**: PASS. The design is additive, keeps the standard mode byte-identical
in behaviour and leaves every existing QA checker untouched.

## Project Structure

### Documentation (this feature)

```text
specs/161-playwright-swiftshader-mode/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
├── checklists/requirements.md
└── evidence.md
```

### Source Code (repository root)

```text
playwright.config.ts                    # unchanged standard option
playwright.swiftshader.config.ts        # new opt-in SwiftShader option
package.json                            # two selectable scripts
.agents/skills/playwright-cli/references/lucky-pick-canada.md
                                        # choose A or B guidance
__tests__/playwright-config-modes.test.js
                                        # guards both configuration modes
```

**Structure Decision**: The repository already has one root Playwright config and a project
Playwright guide under the vendored skill. A second root config is the smallest additive change:
Playwright selects it with `--config`, so no environment variable or conditional branch can
affect the standard path. Package scripts give both modes a stable, discoverable command.

## Implementation Approach

1. Leave `playwright.config.ts` untouched and record its current behaviour as the standard option.
2. Add `playwright.swiftshader.config.ts` that imports the standard config and overrides only
   `use.launchOptions.args`, `workers` and `retries`.
3. Use `--use-gl=angle --use-angle=swiftshader --enable-gpu`; do not use `--disable-gpu`, which
   would disable the GPU process rather than exercise the software GPU path.
4. Add `test:visual` (standard) and `test:visual:swiftshader` (investigation) scripts.
5. Document when to use each mode, that CI uses the standard mode, and that investigation runs
   do not update baselines.
6. Add a Vitest guard that asserts the standard config has no launch arguments or channel, the
   SwiftShader config has the expected arguments and serial settings, and both scripts remain
   present.
7. Run the focused guard, a targeted Playwright check through the SwiftShader config, the
   standard Playwright listing, the type check and the repository gate.

## Risks and Rollback

- **Risk**: Someone runs the SwiftShader mode for visual regression and rewrites baselines.
  **Mitigation**: The guide explicitly says investigation runs do not update baselines, and the
  config uses a separate name and command.
- **Risk**: The standard path accidentally inherits the new flags through a shared import.
  **Mitigation**: The standard config is not edited; the guard asserts no launch arguments there.
- **Risk**: Headless Chromium already uses SwiftShader, so the mode looks redundant.
  **Mitigation**: The mode makes the backend explicit and enables the GPU process, which is the
  difference between an incidental fallback and a reproducible investigation path.
- **Rollback**: Delete the new config, scripts and guard; the standard configuration is untouched.
