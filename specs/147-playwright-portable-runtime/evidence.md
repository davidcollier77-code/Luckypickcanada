# Evidence — Portable Playwright Chromium Runtime

Recorded 2026-11-12 in the Freebuff workspace. Node.js v26.13.0, pnpm 10.30.3, Playwright 1.64.1 (Chromium 1248).

## 1. The fresh-workspace failure, reproduced

```
$ HOME=/tmp/fresh-home bash scripts/setup-chromium-libs.sh     # before this change
==> Refreshing package lists into /tmp/fresh-home/.apt-user
==> Downloading 18 packages and their dependencies
==> Unpacking into /tmp/fresh-home/.local/chromium-libs
==> Writing a private fontconfig file (the image has no /etc/fonts)
FAIL no Chromium binary found; run: pnpm install --frozen-lockfile
exit=1                                   real 0m9.486s
$ ls -la /tmp/fresh-home/.local/chromium-libs/usr/lib/x86_64-linux-gnu/libnspr4.so
-rw-r--r-- 246248 … libnspr4.so          # libraries fine, run failed anyway
```

`--check` needed a browser that a new workspace has not downloaded, so the `&&` chain stopped before `--persist`, the
browser install and the probe.

Profile delivery was also unreliable in the shells that matter:

```
$ printf 'export LPC_PROFILE_MARKER=xyz\n' >> ~/.profile
$ printf 'self marker=%s LL=%s\n' "$LPC_PROFILE_MARKER" "$LD_LIBRARY_PATH"
self marker=unset LL=unset               # profile not read by command shells
$ bash -c '…'   → LD_LIBRARY_PATH unset, FONTCONFIG_FILE set
$ bash -lc '…'  → LD_LIBRARY_PATH set
```

And the CLI defaults to a system Chrome:

```
$ pnpm exec playwright cli open https://luckypickcanada.ca
Error: Daemon pid=7473: Daemon process exited with code 1
[PlaywrightError: Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome
```

## 2. Fixed verification

### 2.1 Empty home now provisions and exits 0

```
$ HOME=/tmp/fresh-home bash scripts/setup-chromium-libs.sh --check-libs >/dev/null 2>&1; echo $?
1                                        # gate correctly reports "not provisioned"
$ time HOME=/tmp/fresh-home bash scripts/setup-chromium-libs.sh
==> Refreshing package lists into /tmp/fresh-home/.apt-user (no root required)
==> Downloading 18 packages and their dependencies
==> Unpacking into /tmp/fresh-home/.local/chromium-libs
==> Writing a private fontconfig file (the image has no /etc/fonts)
==> Chromium runtime libraries are ready in /tmp/fresh-home/.local/chromium-libs
    No Playwright browser yet; the startup command installs it next:
    bash scripts/setup-playwright-agent.sh --install-browser
exit=0                                   real 0m7.718s
```

### 2.2 `--persist` writes all three artifacts, derived from `$HOME`

```
$ HOME=/tmp/fresh-home bash scripts/setup-chromium-libs.sh --persist
PASS persisted the Chromium runtime environment
     env file: /tmp/fresh-home/.local/chromium-libs/env.sh
     shell profiles: /tmp/fresh-home/.profile, /tmp/fresh-home/.bashrc
     Playwright CLI config: /tmp/fresh-home/.playwright/cli.config.json
exit=0

$ cat /tmp/fresh-home/.playwright/cli.config.json
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "channel": "chromium",
      "env": {
        "LD_LIBRARY_PATH": "/tmp/fresh-home/.local/chromium-libs/usr/lib/x86_64-linux-gnu:…",
        "FONTCONFIG_FILE": "/tmp/fresh-home/.local/chromium-libs/etc/fonts/lpc-fonts.conf",
        "FONTCONFIG_PATH": "/tmp/fresh-home/.local/chromium-libs/etc/fonts",
        "HOME": "/tmp/fresh-home",
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      }
    }
  }
}
```

Every value is under that workspace's own `$HOME`; nothing is hardcoded.

### 2.3 The CLI needs no flags and no exported variables

```
$ env | grep -E '^(LD_LIBRARY_PATH|FONTCONFIG_)'      # LD_LIBRARY_PATH absent in this shell
$ pnpm exec playwright cli open https://luckypickcanada.ca
### Browser `default` opened with pid 22665.
- Page URL: https://luckypickcanada.ca/
- Page Title: Lucky Pick Canada | Daily Lucky Picks, Cards & Stories

$ pnpm exec playwright cli click e13
- Page URL: https://luckypickcanada.ca/crystal-ball
- Page Title: Crystal Ball | Lucky Pick Canada

$ pnpm exec playwright cli eval "() => { const h=document.querySelector('h1'); … }"
{ "text": "Crystal Ball", "width": 520, "font": "Cinzel" }

$ pnpm exec playwright cli close
Browser 'default' closed
```

The width and `Cinzel` prove the fonts are real, not fallback boxes.

### 2.4 The documented startup command

```
$ time bash -lc '<documented startup command>'
✅ Startup context check passed.
✅ Using pnpm 10.30.3
PASS persisted the Chromium runtime environment
Chromium runtime environment applied (LD_LIBRARY_PATH, FONTCONFIG_FILE, FONTCONFIG_PATH).
PASS: pnpm exec playwright cli is available.
Installing the matching Chromium browser...
Probing a real headless Chromium launch...
PASS: Chromium launched and rendered a probe page.
PASS 2 Chromium binaries link with 0 missing shared objects
exit=0                                   real 0m11.398s
```

Second run: exit 0, no download, `PASS 2 Chromium binaries link with 0 missing shared objects`.
Profile blocks afterwards: `.profile` 1, `.bashrc` 1.

## 3. Checks

| Check | Result |
| --- | --- |
| `bash -n scripts/setup-chromium-libs.sh` | PASS |
| `scripts/setup-chromium-libs.sh --check-libs` | PASS on the provisioned prefix |
| `scripts/setup-chromium-libs.sh --check` | PASS — 2 binaries, 0 missing objects |
| Empty-home provisioning | PASS — exit 0, 7.7 s, browser note |
| Empty-home `--persist` | PASS — env.sh, two profiles, CLI config |
| CLI with no env and no `--browser` | PASS — open, click, eval, close |
| Documented startup command ×2 | PASS — exit 0, idempotent |
| `pnpm exec vitest run __tests__/freebuff-startup-command.test.js` | PASS — 9 tests |
| `pnpm exec tsc --noEmit` | PASS |
| `./freebuff-verify.sh` | PASS — `All verification steps passed` (gate, tsc, build, refresh-docs) |
| Production build size | PASS — 427,764,814 B = 407.95 MiB (`.next` 393,760,876 + `public` 34,003,938) |
| Empty-home cleanup | `/tmp/fresh-home` removed; nothing in the repository depends on it |
