# Evidence — Playwright Chromium Runtime Environment

Recorded 2026-11-12 in the Freebuff workspace. Node.js v26.13.0, pnpm 10.30.3, Playwright 1.64.1 (Chromium 1248),
`$HOME` = `/workspace/homes/0fe51d9fb70d7d5eedbd7455`.

## 1. The defect, reproduced with the libraries already installed

```
$ node --input-type=module -e "import {chromium} from 'playwright'; const b = await chromium.launch({headless:true}); …"
…
[pid=4147][err] …/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell:
  error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory
[pid=4147] <process did exit: exitCode=127, signal=null>
```

The same launch after `eval "$(bash scripts/setup-chromium-libs.sh --env)"` printed `LAUNCH OK`.

`scripts/setup-chromium-libs.sh --check` reported PASS before any change, because it validated only `chrome`:

```
PASS /…/chromium-1248/chrome-linux64/chrome links with 0 missing shared objects
```

## 2. Why the exports never reached a later shell

```
$ shopt -q login_shell && echo yes || echo no   → no
$ echo $-                                        → hBc
$ echo ${BASH_ENV:-<unset>}                      → <unset>
$ ls ~/.bashrc ~/.profile                        → No such file or directory
```

The startup command's `eval "$(… --env)"` therefore only affected that one process, and every Freebuff tool shell
after it began without `LD_LIBRARY_PATH`.

## 3. Fixed verification

### 3.1 Both Chromium binaries are checked

```
$ bash scripts/setup-chromium-libs.sh --check
PASS 2 Chromium binaries link with 0 missing shared objects
     …/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell
     …/chromium-1248/chrome-linux64/chrome
     prefix: /workspace/homes/…/.local/chromium-libs (27M)
exit=0
```

### 3.2 A complete prefix is reused, not re-downloaded

```
$ time bash scripts/setup-chromium-libs.sh
==> Chromium runtime libraries are already provisioned; skipping download
PASS 2 Chromium binaries link with 0 missing shared objects
exit=0        real 0m0.117s
```

### 3.3 The environment persists

```
$ bash scripts/setup-chromium-libs.sh --persist
PASS persisted the Chromium runtime environment
     env file: /workspace/homes/…/.local/chromium-libs/env.sh
     shell profiles: /workspace/homes/…/.profile, /workspace/homes/…/.bashrc
exit=0

$ env -u LD_LIBRARY_PATH bash -lc 'printf "%s\n" "$LD_LIBRARY_PATH" "$FONTCONFIG_FILE" "$FONTCONFIG_PATH"'
…/.local/chromium-libs/usr/lib/x86_64-linux-gnu:…/lib/x86_64-linux-gnu:…/usr/lib:…/lib
…/.local/chromium-libs/etc/fonts/lpc-fonts.conf
…/.local/chromium-libs/etc/fonts

$ env -u LD_LIBRARY_PATH bash -lc '. "$HOME/.local/chromium-libs/env.sh"; . "$HOME/.local/chromium-libs/env.sh"; …'
4        # sourcing twice does not duplicate the four prefix entries

$ grep -c "luckypick chromium runtime >>>" ~/.profile ~/.bashrc   → 1, 1   (after two startup runs)
```

### 3.4 The probe works with no caller setup

```
$ env -u LD_LIBRARY_PATH -u FONTCONFIG_FILE -u FONTCONFIG_PATH bash scripts/setup-playwright-agent.sh --probe-browser
Chromium runtime environment applied (LD_LIBRARY_PATH, FONTCONFIG_FILE, FONTCONFIG_PATH).
✅ Using pnpm 10.30.3 (…/.local/bin/pnpm)
Project Playwright version: Version 1.64.1
PASS: pnpm exec playwright cli is available.
Probing a real headless Chromium launch...
PASS: Chromium launched and rendered a probe page.
exit=0
```

### 3.5 Playwright Test works in a bare shell (config injection)

```
$ env -u LD_LIBRARY_PATH -u FONTCONFIG_FILE -u FONTCONFIG_PATH \
    pnpm exec playwright test tests/visual/gold-cta.spec.ts --project=desktop
  ✓  1 [desktop] › eight gold CTAs keep the raised rest treatment and stay aligned (5.3s)
  ✓  2 [desktop] › hover lifts and press flattens each representative CTA (5.4s)
  ✓  3 [desktop] › Tip Jar and Suggestion share the shimmer sweep and glow pulse (3.8s)
  ✓  4 [desktop] › reduced motion keeps the raised edge without movement or shimmer (3.4s)
  4 passed (28.7s)
playwright exit=0
```

### 3.6 Cold provisioning still works without root

```
$ CHROMIUM_LIBS_PREFIX=/tmp/chromium-cold bash scripts/setup-chromium-libs.sh
PASS 2 Chromium binaries link with 0 missing shared objects
     prefix: /tmp/chromium-cold (27M)
exit=0        real 0m3.268s
$ ls -la /tmp/chromium-cold/usr/lib/x86_64-linux-gnu/libnspr4.so
-rw-r--r-- 246248 … libnspr4.so
```

### 3.7 The documented startup command

```
$ time bash -lc '<documented startup command>'
… PASS persisted the Chromium runtime environment
… Chromium runtime environment applied (LD_LIBRARY_PATH, FONTCONFIG_FILE, FONTCONFIG_PATH).
… ✅ Using pnpm 10.30.3
… Project Playwright version: Version 1.64.1
… PASS: pnpm exec playwright cli is available.
… Installing the matching Chromium browser...
… Probing a real headless Chromium launch...
… PASS: Chromium launched and rendered a probe page.
exit=0        real 0m10.582s
```

Second run: exit 0, same PASS lines, no download and one profile block per file.

### 3.8 Real browser interaction

```
$ pnpm exec playwright cli open https://luckypickcanada.ca --browser=chromium
### Browser `default` opened with pid 7793.
- Page URL: https://luckypickcanada.ca/
- Page Title: Lucky Pick Canada | Daily Lucky Picks, Cards & Stories

$ pnpm exec playwright cli click e13        # "Crystal Ball" in the primary navigation
await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Crystal Ball' }).click();
- Page URL: https://luckypickcanada.ca/crystal-ball
- Page Title: Crystal Ball | Lucky Pick Canada

$ pnpm exec playwright cli eval "() => document.querySelector('h1')?.textContent?.trim()"
"Crystal Ball"

$ pnpm exec playwright cli screenshot --filename=specs/146-playwright-chromium-runtime/evidence/crystal-ball.png
```

The screenshot (`evidence/crystal-ball.png`) was inspected: heading, body copy and greeting render as legible text with
the site's fonts over the Milky Way artwork — no tofu boxes — confirming `FONTCONFIG_FILE`/`FONTCONFIG_PATH` work. The 8 console errors are all
third-party Cloudflare Turnstile CSP messages, unrelated to this change.

## 4. Checks

| Check | Result |
| --- | --- |
| `bash -n scripts/setup-chromium-libs.sh` | PASS |
| `bash -n scripts/setup-playwright-agent.sh` | PASS |
| `pnpm exec vitest run __tests__/freebuff-startup-command.test.js` | PASS — 9 tests |
| `pnpm exec tsc --noEmit` | PASS (exit 0) |
| `./freebuff-verify.sh` | PASS — “All verification steps passed.” (governance gates, `tsc`, build, refresh-docs 36/36) |
| Production build size | PASS — 410,380,951 B = 391.37 MiB (`.next` 376,377,013 + `public` 34,003,938), below 495 MiB |
| `git diff --check` | PASS — no whitespace errors |
