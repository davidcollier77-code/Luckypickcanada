#!/usr/bin/env bash
# One command to drive the repository-local Playwright CLI in a Freebuff Cloud
# workspace, from a cold start and from a non-interactive shell.
#
#   ./scripts/playwright-cli.sh open https://luckypickcanada.ca
#   ./scripts/playwright-cli.sh snapshot
#   ./scripts/playwright-cli.sh close
#
# A bare `pnpm exec playwright cli` fails here for four separate reasons, and
# each one used to be a manual step an agent had to remember:
#   1. a fresh workspace has no node_modules and no pinned pnpm yet;
#   2. Chromium links against libraries the image does not ship;
#   3. a non-interactive `bash -c` shell never reads ~/.profile, so the
#      LD_LIBRARY_PATH and FONTCONFIG_* values `--persist` wrote are absent;
#   4. the CLI's default channel is a system Chrome the image does not have.
#
# Every step below re-checks the real state instead of trusting a marker, so a
# workspace restored from a checkpoint repairs itself on first use. Only the
# first call in a cold workspace is slow (dependency install and browser
# download); later calls are no-ops.
#
# Usage: scripts/playwright-cli.sh [--dry-run] <playwright cli args...>
#        scripts/playwright-cli.sh [--dry-run] test [playwright test args...]
# --dry-run prints the command it would run and exits without touching anything.

set -euo pipefail

ROOT="$(CDPATH="" cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$ROOT"

dry_run=false
if [[ "${1:-}" == "--dry-run" ]]; then
  dry_run=true
  shift
fi

args=("$@")
runner=(pnpm exec playwright cli)

# `playwright test` needs no environment help: playwright.config.ts injects the
# same library and font paths. Pass it straight through.
if [[ "${args[0]:-}" == "test" ]]; then
  runner=(pnpm exec playwright test)
  args=("${args[@]:1}")
elif [[ "${args[0]:-}" == "open" ]]; then
  # The pinned Chromium is the only browser in this image; the CLI's default is
  # the system Chrome channel, which is not installed. Never override an
  # explicit --browser the caller supplied.
  browser_specified=false
  for argument in "${args[@]}"; do
    if [[ "$argument" == --browser* ]]; then
      browser_specified=true
      break
    fi
  done
  if [[ "$browser_specified" == false ]]; then
    args+=(--browser=chromium)
  fi
fi

if [[ "$dry_run" == true ]]; then
  printf '%s %s\n' "${runner[*]}" "${args[*]}"
  exit 0
fi

# 1. The pinned pnpm, then the repository dependencies. The bootstrap runs on
# every call because the `exec` below is a pnpm command and pnpm lives in
# $HOME/.local when the environment does not put it on PATH - including the
# reopened or scrubbed shells where the dependency tree is already installed.
# It is a no-op once the pinned version is reachable.
# shellcheck source=scripts/bootstrap-pnpm.sh
source "$ROOT/scripts/bootstrap-pnpm.sh"
if [[ ! -x "$ROOT/node_modules/.bin/playwright" ]]; then
  CI=true pnpm install --frozen-lockfile
fi

# 2. Chromium's shared libraries and the private fontconfig files.
if ! bash "$ROOT/scripts/setup-chromium-libs.sh" --check >/dev/null 2>&1; then
  bash "$ROOT/scripts/setup-chromium-libs.sh" >/dev/null
fi

# 3. The project-pinned Chromium build itself. `--browser-root` succeeds only
# when the revision this Playwright pins is launchable, so a cache left behind by
# another Playwright version is repaired here instead of failing at launch with
# "Executable doesn't exist". It also keeps an environment-provided root reuse-only.
if ! bash "$ROOT/scripts/setup-chromium-libs.sh" --browser-root >/dev/null 2>&1; then
  pnpm exec playwright install chromium
fi

# 4. The runtime environment for this process and the browser it launches.
eval "$(bash "$ROOT/scripts/setup-chromium-libs.sh" --env)"

exec "${runner[@]}" "${args[@]}"
