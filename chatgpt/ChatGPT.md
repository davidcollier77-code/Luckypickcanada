#!/usr/bin/env bash
# =============================================================================
# Luckypickcanada - ChatGPT Node.js 26 + pnpm bootstrap (v2)
#
# Installs Node.js 26.x side-by-side with the existing Node.js 22 through the
# NVM installation that already exists, installs exactly pnpm 10.30.3, and
# activates Node 26 in this user's login and interactive bash shells.
#
# Design rules
#   * Non-privileged. No sudo, no apt, no /etc writes. If libatomic.so.1 is
#     missing the script stops before changing anything and says what to ask
#     the environment owner to install.
#   * Only this user's own startup files are touched. Symlinks, files owned by
#     another user, non-regular files, unwritable files and incomplete managed
#     markers are refused rather than edited.
#   * Journaled. Every mutation is recorded in the state directory before it
#     happens. A failure, Ctrl-C or a killed run leaves enough information for
#     --rollback to finish the job.
#   * --rollback verifies Node 22, every restored startup file and the fresh
#     shell results BEFORE retiring the recovery state. If verification fails
#     the state is kept and the exact failure is printed.
#   * Bare non-login non-interactive `bash -c` shells do not read startup
#     files. They are measured and reported honestly, never claimed to be
#     activated. Use --print-env for scripts that need it.
#
# Modes
#   (default) / --check-only   diagnostics only, no changes
#   --install / --install-node full install (Node 26 + pnpm + shell activation)
#   --install-pnpm             pnpm 10.30.3 only, into an existing Node 26
#   --rollback                 undo everything this script recorded
#   --print-env                print an `eval`-able activation line
#   --help                     this text
#
# Environment overrides
#   NVM_DIR                    NVM installation (default: auto-detect
#                              /opt/nvm, /usr/local/nvm, or ~/.nvm)
#   LUCKYPICK_NODE_VERSION     exact Node 26 version (default 26.13.1)
#   LUCKYPICK_STATE_DIR        recovery state (default ~/.local/state/luckypick-node)
# =============================================================================
set -Eeuo pipefail

SCRIPT_VERSION="2.1.0"
PNPM_VERSION="10.30.3"
NODE_TARGET="${LUCKYPICK_NODE_VERSION:-26.13.1}"
HOME_DIR="${HOME:-}"
STATE_DIR="${LUCKYPICK_STATE_DIR:-${XDG_STATE_HOME:-${HOME_DIR}/.local/state}/luckypick-node}"
NVM_DIR="${NVM_DIR:-}"
NVM_DIR_SOURCE="${NVM_DIR:+environment}"
MODE="check"
LOG=""
BLOCK_FILE=""
LOCK_DIR=""
COMPENSATED=0
INSTALL_ACTIVE=0
BLOCKERS=0
BASE_NODE=""
BASE_VER=""
BASE_MAJOR=""
BASE_BIN=""
BASE_SHA=""
TEST_PATH=""
BASH_BIN=""
PRE_LOGIN=""
PRE_INTERACTIVE=""
PRE_BARE=""

MARK_BEGIN="# >>> luckypick-node >>>"
MARK_END="# <<< luckypick-node <<<"

# ---------------------------------------------------------------------------
# output helpers
# ---------------------------------------------------------------------------
say()  { printf '%s\n' "$*"; }
ok()   { printf '  ok    %s\n' "$*"; }
warn() { printf '  WARN  %s\n' "$*" >&2; }
bad()  { printf '  FAIL  %s\n' "$*" >&2; }
section() { printf '\n== %s ==\n' "$*"; }
die()  { bad "$*"; exit 1; }

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }

log() {
  if [ -n "$LOG" ]; then
    printf '%s %s\n' "$(now)" "$*" >>"$LOG" 2>/dev/null || true
  fi
}

blocker() {
  bad "$*"
  BLOCKERS=$((BLOCKERS + 1))
}

usage() {
  cat <<'USAGE'
Usage: bash startup.sh [MODE]

  (no mode)         diagnostics only; no changes, no network
  --check-only      same as no mode
  --install         install Node.js 26.x side-by-side with Node 22, install
                    pnpm 10.30.3, and activate Node 26 in this user's login
                    and interactive bash shells
  --install-node    alias for --install
  --install-pnpm    install or verify pnpm 10.30.3 only; never touches the
                    NVM default or any shell startup file
  --rollback        remove the managed Node 26, pnpm 10.30.3 and startup-file
                    changes, verify Node 22 is intact, then retire the state
  --print-env       print `eval`-able activation for the current shell
  --help            this text

Environment:
  NVM_DIR                  NVM directory (default: auto-detect
                           /opt/nvm, /usr/local/nvm, or ~/.nvm)
  LUCKYPICK_NODE_VERSION   exact Node 26 version (default 26.13.1)
  LUCKYPICK_STATE_DIR      recovery state directory
                           (default ${XDG_STATE_HOME:-$HOME/.local/state}/luckypick-node)

Nothing in this script installs system packages, writes to /etc, changes the
NVM default alias, installs project dependencies, or touches the repository.
USAGE
}

# ---------------------------------------------------------------------------
# validation / small utilities
# ---------------------------------------------------------------------------
is_safe_path() {
  # Absolute, no whitespace, no quotes, no '$', no ':' -> safe to embed in the
  # generated shell snippet and in a PATH entry.
  [[ $1 =~ ^/[A-Za-z0-9._/-]+$ ]]
}

sha256_of() {
  sha256sum -- "$1" | awk '{print $1}'
}

file_mode() {
  stat -c '%a' -- "$1" 2>/dev/null || printf '644'
}

