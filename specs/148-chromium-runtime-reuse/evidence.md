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
Chromium is already installed in …/.cache/ms-playwright; skipping the download.
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
Chromium is already installed in /tmp/prebaked; skipping the download.
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
Chromium is already installed in …/.cache/ms-playwright; skipping the download.
PASS: Chromium launched and rendered a probe page.
```

## 6. Repository checks

| Check            | Command                                                                               | Result                                                           |
| ---------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Shell syntax     | `bash -n scripts/setup-chromium-libs.sh`, `bash -n scripts/setup-playwright-agent.sh` | PASS                                                             |
| Type check       | `pnpm exec tsc --noEmit`                                                              | PASS (exit 0)                                                    |
| Unit suite       | `pnpm exec vitest run`                                                                | PASS — 601 tests in 64 files                                     |
| Repository gate  | `SPEC_KIT_BASE_REF=d4dc6952 ./freebuff-verify.sh`                                     | PASS (exit 0), 36 updater tests                                  |
| Production build | `pnpm build`                                                                          | PASS — exit 0                                                    |
| Build size       | `du -sb .next`                                                                        | 306,083,776 bytes = 291.90 MiB, 203.10 MiB under the 495 MiB cap |

## 7. Limitations

- A genuinely system-wide runtime cannot be created in this workspace (`no new privileges`, read-only `/usr`), so
  system mode is proven by the fixture tests and by the script's own `ldd` path, not by launching Chromium against
  real `/usr/lib` libraries.
- All prebaked-root launches used a symlink to the real Playwright browser; the selection, export, persistence and
  launch path are identical for a real directory, and a real-directory read-only fixture was also selected.
- No CI workflow was run; PR-triggered checks are pending by definition.
