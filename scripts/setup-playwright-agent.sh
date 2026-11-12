#!/usr/bin/env bash
# Validate and optionally prepare the repository-local Playwright CLI.
# Does not install global packages or operating-system dependencies.
set -euo pipefail

ROOT="$(CDPATH="" cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$ROOT"

install_browser=false
probe_browser=false
for arg in "$@"; do
  case "$arg" in
    --install-browser) install_browser=true ;;
    --probe-browser) probe_browser=true ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./scripts/setup-playwright-agent.sh [--install-browser] [--probe-browser]

Validates pnpm exec playwright cli.
--install-browser  Downloads the project-pinned Chromium browser when none is present,
                   then confirms that the pinned revision is installed.
--probe-browser    Attempts a real headless Chromium launch.

An existing browser, including a prebaked root provided by the environment, is reused.
No global npm package, sudo or operating-system package installation is performed.
USAGE
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$arg" >&2
      exit 2
      ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js is required; this repository expects Node.js 26.x.\n' >&2
  exit 1
fi
node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [[ "$node_major" -ne 26 ]]; then
  printf 'This repository requires Node.js 26.x (found %s).\n' "$(node --version)" >&2
  exit 1
fi

# Apply the Chromium runtime environment from scripts/setup-chromium-libs.sh to this
# shell, so a browser launched here finds libnspr4.so and friends without the caller
# having exported LD_LIBRARY_PATH and FONTCONFIG_* first. The export only reaches this
# process and anything it starts, which is exactly the scope the launch needs.
if [[ -f "$ROOT/scripts/setup-chromium-libs.sh" ]]; then
  if chromium_env="$(bash "$ROOT/scripts/setup-chromium-libs.sh" --env 2>/dev/null)"; then
    eval "$chromium_env"
    printf 'Chromium runtime environment applied (LD_LIBRARY_PATH, FONTCONFIG_FILE, FONTCONFIG_PATH).\n'
  fi
fi

# shellcheck source=scripts/bootstrap-pnpm.sh
source "$ROOT/scripts/bootstrap-pnpm.sh"

if [[ ! -x "$ROOT/node_modules/.bin/playwright" ]]; then
  printf 'Install repository dependencies first: pnpm install --frozen-lockfile\n' >&2
  exit 1
fi

printf 'Project Playwright version: '
pnpm exec playwright --version
printf 'Checking local CLI entrypoint...\n'

if ! pnpm exec playwright cli --help >/dev/null 2>&1; then
  printf 'FAIL: pnpm exec playwright cli is not available. Ensure Playwright 1.x is installed with CLI support (pnpm install --frozen-lockfile).\n' >&2
  exit 1
fi
printf 'PASS: pnpm exec playwright cli is available.\n'

# Exit codes: 0 = success, 1 = environment/setup failure,
# 2 = invalid usage (unknown option), 3 = Chromium launch blocked.
# The Chromium revision the installed Playwright pins, read from playwright-core. Used
# only as a log label; empty when the pin cannot be resolved, so printing never fails.
chromium_revision() {
  bash "$ROOT/scripts/setup-chromium-libs.sh" --browser-revision 2>/dev/null || true
}

if [[ "$install_browser" == true ]]; then
  revision="$(chromium_revision)"
  revision_label=""
  [[ -z "$revision" ]] || revision_label=" (revision $revision)"

  # A browser that is already present — Playwright's own cache or a prebaked root the
  # environment provides — is used as it is, so an image that ships one costs no download.
  if browser_root="$(bash "$ROOT/scripts/setup-chromium-libs.sh" --browser-root 2>/dev/null)"; then
    printf 'Chromium%s is already installed in %s; skipping the download.\n' \
      "$revision_label" "$browser_root"
  else
    printf 'Installing Chromium%s...\n' "$revision_label"
    pnpm exec playwright install chromium
    # A finished download is not proof that the pinned revision landed. Without this
    # check a partial or stale install would only surface at the probe, whose message
    # blames the host libraries — the wrong subsystem entirely.
    if ! browser_root="$(bash "$ROOT/scripts/setup-chromium-libs.sh" --browser-root)"; then
      printf 'FAIL: the browser install finished, but no Chromium%s is installed.\n' \
        "$revision_label" >&2
      printf 'Re-run `pnpm exec playwright install chromium` and read its output, or point PLAYWRIGHT_BROWSERS_PATH at a root that holds the pinned revision.\n' >&2
      exit 1
    fi
    printf 'Chromium%s installed in %s.\n' "$revision_label" "$browser_root"
  fi
fi

if [[ "$probe_browser" == true ]]; then
  printf 'Probing a real headless Chromium launch...\n'
  if ! node --input-type=module <<'NODE'
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto('data:text/html,<title>Playwright CLI probe</title>');
  const title = await page.title();
  if (title !== 'Playwright CLI probe') {
    throw new Error(`Unexpected probe page title: ${title}`);
  }
  process.stdout.write('PASS: Chromium launched and rendered a probe page.\n');
} finally {
  await browser.close();
}
NODE
  then
    printf 'BLOCKED: Chromium could not launch in this environment. Check the reported host-library error; provision it with `bash scripts/setup-chromium-libs.sh` (no sudo, no OS packages). Follow AGENTS.md browser fallback guidance.\n' >&2
    exit 3
  fi
fi

printf 'Playwright CLI setup checks completed.\n'