is_uint() {
  case ${1:-} in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

# ---------------------------------------------------------------------------
# state journal
# ---------------------------------------------------------------------------
state_exists() { [ -d "$STATE_DIR/state" ]; }

st_get() { # key [default]
  local key=$1 def=${2-} f="$STATE_DIR/state/$1"
  if [ -f "$f" ]; then
    head -n 1 -- "$f"
  else
    printf '%s' "$def"
  fi
}

st_has() { [ -f "$STATE_DIR/state/$1" ]; }

st_put() { # key value
  local key=$1 val=${2-} f tmp
  [[ $key =~ ^[A-Za-z0-9_.-]+$ ]] || die "internal error: invalid state key '$key'"
  f="$STATE_DIR/state/$key"
  tmp="$STATE_DIR/state/.tmp.$key.$$"
  # Values are single-line by contract; a newline would corrupt the record.
  val=${val//$'\n'/ }
  val=${val//$'\r'/ }
  printf '%s\n' "$val" >"$tmp"
  mv -f -- "$tmp" "$f"
}

st_del() {
  rm -f -- "$STATE_DIR/state/$1"
}

state_init() {
  case $STATE_DIR in
    /*) ;;
    *) die "State directory must be an absolute path: $STATE_DIR" ;;
  esac
  if [ -L "$STATE_DIR" ]; then
    die "State path is a symlink; refusing to use it: $STATE_DIR"
  fi
  if [ -e "$STATE_DIR" ] && [ ! -O "$STATE_DIR" ]; then
    die "State directory is not owned by you; refusing to use it: $STATE_DIR"
  fi
  mkdir -p -- "$STATE_DIR/state"
  chmod 700 -- "$STATE_DIR" "$STATE_DIR/state" 2>/dev/null || true
}

state_reset() {
  rm -rf -- "$STATE_DIR/state" "$STATE_DIR"/backup.* "$STATE_DIR"/payload.* "$STATE_DIR"/block "$STATE_DIR"/node-run.err
  mkdir -p -- "$STATE_DIR/state"
  chmod 700 -- "$STATE_DIR/state" 2>/dev/null || true
}

detect_nvm_dir() {
  local d fallback=""
  if [ -n "$NVM_DIR" ]; then
    NVM_DIR_SOURCE=environment
    return 0
  fi
  # Prefer a copy this user can actually modify; a root-owned NVM is still
  # reported (and refused) rather than silently chosen over a usable one.
  for d in /opt/nvm /usr/local/nvm "$HOME_DIR/.nvm"; do
    [ -r "$d/nvm.sh" ] || continue
    [ -n "$fallback" ] || fallback=$d
    if [ -O "$d" ] && [ -w "$d" ]; then
      NVM_DIR=$d
      NVM_DIR_SOURCE=detected
      return 0
    fi
  done
  if [ -n "$fallback" ]; then
    NVM_DIR=$fallback
    NVM_DIR_SOURCE=detected
    return 0
  fi
  NVM_DIR=/opt/nvm
  NVM_DIR_SOURCE=default
}

release_lock() {
  [ -n "$LOCK_DIR" ] || return 0
  if [ -d "$LOCK_DIR" ] && [ ! -L "$LOCK_DIR" ] &&
     [ "$(head -n 1 -- "$LOCK_DIR/pid" 2>/dev/null || true)" = "$$" ]; then
    rm -rf -- "$LOCK_DIR"
  fi
  LOCK_DIR=""
}

acquire_lock() {
  local oldpid=""
  state_init
  if command -v flock >/dev/null 2>&1; then
    exec 9>"$STATE_DIR/lock"
    if ! flock -n 9; then
      die "Another startup.sh run is in progress (lock: $STATE_DIR/lock)."
    fi
  else
    # Portable fallback: an atomic mkdir plus the owner PID. A dead owner is
    # stale; a live owner blocks the second run.
    LOCK_DIR="$STATE_DIR/lock.d"
    if ! mkdir -- "$LOCK_DIR" 2>/dev/null; then
      if [ -f "$LOCK_DIR/pid" ]; then
        oldpid=$(head -n 1 -- "$LOCK_DIR/pid" 2>/dev/null || true)
      fi
      if is_uint "$oldpid" && kill -0 "$oldpid" 2>/dev/null; then
        die "Another startup.sh run is in progress (pid $oldpid; lock: $LOCK_DIR)."
      fi
      warn "removing stale lock directory (pid ${oldpid:-unknown}): $LOCK_DIR"
      rm -rf -- "$LOCK_DIR"
      if ! mkdir -- "$LOCK_DIR" 2>/dev/null; then
        die "Cannot create lock directory: $LOCK_DIR"
      fi
    fi
    printf '%s\n' "$$" >"$LOCK_DIR/pid" || die "Cannot write lock owner: $LOCK_DIR/pid"
  fi
  : >"$STATE_DIR/lock.holder"
  printf 'pid=%s started=%s\n' "$$" "$(now)" >"$STATE_DIR/lock.holder"
}

# ---------------------------------------------------------------------------
# managed shell snippet
# ---------------------------------------------------------------------------
build_block() { # /absolute/node26/bin
  local bin=$1
  is_safe_path "$bin" || return 1
  {
    printf '%s\n' "$MARK_BEGIN"
    printf '%s\n' '# Managed by startup.sh. Remove with: bash startup.sh --rollback'
    printf 'if [ -x "%s/node" ]; then\n' "$bin"
    printf '  case ":$PATH:" in\n'
    printf '    *":%s:"*) ;;\n' "$bin"
    printf '    *) PATH="%s:$PATH" ;;\n' "$bin"
    printf '  esac\n'
    printf '  export PATH\n'
    printf 'fi\n'
    printf '%s\n' "$MARK_END"
  } >"$BLOCK_FILE"
}

ensure_block_file() {
  if [ -z "$BLOCK_FILE" ]; then
    BLOCK_FILE=$(mktemp "${TMPDIR:-/tmp}/luckypick-block.XXXXXX")
    : >"$BLOCK_FILE"
  fi
}

# ---------------------------------------------------------------------------
# shell startup files
# ---------------------------------------------------------------------------
# Bash reads the FIRST existing file of .bash_profile, .bash_login, .profile
# for login shells, and .bashrc for interactive non-login shells. We edit the
# file bash will actually read, plus .bashrc, and nothing else.
profile_targets() {
  local login="" f ino seen=""
  for f in "$HOME_DIR/.bash_profile" "$HOME_DIR/.bash_login" "$HOME_DIR/.profile"; do
    if [ -e "$f" ] || [ -L "$f" ]; then
      login=$f
      break
    fi
  done
  [ -n "$login" ] || login="$HOME_DIR/.profile"

  for f in "$login" "$HOME_DIR/.bashrc"; do
    if [ -e "$f" ] || [ -L "$f" ]; then
      ino=$(stat -Lc '%d:%i' -- "$f" 2>/dev/null || printf '?')
      case ":$seen:" in
        *":$ino:"*) continue ;;
      esac
      seen="${seen:+$seen:}$ino"
    fi
    printf '%s\n' "$f"
  done
}

# Prints one of: missing regular symlink notregular notowned notwritable parentunsafe
profile_kind() {
  local f=$1 d
  if [ -L "$f" ]; then printf 'symlink\n'; return 0; fi
  if [ -e "$f" ] && [ ! -f "$f" ]; then printf 'notregular\n'; return 0; fi
  if [ -f "$f" ]; then
    if [ ! -O "$f" ]; then printf 'notowned\n'; return 0; fi
    if [ ! -w "$f" ]; then printf 'notwritable\n'; return 0; fi
    printf 'regular\n'
    return 0
  fi
  d=$(dirname -- "$f")
  if [ -d "$d" ] && [ -O "$d" ] && [ -w "$d" ]; then
    printf 'missing\n'
  else
    printf 'parentunsafe\n'
  fi
}

# Prints: none | ours | foreign | malformed | unreadable
profile_marker_state() {
  local f=$1 counts bo=0 bc=0 bs=0 be=0
  if [ ! -e "$f" ] && [ ! -L "$f" ]; then printf 'none\n'; return 0; fi
  if [ ! -r "$f" ]; then printf 'unreadable\n'; return 0; fi
  counts=$(awk -v b="$MARK_BEGIN" -v e="$MARK_END" '
    $0==b { bo++; if (bo==1) bs=NR }
    $0==e { bc++; if (bc==1) be=NR }
    END { printf "%d %d %d %d", bo+0, bc+0, bs+0, be+0 }
  ' "$f" 2>/dev/null || printf '0 0 0 0')
  read -r bo bc bs be <<<"$counts" || true
  if [ "$bo" -eq 0 ] && [ "$bc" -eq 0 ]; then
    printf 'none\n'
    return 0
  fi
  if [ "$bo" -eq 1 ] && [ "$bc" -eq 1 ] && [ "$bs" -lt "$be" ]; then
    if [ -n "$BLOCK_FILE" ] && [ -f "$BLOCK_FILE" ] &&
       sed -n "${bs},${be}p" -- "$f" | cmp -s - "$BLOCK_FILE"; then
      printf 'ours\n'
    else
      printf 'foreign\n'
    fi
    return 0
  fi
  printf 'malformed\n'
}

remove_block_from() { # file added_newline(0|1)
  local f=$1 added=${2:-0} tmp
  tmp="$f.luckypick-tmp.$$"
  awk -v b="$MARK_BEGIN" -v e="$MARK_END" -v add="$added" '
    { lines[NR] = $0 }
    $0==b { bs=NR }
    $0==e { be=NR }
    END {
      for (i = 1; i <= NR; i++) {
        if (bs && be && i >= bs && i <= be) continue
        if (add == 1 && bs && i == bs - 1 && lines[i] == "") continue
        print lines[i]
      }
    }
  ' "$f" >"$tmp" || { rm -f -- "$tmp"; return 1; }
  cat -- "$tmp" >"$f" || { rm -f -- "$tmp"; return 1; }
  rm -f -- "$tmp"
  [ "$(profile_marker_state "$f")" = "none" ]
}

# ---------------------------------------------------------------------------
# failure compensation
# ---------------------------------------------------------------------------
baseline_functional() {
  local p=${BASE_NODE}
  if [ -z "$p" ] && [ -f "$STATE_DIR/state/baseline_path" ]; then
    p=$(st_get baseline_path)
  fi
  [ -n "$p" ] && [ -x "$p" ] || return 1
  "$p" --version >/dev/null 2>&1
}

verify_baseline_sha() {
  local p s
  p=$(st_get baseline_path "")
  s=$(st_get baseline_sha "")
  [ -n "$p" ] && [ -n "$s" ] || return 0
  [ -f "$p" ] || return 1
  [ "$(sha256_of "$p")" = "$s" ]
}

# ---------------------------------------------------------------------------
# NVM
# ---------------------------------------------------------------------------
nvm_run() {
  (
    set +eu
    export NVM_DIR
    [ -r "$NVM_DIR/nvm.sh" ] || exit 1
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh" --no-use >/dev/null 2>&1 || exit 1
    nvm "$@"
  ) 9>&-
}

nvm_install_target() {
  if command -v timeout >/dev/null 2>&1; then
    timeout --foreground "${LUCKYPICK_INSTALL_TIMEOUT:-600}" "${BASH:-bash}" -c '
      set +eu
      export NVM_DIR=$1
      . "$NVM_DIR/nvm.sh" --no-use >/dev/null 2>&1 || exit 1
      nvm install "$2"
    ' _ "$NVM_DIR" "$NODE_TARGET"
  else
    nvm_run install "$NODE_TARGET"
  fi
}

nvm_resolve_version() {
  nvm_run version "$1" 2>/dev/null | tail -n 1 | tr -d '[:space:]' || true
}

resolve_existing_node26() {
  local p v
  p=$(st_get node_prefix "" 2>/dev/null || true)
  if [ -n "$p" ] && [ -x "$p/bin/node" ]; then
    v=$("$p/bin/node" --version 2>/dev/null || true)
    case $v in v26.*) printf '%s\n' "$p"; return 0 ;; esac
  fi
  p=$(command -v node 2>/dev/null || true)
  if [ -n "$p" ]; then
    p=$(readlink -f -- "$p" 2>/dev/null || printf '%s' "$p")
    v=$("$p" --version 2>/dev/null || true)
    case $v in
      v26.*) printf '%s\n' "$(dirname -- "$(dirname -- "$p")")"; return 0 ;;
    esac
  fi
  p=$(ls -1d "$NVM_DIR"/versions/node/v26.*/bin/node 2>/dev/null | sort -V | tail -n 1 || true)
  if [ -n "$p" ] && [ -x "$p" ]; then
    printf '%s\n' "$(dirname -- "$(dirname -- "$p")")"
    return 0
  fi
  return 1
}

find_ldconfig() {
  local p
  p=$(command -v ldconfig 2>/dev/null || true)
  [ -n "$p" ] && { printf '%s' "$p"; return 0; }
  for p in /usr/sbin/ldconfig /sbin/ldconfig; do
    [ -x "$p" ] && { printf '%s' "$p"; return 0; }
  done
  return 1
}

libatomic_present() {
  local ld d
  ld=$(find_ldconfig 2>/dev/null || true)
  if [ -n "$ld" ] && "$ld" -p 2>/dev/null | grep -q -- 'libatomic\.so\.1'; then
    return 0
  fi
  for d in /usr/lib/*-linux-gnu /lib/*-linux-gnu /usr/lib64 /usr/lib /lib64 /lib; do
    [ -f "$d/libatomic.so.1" ] && return 0
  done
  return 1
}

# ---------------------------------------------------------------------------
# baseline Node detection and shell activation measurement
# ---------------------------------------------------------------------------
find_baseline() {
  local p v
  p=$(command -v node 2>/dev/null || true)
  if [ -n "$p" ]; then
    p=$(readlink -f -- "$p" 2>/dev/null || printf '%s' "$p")
  else
    p=$(ls -1d "$NVM_DIR"/versions/node/v*/bin/node 2>/dev/null | sort -V | tail -n 1 || true)
  fi
  [ -n "$p" ] && [ -x "$p" ] || return 1
  v=$("$p" --version 2>/dev/null || true)
  [[ $v =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || return 1
  BASE_NODE=$p
  BASE_VER=$v
  BASE_MAJOR=${v#v}
  BASE_MAJOR=${BASE_MAJOR%%.*}
  BASE_BIN=$(dirname -- "$p")
  BASE_SHA=$(sha256_of "$p")
  TEST_PATH=$(make_test_path "$BASE_BIN")
  return 0
}

make_test_path() {
  local base=$1 p out=$1
  local IFS=:
  for p in $PATH; do
    [ -n "$p" ] || continue
    case $p in
      *"/versions/node/v26."*) continue ;;
    esac
    case ":$out:" in
      *":$p:"*) continue ;;
    esac
    out="$out:$p"
  done
  printf '%s' "$out"
}

run_clean_shell() { # flags command
  local flags=$1 cmd=$2 out
  out=$(env -i HOME="$HOME_DIR" TERM=dumb LANG=C LC_ALL=C PATH="$TEST_PATH" \
        "$BASH_BIN" "$flags" "$cmd" 2>/dev/null 9>&- | tail -n 1 | tr -d '\r' || true)
  printf '%s' "$out"
}

measure_shells() {
  LOGIN_V=$(run_clean_shell -lc 'node --version')
  INTERACTIVE_V=$(run_clean_shell -ic 'node --version')
  BARE_V=$(run_clean_shell -c 'node --version')
}

# ---------------------------------------------------------------------------
# startup-file mutation
# ---------------------------------------------------------------------------
profile_apply() { # file index
  local f=$1 idx=$2 kind marker cur orig_sha added=0 nl
  kind=$(profile_kind "$f")
  case $kind in
    regular|missing) ;;
    *) die_install "Unsafe shell startup file ($kind): $f" ;;
  esac
  marker=$(profile_marker_state "$f")
  st_put "profile.$idx.path" "$f"

  if [ "$marker" = "ours" ]; then
    cur=$(sha256_of "$f")
    st_put "profile.$idx.action" adopted
    st_put "profile.$idx.original_sha" "$cur"
    st_put "profile.$idx.installed_sha" "$cur"
    st_put "profile.$idx.added_nl" 0
    ok "managed block already present: $f"
    return 0
  fi
  if [ "$marker" != "none" ]; then
    die_install "Shell startup file has unusable managed markers ($marker): $f"
  fi

  if [ -f "$f" ]; then
    if ! "$BASH_BIN" -n "$f" >/dev/null 2>&1; then
      die_install "Refusing to edit a startup file that already has a syntax error: $f"
    fi
    orig_sha=$(sha256_of "$f")
    cp -p -- "$f" "$STATE_DIR/backup.$idx" || die_install "Cannot back up $f"
    st_put "profile.$idx.action" appended
    st_put "profile.$idx.original_sha" "$orig_sha"
    st_put "profile.$idx.backup" "$STATE_DIR/backup.$idx"
  else
    st_put "profile.$idx.action" created
    st_put "profile.$idx.original_sha" -
    st_put "profile.$idx.backup" -
  fi

  : >"$STATE_DIR/payload.$idx"
  if [ -s "$f" ]; then
    nl="$STATE_DIR/newline.$$"
    printf '\n' >"$nl" || die_install "Cannot create the newline test file"
    if ! tail -c 1 -- "$f" | cmp -s - "$nl"; then
      printf '\n' >>"$STATE_DIR/payload.$idx"
      added=1
    fi
    rm -f -- "$nl"
  fi
  cat -- "$BLOCK_FILE" >>"$STATE_DIR/payload.$idx" || die_install "Cannot build startup payload"
  st_put "profile.$idx.added_nl" "$added"

  if ! cat -- "$STATE_DIR/payload.$idx" >>"$f"; then
    die_install "Cannot write $f"
  fi
  if [ "$kind" = "missing" ]; then
    chmod 644 -- "$f" 2>/dev/null || true
  fi
  if ! "$BASH_BIN" -n "$f" >/dev/null 2>&1; then
    if [ -f "$STATE_DIR/backup.$idx" ]; then
      cp -p -- "$STATE_DIR/backup.$idx" "$f" 2>/dev/null || true
    else
      rm -f -- "$f" 2>/dev/null || true
    fi
    st_del "profile.$idx.path"
    die_install "The managed block produced invalid shell syntax in $f; change was undone"
  fi
  st_put "profile.$idx.installed_sha" "$(sha256_of "$f")"
  ok "activated Node 26 in $f"
}

