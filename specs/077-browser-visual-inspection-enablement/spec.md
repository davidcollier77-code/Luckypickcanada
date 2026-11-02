# Feature Specification: Browser Visual Inspection Enablement (Investigation Only)

**Feature Branch**: `freebuff/f9451dce1ff9eb4af88ea1f8`

**Created**: 2026-11-02

**Status**: Investigated and reported — no installation, permission, configuration, website or
application change was made or is proposed by this task. Enabling the capability requires the
owner's approval of the requests in "Requested Permissions".

**Task groups**: `troubleshooting` (diagnose why the configured Playwright/Chromium path cannot run
in this workspace) + `deep-dive` (cross-check the sandbox, the repository's browser configuration,
the CI browser path, and the recorded history of blocked browser checks).

**Input**: Determine what Freebuff needs in order to visually inspect its completed work on
LuckyPickCanada.ca with a real browser; identify whether Chromium, Playwright, browser permissions,
additional tools or workspace configuration are missing; explain exactly what prevents visual
browser inspection today; and state the minimum permissions required, with a reason for each, for the
owner's approval.

## Context (verified in this workspace before design)

All measurements below were taken in this cloud worktree on 2026-11-02. Nothing is assumed from
memory; each line is a command result.

### Sandbox

| Check | Result |
| --- | --- |
| OS / architecture | Ubuntu 24.04.5 LTS, `x86_64` |
| Identity | `uid=261478524`, group `freebuff` — unprivileged |
| Root escalation | **Blocked**: `sudo` refuses with `The "no new privileges" flag is set, which prevents sudo from running as root` |
| Package manager | `apt 2.8.3` present, but `apt-get -s install libnspr4` reports `E: Unable to locate package libnspr4` and `apt-get needs root privileges` |
| Node | `v26.13.0`; repository requires Node 22 (`engines.node: "22.x"`, `.nvmrc: "22"`) |
| Package manager for the repo | `npm 11.20.0` present; **`pnpm` and `corepack` absent** |
| Installed dependencies | `node_modules` **absent** |
| Playwright browsers | `~/.cache/ms-playwright` **does not exist** — no downloaded Chromium build |
| Browser on `PATH` | no `chromium`, `chromium-browser` or `google-chrome`; nothing browser-like under `/opt` |
| Display | `DISPLAY` unset, `XDG_RUNTIME_DIR` unset — no X server (headless is still acceptable for Chromium) |
| Resources | 8 vCPU, 15 GiB RAM, 2.0 GiB `/dev/shm`, 55 GiB free — **not a constraint** |
| Outbound network | `registry.npmjs.org` 200, `cdn.playwright.dev` reachable, `https://luckypickcanada.ca/` 200 — **not a constraint** |
| Persistence | processes and system package installations do not survive archive/restore; `node_modules` and package caches are disposable |

Chromium's Linux runtime dependencies are absent from the image (`ldconfig -p`); only a few
graphics libraries are present:

| Shared library | Status |
| --- | --- |
| `libnspr4.so`, `libnss3.so`, `libnssutil3.so`, `libsmime3.so` | **ABSENT** |
| `libatk-1.0.so.0`, `libatk-bridge-2.0.so.0`, `libatspi.so.0` | **ABSENT** |
| `libcairo.so.2`, `libpango-1.0.so.0` | **ABSENT** |
| `libasound.so.2`, `libcups.so.2`, `libxkbcommon.so.0` | **ABSENT** |
| `libXcomposite.so.1`, `libXdamage.so.1`, `libXrandr.so.2` | **ABSENT** |
| `libgbm1` (25.2.8), `libx11-6` (1.8.7), `libdrm`, `libX11-xcb` | present |

The matching Debian packages (`libnspr4`, `libnss3`, `libatk1.0-0t64`, `libatk-bridge2.0-0t64`,
`libcups2t64`, `libxkbcommon0`, `libxcomposite1`, `libxdamage1`, `libxfixes3`, `libxrandr2`,
`libpango-1.0-0`, `libcairo2`, `libasound2t64`, `libatspi2.0-0t64`) are all reported missing by
`dpkg -l`.

### Direct launch measurement (measured, not inferred)

Restoring the committed lockfile for the mandatory verification gate
(`pnpm install --frozen-lockfile`) also downloaded the repository's pinned Playwright Chromium build
to `~/.cache/ms-playwright/chromium-1243` and `chromium_headless_shell-1243`. That made the failure
measurable directly instead of inferred:

