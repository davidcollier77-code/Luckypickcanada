# Implementation Plan: Browser-testing tooling evaluation

**Branch**: `chore/browser-testing-tooling-eval-20261107` | **Date**: 2026-11-07 | **Spec**: `spec.md`

**Input**: Owner request to investigate Playwright, Puppeteer, Computer Use and Browser Use for Lucky Pick Canada, determine what actually works in this Linux environment, and recommend a combination. Investigation only: no installs, no application/dependency/config changes.

## Summary

Probe each of the four tools in the live sandbox, reproduce the recurring `preview_playwright` `options.mode` failure, and test the workarounds that remain. Produce one recommendation matrix (capability → tool) backed by executed probes, and four fallback tools for capabilities that cannot be satisfied locally. Deliverables are Spec Kit artifacts, one evidence record and a Memory Bank entry; nothing in the application or dependency graph changes.

## Technical Context

- **Language/Version**: Node.js v26.13.0 in the sandbox (`package.json` `engines.node` is `22.x`); pnpm 10.30.3; Python 3.12.3.
- **Primary Dependencies**: existing devDependencies only — `playwright`, `@playwright/test`, `playwright-chromium` 1.64.1. No package installed, added or upgraded.
- **Storage**: Spec Kit artifacts under `specs/108-browser-testing-tooling-evaluation/`; evidence under `artifacts/browser-testing-tooling/`.
- **Testing**: direct probes (browser launch, managed-browser tool calls, registry version lookups), then `./freebuff-verify.sh`.
- **Target Platform**: Ubuntu 24.04.5 LTS x86_64 cloud VM, non-root user `fb0b08ef27df00c0e858c01702`, `no_new_privileges` set, no display server.
- **Project Type**: Repository investigation and recommendation; no runtime change.
- **Performance Goals**: Not applicable; the only build is the standard verification build.
- **Constraints**: 495 MB hard production-build maximum; `.docs/` read-only; no installs; no application code, dependency, lockfile, workflow or configuration change.

## Constitution Check

- **Single source of truth**: PASS — work follows `AGENTS.md`, the selected group files and the Spec Kit command definitions.
- **Verify before acting**: PASS — every status claim comes from an executed probe or a cited upstream requirement, not memory.
- **Implementation sequence**: PASS — inspect, identify, understand, plan, implement, test, double-check, report, pull request.
- **Protect core systems**: PASS — no payment, database, authentication, deployment or secret surface touched.
- **Resource conservation**: PASS — `.docs/` untouched, no documentation refresh.
- **PR ownership**: PASS — pull request left open and unmerged.

## Research Findings (executed)

1. **Playwright is installed and version-aligned** (`playwright --version` → 1.64.1; `@playwright/test` 1.64.1) and its Chromium builds are in `~/.cache/ms-playwright` (`chromium-1248`, `chromium_headless_shell-1248`), but `chromium.launch()` fails: the headless shell exits with `error while loading shared libraries: libnspr4.so`. `ldd` reports missing system libraries for both binaries (full list in the evidence record).
2. **The missing libraries cannot be installed here**: `sudo` is refused (`The "no new privileges" flag is set`), `apt-get update` cannot lock `/var/lib/apt/lists`, and `apt-get install --dry-run libnspr4` reports `E: Unable to locate package libnspr4`. The Playwright docs path (`playwright install --with-deps`) therefore cannot complete in this sandbox.
3. **The managed `preview_playwright` bridge fails for every script**, including `return 1;`: `The property 'options.mode' must be one of: 'strip'. Received 'transform'`. A repository-wide search finds no code that sets that option — the only match is a prior evidence note — so the fault is in the platform bridge, not repository code.
4. **The managed browser's other tools do work**: `preview_evaluate`, `preview_snapshot`, `preview_click`, `preview_navigate` and `preview_screenshot` all succeeded, rendered the real homepage, saved a PNG into the workspace, and followed the "Consult the Crystal Ball" navigation to `/crystal-ball`.
5. **The managed browser is fixed-viewport** (`innerWidth` 1024, `innerHeight` 768, `dpr` 1) with no emulation switch exposed, so mobile viewport testing is not available through it.
6. **Puppeteer is not installed**; the registry publishes 25.16.0. Puppeteer was not installed or launched. Although a Chromium-based browser would still need compatible Linux shared libraries, no Puppeteer-specific launch was performed, so this investigation does not establish that Puppeteer uses the same cached browser binaries or solves the local blocker.
7. **Browser Use is not installed** (no `browser_use`/`playwright`/`selenium` Python modules). PyPI describes a Python ≥3.11 library that requires an LLM provider key (for example `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` or `BROWSER_USE_API_KEY`) plus a Playwright browser or a hosted cloud browser.
8. **Computer Use is unavailable**: it needs a vision-model API key and a desktop/screen session. No LLM or browser-cloud key variable is present in the environment and `DISPLAY` is unset.
9. **The authoritative automated-visual environment is GitHub Actions**: `.github/workflows/visual-qa.yml` runs `pnpm exec playwright install --with-deps chromium` on `ubuntu-latest` and then `pnpm exec playwright test`, whose three projects cover desktop 1440×900, mobile-390 and mobile-412.
10. **Cloud preview routing is two-step**: the `*.style.dev` hostname returned an edge 404 ("no application is set up to serve it") until `cloud_show_dev_server` registered the dev server, after which the same host served the app through a ticket URL.

