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
# Everything it writes lives under $HOME, so a workspace that starts with an
# empty home provisions itself the same way as one that keeps its previous state:
# nothing here depends on a library or browser left behind by an earlier session.
#
# Usage:
#   scripts/setup-chromium-libs.sh                 # provision (idempotent, skips when complete)
#   scripts/setup-chromium-libs.sh --check-libs    # libraries + fonts only, no browser needed
#   scripts/setup-chromium-libs.sh --check         # libraries, fonts and every installed Chromium binary
#   scripts/setup-chromium-libs.sh --persist       # export file, shell profiles and the Playwright CLI config
#   eval "$(scripts/setup-chromium-libs.sh --env)" # apply the environment to this shell
#
# Environment:
#   CHROMIUM_LIBS_PREFIX  library prefix (default ~/.local/chromium-libs)
#   CHROMIUM_APT_STATE    apt state/cache root (default ~/.apt-user)

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

# The unpacked objects `--check-libs` requires. This is deliberately a file list
# rather than an `ldd` run: a workspace can provision its libraries before any
# browser exists, and `ldd` needs the browser to inspect.
REQUIRED_LIBS=(
  libnspr4.so
  libnss3.so
  libasound.so.2
  libatk-1.0.so.0
  libatk-bridge-2.0.so.0
  libcups.so.2
  libxkbcommon.so.0
  libXcomposite.so.1
  libXdamage.so.1
  libXfixes.so.3
  libXrandr.so.2
  libpango-1.0.so.0
  libpangocairo-1.0.so.0
  libcairo.so.2
  libatspi.so.0
)

LIB_DIR="$PREFIX/usr/lib/x86_64-linux-gnu"
LIB_PATH="$PREFIX/usr/lib/x86_64-linux-gnu:$PREFIX/lib/x86_64-linux-gnu:$PREFIX/usr/lib:$PREFIX/lib"
FONTS_DIR="$PREFIX/etc/fonts"
FONTS_CONF="$FONTS_DIR/lpc-fonts.conf"
ENV_FILE="$PREFIX/env.sh"
CLI_CONFIG="$HOME/.playwright/cli.config.json"
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

# Browser-independent readiness: used as the startup gate and by --persist, so a
# workspace with no browser yet still provisions its libraries and continues to
# the browser install step instead of failing the whole startup chain.
check_libs() {
  local library failed=0
  for library in "${REQUIRED_LIBS[@]}"; do
    if [[ ! -e "$LIB_DIR/$library" ]]; then
      echo "FAIL missing $library under $LIB_DIR" >&2
      failed=1
    fi
  done
  if [[ ! -f "$FONTS_CONF" || ! -d "$FONTS_DIR/conf.d" ]]; then
    echo "FAIL fontconfig files are missing under $FONTS_DIR" >&2
    failed=1
  fi
  if [[ ! -d "$PREFIX/usr/share/fonts" ]]; then
    echo "FAIL font families are missing under $PREFIX/usr/share/fonts" >&2
    failed=1
  fi
  (( failed == 0 ))
}

# Full readiness: libraries, fonts and every Chromium binary the workspace has.
check() {
  local binary missing failed=0
  local -a binaries=()
  mapfile -t binaries < <(chromium_binaries)

  check_libs || failed=1

  if (( ${#binaries[@]} == 0 )); then
    echo "FAIL no Playwright Chromium installed yet; run: bash scripts/setup-playwright-agent.sh --install-browser" >&2
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

  (( failed == 0 )) || return 1

  printf 'PASS %d Chromium binaries link with 0 missing shared objects\n' "${#binaries[@]}"
  for binary in "${binaries[@]}"; do
    printf '     %s\n' "$binary"
  done
  printf '     prefix: %s (%s)\n' "$PREFIX" "$(du -sh "$PREFIX" 2>/dev/null | cut -f1)"
}

# Teach the repository's Playwright CLI where the libraries are, so `playwright
# cli` launches the bundled Chromium from any shell - including the
# non-interactive `bash -c` shells that never read a profile, and without the
# `--browser=chromium` flag. The CLI reads ~/.playwright/cli.config.json; values
# already present are preserved, and every path is derived from $HOME so it is
# regenerated per workspace instead of being hardcoded.
write_cli_config() {
  mkdir -p "$(dirname -- "$CLI_CONFIG")"
  if ! command -v node >/dev/null 2>&1; then
    echo "WARN node is unavailable; skipped $CLI_CONFIG" >&2
    return 0
  fi
  node - "$CLI_CONFIG" "$LIB_PATH" "$FONTS_CONF" "$FONTS_DIR" "$HOME" <<'NODE'
const fs = require('node:fs');
const [file, libraryPath, fontConfigFile, fontConfigPath, home] = process.argv.slice(2);

let config = {};
if (fs.existsSync(file)) {
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    config = {};
  }
}

const browser = (config.browser ??= {});
browser.browserName ??= 'chromium';
const launchOptions = (browser.launchOptions ??= {});
launchOptions.channel ??= 'chromium';
const env = (launchOptions.env ??= {});
env.LD_LIBRARY_PATH = libraryPath;
env.FONTCONFIG_FILE = fontConfigFile;
env.FONTCONFIG_PATH = fontConfigPath;
env.HOME = home;
env.PATH ??= '/usr/local/bin:/usr/bin:/bin';

fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
NODE
}

# Make the environment durable for every later login or interactive shell, and
# for the Playwright CLI in every shell, so a launch after startup does not
# depend on the startup command's own process still being alive. Every file is
# under $HOME and survives restarts; each block is rewritten, never duplicated.
persist() {
  local rc
  if ! check_libs >/dev/null 2>&1; then
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

  write_cli_config

  printf 'PASS persisted the Chromium runtime environment\n'
  printf '     env file: %s\n' "$ENV_FILE"
  printf '     shell profiles: %s/.profile, %s/.bashrc\n' "$HOME" "$HOME"
  printf '     Playwright CLI config: %s\n' "$CLI_CONFIG"
}

case "${1:-}" in
  --env)
    print_env
    exit 0
    ;;
  --check-libs)
    check_libs
    exit $?
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
if check_libs >/dev/null 2>&1; then
  echo "==> Chromium runtime libraries are already provisioned; skipping download"
  check_libs
  echo
  echo "Environment for this shell:"
  print_env
  exit 0
fi

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

check_libs
echo "==> Chromium runtime libraries are ready in $PREFIX"
if [[ -n "$(chromium_binaries)" ]]; then
  echo "    The Playwright Chromium browser is present."
else
  echo "    No Playwright browser yet; the startup command installs it next:"
  echo "    bash scripts/setup-playwright-agent.sh --install-browser"
fi
echo
echo "Environment for this shell:"
print_env