restore_one() { # index
  local idx=$1 path action backup orig inst added cur marker tmp
  path=$(st_get "profile.$idx.path" "")
  [ -n "$path" ] || return 0
  action=$(st_get "profile.$idx.action" appended)
  backup=$(st_get "profile.$idx.backup" "")
  orig=$(st_get "profile.$idx.original_sha" "")
  inst=$(st_get "profile.$idx.installed_sha" "")
  added=$(st_get "profile.$idx.added_nl" 0)
  is_uint "$added" || added=0

  if [ -L "$path" ] || { [ -e "$path" ] && [ ! -f "$path" ]; }; then
    bad "startup path is no longer a regular file: $path"
    return 1
  fi

  if [ ! -e "$path" ] && [ ! -L "$path" ]; then
    case $action in
      created|adopted) return 0 ;;
    esac
    if [ -n "$backup" ] && [ -f "$backup" ]; then
      cp -p -- "$backup" "$path" || { bad "cannot restore $path"; return 1; }
      ok "restored missing startup file: $path"
      return 0
    fi
    bad "startup file is missing and no backup exists: $path"
    return 1
  fi

  cur=$(sha256_of "$path")
  if [ -n "$inst" ] && [ "$cur" = "$inst" ]; then
    case $action in
      created)
        rm -f -- "$path" || { bad "cannot remove $path"; return 1; }
        ok "removed startup file created by this script: $path"
        ;;
      adopted)
        if remove_block_from "$path" 0; then
          ok "removed managed block from $path"
        else
          bad "could not remove managed block from $path"
          return 1
        fi
        ;;
      appended)
        tmp="$path.luckypick-restore.$$"
        if cp -p -- "$backup" "$tmp" && mv -f -- "$tmp" "$path"; then
          ok "restored $path"
        else
          rm -f -- "$tmp" 2>/dev/null || true
          bad "cannot restore $path"
          return 1
        fi
        ;;
      *)
        bad "unknown action '$action' for $path"
        return 1
        ;;
    esac
  else
    marker=$(profile_marker_state "$path")
    case $marker in
      none)
        ok "$path is already clean"
        ;;
      ours)
        if remove_block_from "$path" "$added"; then
          ok "removed managed block from modified startup file: $path"
        else
          bad "could not remove managed block from $path"
          return 1
        fi
        ;;
      *)
        bad "cannot safely restore $path (managed markers: $marker)"
        return 1
        ;;
    esac
  fi

  if [ "$(profile_marker_state "$path")" != "none" ]; then
    bad "managed markers still present after restore: $path"
    return 1
  fi
  if [ "$action" != "created" ] && [ -n "$backup" ] && [ -f "$backup" ] && [ "$(sha256_of "$path")" != "$orig" ]; then
    warn "$path now differs from the original backup; edits made after installation were preserved"
  fi
  return 0
}

