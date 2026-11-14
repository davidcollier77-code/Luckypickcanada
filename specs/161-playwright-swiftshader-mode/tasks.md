# Tasks: Selectable Playwright Modes

**Input**: Design documents from `/specs/161-playwright-swiftshader-mode/`

**Prerequisites**: plan.md, spec.md, research.md

**Scope guard**: Test tooling and documentation only. The standard configuration, CI workflow,
QA checkers, application code, visual baselines and browser dependencies remain unchanged.

## Phase 1: Setup and Baseline

- [X] T001 Confirm the standard Playwright configuration, projects, web server and CI command are unchanged (`playwright.config.ts`, `.github/workflows/visual-qa.yml`)
- [X] T002 Record the installed Playwright/Chromium versions and the SwiftShader launch decision (`research.md`)
- [X] T003 Confirm no new browser, package, hosted runner or paid service is required (`plan.md`)

## Phase 2: User Story 1 — Standard mode remains the default (P1)

**Goal**: Normal QA and CI keep using the existing configuration with no SwiftShader flags.

**Independent Test**: Resolve the standard command and assert the standard config has no
`launchOptions` or `channel`.

- [X] T004 [US1] Add the `test:visual` standard command in `package.json`
- [X] T005 [US1] Add a guard asserting `playwright.config.ts` has no SwiftShader launch arguments or channel in `__tests__/playwright-config-modes.test.js`
- [X] T006 [US1] Leave `.github/workflows/visual-qa.yml` and every QA checker unchanged

## Phase 3: User Story 2 — Opt-in SwiftShader investigation mode (P2)

**Goal**: A separate configuration explicitly launches Chromium with SwiftShader.

**Independent Test**: Run a focused Playwright check through the new config and inspect the WebGL
renderer; it must identify SwiftShader.

- [X] T007 [US2] Create `playwright.swiftshader.config.ts` inheriting the standard projects and web server, with `--use-gl=angle --use-angle=swiftshader --enable-gpu`, `workers: 1` and `retries: 0`
- [X] T008 [US2] Add the `test:visual:swiftshader` command in `package.json`
- [X] T009 [US2] Guard the SwiftShader arguments, serial settings and inherited project names in `__tests__/playwright-config-modes.test.js`
- [X] T010 [US2] Run a focused Playwright check through the SwiftShader config and record the launch result

## Phase 4: User Story 3 — Clear mode selection (P3)

**Goal**: The project Playwright guidance tells readers which option to use.

**Independent Test**: Follow the guide from a clean checkout and select each command.

- [X] T011 [US3] Add the Option A / Option B selection guidance to `.agents/skills/playwright-cli/references/lucky-pick-canada.md`
- [X] T012 [P] [US3] Add a short Playwright modes note to `README.md` for developers who do not read the skill guide
- [X] T013 [US3] State that CI uses only the standard option and that investigation runs do not update baselines

## Phase 5: Verification and Delivery

- [X] T014 Run the focused config guard and the affected Playwright run
- [X] T015 Run the full unit suite and `pnpm exec tsc --noEmit`
- [X] T016 Run `./freebuff-verify.sh`
- [X] T017 Measure the production build and confirm it is below 495 MiB
- [X] T018 Record evidence in `evidence.md`
- [X] T019 Update the Memory Bank and open one regular, non-draft PR

## Dependencies

- T001–T003 establish the baseline before any edit.
- T004–T006 and T007–T010 are independent of each other but both depend on T001.
- T011–T013 depend on the final command names.
- T014–T019 depend on all implementation tasks.

## Notes

- The standard option is the only mode used by CI and normal QA.
- The SwiftShader option is for investigation; screenshot differences from committed baselines
  are expected and must not be used to regenerate them.
- No application or gameplay change is involved.
