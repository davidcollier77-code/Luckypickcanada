#!/usr/bin/env bash
# Ensure the pnpm version pinned by `packageManager` in package.json is available.
#
# Source this file (or run it) before installing or verifying dependencies in a
# fresh Freebuff workspace. The image's global npm prefix is not writable by the
# sandbox user, so a bare `npm install -g pnpm@<version>` fails; the pinned pnpm
# is installed into `$HOME/.local` instead and prepended to PATH.
#
# The pinned pnpm only ever installs from the committed pnpm-lock.yaml, so this
# script never introduces a second lockfile.

BOOTSTRAP_PNPM_REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"


bootstrap_pnpm_fail() {
  echo "❌ pnpm bootstrap: $1" >&2
  # Always exit, even when sourced. A `return` here would only leave this
  # helper and let the sourced script continue (e.g. into an unpinned
  # `npm install -g "pnpm@"`), which is fail-open. Exiting a sourced file from
  # a non-interactive caller such as freebuff-verify.sh aborts that script
  # with a non-zero status before any install can happen.
  exit 1
}

if [[ ! -f "$BOOTSTRAP_PNPM_REPO_ROOT/package.json" ]]; then
  bootstrap_pnpm_fail "no package.json found in $BOOTSTRAP_PNPM_REPO_ROOT"
fi

BOOTSTRAP_PNPM_PIN="$(
  cd "$BOOTSTRAP_PNPM_REPO_ROOT" &&
    node -p "require('./package.json').packageManager || ''" 2>/dev/null
)"
if [[ "$BOOTSTRAP_PNPM_PIN" != pnpm@* ]]; then
  bootstrap_pnpm_fail "package.json must pin the package manager, e.g. \"packageManager\": \"pnpm@10.30.3\" (found: '${BOOTSTRAP_PNPM_PIN}')"
fi

BOOTSTRAP_PNPM_VERSION="${BOOTSTRAP_PNPM_PIN#pnpm@}"
if [[ ! "$BOOTSTRAP_PNPM_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  bootstrap_pnpm_fail "packageManager must pin an exact pnpm version, e.g. \"pnpm@10.30.3\" (found: '$BOOTSTRAP_PNPM_PIN')"
fi

BOOTSTRAP_PNPM_BIN=""

bootstrap_pnpm_matches() {
  local candidate="$1"
  [[ -n "$candidate" && -x "$candidate" ]] || return 1
  [[ "$("$candidate" --version 2>/dev/null | tr -d '[:space:]')" == "$BOOTSTRAP_PNPM_VERSION" ]]
}

for candidate in "$(command -v pnpm 2>/dev/null)" "$HOME/.local/bin/pnpm"; do
  if bootstrap_pnpm_matches "$candidate"; then
    BOOTSTRAP_PNPM_BIN="$candidate"
    break
  fi
done

if [[ -z "$BOOTSTRAP_PNPM_BIN" ]]; then
  echo "Installing pnpm $BOOTSTRAP_PNPM_VERSION into $HOME/.local ..."
  if ! npm install -g "pnpm@$BOOTSTRAP_PNPM_VERSION" --prefix "$HOME/.local"; then
    bootstrap_pnpm_fail "could not install pnpm $BOOTSTRAP_PNPM_VERSION into $HOME/.local"
  fi
  BOOTSTRAP_PNPM_BIN="$HOME/.local/bin/pnpm"
  if ! bootstrap_pnpm_matches "$BOOTSTRAP_PNPM_BIN"; then
    bootstrap_pnpm_fail "installed pnpm does not report version $BOOTSTRAP_PNPM_VERSION"
  fi
fi

export PATH="$(dirname -- "$BOOTSTRAP_PNPM_BIN"):$PATH"
echo "✅ Using pnpm $BOOTSTRAP_PNPM_VERSION ($BOOTSTRAP_PNPM_BIN)"
