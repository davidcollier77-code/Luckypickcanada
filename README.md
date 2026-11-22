# Lucky Pick Canada

> A Canadian digital entertainment experience for daily luck, stories, collectible cards, and a little everyday magic.

**[Visit Lucky Pick Canada](https://luckypickcanada.ca/)**

Lucky Pick Canada is an independent community-focused web experience created in Nova Scotia. It combines playful daily experiences with community stories, interactive reveals, and shareable moments.

## Explore the Live Experience

- **Lucky Meter** — a daily experience designed around reflection, encouragement, and fun.
- **Lucky Stories & Lucky Map** — share experiences of luck and explore stories from across Canada.
- **Daily Lucky Card** — reveal a collectible digital card and build a collection over time.
- **Crystal Ball** — ask a question and receive a playful, mystical reading.
- **Lucky Picks** — generate fresh number combinations for entertainment.
- **Gift Experiences** — send a personalized digital lucky experience to someone else.
- **Suggestion Box** — contribute ideas for the project.
- **Tip Jar** — optionally support the independent project.

The project is designed so visitors can enjoy one small experience and naturally discover the rest.

## The Community Comes First

At the heart of Lucky Pick Canada are the people and the stories they bring with them.

Share a lucky story about an unexpected coincidence, an opportunity that appeared at just the right time, finding money, a small everyday win, or simply a moment that made you feel unusually lucky. Stories can become part of the Lucky Map of Canada, giving visitors a way to explore experiences being shared across the country.

The numbers are only part of the experience. The bigger idea is what happens around them: the stories people tell, the moments they remember, and the connections that can grow from a little bit of fun.

## More Than the Numbers

Lucky Pick Canada is not built around the idea that numbers are the most important part of the experience.

It is about creating something people can return to, share with someone else, contribute to, and make part of their own routine.

A lucky pick might bring someone to the site once.

A story, a card collection, a shared experience, or something discovered along the way might give them a reason to come back.

## A Small Canadian Project

Lucky Pick Canada is an independent digital entertainment and community project created in Nova Scotia.

It began with a simple idea around everyday positivity and has continued to grow one feature, one story, and one little moment at a time.

The goal is simple: create something positive, playful, and distinctly Canadian that people can enjoy and share.

## Entertainment Only

Lucky Pick Canada is an independent digital entertainment experience. It does not operate a lottery, provide gambling services, or offer real-money lottery prizes, and it is not affiliated with, endorsed by, or connected to any lottery organization.

The experience is designed for fun, encouragement, creativity, and community participation.

## Development

Lucky Pick Canada is built with Next.js, React, and TypeScript, with an emphasis on reliability, accessibility, performance, and a polished experience across phones, tablets, and desktop devices.

### Local Development

This project uses `pnpm`.

```bash
pnpm install
pnpm dev
```

### Playwright Modes

Normal QA and CI use the standard Playwright configuration:

```bash
pnpm exec playwright test
```

For an explicit software-rendered investigation of GPU, WebGL or graphics behaviour, select the
opt-in SwiftShader configuration:

```bash
pnpm exec playwright test --config=playwright.swiftshader.config.ts
```

The SwiftShader mode forces the software backend, uses one worker and does not update visual
baselines. It is for investigation only; CI continues to use the standard configuration.

### Freebuff Workspace Startup

The Freebuff project startup command is stored in Freebuff Project Settings, outside this repository. This is the
exact value to paste there; the repository cannot read or change that setting:

```bash
bash -lc 'bash scripts/verify-startup.sh && source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile && pnpm exec playwright cli --help && bash scripts/setup-playwright-agent.sh --install-browser && (bash scripts/setup-chromium-libs.sh --check >/dev/null 2>&1 || bash scripts/setup-chromium-libs.sh) && eval "$(bash scripts/setup-chromium-libs.sh --env)" && bash scripts/setup-chromium-libs.sh --persist && bash scripts/setup-playwright-agent.sh --probe-browser'
```

Each step is chained with `&&`, so it runs in this order and stops the rest of the command on failure:

1. `bash scripts/verify-startup.sh` — reports whether `AGENTS.md`, all four Memory Bank files and
   `.docs/manifest.json` exist, are readable and are non-empty, that `AGENTS.md` still names them, that the manifest
   parses with the expected structure, and that `AGENTS.md` fits Freebuff's ~64 KiB project-instructions budget.
   Running it first means the context answer is visible even when the install or the Playwright check later fails.
2. `source scripts/bootstrap-pnpm.sh` — resolves the exact `pnpm` version pinned in `package.json#packageManager`
   and exports its directory on `PATH`. Because that export only survives in the shell that sources it, the
   bootstrap and the install share one explicit Bash process. Do not replace it with
   `bash scripts/bootstrap-pnpm.sh && …` (the export dies with the child process) or a bare `source …` (it fails
   under a POSIX `sh`).
3. `CI=true pnpm install --frozen-lockfile` — installs the committed dependency tree and fails when the tree or the
   lockfile is out of date. `CI=true` keeps pnpm non-interactive during startup.
4. `pnpm exec playwright cli --help` — proves the repository-local Playwright agent CLI used for browser QA is
   installed and runnable, without launching a browser.
5. `bash scripts/setup-playwright-agent.sh --install-browser` — installs the project-pinned Chromium only when
   `--browser-root` reports no browser at the pinned revision (an existing matching cache or an environment-provided
   install costs no download, while a cache left behind by another Playwright version is repaired), then confirms the
   pinned revision is installed afterwards — the log names the revision it reused or downloaded, and a download that
   does not produce it fails here instead of surfacing later as a misleading library error. It runs before the strict
   check because that check validates the browser binaries: on a workspace that has never had a browser it fails, the
   provisioning branch below runs, and that branch ends by repeating the same check. Installing first keeps the check
   as the assertion it is meant to be instead of a step that aborts a cold startup. The download does not launch the
   browser, so it needs no `LD_LIBRARY_PATH`; `setup-playwright-agent.sh` applies the library environment to itself
   when it is already provisioned.
6. `bash scripts/setup-chromium-libs.sh --check || bash scripts/setup-chromium-libs.sh` — the check is a 0.06 s
   `ldd` against the Playwright Chromium binary, so provisioning only runs when the libraries are missing. The image
   ships none of them and refuses `sudo`, so the script downloads the official Ubuntu packages with `apt-get` as an
   unprivileged downloader and unpacks them into `~/.local/chromium-libs`; nothing is written system-wide. A
   provisioned workspace takes about 11 s once. A system-wide runtime — every required object, `/etc/fonts/fonts.conf`
   and a system font directory — satisfies the same check, so a machine or image that already installs the packages
   needs no download and no exports at all.
7. `eval "$(bash scripts/setup-chromium-libs.sh --env)"` — applies the `LD_LIBRARY_PATH` and `FONTCONFIG_*` values in
   the shell that runs the probe, because the provisioning step's environment does not outlive its own process.
8. `bash scripts/setup-chromium-libs.sh --persist` — writes `~/.local/chromium-libs/env.sh` and sources it from a
   guarded block in `~/.profile` and `~/.bashrc`. The exports of a startup command die with that process, so without
   this step every later shell would start with no `LD_LIBRARY_PATH` and Chromium would fail on `libnspr4.so` again.
   Both files live under `$HOME`, so the wiring survives workspace restarts and is rewritten idempotently, never
   duplicated.
9. `bash scripts/setup-playwright-agent.sh --probe-browser` — re-applies the same Chromium environment to its own
   shell and launches the pinned browser headlessly, so startup ends with
   `PASS: Chromium launched and rendered a probe page` instead of an unproven CLI.

`pnpm exec playwright test` and `bash scripts/setup-playwright-agent.sh --probe-browser` need no manual setup: the
Playwright config injects the library and font paths when `~/.local/chromium-libs` exists, and the setup script
applies them to its own process. Other shells load them from the profiles written by `--persist`.

Interactive browser work goes through one command, which installs the dependencies, provisions the libraries,
installs the pinned browser if it is missing, applies the runtime environment and selects the pinned Chromium:

```bash
./scripts/playwright-cli.sh open https://luckypickcanada.ca
./scripts/playwright-cli.sh snapshot
./scripts/playwright-cli.sh close
```

The wrapper is required rather than convenient: a non-interactive shell does not read a profile, so
`LD_LIBRARY_PATH` and `FONTCONFIG_*` are absent, and the CLI's default channel is a system Chrome that this image does
not have. `./scripts/playwright-cli.sh test ...` passes test runs through to `pnpm exec playwright test`, which needs
neither workaround because `playwright.config.ts` injects the same paths. A bare `pnpm exec playwright cli` still
works once the environment is applied and `--browser=chromium` is passed, but nothing should depend on remembering
that.

**Where the browser comes from.** `scripts/setup-chromium-libs.sh --browser-root` prints the directory a workspace
will launch. A prebaked Playwright install — `$PLAYWRIGHT_BROWSERS_PATH`, or one of `/opt/ms-playwright`,
`/usr/local/share/ms-playwright`, `/usr/share/ms-playwright`, `/ms-playwright` — is used as it is and exported, so
Playwright, the probe and the CLI read it instead of downloading it. A read-only directory is only trusted when it
holds the revision this repository pins (`chromium-1248`), because Playwright fails on a mismatch instead of falling
back; a writable one may hold any revision, since `playwright install` can repair it in place. With no prebaked
install, the default `~/.cache/ms-playwright` is used.

The same revision rule covers Playwright's own `~/.cache/ms-playwright`: `--browser-root` succeeds only when the
pinned revision is present there, so a cache written by an older or newer Playwright makes
`setup-playwright-agent.sh --install-browser` download the pinned build instead of skipping it. The strict `--check`
verifies the pinned binaries too, so `ldd` never reports a launchable browser that Playwright would refuse to start.

`bash -lc` is deliberate: the login profile supplies `node` and `npm`, which the bootstrap needs. With a minimal
`PATH` and no login profile neither resolves; `bash -c` alone was measured failing there and `bash -lc` succeeding.

**The four Memory Bank files are checked, not preloaded.** Freebuff injects only the project-root `AGENTS.md` (or
`CLAUDE.md`) into the agent's context; terminal output from the startup command is not added to it. The supported
approach is the one in the “Memory Bank context and maintenance” section of `AGENTS.md` — the agent reads all four Memory Bank files and
`.docs/manifest.json` before task work. Keep that instruction in `AGENTS.md`.

`__tests__/freebuff-startup-command.test.js` fails if this block is removed, duplicated, edited away from that
tested form or reordered, and it executes the documented command with `pnpm` absent from `PATH` under both Bash
and a POSIX `sh`.

## Local verification

`./freebuff-verify.sh` is the local gate. It runs the pinned/frozen install, the Spec Kit task gate, every Python
checker suite, the standalone TypeScript check, the **full Vitest suite**, the documentation-refresh tests, the
Next.js production build and a 495 MiB size check. It deliberately does **not** run Playwright, the OpenNext
artifact build, DevSkim or any deployment command; those run in GitHub Actions after the pull request is opened.

Build validation and the Playwright shards are conditional: the trusted classifier decides whether the change set
can affect them, and any unknown, empty or unreadable change set keeps them required. Playwright is not part of this
local gate and does not run for documentation, CI or backend-only pull requests; the browser shards run only when a
change can affect rendered output or the visual tests. The always-required application job is named **Application
Verification**; a check that could not apply is reported as `NOT RUN — not applicable` with its reason, never as a
pass. Playwright remains two shards, assigned by whole spec file from recorded durations, and every spec, project
and committed baseline still runs and is compared.
