# Verification Evidence: Reuse an Environment-Provided Chromium Runtime

**Date:** 2026-11-12
**Branch:** `freebuff/0fe51d9fb70d7d5eedbd7455-image-aware`
**Base:** `main` at `d4dc6952`
**Environment:** Freebuff Cloud workspace, non-root (`no new privileges`), `/opt`, `/usr/local`, `/etc` read-only.

## 1. What the image provides (baseline, unchanged by this feature)

| Probe                                                                                                   | Result     |
| ------------------------------------------------------------------------------------------------------- | ---------- |
| `/opt/google/chrome/chrome`, `/usr/bin/google-chrome`, `/usr/bin/chromium`, `/usr/bin/chromium-browser` | all absent |
| Browser on `PATH`                                                                                       | none       |
| `/usr/lib/x86_64-linux-gnu/libnspr4.so`                                                                 | absent     |
| `/etc/fonts`                                                                                            | absent     |
| `/opt/ms-playwright`, `/usr/local/share/ms-playwright`, `/usr/share/ms-playwright`                      | absent     |
| `PLAYWRIGHT_BROWSERS_PATH`                                                                              | unset      |

So the private prefix remains the normal path, and this feature only removes duplicated work where the environment is
better provisioned.

## 2. Detection tests

```
$ pnpm exec vitest run __tests__/setup-chromium-runtime-detect.test.js __tests__/freebuff-startup-command.test.js
 ✓ __tests__/setup-chromium-runtime-detect.test.js (5 tests) 821ms
 ✓ __tests__/freebuff-startup-command.test.js (9 tests) 856ms
 Test Files  2 passed (2)
      Tests  14 passed (14)
```

The five detection tests cover: a complete system runtime (no download, no exports, no prefix created), an incomplete
system runtime (provisioning kept, exports kept), a prebaked root (reported, exported, `--check` passes), the
no-browser failure of `--browser-root`, and removal of stale library keys from an existing CLI config while unrelated
keys survive.

## 3. This workspace — behavior preserved

```
$ bash scripts/setup-chromium-libs.sh --check-libs
PASS Chromium runtime libraries present: 15 objects and fonts in /workspace/homes/…/.local/chromium-libs

$ bash scripts/setup-chromium-libs.sh --browser-root
/workspace/homes/…/.cache/ms-playwright                       (exit 0)

$ bash scripts/setup-chromium-libs.sh --check
PASS Chromium runtime libraries present: 15 objects and fonts in …/.local/chromium-libs
PASS 2 Chromium binaries link with 0 missing shared objects
     …/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome
     …/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell
     prefix: …/.local/chromium-libs (27M)
     browser root: …/.cache/ms-playwright

$ bash scripts/setup-playwright-agent.sh --install-browser
PASS: pnpm exec playwright cli is available.
Chromium (revision 1248) is already installed in …/.cache/ms-playwright; skipping the download.
Playwright CLI setup checks completed.
```

## 4. Prebaked root, image-style (read-only, symlinked like a mount)

Fixture: `/tmp/prebaked` (mode `a-w`) symlinking the real `chromium-1248` and `chromium_headless_shell-1248`;
`playwright-core/browsers.json` pins `chromium=1248`.

```
$ CHROMIUM_BROWSER_DIRS=/tmp/prebaked … --browser-root
/tmp/prebaked
$ CHROMIUM_BROWSER_DIRS=/tmp/prebaked … --env | grep PLAYWRIGHT
export PLAYWRIGHT_BROWSERS_PATH="/tmp/prebaked"
$ CHROMIUM_BROWSER_DIRS=/tmp/prebaked … --persist
PASS persisted the Chromium runtime environment
     runtime: prefix
     browser root: /tmp/prebaked

$ env -i HOME=$HOME PATH=… bash -c 'pnpm exec playwright cli open https://luckypickcanada.ca …'
- Page Title: Lucky Pick Canada | Daily Lucky Picks, Cards & Stories
### Result
"Lucky Pick Canada"
Browser 'default' closed

$ CHROMIUM_BROWSER_DIRS=/tmp/prebaked bash scripts/setup-playwright-agent.sh --install-browser --probe-browser
Chromium (revision 1248) is already installed in /tmp/prebaked; skipping the download.
PASS: Chromium launched and rendered a probe page.
```

Read-only root holding `chromium-9999` instead: ignored, `--browser-root` fell back to `~/.cache/ms-playwright`, which
is the documented safety rule for a stale image. Read-only root holding real (non-symlinked) `chromium-1248`: selected.

Afterwards `--persist` without the override restored this workspace's config: `PLAYWRIGHT_BROWSERS_PATH` absent,
`LD_LIBRARY_PATH` present, `--check` PASS.

## 5. Documented startup command

```
$ bash -lc 'bash scripts/verify-startup.sh && source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile
  && pnpm exec playwright cli --help && (bash scripts/setup-chromium-libs.sh --check >/dev/null 2>&1 || bash scripts/setup-chromium-libs.sh)
  && eval "$(bash scripts/setup-chromium-libs.sh --env)" && bash scripts/setup-chromium-libs.sh --persist
  && bash scripts/setup-playwright-agent.sh --install-browser --probe-browser'
exit=0  elapsed=12s
✅ Startup context check passed.
PASS persisted the Chromium runtime environment
PASS: pnpm exec playwright cli is available.
Chromium (revision 1248) is already installed in …/.cache/ms-playwright; skipping the download.
PASS: Chromium launched and rendered a probe page.
```

