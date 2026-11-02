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
#   scripts/setup-chromium-libs.sh           # provision (idempotent)
#   scripts/setup-chromium-libs.sh --check    # verify only, provision nothing
#   eval "$(scripts/setup-chromium-libs.sh --env)"   # print export lines
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
FONTS_CONF="$PREFIX/etc/fonts/lpc-fonts.conf"

print_env() {
  printf 'export LD_LIBRARY_PATH="%s"\n' "$LIB_PATH"
  printf 'export FONTCONFIG_FILE="%s"\n' "$FONTS_CONF"
  printf 'export FONTCONFIG_PATH="%s"\n' "$PREFIX/etc/fonts"
}

# Locate the Playwright Chromium binary this repository pins.
find_chrome() {
  local candidate
  candidate="$(command -v google-chrome chromium chromium-browser 2>/dev/null | head -1 || true)"
  if [[ -n "$candidate" ]]; then
    printf '%s\n' "$candidate"
    return 0
  fi
  find "$HOME/.cache/ms-playwright" -maxdepth 3 -type f -name chrome 2>/dev/null | head -1
}

check() {
  local chrome missing
  chrome="$(find_chrome)"
  if [[ -z "$chrome" ]]; then
    echo "FAIL no Chromium binary found; run: pnpm exec playwright install chromium" >&2
    return 1
  fi
  # shellcheck disable=SC2086
  missing="$(LD_LIBRARY_PATH="$LIB_PATH" ldd "$chrome" 2>/dev/null | grep -c 'not found' || true)"
  if [[ "$missing" -ne 0 ]]; then
    echo "FAIL $chrome still misses $missing shared object(s)" >&2
    LD_LIBRARY_PATH="$LIB_PATH" ldd "$chrome" 2>/dev/null | grep 'not found' >&2 || true
    return 1
  fi
  echo "PASS $chrome links with 0 missing shared objects"
  echo "     prefix: $PREFIX ($(du -sh "$PREFIX" 2>/dev/null | cut -f1))"
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
  "")
    ;;
  *)
    echo "Unknown argument: $1" >&2
    exit 2
    ;;
esac

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
mkdir -p "$PREFIX/etc/fonts"
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
if [[ ! -e "$PREFIX/etc/fonts/conf.d" && -d "$PREFIX/etc/fonts/conf.avail" ]]; then
  ln -s conf.avail "$PREFIX/etc/fonts/conf.d"
fi

check
echo
echo "Environment for this shell:"
print_env
