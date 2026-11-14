# Active Context — Selectable Playwright modes

- **Updated:** 2026-11-14
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/38a663e10f412e1b8cba2642-playwright-modes`
- **Base:** `main` (`13e98f02`, including merged feature 160)
- **Spec Kit feature:** `specs/161-playwright-swiftshader-mode`

## Current Task

The repository now has two explicit Playwright Test modes. Option A is the unchanged
`playwright.config.ts` used by normal QA and CI. Option B is the opt-in
`playwright.swiftshader.config.ts`, selected with
`pnpm exec playwright test --config=playwright.swiftshader.config.ts`, which forces ANGLE's
SwiftShader backend for GPU and graphics investigations.

## Scope and safeguards

- `playwright.config.ts`, the Visual QA workflow, QA checker scripts and committed baselines are
  unchanged.
- Option B inherits the standard projects and web server, adds `--use-gl=angle`,
  `--use-angle=swiftshader`, `--enable-gpu`, and uses one worker with no retries.
- No new browser, dependency, paid service, hosted runner or infrastructure was introduced.
- `__tests__/playwright-config-modes.test.js` guards both modes and their documented commands.
- The project Playwright guide and README explain which mode to use and that investigation runs
  must not regenerate baselines.

## Verification

- Focused mode guard: 3/3 passed; combined focused run 22/22 passed.
- Standard Playwright smoke (`security-headers`, desktop): 3/3 passed.
- SwiftShader Playwright smoke: 3/3 passed; renderer reported SwiftShader / `SwANGLE`.
- Full Vitest: 686/686 passed before the current-main merge.
- `pnpm exec tsc --noEmit`: exit 0.
- `./freebuff-verify.sh`: exit 0, including 36/36 documentation tests.
- Production build: 438,155,074 bytes (≈417.9 MiB), below the 495 MiB cap.

## Remaining

- Resolve the current-main merge, then rerun the guard and type check on the final head.
- The required Visual QA workflow and PR checks run after the PR is opened.
- SwiftShader is intentionally slower and is not a hardware performance measurement.
