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
    # --env emits each value as a single quoted word, so evaluating it cannot run
    # anything a path or HOME happens to contain.
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

# Fail closed when node_modules predates the lockfile. pnpm records the resolved
# lockfile at node_modules/.pnpm/lock.yaml; comparing it (never a hardcoded
# version) means a Playwright update by Dependabot or the owner is picked up
# instead of silently running the previous install.
installed_lockfile="$ROOT/node_modules/.pnpm/lock.yaml"
if [[ ! -f "$installed_lockfile" ]] || ! cmp -s "$installed_lockfile" "$ROOT/pnpm-lock.yaml"; then
  printf 'FAIL: node_modules does not match pnpm-lock.yaml. Run pnpm install --frozen-lockfile.\n' >&2
  exit 1
fi
printf 'PASS: node_modules matches pnpm-lock.yaml.\n'

printf 'Project Playwright version: '
pnpm exec playwright --version
printf 'Checking local CLI entrypoint...\n'

if ! pnpm exec playwright cli --help >/dev/null 2>&1; then
  printf 'FAIL: pnpm exec playwright cli is not available. Install the repository Playwright packages with CLI support (pnpm install --frozen-lockfile).\n' >&2
  exit 1
fi
printf 'PASS: pnpm exec playwright cli is available.\n'

# The CLI, @playwright/test and playwright-chromium must all resolve to the
# same installed release. A split install would launch tests with one version
# and provision a browser for another. Nothing here pins a version: the
# installed tree is the single source of truth.
if ! node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';

const declared = JSON.parse(readFileSync('package.json', 'utf8'));
const sections = [declared.dependencies || {}, declared.devDependencies || {}];
const packages = ['playwright', '@playwright/test', 'playwright-chromium'];
const installed = {};
for (const name of packages) {
  const range = sections.map((section) => section[name]).find(Boolean);
  if (!range) {
    console.error(`FAIL: ${name} is not declared in package.json.`);
    process.exit(1);
  }
  let version;
  try {
    version = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version;
  } catch {
    console.error(`FAIL: ${name} is not installed; run pnpm install --frozen-lockfile.`);
    process.exit(1);
  }
  installed[name] = version;
}
const versions = new Set(Object.values(installed));
if (versions.size !== 1) {
  console.error(
    `FAIL: Playwright packages resolve to different versions: ${Object.entries(installed)
      .map(([name, version]) => `${name}=${version}`)
      .join(', ')}.`,
  );
  process.exit(1);
}
const [version] = versions;
// The declared range is reported for context. It is deliberately not compared
// with the resolved version: a range like ^x.y.z legitimately resolves to a
// later patch, and the lockfile is what the repository approved.
console.log(`PASS: all Playwright packages resolve to ${version}; the browser revision comes from that install.`);
NODE
then
  exit 1
fi

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
