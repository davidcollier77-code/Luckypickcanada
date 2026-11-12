#!/usr/bin/env bash
# setup-chromium-libs.sh — provision Chromium's Linux runtime libraries for the
# Freebuff workspace WITHOUT root and WITHOUT changing sandbox security settings.
#
# Why this exists: the workspace image does not ship the shared libraries the
# Playwright Chromium build links against, so every launch dies before it paints
# (`libnspr4.so: cannot open shared object file`). `sudo` is refused by the
# `no new privileges` flag and `apt-get install` needs root, so this script uses
# apt only as a downloader: a user-owned state directory feeds `apt-get`,
# `dpkg-deb -x` unpacks the official Ubuntu packages into a private prefix, and
# `LD_LIBRARY_PATH` makes the browser find them. Nothing is written system-wide.
#
# Usage:
#   scripts/setup-chromium-libs.sh             # provision (idempotent, skips when complete)
#   scripts/setup-chromium-libs.sh --check     # verify only, provision nothing
#   scripts/setup-chromium-libs.sh --persist   # write $PREFIX/env.sh and hook ~/.profile + ~/.bashrc
#   eval "$(scripts/setup-chromium-libs.sh --env)"   # apply the environment to this shell
#
# Environment:
#   CHROMIUM_LIBS_PREFIX  library prefix (default ~/.local/chromium-libs)
#   CHROMIUM_APT_STATE    apt state/cache root (default ~/.apt-user)
#
# The prefix lives under $HOME, which is durable in this workspace, so a
# provisioned browser survives archive/restore. It is not part of the repository
# image; see the PR for the image-level request that would remove this step.

set -euo pipefail

PREFIX="${CHROMIUM_LIBS_PREFIX:-$HOME/.local/chromium-libs}"
APT_ROOT="${CHROMIUM_APT_STATE:-$HOME/.apt-user}"

# Chromium's documented Linux dependencies, limited to what this image lacks.
# fontconfig-config and the font packages make text render instead of blanking.
PACKAGES=(
  libnspr4
  libnss3
  libatk1.0-0t64
  libatk-bridge2.0-0t64
  libcups2t64
  libxkbcommon0
  libxcomposite1
  libxdamage1
  libxfixes3
  libxrandr2
  libpango-1.0-0
  libpangocairo-1.0-0
  libcairo2
  libasound2t64
  libatspi2.0-0t64
  fontconfig-config
  fonts-dejavu-core
  fonts-liberation
)

LIB_PATH="$PREFIX/usr/lib/x86_64-linux-gnu:$PREFIX/lib/x86_64-linux-gnu:$PREFIX/usr/lib:$PREFIX/lib"
FONTS_DIR="$PREFIX/etc/fonts"
FONTS_CONF="$FONTS_DIR/lpc-fonts.conf"
ENV_FILE="$PREFIX/env.sh"
RC_MARKER_BEGIN='# >>> luckypick chromium runtime >>>'
RC_MARKER_END='# <<< luckypick chromium runtime <<<'

# Idempotent, POSIX-compatible exports. Prepending would clobber a caller's
# LD_LIBRARY_PATH every time this is sourced from a shell profile, so the prefix
# is only appended once and existing precedence is kept.
print_env() {
  cat <<EOF
case ":\${LD_LIBRARY_PATH:-}:" in
  *":$LIB_PATH:"*) ;;
  *) LD_LIBRARY_PATH="$LIB_PATH\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}" ;;
esac
export LD_LIBRARY_PATH
export FONTCONFIG_FILE="$FONTS_CONF"
export FONTCONFIG_PATH="$FONTS_DIR"
EOF
}

# Every Playwright Chromium binary this workspace can launch. A headless
# `chromium.launch()` runs `chrome-headless-shell`, not `chrome`, so checking only
# `chrome` reports PASS while the headless path still dies on libnspr4.so.
chromium_binaries() {
  local candidate
  candidate="$(command -v google-chrome chromium chromium-browser 2>/dev/null | head -1 || true)"
  if [[ -n "$candidate" ]]; then
    printf '%s\n' "$candidate"
  fi
  find "$HOME/.cache/ms-playwright" -maxdepth 4 -type f \
    \( -name chrome -o -name chrome-headless-shell \) 2>/dev/null
}

