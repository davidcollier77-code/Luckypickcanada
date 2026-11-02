# Implementation Plan: Browser Visual Inspection Enablement (Investigation Only)

**Feature**: `specs/077-browser-visual-inspection-enablement`

**Branch**: `freebuff/f9451dce1ff9eb4af88ea1f8`

## Summary

Run a read-only capability audit of the sandbox and of the repository's existing browser
configuration, reproduce the recorded blocker with current command output, and turn the gap into a
short, minimum-scope permission request. The deliverable is the report; no capability is enabled.

## Constitution Check

- **I. Single Source of Truth** — `AGENTS.md` governs the workflow; unchanged.
- **II. Verify Before Acting** — every capability claim comes from a command run in this workspace;
  no claim is inherited from memory without re-measurement.
- **III. Implementation Sequence** — specify → plan → tasks → implement (report) → verify → diff audit
  → PR summary.
- **IV. Protect Core Systems** — no Stripe, database, auth, API route, Cloudflare, environment or
  accessibility change. `.docs/` is read-only and unmodified.
- **V. Resource Conservation** — the audit is read-only apart from lockfile-pinned dependency restore
  needed for the mandated verification gate; no new dependency is added to `package.json`.
- **VI. Scope** — audit-only is explicitly authorized by the request, which forbids installation,
  permission, configuration and product changes.

**Gate result**: PASS.

## Phase 0 — Research

Local measurement answered every question; external research was not required. The repository's own
`playwright.config.ts`, `visual-qa.yml` and the 041/061/064/066 artifacts already document the browser
path and the historical failure.

## Phase 1 — Design of the audit

1. **Sandbox capability probe** (read-only): OS, identity, `sudo`, `apt`, Node/npm/pnpm/corepack,
   `node_modules`, Playwright browser cache, browser binaries on `PATH`/`/opt`, `DISPLAY`,
   `/dev/shm`, CPU/RAM/disk, and outbound network to the npm registry, the Playwright CDN and
   `luckypickcanada.ca`.
2. **Chromium runtime dependency probe** (read-only): `dpkg -l` for the Debian package set Chromium
   links against, plus `ldconfig -p` for the shared objects, to separate "browser engine missing" from
   "browser engine would link but would not start".
3. **Repository browser-path probe** (read-only): confirm the Playwright projects, viewports, test
   directory and `webServer` command, and confirm CI installs Chromium with system dependencies.
4. **Root-cause statement**: combine (1)–(3) into one causal chain, with the recorded session history
   as corroboration rather than as the primary evidence.
5. **Permission model**: for each blocked step, state the minimum authorization that unblocks it, what
   it does not authorize, and whether it is required or optional.

## Phase 2 — Design of the permission request

| # | Permission | Maps to blocked step | Required? |
| --- | --- | --- | --- |
| 1 | Chromium runtime libraries present in the sandbox image **or** root (`sudo`/no `no-new-privileges`) so `playwright install --with-deps` can add them | every Chromium launch | required |
| 2 | Download the Playwright Chromium build into the sandbox (`pnpm exec playwright install chromium`, ~150 MB) | "no browser engine" | required |
| 3 | Restore dependencies from the committed lockfile (`pnpm install --frozen-lockfile`) | `playwright.config.ts` cannot start | required |
| 4 | Run a local dev server and Playwright processes in the sandbox, writing screenshots/reports to an ignored path | capture and review | required |
| 5 | Pin Node 22 in the sandbox to match `engines.node`/`.nvrc`/CI | result fidelity | optional |
| 6 | Outbound HTTPS to the deployed site (already verified working) | inspecting production | already available |

Explicitly **not** requested: new repository dependencies, `package.json`/lockfile edits, deployment
or Cloudflare credentials, Stripe/database/auth access, environment or secret values, and access to
the owner's personal browser session.

## Phase 3 — Alternatives recorded (not adopted without approval)

- **CI Visual QA as the browser** — already exists and does prove rendering, but only on a pushed
  branch and only as uploaded artifacts; it cannot give a same-turn look at a local change.
- **Owner's own browser via the platform dev-server preview** — proves the change to the owner, not
  to Freebuff; no screenshot reaches the agent.
- **Hand-extracted libraries with `LD_LIBRARY_PATH`** — previously reached a launched Chromium in this
  container family (spec 062/072 sessions) but the renderer crashed on `/` and `/crystal-ball`
  (specs 061/064/066), so it is not a dependable substitute for the library set.
- **A hosted browser-rendering or screenshot API** — would work without local libraries but adds an
  external account, credentials and a third-party dependency for a one-off visual check, and is out of
  scope for this audit-only request; it is listed for the owner's consideration only.

## Phase 4 — Verification plan

- `./freebuff-verify.sh` (Spec Kit gate, TypeScript check, production build, refresh-docs tests), with
  `pnpm`, as `AGENTS.md` requires, and the production build size measured against the 495 MB maximum.
- Final diff audit proving the change set is documentation-only.
- PR summary updated as the single canonical report; PR left open and unmerged.

## Phase 5 — Resolution without root (follow-up)

The follow-up request is to make the browser usable while **keeping** the security posture: no root,
no `no-new-privileges` change, no sandbox weakening, image-level inclusion preferred. The image is
not editable from inside the workspace, so the design is the strongest non-privileged equivalent:

1. **Download, don't install.** `apt-get` is given user-owned `Dir::State::lists` and `Dir::Cache`
   under `~/.apt-user`, which makes `update` and `--download-only install` work as an unprivileged
   user. apt never runs `dpkg` as root; `dpkg-deb -x` unpacks each `.deb` into a private prefix.
2. **Prefix outside the repository.** `~/.local/chromium-libs` keeps `git status` clean, stays off the
   application build, and lives inside the durable `/workspace` tree so it survives archive/restore.
3. **Both runtime paths covered.** Libraries come from `LD_LIBRARY_PATH`; text comes from a private
   fontconfig file, because the image ships no `/etc/fonts` and Chromium otherwise draws blank boxes.
4. **One command, idempotent.** `scripts/setup-chromium-libs.sh` performs all of it, self-verifies
   with `ldd` (0 missing), and exposes `--check` and `--env` so the environment can be applied to any
   shell or process without editing global configuration.
5. **Evidence, then claims.** `artifacts/capture-site-screenshots.cjs` drives the repository's pinned
   `playwright-chromium`, captures three viewports, and records status, overflow, image and text facts
   in `report.json`; the PNGs are then inspected directly.

**What this cannot do**: add the libraries to the shared base image. That requires the workspace image
owner; the PR records the exact package list and the one-line Dockerfile change to request.