- `ldd ~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome` reports **16 missing** shared
  objects: `libXcomposite.so.1`, `libXdamage.so.1`, `libXfixes.so.3`, `libXrandr.so.2`,
  `libasound.so.2`, `libatk-1.0.so.0`, `libatk-bridge-2.0.so.0`, `libatspi.so.0`, `libcairo.so.2`,
  `libcups.so.2`, `libnspr4.so`, `libnss3.so`, `libnssutil3.so`, `libpango-1.0.so.0`,
  `libsmime3.so`, `libxkbcommon.so.0`.
- Launching the binary directly: `chrome --headless --no-sandbox --dump-dom about:blank` →
  `error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or
  directory` (exit 127).
- Launching through Playwright: `chromium.launch({headless:true})` →
  `browserType.launch: Target page, context or browser has been closed`, with the browser log
  `chrome-headless-shell: error while loading shared libraries: libnspr4.so ...`.

**Consequence for the record**: the `Target page, context or browser has been closed` and
"renderer crash" symptoms written into `specs/061`, `specs/064` and `specs/066` are this same
missing-library failure surfacing through Playwright's launch handshake. They were never evidence of
a rendering defect in the website.

### Resolution without root (follow-up, 2026-11-02)

The owner then asked for the libraries through a supported platform-level path **without root and
without weakening sandbox security**. Because the image itself cannot be changed from inside the
workspace, the libraries were provisioned at user level from the official Ubuntu archive, with apt
used only as a downloader:

- `apt-get -o Dir::State::lists=$HOME/.apt-user/lists -o Dir::Cache=$HOME/.apt-user/cache … update`
  succeeds as an unprivileged user (exit 0; 26.6 MB of package indexes fetched).
- `apt-get … --download-only --reinstall install` fetched the 47 official `.deb` files covering the
  Chromium dependency closure; `dpkg-deb -x` unpacked them into `~/.local/chromium-libs` (27 MB).
  `sudo` was never invoked and `no-new-privileges` was left untouched.
- `LD_LIBRARY_PATH` plus a private fontconfig file
  (`~/.local/chromium-libs/etc/fonts/lpc-fonts.conf`) let the browser find both the libraries and the
  fonts; the image ships no `/etc/fonts`, which would otherwise render text as blank boxes.

Result: `ldd` on `chromium-1243/chrome-linux64/chrome` reports **0 missing** shared objects (it was
16), and Chromium **153.0.8010.12** launched through the repository's pinned `playwright-chromium`
build and captured real screenshots of `https://luckypickcanada.ca/` at 1440×900, 390×844 and
412×915 — all HTTP 200, `scrollWidth === clientWidth` (0 px horizontal overflow), no broken images.

Persistence: the prefix lives under `$HOME`, inside the durable `/workspace` tree, so it survives
archive/restore **for this workspace**. It is not part of the shared base image, so a brand-new
workspace must run `scripts/setup-chromium-libs.sh` once; image-level inclusion remains a platform
change that only the workspace image owner can make.

### Repository (already correct — nothing to build)

- `playwright.config.ts` already configures Chromium with three projects (desktop 1440x900,
  `mobile-390`, `mobile-412`), `testDir: './tests/visual'`, and a `webServer` that starts
  `pnpm dev --hostname 127.0.0.1 --port 3000`.
- `.github/workflows/visual-qa.yml` is a working browser path: `ubuntu-latest`, Node 22, pnpm
  10.30.3, `pnpm exec playwright install --with-deps chromium`, then `pnpm exec playwright test`, and
  it uploads `playwright-report/` and `test-results/` as artifacts.
- `@playwright/test`, `playwright` and `playwright-chromium` are already pinned in
  `devDependencies`; no dependency needs to be added for a browser to run.

### Recorded history in this container family (why this is not a new conclusion)

`specs/041-turnstile-early-preload/research.md` records `chromium-1243` failing with
`libnspr4.so: cannot open shared object file` and `sudo` blocked by the `no new privileges` flag.
`specs/061`, `specs/064` and `specs/066` record `page.goto: Target page, context or browser has been
closed` (renderer crash) even after system libraries were extracted locally, and
`memory-bank/activeContext.md` records the same BLOCKED browser check for features 074, 075 and 076.
So the blocker has been stable across sessions, and it is environmental, not a repository defect.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Know exactly what is missing (Priority: P1)