restore_profiles() {
  local n i fails=0 f marker
  n=$(st_get profile_count 0)
  is_uint "$n" || n=0
  i=0
  while [ "$i" -lt "$n" ]; do
    if st_has "profile.$i.path"; then
      if ! restore_one "$i"; then
        fails=$((fails + 1))
      fi
    fi
    i=$((i + 1))
  done
  # Final sweep: a block can only be removed safely when it matches this
  # script's exact template, so an unrecorded block is still unambiguous.
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    [ -f "$f" ] || continue
    marker=$(profile_marker_state "$f")
    if [ "$marker" = "ours" ]; then
      if remove_block_from "$f" 0; then
        ok "removed unrecorded managed block from $f"
      else
        bad "could not remove managed block from $f"
        fails=$((fails + 1))
      fi
    fi
  done < <(profile_targets)
  return "$fails"
}

# ---------------------------------------------------------------------------
# package removal
# ---------------------------------------------------------------------------
remove_pnpm() {
  local p=$1
  is_safe_path "$p" || { bad "refusing to remove pnpm from unexpected path: $p"; return 1; }
  rm -rf -- "$p/lib/node_modules/pnpm" 2>/dev/null || true
  rm -f -- "$p/bin/pnpm" "$p/bin/pnpx" "$p/bin/pnpm.cjs" "$p/bin/pnpx.cjs" 2>/dev/null || true
  [ ! -e "$p/bin/pnpm" ] && [ ! -d "$p/lib/node_modules/pnpm" ]
}

undo_pnpm() {
  local prefix
  [ "$(st_get pnpm_created 0)" = "1" ] || return 0
  prefix=$(st_get node_prefix "")
  [ -n "$prefix" ] || { bad "state has no Node prefix for the pnpm removal"; return 1; }
  if remove_pnpm "$prefix"; then
    ok "removed pnpm $PNPM_VERSION from $prefix"
  else
    bad "could not remove pnpm from $prefix"
    return 1
  fi
}

undo_node() {
  local prefix nvm ver
  [ "$(st_get node_created 0)" = "1" ] || return 0
  prefix=$(st_get node_prefix "")
  nvm=$(st_get nvm_dir "$NVM_DIR")
  [ -n "$prefix" ] || { bad "state has no Node prefix to remove"; return 1; }
  case $prefix in
    "$nvm"/versions/node/v26.*) ;;
    *)
      bad "refusing to remove an unexpected path: $prefix"
      return 1
      ;;
  esac
  [ -d "$prefix" ] || return 0
  ver=${prefix##*/}
  if ! NVM_DIR="$nvm" nvm_run uninstall "$ver" >>"$LOG" 2>&1 9>&-; then
    warn "nvm uninstall failed; removing only the version directory directly"
    rm -rf -- "$prefix"
  fi
  if [ -e "$prefix" ]; then
    bad "failed to remove $prefix"
    return 1
  fi
  ok "removed Node.js $ver"
}

# Remove a Node directory created by this run but never verified (for example a
# download/extraction killed before nvm finished). Only directories that were
# absent from the pre-install snapshot are touched.
undo_partial_node() {
  local nvm nodes_before prefix created target d name
  [ "$(st_get node_install_started 0)" = "1" ] || return 0
  nvm=$(st_get nvm_dir "$NVM_DIR")
  nodes_before=$(st_get nodes_before "")
  prefix=$(st_get node_prefix "")
  created=$(st_get node_created 0)
  target=$(st_get node_target "$NODE_TARGET")

  if [[ $target =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    d="$nvm/versions/node/v$target"
    case ",$nodes_before," in
      *",v$target,"*) ;;
      *)
        if [ -d "$d" ] && { [ "$created" != "1" ] || [ "$prefix" != "$d" ]; }; then
          if rm -rf -- "$d"; then
            ok "removed incomplete Node.js $target directory"
          else
            bad "could not remove incomplete directory: $d"
            return 1
          fi
        fi
        ;;
    esac
  fi

  for d in "$nvm"/versions/node/v26.*; do
    [ -d "$d" ] || continue
    name=${d##*/}
    case ",$nodes_before," in
      *",$name,"*) continue ;;
    esac
    [ "$d" = "$prefix" ] && continue
    if rm -rf -- "$d"; then
      ok "removed incomplete Node.js $name directory"
    else
      bad "could not remove incomplete directory: $d"
      return 1
    fi
  done
  return 0
}

# ---------------------------------------------------------------------------
# compensation after a failed install
# ---------------------------------------------------------------------------
compensate() {
  local reason=${1:-failure} fails=0 prefix nvm rf
  [ "$COMPENSATED" -eq 1 ] && return 0
  COMPENSATED=1
  INSTALL_ACTIVE=0
  set +e
  warn "Installation did not complete: $reason"

  if ! baseline_functional; then
    bad "The original Node.js is not usable, so Node 26 is being LEFT INSTALLED."
    bad "Nothing else is safe to remove automatically; inspect $STATE_DIR and the messages above."
    st_put status failed
    st_put failure_reason "$reason"
    st_put finished_at "$(now)"
    return 1
  fi

  HOME_DIR=$(st_get home "$HOME_DIR")
  prefix=$(st_get node_prefix "")
  nvm=$(st_get nvm_dir "$NVM_DIR")
  if [ -n "$prefix" ] && is_safe_path "$prefix/bin"; then
    ensure_block_file
    build_block "$prefix/bin" 2>/dev/null || true
  fi

  restore_profiles
  rf=$?
  fails=$((fails + rf))
  undo_pnpm || fails=$((fails + 1))
  undo_node || fails=$((fails + 1))
  undo_partial_node || fails=$((fails + 1))
  verify_baseline_sha || warn "the original Node.js binary hash changed (not caused by this script)"

  st_put status failed
  st_put failure_reason "$reason"
  st_put finished_at "$(now)"
  if [ "$fails" -eq 0 ]; then
    say "Partial changes were removed. Node ${BASE_VER:-22.x} is available again."
    say "State kept for inspection and for '$0 --rollback': $STATE_DIR"
  else
    bad "Compensation completed with $fails problem(s). State kept: $STATE_DIR"
  fi
  return 0
}

die_install() {
  local msg=$1
  bad "$msg"
  log "FATAL: $msg"
  if [ "$INSTALL_ACTIVE" -eq 1 ] && [ "$COMPENSATED" -eq 0 ]; then
    compensate "$msg"
  fi
  exit 1
}

# ---------------------------------------------------------------------------
# preflight
# ---------------------------------------------------------------------------
check_dependencies() {
  local c
  for c in bash awk sed grep cmp sort tail df mktemp stat dirname readlink \
           sha256sum head cat cp mv rm chmod mkdir tr date touch uname; do
    if ! command -v "$c" >/dev/null 2>&1; then
      blocker "required command is missing: $c"
    fi
  done
  BASH_BIN=$(command -v bash 2>/dev/null || true)
  if [ -n "$BASH_BIN" ]; then
    BASH_BIN=$(readlink -f -- "$BASH_BIN" 2>/dev/null || printf '%s' "$BASH_BIN")
    ok "bash: $BASH_BIN"
  else
    blocker "bash is not available"
  fi
}

check_home() {
  if [ -z "$HOME_DIR" ]; then
    blocker "HOME is not set; cannot locate shell startup files"
    return
  fi
  if [ ! -d "$HOME_DIR" ]; then
    blocker "HOME does not exist: $HOME_DIR"
    return
  fi
  if [ ! -O "$HOME_DIR" ]; then
    blocker "HOME is not owned by the current user: $HOME_DIR"
    return
  fi
  if [ ! -w "$HOME_DIR" ]; then
    blocker "HOME is not writable by the current user: $HOME_DIR"
    return
  fi
  ok "HOME: $HOME_DIR"
}

check_shell_support() {
  local sh=${SHELL:-}
  if [ -z "$sh" ]; then
    warn "SHELL is not set; only bash startup files are configured"
    return
  fi
  case ${sh##*/} in
    bash) ok "login shell: $sh" ;;
    *)
      warn "login shell is ${sh##*/} ($sh); this script configures bash startup files only and does not modify ${sh##*/} files"
      ;;
  esac
}