## 6. Repository checks

| Check            | Command                                                                               | Result                                                           |
| ---------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Shell syntax     | `bash -n scripts/setup-chromium-libs.sh`, `bash -n scripts/setup-playwright-agent.sh` | PASS                                                             |
| Type check       | `pnpm exec tsc --noEmit`                                                              | PASS (exit 0)                                                    |
| Unit suite       | `pnpm exec vitest run`                                                                | PASS — 606 tests in 65 files                                     |
| Repository gate  | `SPEC_KIT_BASE_REF=d4dc6952 ./freebuff-verify.sh`                                     | PASS (exit 0), 36 updater tests                                  |
| Production build | `pnpm build`                                                                          | PASS — exit 0                                                    |
| Build size       | `du -sb .next`                                                                        | 306,083,776 bytes = 291.90 MiB, 203.10 MiB under the 495 MiB cap |

## 7. Review follow-up on PR #1854

| Finding                                                                                                                                                                              | Fix                                                                                                                                                                         | Evidence                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Graphite: `--browser-root` bypassed the revision rule for the default cache, so a cache of any revision counted as installed.                                                        | `root_has_pinned_browser` now requires `chromium-<pin>` in every root, including `~/.cache/ms-playwright`; the pin is resolved once per process.                            | Stale cache only: `--browser-root` exit 1 with `FAIL no Chromium at the pinned revision chromium-1248 installed under …`; pinned cache: exit 0.                |
| Graphite: `--install-browser` skipped the download for a wrong revision, preventing the repair.                                                                                      | The skip depends on the same pinned check, so a wrong revision always runs `playwright install chromium`.                                                                   | `--browser-root` returning 1 is the gate; the workspace's matching cache still prints `Chromium (revision 1248) is already installed … skipping the download`. |
| Graphite: the prebaked test only exercised the writable shortcut; read-only pinned acceptance and wrong-revision rejection were untested.                                            | Eight tests now cover pinned read-only acceptance, wrong read-only rejection, pinned default cache and stale default cache; read-only fixtures are restored before cleanup. | `__tests__/setup-chromium-runtime-detect.test.js` — 8/8.                                                                                                       |
| Visual QA: the prebaked test asserted `1 Chromium binaries`, but the runner provides `/usr/bin/google-chrome`, so the strict check legitimately listed two.                          | Assertions are count-agnostic and assert the fixture path plus `link with 0 missing shared objects`; no runtime check was weakened.                                         | Local run passes with and without a system Chrome; `--check` still runs `ldd` on every pinned binary.                                                          |
| OpenNext validation: `actions/setup-node` used `cache: pnpm` before `pnpm/action-setup`, so the job failed with `Unable to locate executable file: pnpm` before any validation step. | pnpm is installed first, matching Visual QA and the updater scheduler; a guard test checks the ordering in every job of every workflow.                                     | `__tests__/workflow-pnpm-setup-order.test.js` — 2/2, plus a deliberately mis-ordered job the guard rejects while accepting a correct job in the same file.     |
| Stale revision reported as launchable by `--check`.                                                                                                                                  | `chromium_binaries` lists only the pinned `chromium-<pin>` and `chromium_headless_shell-<pin>` binaries (any revision only when the pin is unresolvable).                   | Wrong-revision fixture output contains no `chromium-9999` path; the pinned fixture's binary is listed.                                                         |

### Post-install confirmation

`--install-browser` trusted `playwright install chromium` and said nothing about the result, so a partial or stale
install only surfaced at the probe, whose message blames the host libraries (`BLOCKED ... check the reported
host-library error`) — the wrong subsystem. It now logs the pinned revision on both paths and re-checks
`--browser-root` after installing, exiting 1 when the pin is still absent:

```
Chromium (revision 1248) is already installed in …/.cache/ms-playwright; skipping the download.
```

```
Installing Chromium (revision 1248)...
Chromium (revision 1248) installed in …/.cache/ms-playwright.
```

The failure path deliberately reuses `--browser-root`'s own diagnostic (`no Chromium at the pinned revision
chromium-1248 installed under …`) rather than duplicating the root list here, and `--browser-revision` was added so the
label comes from the same resolver as the check. Covered by a `--browser-revision` test: 9/9 detection tests.

Re-run after these changes: type check exit 0, 606 unit tests in 65 files, `./freebuff-verify.sh` exit 0 with 36 updater tests, documented startup command exit 0 in 11 s with the probe passing, production build 306,083,489 bytes = 291.90 MiB.

## 8. Limitations

- A genuinely system-wide runtime cannot be created in this workspace (`no new privileges`, read-only `/usr`), so
  system mode is proven by the fixture tests and by the script's own `ldd` path, not by launching Chromium against
  real `/usr/lib` libraries.
- All prebaked-root launches used a symlink to the real Playwright browser; the selection, export, persistence and
  launch path are identical for a real directory, and a real-directory read-only fixture was also selected.
- No CI workflow was run locally; the workflow ordering fix is covered by source assertions, not by executing GitHub Actions.
- The pin is read from `playwright-core/browsers.json`; before `pnpm install` it cannot be resolved, and any Chromium is
  then accepted. That is a deliberate, documented fallback, not a revision guarantee.
