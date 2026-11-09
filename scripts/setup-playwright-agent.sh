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
--install-browser  Downloads the project-pinned Chromium browser.
--probe-browser    Attempts a real headless Chromium launch.

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
  printf 'Node.js is required; this repository expects Node.js 22.x.\n' >&2
  exit 1
fi
node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [[ "$node_major" -ne 22 ]]; then
  printf 'This repository requires Node.js 22.x (found %s).\n' "$(node --version)" >&2
  exit 1
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
if [[ "$install_browser" == true ]]; then
  printf 'Installing the matching Chromium browser...\n'
  pnpm exec playwright install chromium
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
    printf 'BLOCKED: Chromium could not launch in this environment. Check the reported host-library error; do not use sudo or install OS packages through this script. Follow AGENTS.md browser fallback guidance.\n' >&2
    exit 3
  fi
fi

printf 'Playwright CLI setup checks completed.\n'