check_optional_tools() {
  if command -v flock >/dev/null 2>&1; then
    ok "flock: $(command -v flock)"
  else
    warn "flock is missing; using the mkdir+pid lock fallback"
  fi
  if command -v timeout >/dev/null 2>&1; then
    ok "timeout: $(command -v timeout)"
  else
    warn "timeout is missing; nvm/npm runs have no enforced timeout"
  fi
  if ! find_ldconfig >/dev/null 2>&1; then
    warn "ldconfig is missing; libatomic is checked by file path"
  fi
}

check_environment() {
  local id="" ver="" node_bin="" npm_bin="" pnpm_bin=""
  if [ -r /etc/os-release ]; then
    id=$(sed -n 's/^ID=//p' /etc/os-release 2>/dev/null | head -n 1 | tr -d '"')
    ver=$(sed -n 's/^VERSION_ID=//p' /etc/os-release 2>/dev/null | head -n 1 | tr -d '"')
  fi
  node_bin=$(command -v node 2>/dev/null || true)
  npm_bin=$(command -v npm 2>/dev/null || true)
  pnpm_bin=$(command -v pnpm 2>/dev/null || true)
  say "host: $(uname -srm 2>/dev/null || echo unknown)"
  say "distro: ${id:-unknown} ${ver:-unknown}"
  say "bash: ${BASH_VERSION:-unknown} ($BASH_BIN)"
  say "shell: ${SHELL:-<unset>}"
  say "HOME: $HOME_DIR"
  say "NVM: ${NVM_DIR:-<unset>} (${NVM_DIR_SOURCE:-unknown})"
  say "node: ${node_bin:-<missing>} $([ -n "$node_bin" ] && "$node_bin" --version 2>/dev/null || true)"
  say "npm: ${npm_bin:-<missing>} $([ -n "$npm_bin" ] && "$npm_bin" --version 2>/dev/null || true)"
  say "pnpm: ${pnpm_bin:-<missing>} $([ -n "$pnpm_bin" ] && "$pnpm_bin" --version 2>/dev/null || true)"
  if libatomic_present; then
    say "libatomic.so.1: present"
  else
    say "libatomic.so.1: MISSING"
  fi
}

check_nvm() {
  local nv
  if [ ! -d "$NVM_DIR" ]; then
    blocker "NVM directory does not exist: $NVM_DIR"
    return
  fi
  if [ ! -r "$NVM_DIR/nvm.sh" ]; then
    blocker "nvm.sh is not readable: $NVM_DIR/nvm.sh"
    return
  fi
  if [ ! -O "$NVM_DIR" ]; then
    blocker "NVM directory is not owned by the current user; refusing to modify a shared or root-owned NVM: $NVM_DIR"
    return
  fi
  if [ ! -w "$NVM_DIR" ]; then
    blocker "NVM directory is not writable by this user: $NVM_DIR"
  fi
  if ! is_safe_path "$NVM_DIR"; then
    blocker "NVM directory contains characters this script refuses to embed: $NVM_DIR"
  fi
  nv=$(nvm_run --version 2>/dev/null || true)
  if [ -n "$nv" ]; then
    ok "nvm $nv at $NVM_DIR"
  else
    blocker "nvm did not load from $NVM_DIR"
  fi
}

check_disk() {
  local target free
  for target in "$NVM_DIR" "$STATE_DIR"; do
    target=$(existing_parent "$target")
    free=$(df -Pk -- "$target" 2>/dev/null | awk 'NR==2 {print $4}' || true)
    if ! is_uint "$free"; then
      warn "could not determine free space for $target"
      continue
    fi
    if [ "$free" -lt 204800 ]; then
      blocker "less than 200 MB free on the filesystem holding $target"
    elif [ "$free" -lt 512000 ]; then
      warn "less than 500 MB free on the filesystem holding $target"
    else
      ok "free space for $target: $((free / 1024)) MB"
    fi
  done
}

existing_parent() {
  local d=$1
  while [ ! -d "$d" ]; do
    d=$(dirname -- "$d")
  done
  printf '%s' "$d"
}

check_profiles() {
  local f kind marker
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    kind=$(profile_kind "$f")
    case $kind in
      regular)
        if ! "$BASH_BIN" -n "$f" >/dev/null 2>&1; then
          blocker "existing startup file already contains a shell syntax error: $f"
        fi
        ;;
      missing) ;;
      *)
        blocker "unsafe startup file ($kind): $f"
        ;;
    esac
    marker=$(profile_marker_state "$f")
    case $marker in
      none|ours) ;;
      *)
        blocker "managed markers are incomplete or unexpected in $f ($marker)"
        ;;
    esac
  done < <(profile_targets)
}

check_legacy_etc() {
  local legacy=/etc/profile.d/zz-luckypick-node.sh
  if [ -e "$legacy" ] || [ -L "$legacy" ]; then
    warn "a system-wide file exists and will NOT be modified: $legacy"
    if [ -r "$legacy" ] && grep -q -- 'v26\|luckypick' "$legacy" 2>/dev/null; then
      blocker "legacy system-wide Node activation exists; remove $legacy manually, then re-run"
    fi
  fi
}

prepare_block() {
  ensure_block_file
  local p
  if p=$(candidate_prefix 2>/dev/null) && [ -n "$p" ]; then
    build_block "$p/bin" || true
  fi
}

candidate_prefix() {
  local p
  p=$(st_get node_prefix "" 2>/dev/null || true)
  if [ -n "$p" ] && [ -x "$p/bin/node" ]; then
    printf '%s' "$p"
    return 0
  fi
  p="$NVM_DIR/versions/node/v$NODE_TARGET"
  if [ -x "$p/bin/node" ]; then
    printf '%s' "$p"
    return 0
  fi
  resolve_existing_node26
}

preflight_install() {
  section "Preflight"
  BLOCKERS=0
  check_dependencies
  check_home
  check_nvm
  check_shell_support
  check_optional_tools
  if ! [[ $NODE_TARGET =~ ^[0-9]+(\.[0-9]+){0,2}$ ]]; then
    blocker "LUCKYPICK_NODE_VERSION is not a valid version: $NODE_TARGET"
  fi
  if find_baseline; then
    ok "existing Node.js: $BASE_VER ($BASE_NODE)"
    case $BASE_MAJOR in
      22)
        if ! libatomic_present; then
          blocker "libatomic.so.1 is missing. Node.js 26 requires it, and this script does not install system packages. Ask the environment owner to install libatomic1 (Debian/Ubuntu), then re-run."
        else
          ok "libatomic.so.1 is present"
        fi
        ;;
      26)
        if [ "$BASE_VER" = "v$NODE_TARGET" ] || [ "$BASE_VER" = "v${NODE_TARGET}" ]; then
          ok "Node 26 is already the active runtime; it will be reused"
        else
          blocker "active Node is $BASE_VER but LUCKYPICK_NODE_VERSION is $NODE_TARGET; set LUCKYPICK_NODE_VERSION to the installed version"
        fi
        ;;
      *)
        blocker "active Node is $BASE_VER; this script expects a 22.x baseline (or an already-active 26.x target)"
        ;;
    esac
  else
    blocker "no usable existing Node.js was found; refusing to install without a rollback baseline"
  fi
  prepare_block
  check_profiles
  check_disk
  check_legacy_etc
  if [ "$BLOCKERS" -gt 0 ]; then
    bad "Preflight found $BLOCKERS blocker(s). Nothing was changed."
    exit 2
  fi
  ok "preflight passed"
}

# ---------------------------------------------------------------------------
# pnpm
# ---------------------------------------------------------------------------
install_pnpm() {
  local prefix=$1 npm="$1/bin/npm"
  [ -x "$npm" ] || return 1
  if command -v timeout >/dev/null 2>&1; then
    timeout --foreground "${LUCKYPICK_PNPM_TIMEOUT:-300}" env \
      PATH="$prefix/bin:$PATH" \
      npm_config_update_notifier=false npm_config_fund=false npm_config_audit=false \
      "$npm" install --global --prefix "$prefix" --no-fund --no-audit --loglevel=error \
      "pnpm@$PNPM_VERSION"
  else
    env PATH="$prefix/bin:$PATH" \
      npm_config_update_notifier=false npm_config_fund=false npm_config_audit=false \
      "$npm" install --global --prefix "$prefix" --no-fund --no-audit --loglevel=error \
      "pnpm@$PNPM_VERSION"
  fi
}

pnpm_version_at() {
  local prefix=$1
  [ -x "$prefix/bin/pnpm" ] || { printf ''; return 0; }
  PATH="$prefix/bin:$PATH" "$prefix/bin/pnpm" --version 2>/dev/null 9>&- | tail -n 1 | tr -d '[:space:]\r' || true
}