check() {
  local binary missing failed=0
  local -a binaries=()
  mapfile -t binaries < <(chromium_binaries)

  if (( ${#binaries[@]} == 0 )); then
    echo "FAIL no Chromium binary found; run: pnpm install --frozen-lockfile" >&2
    return 1
  fi

  for binary in "${binaries[@]}"; do
    # shellcheck disable=SC2086
    missing="$(LD_LIBRARY_PATH="$LIB_PATH" ldd "$binary" 2>/dev/null | grep -c 'not found' || true)"
    if [[ "$missing" -ne 0 ]]; then
      echo "FAIL $binary still misses $missing shared object(s)" >&2
      LD_LIBRARY_PATH="$LIB_PATH" ldd "$binary" 2>/dev/null | grep 'not found' >&2 || true
      failed=1
    fi
  done

  if [[ ! -f "$FONTS_CONF" || ! -d "$FONTS_DIR/conf.d" ]]; then
    echo "FAIL fontconfig files are missing under $FONTS_DIR" >&2
    failed=1
  fi

  (( failed == 0 )) || return 1

  printf 'PASS %d Chromium binaries link with 0 missing shared objects\n' "${#binaries[@]}"
  for binary in "${binaries[@]}"; do
    printf '     %s\n' "$binary"
  done
  printf '     prefix: %s (%s)\n' "$PREFIX" "$(du -sh "$PREFIX" 2>/dev/null | cut -f1)"
}

# Make the environment durable for every later login or interactive shell, so a
# Playwright launch after startup does not depend on the startup command's own
# process still being alive. Both files live under $HOME and survive restarts.
persist() {
  local rc
  if ! check >/dev/null 2>&1; then
    echo "FAIL refusing to persist an incomplete runtime; run: bash scripts/setup-chromium-libs.sh" >&2
    return 1
  fi

  mkdir -p "$PREFIX"
  print_env > "$ENV_FILE"
  chmod 0644 "$ENV_FILE"

  for rc in "$HOME/.profile" "$HOME/.bashrc"; do
    touch "$rc"
    if grep -qF "$RC_MARKER_BEGIN" "$rc"; then
      # Drop the previous block so a changed prefix or format cannot leave a stale
      # LD_LIBRARY_PATH behind; the block is appended again below.
      awk -v begin="$RC_MARKER_BEGIN" -v end="$RC_MARKER_END" '
        $0 == begin { skip = 1; next }
        $0 == end { skip = 0; next }
        skip != 1 { print }
      ' "$rc" > "$rc.tmp" && mv "$rc.tmp" "$rc"
    fi
    {
      printf '\n%s\n' "$RC_MARKER_BEGIN"
      printf 'if [ -f "%s" ]; then . "%s"; fi\n' "$ENV_FILE" "$ENV_FILE"
      printf '%s\n' "$RC_MARKER_END"
    } >> "$rc"
  done

  printf 'PASS persisted the Chromium runtime environment\n'
  printf '     env file: %s\n' "$ENV_FILE"
  printf '     shell profiles: %s/.profile, %s/.bashrc\n' "$HOME" "$HOME"
}

case "${1:-}" in
  --env)
    print_env
    exit 0
    ;;
  --check)
    check
    exit $?
    ;;
  --persist)
    persist
    exit $?
    ;;
  "")
    ;;
  *)
    echo "Unknown argument: $1" >&2
    exit 2
    ;;
esac

# Reuse an existing prefix instead of downloading and unpacking the same packages
# again; a restored workspace usually still has it under $HOME.
check_output="$(check 2>&1)" && {
  echo "==> Chromium runtime libraries are already provisioned; skipping download"
  printf '%s\n' "$check_output"
  echo
  echo "Environment for this shell:"
  print_env
  exit 0
}

command -v apt-get >/dev/null || { echo "apt-get is required" >&2; exit 1; }
command -v dpkg-deb >/dev/null || { echo "dpkg-deb is required" >&2; exit 1; }

SOURCES=/etc/apt/sources.list.d/ubuntu.sources
[[ -f "$SOURCES" ]] || SOURCES=/etc/apt/sources.list

mkdir -p "$APT_ROOT/lists/partial" "$APT_ROOT/cache/archives/partial" "$PREFIX"

APT_OPTS=(
  -o "Dir::State::lists=$APT_ROOT/lists"
  -o "Dir::Cache=$APT_ROOT/cache"
  -o "Dir::Etc::sourcelist=$SOURCES"
  -o "Dir::Etc::sourceparts=-"
  -o "APT::Get::List-Cleanup=0"
  -o "Acquire::Languages=none"
  -o "Debug::NoLocking=1"
)

echo "==> Refreshing package lists into $APT_ROOT (no root required)"
apt-get "${APT_OPTS[@]}" update -qq

echo "==> Downloading ${#PACKAGES[@]} packages and their dependencies"
(cd "$APT_ROOT/cache/archives" && apt-get "${APT_OPTS[@]}" -y -qq --download-only --reinstall install "${PACKAGES[@]}")

echo "==> Unpacking into $PREFIX"
for deb in "$APT_ROOT"/cache/archives/*.deb; do
  dpkg-deb -x "$deb" "$PREFIX"
done

echo "==> Writing a private fontconfig file (the image has no /etc/fonts)"
mkdir -p "$FONTS_DIR"
cat > "$FONTS_CONF" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>$PREFIX/usr/share/fonts</dir>
  <cachedir>$PREFIX/font-cache</cachedir>
  <include ignore_missing="yes">$PREFIX/etc/fonts/conf.d</include>
  <config></config>
</fontconfig>
EOF

# fontconfig-config ships conf.d plus a fonts.conf that points at absolute system
# paths; keep the conf.d includes usable from the prefix.
if [[ ! -e "$FONTS_DIR/conf.d" && -d "$FONTS_DIR/conf.avail" ]]; then
  ln -s conf.avail "$FONTS_DIR/conf.d"
fi

check
echo
echo "Environment for this shell:"
print_env
