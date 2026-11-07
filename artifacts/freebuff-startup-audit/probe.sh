#!/usr/bin/env bash
# Reproducible probe for the Freebuff startup-command audit.
# Runs each candidate startup command under a controlled HOME/PATH and records
# the real outcome. It only runs `pnpm install --frozen-lockfile` against the
# committed lockfile; no dependency version or lockfile content is modified.
#
# Usage: bash artifacts/freebuff-startup-audit/probe.sh
set -u

REPO="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
REAL_HOME="${HOME}"
# Reuse the real pnpm content-addressable store so repeated installs stay fast.
SHARED_DATA="${REAL_HOME}/.local/share"
BASE="${TMPDIR:-/tmp}/fb-startup-audit"
rm -rf "$BASE"
mkdir -p "$BASE"

strip_local_bin() { # a PATH that does not contain $HOME/.local/bin
  printf '%s' "/usr/local/bin:/usr/bin:/bin"
}

fresh_home() { # fresh_home <name>
  local dir="$BASE/$1"
  mkdir -p "$dir"
  printf '%s' "$dir"
}

CURRENT='bash scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile'
PROPOSED='source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile'
WRAPPED="bash -c 'source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile'"

run_probe() { # run_probe <label> <shell> <command> <home> <path> [extra env...]
  local label="$1" shell="$2" cmd="$3" home="$4" path="$5"
  shift 5
  local start end status
  echo "----- $label -----"
  echo "shell: $shell"
  echo "command: $cmd"
  echo "HOME: $home"
  echo "PATH: $path"
  [[ $# -gt 0 ]] && echo "extra env: $*"
  start=$(date +%s%N)
  ( cd "$REPO" || exit 99
    # shellcheck disable=SC2086
    env -u PNPM_HOME -u COREPACK_HOME HOME="$home" PATH="$path" \
      XDG_DATA_HOME="$SHARED_DATA" CI=true "$@" \
      "$shell" -c "$cmd" ) 2>&1 | sed 's/^/  | /'
  status=${PIPESTATUS[0]}
  end=$(date +%s%N)
  echo "EXIT: $status"
  echo "SECONDS: $(awk "BEGIN{printf \"%.2f\", ($end-$start)/1000000000}")"
  echo "pnpm afterwards: $(env HOME="$home" PATH="$path" sh -c 'command -v pnpm || echo none')"
  echo
}

echo "================ SCENARIO 0: baseline environment ================"
echo "real HOME: $REAL_HOME"
echo "real PATH: $PATH"
echo "resolved pnpm: $(command -v pnpm) -> $(pnpm --version)"
echo "declared pin (package.json#packageManager): $(node -p "require('./package.json').packageManager")"
echo "sh -> $(readlink -f /bin/sh); bash -> $(bash --version | head -1)"
echo "sh supports 'source': $(sh -c 'source /dev/null 2>/dev/null; echo $?') (127 = not found)"
echo "bash supports 'source': $(bash -c 'source /dev/null; echo $?')"
echo

H1=$(fresh_home fresh-no-local-path)
run_probe "SCENARIO A1 current command, fresh HOME, \$HOME/.local/bin NOT on PATH" \
  bash "$CURRENT" "$H1" "$(strip_local_bin)"

H2=$(fresh_home fresh-no-local-path-source)
run_probe "SCENARIO A2 proposed command, fresh HOME, \$HOME/.local/bin NOT on PATH" \
  bash "$PROPOSED" "$H2" "$(strip_local_bin)"

H3=$(fresh_home fresh-no-local-path-wrapped)
run_probe "SCENARIO A3 wrapped command under /bin/sh, fresh HOME, no .local/bin" \
  sh "$WRAPPED" "$H3" "$(strip_local_bin)"

H4=$(fresh_home fresh-local-on-path)
run_probe "SCENARIO B1 current command, fresh HOME, \$HOME/.local/bin ON PATH" \
  bash "$CURRENT" "$H4" "$H4/.local/bin:$(strip_local_bin)"

H5=$(fresh_home fresh-local-on-path-source)
run_probe "SCENARIO B2 proposed command, fresh HOME, \$HOME/.local/bin ON PATH" \
  bash "$PROPOSED" "$H5" "$H5/.local/bin:$(strip_local_bin)"

echo "================ SCENARIO C: competing pnpm earlier in PATH ================"
OTHER_PREFIX="$BASE/other-pnpm"
npm install -g pnpm@10.30.0 --prefix "$OTHER_PREFIX" >/dev/null 2>&1
# pnpm 10 self-manages to the packageManager pin, which would mask the
# precedence question. Disable that for the probe so the competing binary keeps
# its real version, like an image/corepack pnpm that cannot download the pin.
COMPETE=("npm_config_manage_package_manager_versions=false")
echo "competing pnpm at $OTHER_PREFIX/bin/pnpm reports: $(cd /tmp && env "${COMPETE[@]}" "$OTHER_PREFIX/bin/pnpm" --version)"
H6=$(fresh_home fresh-competing)
run_probe "SCENARIO C1 current command, competing pnpm 10.30.0 first in PATH, no .local/bin" \
  bash "$CURRENT" "$H6" "$OTHER_PREFIX/bin:$(strip_local_bin)" "${COMPETE[@]}"

H7=$(fresh_home fresh-competing-source)
run_probe "SCENARIO C2 proposed command, competing pnpm 10.30.0 first in PATH, no .local/bin" \
  bash "$PROPOSED" "$H7" "$OTHER_PREFIX/bin:$(strip_local_bin)" "${COMPETE[@]}"

H8=$(fresh_home fresh-competing-local-later)
run_probe "SCENARIO C3 proposed command, competing pnpm first and .local/bin later in PATH" \
  bash "$PROPOSED" "$H8" "$OTHER_PREFIX/bin:$H8/.local/bin:$(strip_local_bin)" "${COMPETE[@]}"

echo "================ SCENARIO D: steady state, real Freebuff environment ================"
run_probe "SCENARIO D1 current command, installed pinned pnpm (repeat run)" \
  bash "$CURRENT" "$REAL_HOME" "$PATH"
run_probe "SCENARIO D2 proposed command, installed pinned pnpm (repeat run)" \
  bash "$PROPOSED" "$REAL_HOME" "$PATH"
run_probe "SCENARIO D3 wrapped command under /bin/sh, installed pinned pnpm" \
  sh "$WRAPPED" "$REAL_HOME" "$PATH"

echo "================ SCENARIO E: shell portability ================"
run_probe "SCENARIO E1 proposed command run by dash (source unsupported)" \
  sh "$PROPOSED" "$REAL_HOME" "$PATH"
echo "SCENARIO E2 POSIX dot form run by dash (bootstrap uses Bash syntax):"
( cd "$REPO" && sh -c '. scripts/bootstrap-pnpm.sh; echo "dot_status=$?"' ) 2>&1 | sed 's/^/  | /'
echo

echo "================ LOCKFILE / MANIFEST INTEGRITY ================"
( cd "$REPO" && echo "changed lines in package.json + pnpm-lock.yaml: $(git diff -- package.json pnpm-lock.yaml | wc -l)" )