verify_pnpm() {
  local prefix=$1 v link
  v=$(pnpm_version_at "$prefix")
  if [ "$v" != "$PNPM_VERSION" ]; then
    bad "pnpm version at $prefix is '${v:-missing}', expected $PNPM_VERSION"
    return 1
  fi
  link=$(readlink -f -- "$prefix/bin/pnpm" 2>/dev/null || true)
  case $link in
    "$prefix"/lib/node_modules/pnpm/*) ;;
    *)
      bad "pnpm resolves outside the managed Node prefix: ${link:-<none>}"
      return 1
      ;;
  esac
  ok "pnpm $PNPM_VERSION at $prefix/bin/pnpm"
}

# ---------------------------------------------------------------------------
# install
# ---------------------------------------------------------------------------
installed_complete() {
  local prefix resolved n i f
  [ "$(st_get mode "")" = "install" ] || return 1
  prefix=$(st_get node_prefix "")
  resolved=$(st_get node_resolved "")
  [ -n "$prefix" ] && [ -x "$prefix/bin/node" ] || return 1
  [ "$("$prefix/bin/node" --version 2>/dev/null || true)" = "$resolved" ] || return 1
  [ "$(pnpm_version_at "$prefix")" = "$PNPM_VERSION" ] || return 1
  n=$(st_get profile_count 0)
  is_uint "$n" || return 1
  ensure_block_file
  build_block "$prefix/bin" || return 1
  i=0
  while [ "$i" -lt "$n" ]; do
    f=$(st_get "profile.$i.path" "")
    [ -n "$f" ] && [ -f "$f" ] || return 1
    [ "$(profile_marker_state "$f")" = "ours" ] || return 1
    i=$((i + 1))
  done
  return 0
}

print_install_summary() {
  local prefix resolved bare
  prefix=$(st_get node_prefix "")
  resolved=$(st_get node_resolved "")
  TEST_PATH=$(st_get test_path "$TEST_PATH")
  BASH_BIN=${BASH_BIN:-$(command -v bash)}
  section "Installed"
  say "Node.js   $resolved  ($prefix/bin/node)"
  say "npm       $(PATH="$prefix/bin:$PATH" "$prefix/bin/npm" --version 2>/dev/null || true)"
  say "pnpm      $PNPM_VERSION  ($prefix/bin/pnpm)"
  say "shells    login and interactive bash now use $resolved"
  bare=$(run_clean_shell -c 'node --version')
  if [ "$bare" = "$resolved" ]; then
    say "bare bash -c: $resolved (demonstrated in this environment)"
  else
    say "bare bash -c: ${bare:-<no node>} (NOT activated; non-login shells do not read startup files)"
    say "             use: eval \"\$(bash $0 --print-env)\""
  fi
  say ""
  say "Rollback: bash $0 --rollback"
}

do_install() {
  local status prefix resolved created=0 nodes_before before_alias after_alias v out
  local targets=() f idx n

  if state_exists; then
    status=$(st_get status "")
    if [ "$status" = "installed" ]; then
      if installed_complete; then
        say "Node 26 and pnpm $PNPM_VERSION are already installed and verified; no changes made."
        print_install_summary
        exit 0
      fi
      die "A managed installation is on record but failed verification. Run 'bash $0 --rollback' first."
    fi
    if [ "$status" != "rolled-back" ]; then
      die "A managed installation is already on record (status: '$status'). Run 'bash $0 --rollback' first."
    fi
  fi

  preflight_install
  acquire_lock
  LOG="$STATE_DIR/log"
  printf '\n=== %s install v%s target=%s ===\n' "$(now)" "$SCRIPT_VERSION" "$NODE_TARGET" >>"$LOG"

  measure_shells
  PRE_LOGIN=$LOGIN_V
  PRE_INTERACTIVE=$INTERACTIVE_V
  PRE_BARE=$BARE_V

  state_reset
  st_put schema 2
  st_put status installing
  st_put mode install
  st_put script_version "$SCRIPT_VERSION"
  st_put started_at "$(now)"
  st_put home "$HOME_DIR"
  st_put nvm_dir "$NVM_DIR"
  st_put nvm_dir_source "$NVM_DIR_SOURCE"
  st_put node_target "$NODE_TARGET"
  st_put pnpm_target "$PNPM_VERSION"
  st_put baseline_version "$BASE_VER"
  st_put baseline_path "$BASE_NODE"
  st_put baseline_sha "$BASE_SHA"
  st_put baseline_bin "$BASE_BIN"
  st_put test_path "$TEST_PATH"
  st_put pre_login "$PRE_LOGIN"
  st_put pre_interactive "$PRE_INTERACTIVE"
  st_put pre_bare "$PRE_BARE"
  INSTALL_ACTIVE=1

  if [ "$BASE_MAJOR" = "26" ]; then
    prefix=$(dirname -- "$(dirname -- "$BASE_NODE")")
    resolved=${prefix##*/}
    case $resolved in
      v26.*) ;;
      *) die_install "cannot derive the Node 26 prefix from $BASE_NODE" ;;
    esac
    st_put node_created 0
    st_put node_prefix "$prefix"
    st_put node_resolved "$resolved"
    st_put node_verified 1
    say "Reusing the already-active Node.js $resolved at $prefix"
  else
    nodes_before=$(ls -1 -- "$NVM_DIR/versions/node" 2>/dev/null | tr '\n' ',' || true)
    st_put nodes_before "$nodes_before"
    st_put node_install_started 1
    say "Installing Node.js $NODE_TARGET with nvm (one download, then cached)..."
    if ! nvm_install_target >>"$LOG" 2>&1 9>&-; then
      tail -n 30 -- "$LOG" >&2 || true
      die_install "nvm install $NODE_TARGET failed (full log: $LOG)"
    fi
    resolved=$(nvm_resolve_version "$NODE_TARGET")
    if ! [[ $resolved =~ ^v26\.[0-9]+\.[0-9]+$ ]]; then
      die_install "nvm installed an unexpected version ('${resolved:-unknown}') for target $NODE_TARGET"
    fi
    prefix="$NVM_DIR/versions/node/$resolved"
    if [ ! -x "$prefix/bin/node" ]; then
      die_install "nvm reported $resolved but the binary is missing: $prefix/bin/node"
    fi
    case ",$nodes_before," in
      *",$resolved,"*) created=0 ;;
      *) created=1 ;;
    esac
    st_put node_created "$created"
    st_put node_prefix "$prefix"
    st_put node_resolved "$resolved"
  fi

  if ! out=$("$prefix/bin/node" --version 2>"$STATE_DIR/node-run.err"); then
    cat -- "$STATE_DIR/node-run.err" >&2 || true
    if grep -qi -- 'libatomic' "$STATE_DIR/node-run.err" 2>/dev/null; then
      die_install "Node $resolved cannot start because libatomic.so.1 is missing; no system packages were installed"
    fi
    die_install "Node $resolved was installed but cannot run"
  fi
  if [ "$out" != "$resolved" ]; then
    die_install "Node binary reports $out but nvm reported $resolved"
  fi
  ok "Node $resolved runs ($prefix/bin/node)"
  st_put node_verified 1

  ensure_block_file
  if ! build_block "$prefix/bin"; then
    die_install "the NVM path cannot be embedded safely in a shell snippet: $prefix"
  fi

  while IFS= read -r f; do
    [ -n "$f" ] && targets+=("$f")
  done < <(profile_targets)
  n=${#targets[@]}
  st_put profile_count "$n"
  idx=0
  for f in "${targets[@]}"; do
    profile_apply "$f" "$idx"
    idx=$((idx + 1))
  done

  measure_shells
  st_put post_login "$LOGIN_V"
  st_put post_interactive "$INTERACTIVE_V"
  st_put post_bare "$BARE_V"
  if [ "$LOGIN_V" != "$resolved" ] || [ "$INTERACTIVE_V" != "$resolved" ]; then
    bad "fresh login shell: ${LOGIN_V:-<none>}; fresh interactive shell: ${INTERACTIVE_V:-<none>}; expected $resolved"
    if [ -n "$LOGIN_V" ] && [ "$INTERACTIVE_V" = "$LOGIN_V" ]; then
      bad "the startup files were written but this shell did not read them; check for an early 'return' in them"
    fi
    die_install "shell activation verification failed"
  fi
  ok "fresh login shell uses $resolved"
  ok "fresh interactive shell uses $resolved"
  if [ "$BARE_V" = "$resolved" ]; then
    ok "bare bash -c uses $resolved in this environment"
  else
    warn "bare bash -c uses ${BARE_V:-<no node>} (not activated by startup files; use --print-env)"
  fi

  local have
  have=$(pnpm_version_at "$prefix")
  if [ "$have" = "$PNPM_VERSION" ]; then
    st_put pnpm_created 0
    st_put pnpm_preexisting "$have"
    ok "pnpm $PNPM_VERSION is already present in $prefix"
  elif [ -n "$have" ]; then
    die_install "pnpm $have is already installed in $prefix; this script manages only $PNPM_VERSION"
  else
    st_put pnpm_preexisting absent
    # Journal ownership BEFORE npm writes anything, so a SIGKILL during the
    # install leaves enough state for --rollback to remove a partial pnpm.
    st_put pnpm_created 1
    say "Installing pnpm $PNPM_VERSION into $prefix ..."
    if ! install_pnpm "$prefix" >>"$LOG" 2>&1 9>&-; then
      tail -n 30 -- "$LOG" >&2 || true
      die_install "pnpm $PNPM_VERSION installation failed (full log: $LOG)"
    fi
    if ! verify_pnpm "$prefix"; then
      die_install "pnpm was installed but did not verify"
    fi
  fi

  before_alias=$(cat -- "$NVM_DIR/alias/default" 2>/dev/null || true)
  st_put default_alias "$before_alias"
  st_put status installed
  st_put finished_at "$(now)"
  after_alias=$(cat -- "$NVM_DIR/alias/default" 2>/dev/null || true)
  if [ "$before_alias" != "$after_alias" ]; then
    warn "the NVM default alias changed during installation; this script does not change it"
  fi
  INSTALL_ACTIVE=0
  print_install_summary
}