The owner reads one report that states, with command evidence, what the sandbox has and does not
have, so they can decide what to authorize instead of guessing.

**Independent Test**: Every claim in the report is reproducible with the command quoted beside it.

**Acceptance Scenarios**:

1. **Given** the report, **Then** it names the missing browser engine, the missing shared libraries,
   the missing repository dependencies and the missing package manager, each with the command output.
2. **Given** the report, **Then** it explicitly separates environment limitations from repository
   configuration, and states that the repository's Playwright and CI configuration need no change.

### User Story 2 — Approve the minimum permissions (Priority: P1)

The owner receives a short, plain-language list of permissions to grant, each with the reason it is
needed and what it would not grant.

**Independent Test**: Each requested permission maps to exactly one blocked step of a browser run.

**Acceptance Scenarios**:

1. **Given** the permission list, **Then** each item states why it is needed and what it does not
   authorize (no dependency change, no deployment, no secret access).
2. **Given** approval of only the browser-engine and library items, **Then** that is sufficient for a
   local headless visual check; every other item is optional and labelled as such.

### User Story 3 — Nothing is changed without approval (Priority: P2)

Between the report and the owner's decision, the workspace and repository stay untouched apart from
reporting artifacts.

**Independent Test**: `git status` shows only Spec Kit and memory artifacts; no application, config,
permission or dependency file is modified.

**Acceptance Scenarios**:

1. **Given** the audit, **Then** no package is installed into the repository, no permission is
   changed, and no configuration is modified.
2. **Given** the audit, **Then** the branch contains only documentation-style artifacts and the PR
   stays open and unmerged.

### Edge Cases

- A future sandbox image includes the libraries but not a Playwright browser build: the browser still
  cannot launch, so the engine download must be authorized separately from the libraries.
- A browser can be launched but its renderer crashes on heavy routes (the recorded 061/064/066
  behaviour): libs extracted by hand into a local directory were enough to start Chromium but not
  stable enough for the homepage, so partial local workarounds must not be presented as a working
  browser.
- Node 26 in the sandbox versus Node 22 in CI: a local pass on Node 26 is not evidence about the
  Node 22 production build, so the toolchain pin matters for trustworthy comparison.
- Any install performed here is lost on archive/restore, so the setup must be scripted to be repeated
  rather than treated as a one-time fix.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The report MUST state, with the command output that produced it, which components of a
  real-browser visual inspection are present and which are missing.
- **FR-002**: The report MUST name the single root cause that prevents visual browser inspection in
  this workspace, distinguishing "no browser engine", "no Chromium runtime libraries", "no root to
  install them" and "no repository dependencies".
- **FR-003**: The report MUST list the minimum permissions required, each with its purpose and the
  scope it does not cover.
- **FR-004**: The report MUST state what is explicitly not needed (display server, GPU, new
  dependency, deployment or secret access) so the owner does not grant more than necessary.
- **FR-005**: The report MUST record the alternative browser paths that exist today (CI Visual QA
  artifacts, the platform dev-server preview) and what each can and cannot prove.
- **FR-006**: This task MUST NOT install packages, change permissions, modify configuration, or change
  website or application behaviour.
- **FR-007**: The report MUST be presented for the owner's approval before anything is enabled.

### Key Entities

- **Sandbox capability**: what the workspace can already do (network, CPU, memory, npm), versus what
  it cannot (root, Chromium libraries, browser engine).
- **Permission request**: one authorization item, with reason, minimum scope and excluded scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of environment claims carry the command result that proves them.
- **SC-002**: Every requested permission maps to a concrete blocked step; no permission is requested
  without a stated reason.
- **SC-003**: The final diff contains only Spec Kit artifacts, the memory-bank context update and the
  PR summary — zero application, dependency, configuration or permission changes.
- **SC-004**: The report reaches a decision the owner can act on in one reading, with no follow-up
  investigation required from them.

## Assumptions

- "Visually inspect its completed work" means Freebuff capturing and reviewing rendered screenshots
  of LuckyPickCanada.ca (locally served build or the deployed site), which requires a browser engine
  in this workspace; a preview shown in the owner's own browser does not give Freebuff that ability.
- The owner, not the agent, decides whether to grant root or change the sandbox image.
- Pinning Node 22 is treated as a comparison-fidelity improvement, not a product requirement.