## Design

### Capability → tool matrix (recommended combination)

| Capability | Recommended tool | Basis |
| --- | --- | --- |
| Automated browser testing / visual regression | Playwright 1.64.1 in GitHub Actions Visual QA (and any host with `install-deps`) | Working stack already wired: config, three projects, baselines |
| Mobile testing | Playwright `mobile-390` / `mobile-412` projects in CI; real-device cloud (BrowserStack/LambdaTest) when physical devices matter | Managed browser has no viewport emulation; local Chromium blocked |
| Screenshots | Playwright in CI for baselines; managed cloud browser `preview_screenshot` for same-session visual checks | Both demonstrated/cited |
| Visitor walkthrough | Managed cloud browser (`preview_snapshot` → `preview_click` → `preview_evaluate`) | Executed on the real site this session |

### Rejected locally

- Local Playwright/Puppeteer Chromium: blocked by missing system libraries without root.
- `preview_playwright`: platform-side validation defect, not bypassable by script content.
- Computer Use and Browser Use: require credentials and (for Computer Use) a desktop; none available, and installing is out of scope.

### Fallback tools when a recommended path is unavailable

1. **Playwright MCP** (`@playwright/mcp`) — accessibility-tree browser control for an agent; needs Node 20+ and a Chromium it can launch (so it inherits the local library blocker and is suited to a CI or host with dependencies installed).
2. **Chrome DevTools MCP** — Chrome control plus performance traces and source-mapped console errors; needs a Chrome it can drive, so same local constraint.
3. **Hosted CDP Chromium** (Browser Use Cloud browsers or Browserbase) — `chromium.connectOverCDP(cdpUrl)` makes the existing Playwright scripts run against a remote browser with no local system libraries; needs a paid/owner API key.
4. **Real-device cloud** (BrowserStack / LambdaTest) — physical iOS/Android coverage that CI Chromium emulation cannot provide; needs an owner account.

Cypress and Selenium/WebdriverIO are deliberately not recommended: they bring the same local Chromium library requirements, so they add a second stack without solving the blocker.

### Scope of change

- Add: `specs/108-browser-testing-tooling-evaluation/{spec.md,plan.md,tasks.md,checklists/requirements.md}`
- Add: `artifacts/browser-testing-tooling/out/tool-probes.json`, `artifacts/browser-testing-tooling/out/home-desktop-cloud-browser.png`
- Update: `.specify/feature.json` (Spec Kit pointer), `memory-bank/activeContext.md`

## Verification Plan

**Runtime qualification**: The recorded local install, test and build results were produced under Node.js v26.13.0, while `package.json` declares Node `22.x`. They are not evidence of compatibility with the declared runtime. Re-run the required gate under Node 22.x in PR CI before claiming verified completion.

1. Re-run the two decisive probes (`chromium.launch()` and a `preview_playwright` call) and confirm the same failures before reporting them.
2. Confirm the successful path end-to-end: dev server reachable, cloud browser renders the page, screenshot saved, click navigates.
3. Run `./freebuff-verify.sh`, record the exit status, and measure `.next` + `public` against the 495 MB maximum.
4. Audit the final diff for out-of-scope changes: no application file, `package.json`, `pnpm-lock.yaml`, workflow, or `.docs/` modification.

## Risks and Mitigations

- **Risk**: A future session treats the local Chromium as usable.
  - **Mitigation**: The evidence record states the exact failing library and the privilege constraint; the recommendation routes local rendering to the managed browser or CI.
- **Risk**: The platform `options.mode` defect is mistaken for a repository bug and "fixed" in code.
  - **Mitigation**: The report states it is platform-side and records the working replacements.
- **Risk**: Screenshot evidence is lost when the workspace is archived.
  - **Mitigation**: The PNG is committed with the evidence record.
- **Risk**: A recommendation implies a paid tool is already available.
  - **Mitigation**: Every tool needing an account or key is labelled as requiring owner setup.