# ---------------------------------------------------------------------------
# pnpm-only mode
# ---------------------------------------------------------------------------
do_install_pnpm() {
  local prefix have state_mode=0 before_alias after_alias
  if state_exists; then
    case $(st_get status "") in
      installed) state_mode=1 ;;
      rolled-back) ;;
      *)
        die "A managed installation is on record with status '$(st_get status "")'. Run 'bash $0 --rollback' first."
        ;;
    esac
  fi

  if ! prefix=$(resolve_existing_node26); then
    die "No Node.js 26 installation was found. Run 'bash $0 --install' first."
  fi
  have=$(pnpm_version_at "$prefix")
  if [ "$have" = "$PNPM_VERSION" ]; then
    say "pnpm $PNPM_VERSION is already installed at $prefix; no changes made."
    exit 0
  fi
  if [ -n "$have" ]; then
    die "pnpm $have is already installed at $prefix. This script manages only $PNPM_VERSION and will not replace it automatically."
  fi

  before_alias=$(cat -- "$NVM_DIR/alias/default" 2>/dev/null || true)
  acquire_lock
  LOG="$STATE_DIR/log"
  printf '\n=== %s install-pnpm v%s ===\n' "$(now)" "$SCRIPT_VERSION" >>"$LOG"

  if [ "$state_mode" -eq 0 ]; then
    state_reset
    st_put schema 2
    st_put status installing
    st_put mode pnpm
    st_put script_version "$SCRIPT_VERSION"
    st_put started_at "$(now)"
    st_put home "$HOME_DIR"
    st_put nvm_dir "$NVM_DIR"
    st_put nvm_dir_source "$NVM_DIR_SOURCE"
    st_put pnpm_target "$PNPM_VERSION"
    st_put node_prefix "$prefix"
    st_put node_resolved "${prefix##*/}"
    st_put node_created 0
  fi
  st_put pnpm_preexisting absent
  if [ "$state_mode" -eq 0 ]; then
    # No earlier full-install journal owns this pnpm; journal it now so a
    # SIGKILL during npm leaves a rollback record.
    st_put pnpm_created 1
  fi

  say "Installing pnpm $PNPM_VERSION into $prefix ..."
  if ! install_pnpm "$prefix" >>"$LOG" 2>&1 9>&-; then
    tail -n 30 -- "$LOG" >&2 || true
    remove_pnpm "$prefix" || true
    if [ "$state_mode" -eq 0 ]; then
      st_put status failed
      st_put failure_reason "pnpm install failed"
      st_put finished_at "$(now)"
    fi
    die "pnpm installation failed; partial pnpm files were removed (full log: $LOG)"
  fi
  if ! verify_pnpm "$prefix"; then
    remove_pnpm "$prefix" || true
    if [ "$state_mode" -eq 0 ]; then
      st_put status failed
      st_put failure_reason "pnpm verification failed"
      st_put finished_at "$(now)"
    fi
    die "pnpm did not verify; partial pnpm files were removed"
  fi
  if [ "$state_mode" -eq 0 ]; then
    st_put status installed
    st_put finished_at "$(now)"
  fi

  after_alias=$(cat -- "$NVM_DIR/alias/default" 2>/dev/null || true)
  if [ "$before_alias" != "$after_alias" ]; then
    warn "the NVM default alias changed during this run (this script does not change it)"
  fi
  section "pnpm installed"
  say "prefix   $prefix"
  say "pnpm     $PNPM_VERSION ($prefix/bin/pnpm)"
  say "shell startup files and the NVM default alias were not touched."
  if [ "$state_mode" -eq 0 ]; then
    say "Rollback: bash $0 --rollback"
  fi
}

# ---------------------------------------------------------------------------
# rollback
# ---------------------------------------------------------------------------
rollback_verify() {
  local fails=0 prefix pnpm_created node_created n i f marker v
  prefix=$(st_get node_prefix "")
  node_created=$(st_get node_created 0)
  pnpm_created=$(st_get pnpm_created 0)

  if [ "$node_created" = "1" ] && [ -e "$prefix" ]; then
    bad "Node 26 directory still exists: $prefix"
    fails=$((fails + 1))
  fi
  if [ "$pnpm_created" = "1" ] && [ -n "$prefix" ] && [ -e "$prefix/bin/pnpm" ]; then
    bad "pnpm is still present: $prefix/bin/pnpm"
    fails=$((fails + 1))
  fi

  if [ -n "$BASE_NODE" ]; then
    v=$("$BASE_NODE" --version 2>/dev/null || true)
    if [ "$v" != "$(st_get baseline_version "")" ]; then
      bad "original Node.js reports '${v:-<none>}', expected '$(st_get baseline_version "")'"
      fails=$((fails + 1))
    else
      ok "original Node.js is intact: $v"
    fi
  else
    ok "pnpm-only state: no Node baseline was changed"
  fi

  n=$(st_get profile_count 0)
  is_uint "$n" || n=0
  i=0
  while [ "$i" -lt "$n" ]; do
    f=$(st_get "profile.$i.path" "")
    if [ -n "$f" ]; then
      if [ -e "$f" ] || [ -L "$f" ]; then
        if [ -f "$f" ]; then
          marker=$(profile_marker_state "$f")
          if [ "$marker" != "none" ]; then
            bad "managed markers remain in $f ($marker)"
            fails=$((fails + 1))
          fi
        fi
      elif [ "$(st_get "profile.$i.action" "")" != "created" ]; then
        bad "startup file is missing after rollback: $f"
        fails=$((fails + 1))
      fi
    fi
    i=$((i + 1))
  done

  if ! st_has pre_login; then
    return "$fails"
  fi

  measure_shells
  if [ "$LOGIN_V" != "$(st_get pre_login "")" ]; then
    bad "fresh login shell reports '${LOGIN_V:-<none>}', expected the original '$(st_get pre_login "")'"
    fails=$((fails + 1))
  else
    ok "fresh login shell matches the original result (${LOGIN_V:-<none>})"
  fi
  if [ "$INTERACTIVE_V" != "$(st_get pre_interactive "")" ]; then
    bad "fresh interactive shell reports '${INTERACTIVE_V:-<none>}', expected the original '$(st_get pre_interactive "")'"
    fails=$((fails + 1))
  else
    ok "fresh interactive shell matches the original result (${INTERACTIVE_V:-<none>})"
  fi
  if [ "$BARE_V" != "$(st_get pre_bare "")" ]; then
    bad "bare bash -c reports '${BARE_V:-<none>}', expected the original '$(st_get pre_bare "")'"
    fails=$((fails + 1))
  fi
  return "$fails"
}

