# Tasks: Browser-testing tooling evaluation

**Input**: Design documents from `spec.md` and `plan.md`

**Prerequisites**: `spec.md`, `plan.md`

**Tests**: Verification is required by the specification; this is an investigation, so the "tests" are executed probes rather than unit tests.

## Phase 1: Setup and baseline

- [x] T001 Read `AGENTS.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `.docs/manifest.json`, `.specify/memory/constitution.md` and the `.freebuff/` group files; select `deep-dive` (evidence-driven tool audit) + `testing` (executed probes of every candidate) + `troubleshooting` (root-cause the recurring `preview_playwright` failure).
- [x] T002 Confirm no existing Spec Kit feature covers browser tooling; use the next sequential feature directory `specs/106-browser-testing-tooling-evaluation` and update `.specify/feature.json`.
- [x] T003 Record the environment: Ubuntu 24.04.5 LTS x86_64, Node v26.13.0, pnpm 10.30.3, Python 3.12.3, non-root user, `no_new_privileges`, no `DISPLAY`.

## Phase 2: User Story 1 — Which tools actually work (Priority: P1)

**Goal**: Give every tool a verified status.

**Independent Test**: Repeat each probe and obtain the same outcome.

- [x] T004 Verify installed Playwright versions (`playwright --version`, `@playwright/test` 1.64.1) and the cached browser builds (`chromium-1248`, `chromium_headless_shell-1248`).
- [x] T005 Attempt a real Chromium launch from `playwright-chromium`; record the failure and the complete `ldd` missing-library list (16 for `chrome`, 12 for the headless shell).
- [x] T006 Test whether the missing libraries can be installed without violating the no-install instruction: `sudo -n true`, `apt-get update`, `apt-get install --dry-run libnspr4`; record the exact refusals.
- [x] T007 Check Puppeteer presence (`node_modules`) and its published version (`pnpm view puppeteer version` → 25.16.0); record that it uses the same Chromium binaries.
- [x] T008 Check Browser Use presence (Python module probe) and its documented requirements from PyPI/docs; record the Python ≥3.11, browser and LLM-key requirements.
- [x] T009 Check Computer Use feasibility (`DISPLAY`, model-provider key variable names) and record that neither a desktop session nor a provider key exists.

## Phase 3: User Story 2 — The `preview_playwright` failure (Priority: P2)

**Goal**: Reproduce, localize and bypass the recurring error.

**Independent Test**: Submit any Playwright script through the bridge and observe the identical error; use the alternative tools successfully in the same session.

- [x] T010 Call `preview_playwright` with a trivial script (`return 1;`) and with a navigation script; record the identical error text both times.
- [x] T011 Search the repository for the option that triggers the error; confirm no repository code controls it, so the defect is in the platform bridge.
- [x] T012 Verify the working alternatives on `https://example.com`: `preview_evaluate` returned the title and user agent.
- [x] T013 Start the app dev server on `0.0.0.0:3000`, confirm readiness with the preview `Host` header, and register it with `cloud_show_dev_server`.
- [x] T014 Walk the real site with the managed browser: `preview_open` ticket URL, `preview_evaluate` (title, `h1`, 1024×768), `preview_screenshot` saved to `artifacts/browser-testing-tooling/out/home-desktop-cloud-browser.png`, `preview_snapshot`, and `preview_click` navigating to `/crystal-ball`.
- [x] T015 Record the mobile limitation: the managed browser exposes no viewport/device emulation, while `playwright.config.ts` provides `mobile-390` and `mobile-412` projects for CI.

## Phase 4: User Story 3 — Recommendation and fallbacks (Priority: P3)

**Goal**: One capability → tool matrix plus four fallback tools.

**Independent Test**: The matrix names a tool for each of the four capabilities, and each fallback has a prerequisite and a status.

- [x] T016 Write the recommendation matrix for automated testing, mobile testing, screenshots and visitor walkthroughs.
- [x] T017 Name four fallback tools (Playwright MCP, Chrome DevTools MCP, hosted CDP Chromium, real-device cloud) with prerequisites, and state why Cypress/Selenium are not recommended.
- [x] T018 Record that CI (`.github/workflows/visual-qa.yml`) is the authoritative automated visual environment because it installs Chromium with its system dependencies.

## Final Phase: Verification, audit and delivery

- [x] T019 Write `artifacts/browser-testing-tooling/out/tool-probes.json` with the exact commands, outputs and timestamps for every probe.
- [x] T020 Run `./freebuff-verify.sh`, record the exit status and measure the production build size against the 495 MB maximum. Result: exit `0` with `SPEC_KIT_BASE_REF=HEAD`; `.next` 372,394,512 B + `public` 32,840,043 B = 405,234,555 B (386.46 MiB) < 495 MB. Note: `origin/main` and `main` are absent in this workspace clone and `freebuff-base` shares no merge base with `HEAD`, so the worktree-vs-`HEAD` comparison is the only valid base here.
- [x] T021 Audit the complete diff for out-of-scope changes and confirm no application code, `package.json`, `pnpm-lock.yaml`, workflow or `.docs/` modification. Result: 8 files — this feature's four Spec Kit artifacts, two evidence files, plus `.specify/feature.json` and `memory-bank/activeContext.md`.
- [x] T022 Push the task branch, open the pull request with the canonical summary, and leave it open and unmerged. Branch `chore/browser-testing-tooling-eval-20261107`; the pull request carries the single canonical summary and stays open.

## Completion Conditions

- Every investigated tool has a status backed by an executed probe or a cited upstream requirement.
- The `preview_playwright` failure is explained as platform-side with working alternatives demonstrated.
- The recommendation covers all four requested capabilities, and four fallback tools are listed.
- Repository verification results and the measured build size are reported accurately.
- The pull request stays open and unmerged.
