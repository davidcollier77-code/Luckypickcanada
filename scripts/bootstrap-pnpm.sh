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

bootstrap_pnpm_fail() {
  printf '❌ pnpm bootstrap: %s\n' "$1" >&2
  return 1
}

bootstrap_pnpm_matches() {
  local candidate="$1"
  [[ -n "$candidate" && -x "$candidate" ]] || return 1
  [[ "$("$candidate" --version 2>/dev/null | tr -d '[:space:]')" == "$BOOTSTRAP_PNPM_VERSION" ]]
}

bootstrap_pnpm_main() {
  local BOOTSTRAP_PNPM_REPO_ROOT
  local BOOTSTRAP_PNPM_PIN
  local BOOTSTRAP_PNPM_VERSION
  local BOOTSTRAP_PNPM_BIN=""
  local path_pnpm
  local candidate

  BOOTSTRAP_PNPM_REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
  if [[ ! -f "$BOOTSTRAP_PNPM_REPO_ROOT/package.json" ]]; then
    bootstrap_pnpm_fail "no package.json found in $BOOTSTRAP_PNPM_REPO_ROOT"
    return 1
  fi

  if ! BOOTSTRAP_PNPM_PIN="$(
    cd "$BOOTSTRAP_PNPM_REPO_ROOT" &&
      node -p "require('./package.json').packageManager || ''" 2>/dev/null
  )"; then
    bootstrap_pnpm_fail "could not read package.json#packageManager"
    return 1
  fi

  if [[ "$BOOTSTRAP_PNPM_PIN" != pnpm@* ]]; then
    bootstrap_pnpm_fail "package.json must pin the package manager, e.g. \"packageManager\": \"pnpm@10.30.3\" (found: '$BOOTSTRAP_PNPM_PIN')"
    return 1
  fi

  BOOTSTRAP_PNPM_VERSION="${BOOTSTRAP_PNPM_PIN#pnpm@}"
  if [[ ! "$BOOTSTRAP_PNPM_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    bootstrap_pnpm_fail "packageManager must pin an exact pnpm version, e.g. \"pnpm@10.30.3\" (found: '$BOOTSTRAP_PNPM_PIN')"
    return 1
  fi

  path_pnpm="$(command -v pnpm 2>/dev/null || true)"
  for candidate in "$path_pnpm" "$HOME/.local/bin/pnpm"; do
    if bootstrap_pnpm_matches "$candidate"; then
      BOOTSTRAP_PNPM_BIN="$candidate"
      break
    fi
  done

  if [[ -z "$BOOTSTRAP_PNPM_BIN" ]]; then
    echo "Installing pnpm $BOOTSTRAP_PNPM_VERSION into $HOME/.local ..."
    if ! npm install -g "pnpm@$BOOTSTRAP_PNPM_VERSION" --prefix "$HOME/.local"; then
      bootstrap_pnpm_fail "could not install pnpm $BOOTSTRAP_PNPM_VERSION into $HOME/.local"
      return 1
    fi
    BOOTSTRAP_PNPM_BIN="$HOME/.local/bin/pnpm"
    if ! bootstrap_pnpm_matches "$BOOTSTRAP_PNPM_BIN"; then
      bootstrap_pnpm_fail "installed pnpm does not report version $BOOTSTRAP_PNPM_VERSION"
      return 1
    fi
  fi

  export PATH="$(dirname -- "$BOOTSTRAP_PNPM_BIN"):$PATH"
  echo "✅ Using pnpm $BOOTSTRAP_PNPM_VERSION ($BOOTSTRAP_PNPM_BIN)"
  return 0
}

# Capture the function status explicitly: sourced callers receive a non-zero
# return without the bootstrap terminating their interactive shell, while
# direct execution exits with the same status.
if bootstrap_pnpm_main; then
  BOOTSTRAP_PNPM_STATUS=0
else
  BOOTSTRAP_PNPM_STATUS=$?
fi

if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  return "$BOOTSTRAP_PNPM_STATUS"
fi

exit "$BOOTSTRAP_PNPM_STATUS"