do_rollback() {
  local status prefix nvm
  if ! state_exists; then
    say "No managed state was found at $STATE_DIR; nothing to roll back."
    exit 0
  fi
  if ! st_has status; then
    if st_has node_prefix || st_has baseline_path || st_has profile.0.path; then
      die "State is incomplete and has no status; inspect $STATE_DIR and re-run."
    fi
    say "State directory contains no completed journal; removing the empty state."
    rm -rf -- "$STATE_DIR"
    exit 0
  fi
  status=$(st_get status "")
  case $status in
    rolled-back)
      say "This installation was already rolled back ($(st_get rolled_back_at "unknown time"))."
      exit 0
      ;;
    installed|failed|installing) ;;
    *)
      die "Unrecognized state status '${status:-<empty>}' in $STATE_DIR; refusing to guess."
      ;;
  esac

  acquire_lock
  LOG="$STATE_DIR/log"
  printf '\n=== %s rollback v%s ===\n' "$(now)" "$SCRIPT_VERSION" >>"$LOG"
  INSTALL_ACTIVE=0
  section "Rollback"

  BASE_NODE=$(st_get baseline_path "")
  BASE_VER=$(st_get baseline_version "")
  local nprofiles
  nprofiles=$(st_get profile_count 0)
  is_uint "$nprofiles" || nprofiles=0
  if [ -n "$BASE_NODE" ]; then
    if [ ! -x "$BASE_NODE" ]; then
      bad "the original Node.js recorded in the state is missing: $BASE_NODE"
      bad "refusing to remove Node 26 while no replacement runtime exists; state kept"
      exit 1
    fi
    if ! "$BASE_NODE" --version >/dev/null 2>&1; then
      bad "the original Node.js does not run: $BASE_NODE"
      bad "refusing to remove Node 26 while no replacement runtime exists; state kept"
      exit 1
    fi
  elif [ "$(st_get node_created 0)" = "1" ] || [ "$nprofiles" -gt 0 ]; then
    bad "state has no record of the original Node.js; refusing to remove anything; state kept"
    exit 1
  fi
  if ! verify_baseline_sha; then
    warn "the original Node.js binary changed since installation (probably an unrelated update); the version check is still enforced"
  fi
  HOME_DIR=$(st_get home "$HOME_DIR")
  TEST_PATH=$(st_get test_path "$TEST_PATH")
  BASH_BIN=${BASH_BIN:-$(command -v bash)}
  nvm=$(st_get nvm_dir "$NVM_DIR")
  prefix=$(st_get node_prefix "")

  ensure_block_file
  if [ -n "$prefix" ] && is_safe_path "$prefix/bin"; then
    build_block "$prefix/bin" || true
  fi

  say "Restoring shell startup files ..."
  if ! restore_profiles; then
    bad "shell startup files could not be fully restored; Node 26 was NOT removed and the state was kept"
    exit 1
  fi
  say "Removing pnpm and Node 26 if this script created them ..."
  undo_pnpm || { bad "pnpm removal failed; state kept"; exit 1; }
  undo_node || { bad "Node 26 removal failed; state kept"; exit 1; }
  undo_partial_node || { bad "incomplete Node directory could not be removed; state kept"; exit 1; }

  say "Verifying the original environment ..."
  if ! rollback_verify; then
    bad "rollback verification failed. The recovery state was KEPT at $STATE_DIR."
    bad "Fix the reported item and run 'bash $0 --rollback' again."
    exit 1
  fi

  rm -f -- "$STATE_DIR"/backup.* "$STATE_DIR"/payload.* "$STATE_DIR"/node-run.err
  st_put status rolled-back
  st_put rolled_back_at "$(now)"
  st_put finished_at "$(now)"
  section "Rolled back"
  if [ -n "$BASE_VER" ] && [ "$(st_get node_created 0)" = "1" ]; then
    say "Node.js $BASE_VER is active again; Node 26 and pnpm $PNPM_VERSION were removed"
    say "if this script created them; shell startup files were restored."
  elif [ -n "$BASE_VER" ]; then
    say "pnpm and shell changes were removed; the pre-existing Node.js $BASE_VER was left untouched."
  else
    say "pnpm was removed; the pre-existing Node 26 installation was left untouched."
  fi
  say "Recovery state retained at $STATE_DIR with status 'rolled-back'."
  say "A second --rollback is a no-op."
}

# ---------------------------------------------------------------------------
# print an eval-able activation line
# ---------------------------------------------------------------------------
do_print_env() {
  local prefix
  prefix=$(candidate_prefix 2>/dev/null || true)
  [ -n "$prefix" ] || prefix=$(st_get node_prefix "" 2>/dev/null || true)
  if [ -z "$prefix" ] || [ ! -x "$prefix/bin/node" ]; then
    die "No usable Node 26 installation was found. Run 'bash $0 --install' first."
  fi
  is_safe_path "$prefix/bin" || die "Refusing to print an unsafe path: $prefix/bin"
  printf 'export PATH="%s/bin:$PATH"\n' "$prefix"
}

# ---------------------------------------------------------------------------
# diagnostics (default)
# ---------------------------------------------------------------------------
do_check() {
  local status prefix resolved have v
  section "Luckypick Node.js 26 bootstrap - diagnostics"
  say "script $SCRIPT_VERSION; mode=check-only; no changes will be made"
  BLOCKERS=0
  check_dependencies
  check_home
  check_nvm
  check_shell_support
  check_optional_tools
  check_environment

  if find_baseline; then
    ok "active Node.js: $BASE_VER ($BASE_NODE)"
    ok "PATH used for fresh-shell tests: $TEST_PATH"
  else
    blocker "no usable Node.js was found on PATH or in $NVM_DIR"
  fi
  prepare_block
  check_profiles
  check_disk
  check_legacy_etc

  if libatomic_present; then
    ok "libatomic.so.1 is present"
  else
    blocker "libatomic.so.1 is missing; Node.js 26 requires it and this script does not install system packages (Debian/Ubuntu package: libatomic1)"
  fi

  if state_exists; then
    status=$(st_get status "")
    say "managed state: ${status:-<empty>} ($STATE_DIR)"
    prefix=$(st_get node_prefix "")
    resolved=$(st_get node_resolved "")
    if [ -n "$prefix" ]; then
      say "managed Node: ${resolved:-unknown} ($prefix)"
      if [ -x "$prefix/bin/node" ]; then
        v=$("$prefix/bin/node" --version 2>/dev/null || true)
        say "managed Node runs: ${v:-no}"
      else
        say "managed Node binary: missing"
      fi
      have=$(pnpm_version_at "$prefix")
      say "managed pnpm: ${have:-missing} (expected $PNPM_VERSION)"
    fi
    say "recorded baseline: $(st_get baseline_version "") ($(st_get baseline_path ""))"
  else
    say "managed state: none ($STATE_DIR)"
  fi

  if [ -n "$TEST_PATH" ]; then
    measure_shells
    say "shells today: login='${LOGIN_V:-<none>}' interactive='${INTERACTIVE_V:-<none>}' bare-bash-c='${BARE_V:-<none>}'"
  fi

  say ""
  if [ "$BLOCKERS" -eq 0 ]; then
    say "No blockers found. 'bash $0 --install' can proceed."
    say "No changes were made."
    exit 0
  fi
  bad "$BLOCKERS blocker(s) found. No changes were made."
  exit 2
}

# ---------------------------------------------------------------------------
# entry point
# ---------------------------------------------------------------------------
cleanup() {
  local rc=$?
  if [ -n "$BLOCK_FILE" ] && [ -f "$BLOCK_FILE" ]; then
    rm -f -- "$BLOCK_FILE" 2>/dev/null || true
  fi
  if [ "$INSTALL_ACTIVE" -eq 1 ] && [ "$COMPENSATED" -eq 0 ] && [ "$rc" -ne 0 ]; then
    set +e
    compensate "unexpected exit (status $rc)"
  fi
  release_lock
}

on_signal() {
  local sig=$1
  bad "Interrupted by SIG$sig."
  if [ "$INSTALL_ACTIVE" -eq 1 ] && [ "$COMPENSATED" -eq 0 ]; then
    set +e
    compensate "SIG$sig"
  fi
  exit 130
}

main() {
  local arg
  for arg in "$@"; do
    case $arg in
      --check-only) MODE=check ;;
      --install|--install-node) MODE=install ;;
      --install-pnpm) MODE=pnpm ;;
      --rollback) MODE=rollback ;;
      --print-env) MODE=print-env ;;
      --help|-h) usage; exit 0 ;;
      --version) printf '%s\n' "$SCRIPT_VERSION"; exit 0 ;;
      *) usage >&2; bad "unknown argument: $arg"; exit 2 ;;
    esac
  done

  if [ -z "$HOME_DIR" ]; then
    bad "HOME is not set."
    exit 2
  fi
  BASH_BIN=$(command -v bash 2>/dev/null || true)
  [ -n "$BASH_BIN" ] || { bad "bash is not available"; exit 2; }
  BASH_BIN=$(readlink -f -- "$BASH_BIN" 2>/dev/null || printf '%s' "$BASH_BIN")
  detect_nvm_dir

  ensure_block_file
  trap cleanup EXIT
  trap 'on_signal INT' INT
  trap 'on_signal TERM' TERM
  trap 'on_signal HUP' HUP

  case $MODE in
    check) do_check ;;
    install) do_install ;;
    pnpm) do_install_pnpm ;;
    rollback) do_rollback ;;
    print-env) do_print_env ;;
  esac
}

main "$@"
