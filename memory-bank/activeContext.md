# Active Context — Freebuff Startup Chromium Readiness

- **Updated:** 2026-11-11
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** freebuff/5a4ef38f3323a2930a7d92c1
- **Spec Kit feature:** specs/137-startup-chromium-readiness
- **Pull request:** not submitted

## Current Task

Make the Freebuff startup command provision Chromium's Linux runtime libraries and prove a real headless launch, and
make `scripts/setup-playwright-agent.sh` executable, with `README.md` and its guard test kept in sync.

## Verified Baseline

- Node.js v26.13.0, pnpm 10.30.3 and the frozen lockfile install pass; Playwright 1.64.1 downloads Chromium 1248.
- The workspace image ships none of Chromium's shared libraries and refuses `sudo`; a cold launch failed on
  `libnspr4.so`, and `./scripts/setup-playwright-agent.sh --probe-browser` exited 126 because the file was `100644`.
- `scripts/setup-chromium-libs.sh` provisions the libraries without root into `~/.local/chromium-libs` (10.9 s, 27 MB)
  and its `--check` costs 0.06 s once provisioned.

## Implementation

- Added three steps to the documented startup command after the guarded prefix: gated library provisioning, the
  `--env` export in the probe's shell, and `setup-playwright-agent.sh --install-browser --probe-browser`.
- Updated the documented steps in `README.md` and noted that later shells need the export plus `--browser=chromium`.
- Extended `__tests__/freebuff-startup-command.test.js` to the new string, the new order, and fixture stand-ins for the
  Chromium and probe scripts.
- Marked `scripts/setup-playwright-agent.sh` executable in the Git index (`100755`).

## Verification and Delivery Status

- **PASS (guard tests):** focused startup and bootstrap Vitest suites.
- **PASS (documented command):** verbatim run exits 0 with `PASS: pnpm exec playwright cli is available.` and
  `PASS: Chromium launched and rendered a probe page.`
- **PASS (provisioning branch):** forced with a throwaway library prefix.
- **PASS (`./freebuff-verify.sh`):** exit 0, including the Spec Kit gate, verification-integrity tests, `tsc --noEmit`,
  the production build and the docs tests.
- **PASS (build size):** `.next` 305 MiB + `public` 33 MiB = 338 MiB, strictly below the 495 MiB cap.
- **PASS (diff audit):** `README.md`, the guard test, `memory-bank/activeContext.md`, the ignored Spec Kit pointer,
  this feature's artifacts, and the `100755` mode change on `scripts/setup-playwright-agent.sh`; no dependency,
  lockfile, workflow, application, integration or deployment change. `git diff --check` is clean.

## Handoff

No PR has been opened for this task. The Freebuff project startup setting remains an owner action; `README.md`
documents the exact value.
