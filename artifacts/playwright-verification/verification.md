# Verification — Playwright workspace hardening

**Date:** 2026-11-12 · **Branch:** `freebuff/78543caa3c21f40958fc74d4` · **Base:** `main` at `9fbe7a21`
**Environment:** Freebuff Cloud workspace, non-root (`no new privileges`), per-chat `$HOME`.

## Starting point

The assessment that produced this change found the documented workflow working from a cold workspace (41 s to a
probed browser, live site loaded, full-page screenshot captured) and three failure points that do not block it today.
This change fixes exactly those three, nothing else.

## Fixes and their proofs

### 1. `scripts/playwright-cli.sh` — pinned pnpm is always resolved

Before: the wrapper sourced `scripts/bootstrap-pnpm.sh` only when `node_modules/.bin/playwright` was missing, but it
always `exec`s a pnpm command. Reproduced failure with dependencies installed and `pnpm` absent from `PATH`:

```
$ env -i HOME=$HOME PATH=/usr/local/bin:/usr/bin:/bin TERM=dumb bash -c \
    './scripts/playwright-cli.sh --raw eval "() => document.title"'
./scripts/playwright-cli.sh: line 86: exec: pnpm: not found      → exit 127
```

After:

```
$ env -i HOME=$HOME PATH=/usr/local/bin:/usr/bin:/bin TERM=dumb bash -c \
    './scripts/playwright-cli.sh --raw list'
✅ Using pnpm 10.30.3 (/workspace/homes/…/.local/bin/pnpm)
  (no browsers)                                                  → exit 0
```

### 2. `scripts/playwright-cli.sh` — the browser decision uses the pinned revision

Before: `compgen -G "$HOME/.cache/ms-playwright/chromium-*"`, which matches a cache left by any Playwright version.

Proof with the pinned directory renamed and a `chromium-9999` directory planted in its place:

```
$ bash scripts/setup-chromium-libs.sh --browser-root
FAIL no Chromium at the pinned revision chromium-1248 installed under …/.cache/ms-playwright   → exit 1
$ ./scripts/playwright-cli.sh open https://luckypickcanada.ca
Chrome for Testing 156.0.8078.4 (playwright chromium v1248) downloaded to …/chromium-1248
- Page Title: Lucky Pick Canada | Daily Lucky Picks, Cards & Stories                           → exit 0, 11 s
```

Warm start with the pin present (no download, one extra `--browser-root` check): **4 s**, exit 0, correct title.
The planted directory and the renamed cache were removed afterwards; the cache holds only `chromium-1248` and
`chromium_headless_shell-1248`.

### 3. `playwright.config.ts` — an inherited fontconfig path must exist

Before: `FONTCONFIG_FILE`/`FONTCONFIG_PATH` were only assigned when unset, so a stale value inherited from another
workspace survived and fontconfig dropped the provisioned fonts.

```
$ env | grep -E '^FONT'
FONTCONFIG_PATH=/workspace/homes/0fe51d9f…/.local/chromium-libs/etc/fonts
FONTCONFIG_FILE=/workspace/homes/0fe51d9f…/.local/chromium-libs/etc/fonts/lpc-fonts.conf   (does not exist)
```

Now covered by `__tests__/playwright-config-fontconfig.test.js`, which loads the real config module against a temporary
prefix fixture: a nonexistent inherited path is replaced by the prefix config, an existing one is preserved.

## Checks actually run

| Check | Command | Result |
| --- | --- | --- |
| Shell syntax | `bash -n scripts/playwright-cli.sh` | PASS |
| Wrapper contract | `--dry-run open`, `--dry-run test`, `--dry-run open --browser=firefox` | PASS — output unchanged |
| FR-001 scrubbed shell | `env -i … ./scripts/playwright-cli.sh --raw list` | PASS — exit 0 |
| FR-002 stale cache | foreign-revision cache → wrapper installs `chromium-1248`, launches | PASS — 11 s incl. 191 MiB download |
| FR-002 warm start | `./scripts/playwright-cli.sh open https://luckypickcanada.ca` | PASS — 4 s, no download |
| Focused tests | `pnpm exec vitest run __tests__/playwright-cli-wrapper.test.js __tests__/playwright-config-fontconfig.test.js` | PASS — 9 tests, 2 files |
| Unit suite | `pnpm exec vitest run` | PASS — 66 files, exit 0 |
| Repository gate | `./freebuff-verify.sh` | PASS — exit 0 in 78 s (Spec Kit gate, governance tests, type check, build, docs tests: 36 passed) |
| Production build size | `du -sb .next` | PASS — 306,083,516 bytes = **291.90 MiB**, 203.10 MiB under the 495 MiB cap |
| Live workflow | `open https://luckypickcanada.ca` + `screenshot --full-page` | PASS — title correct, PNG 1280 × 9366, 7 images, 0 broken, `document.fonts = loaded` |

Console output for the live page is unchanged from the assessment: 8 errors / 10 warnings, all originating inside the
Cloudflare Turnstile iframe (`connect-src` CSP blocks, WebGL readback warnings), plus one third-party 401 from
`challenges.cloudflare.com`. No first-party errors and no failed first-party requests.

## Files in this directory

- `startup.log` — the documented cold-start command before any change (exit 0, 41 s).
- `homepage-full.png` / `homepage-full-small.png` — the pre-change full-page capture, 1280 × 9366.
- `homepage-full-after-fix.png` / `homepage-full-after-fix-small.png` — the post-change capture, same view.
- `homepage-viewport.png` — the 1280 × 720 viewport capture.
- `console.log`, `requests-all.log`, `open.log` — console and network evidence.
- `freebuff-verify.log`, `vitest-full.log` — the gate and unit-suite output.

## Limitations

- The pinned-revision proof uses a planted wrong-revision directory, not a real Playwright upgrade; the decision path
  (`--browser-root` exit status) is the same one an upgrade exercises.
- The fontconfig guard is proven by loading the real config module in tests; no `playwright test` visual run was
  performed in this task, because baselines are produced by CI.
- No GitHub Actions workflow was executed locally; PR-triggered checks run after submission.
