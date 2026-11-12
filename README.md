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

### Freebuff Workspace Startup

The Freebuff project startup command is stored in Freebuff Project Settings, outside this repository. This is the
exact value to paste there; the repository cannot read or change that setting:

```bash
bash -lc 'bash scripts/verify-startup.sh && source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile && pnpm exec playwright cli --help && (bash scripts/setup-chromium-libs.sh --check >/dev/null 2>&1 || bash scripts/setup-chromium-libs.sh) && eval "$(bash scripts/setup-chromium-libs.sh --env)" && bash scripts/setup-chromium-libs.sh --persist && bash scripts/setup-playwright-agent.sh --install-browser --probe-browser'
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
5. `bash scripts/setup-chromium-libs.sh --check || bash scripts/setup-chromium-libs.sh` — the check is a 0.06 s
   `ldd` against the Playwright Chromium binary, so provisioning only runs when the libraries are missing. The image
   ships none of them and refuses `sudo`, so the script downloads the official Ubuntu packages with `apt-get` as an
   unprivileged downloader and unpacks them into `~/.local/chromium-libs`; nothing is written system-wide. A
   provisioned workspace takes about 11 s once.
6. `eval "$(bash scripts/setup-chromium-libs.sh --env)"` — applies the `LD_LIBRARY_PATH` and `FONTCONFIG_*` values in
   the shell that runs the probe, because the provisioning step's environment does not outlive its own process.
7. `bash scripts/setup-chromium-libs.sh --persist` — writes `~/.local/chromium-libs/env.sh` and sources it from a
   guarded block in `~/.profile` and `~/.bashrc`. The exports of a startup command die with that process, so without
   this step every later shell would start with no `LD_LIBRARY_PATH` and Chromium would fail on `libnspr4.so` again.
   Both files live under `$HOME`, so the wiring survives workspace restarts and is rewritten idempotently, never
   duplicated.
8. `bash scripts/setup-playwright-agent.sh --install-browser --probe-browser` — applies the same Chromium
   environment to its own shell, installs the project-pinned Chromium (a no-op when the cache already matches
   Playwright 1.64.1) and launches it headlessly, so startup ends with
   `PASS: Chromium launched and rendered a probe page` instead of an unproven CLI.

`pnpm exec playwright test` and `bash scripts/setup-playwright-agent.sh --probe-browser` need no manual setup: the
Playwright config injects the library and font paths when `~/.local/chromium-libs` exists, and the setup script
applies them to its own process. Other shells load them from the profiles written by `--persist`.

Interactive `pnpm exec playwright cli` commands are the exception: a non-interactive shell does not read a profile, so
in one of those either run `eval "$(bash scripts/setup-chromium-libs.sh --env)"` first or define the same three
values in Freebuff's Variables section, and pass `--browser=chromium` to `pnpm exec playwright cli open`, because the
CLI's default channel is a system Chrome that this image does not have.

`bash -lc` is deliberate: the login profile supplies `node` and `npm`, which the bootstrap needs. With a minimal
`PATH` and no login profile neither resolves; `bash -c` alone was measured failing there and `bash -lc` succeeding.

**The four Memory Bank files are checked, not preloaded.** Freebuff injects only the project-root `AGENTS.md` (or
`CLAUDE.md`) into the agent's context; terminal output from the startup command is not added to it. The supported
approach is the one in `AGENTS.md` §1 step 4 — the agent reads all four Memory Bank files and
`.docs/manifest.json` before task work. Keep that instruction in `AGENTS.md`.

`__tests__/freebuff-startup-command.test.js` fails if this block is removed, duplicated, edited away from that
tested form or reordered, and it executes the documented command with `pnpm` absent from `PATH` under both Bash
and a POSIX `sh`.
