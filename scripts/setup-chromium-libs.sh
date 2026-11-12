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
# It uses what the environment already provides instead of duplicating it. A
# system-wide library set and fontconfig (an image that installs them, or a
# developer machine) mean no download and no exports at all. A prebaked Playwright
# browser root — the documented way to ship browsers outside `$HOME` — is used
# through `PLAYWRIGHT_BROWSERS_PATH`. Today's Cloud image has neither, so the
# private prefix remains the normal path, and both checks cost only `stat` calls.
#
# Everything it writes lives under $HOME, so a workspace that starts with an
# empty home provisions itself the same way as one that keeps its previous state:
# nothing here depends on a library or browser left behind by an earlier session.
#
# Usage:
#   scripts/setup-chromium-libs.sh                 # provision (idempotent, skips when complete)
#   scripts/setup-chromium-libs.sh --check-libs    # runtime libraries only, no browser needed
#   scripts/setup-chromium-libs.sh --check         # libraries, fonts and every installed Chromium binary
#   scripts/setup-chromium-libs.sh --persist       # export file, shell profiles and the Playwright CLI config
#   scripts/setup-chromium-libs.sh --browser-root  # print where Chromium is installed, exit 1 when it is absent
#   eval "$(scripts/setup-chromium-libs.sh --env)" # apply the environment to this shell
#
# Environment:
#   CHROMIUM_LIBS_PREFIX       library prefix (default ~/.local/chromium-libs)
#   CHROMIUM_APT_STATE         apt state/cache root (default ~/.apt-user)
#   CHROMIUM_SYSTEM_LIB_DIRS   system library directories probed for the runtime
#   CHROMIUM_SYSTEM_FONTS      system fontconfig directory (default /etc/fonts)
#   CHROMIUM_SYSTEM_FONT_DIRS  system font directories (default /usr/share/fonts:...)
#   CHROMIUM_BROWSER_DIRS      extra prebaked Playwright browser roots to consider

set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)"

PREFIX="${CHROMIUM_LIBS_PREFIX:-$HOME/.local/chromium-libs}"
APT_ROOT="${CHROMIUM_APT_STATE:-$HOME/.apt-user}"

# Where the image (or an administrator) would put the same runtime system-wide.
SYSTEM_LIB_DIRS="${CHROMIUM_SYSTEM_LIB_DIRS:-/usr/lib/x86_64-linux-gnu:/lib/x86_64-linux-gnu:/usr/lib:/lib}"
SYSTEM_FONTS_DIR="${CHROMIUM_SYSTEM_FONTS:-/etc/fonts}"
SYSTEM_FONT_DIRS="${CHROMIUM_SYSTEM_FONT_DIRS:-/usr/share/fonts:/usr/local/share/fonts}"
# Where the image would put a Playwright browser install. Playwright itself only
# reads a prebaked root from PLAYWRIGHT_BROWSERS_PATH, so this script exports it.
PREBAKED_BROWSER_DIRS="${CHROMIUM_BROWSER_DIRS:-/opt/ms-playwright:/usr/local/share/ms-playwright:/usr/share/ms-playwright:/ms-playwright}"
DEFAULT_BROWSERS_DIR="$HOME/.cache/ms-playwright"

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

IFS=':' read -r -a SYSTEM_LIB_DIR_LIST <<< "$SYSTEM_LIB_DIRS"
IFS=':' read -r -a SYSTEM_FONT_DIR_LIST <<< "$SYSTEM_FONT_DIRS"

SYSTEM_RUNTIME_STATUS=""
BROWSER_ROOT_CACHE=""
LDCONFIG_LIST=""
LDCONFIG_LOADED=0
PINNED_REVISION=""
PINNED_REVISION_LOADED=0

# `ldconfig -p` is the loader's own view, and covers directories that are not in
# the list above. Read once: a missing runtime would otherwise run it per library.
ldconfig_knows() {
  if (( LDCONFIG_LOADED == 0 )); then
    LDCONFIG_LIST="$(ldconfig -p 2>/dev/null || true)"
    LDCONFIG_LOADED=1
  fi
  [[ -n "$LDCONFIG_LIST" ]] && grep -qF -- "$1" <<< "$LDCONFIG_LIST"
}

# The complete system runtime: every library resolvable without LD_LIBRARY_PATH,
# system fontconfig present, and at least one system font directory. Half of it is
# deliberately not accepted, because a private font set would still need the same
# exports as a private library set, and a mixed mode buys nothing but complexity.
has_system_runtime() {
  if [[ -n "$SYSTEM_RUNTIME_STATUS" ]]; then
    [[ "$SYSTEM_RUNTIME_STATUS" == yes ]]
    return
  fi

  SYSTEM_RUNTIME_STATUS=no
  [[ -f "$SYSTEM_FONTS_DIR/fonts.conf" ]] || return 1

  local directory found_font=0
  for directory in "${SYSTEM_FONT_DIR_LIST[@]}"; do
    if [[ -d "$directory" ]]; then
      found_font=1
      break
    fi
  done
  (( found_font == 1 )) || return 1

  local library found
  for library in "${REQUIRED_LIBS[@]}"; do
    found=0
    for directory in "${SYSTEM_LIB_DIR_LIST[@]}"; do
      if [[ -e "$directory/$library" ]]; then
        found=1
        break
      fi
    done
    if (( found == 0 )) && ldconfig_knows "$library"; then
      found=1
    fi
    (( found == 1 )) || return 1
  done

  SYSTEM_RUNTIME_STATUS=yes
}

runtime_mode() {
  if has_system_runtime; then
    printf 'system\n'
  else
    printf 'prefix\n'
  fi
}

# The Chromium revision this repository's Playwright expects. A directory holding a
# different revision is never a launchable install: Playwright fails on the mismatch
# instead of falling back. Read once per process; an unresolvable pin (for example
# before `pnpm install`) is cached as empty so it is not retried per call.
pinned_chromium_revision() {
  if (( PINNED_REVISION_LOADED == 0 )); then
    PINNED_REVISION_LOADED=1
    PINNED_REVISION="$(detect_pinned_chromium_revision || true)"
  fi
  [[ -n "$PINNED_REVISION" ]] || return 1
  printf '%s\n' "$PINNED_REVISION"
}

detect_pinned_chromium_revision() {
  command -v node >/dev/null 2>&1 || return 1
  (
    cd "$REPO_ROOT" 2>/dev/null || exit 1
    node --input-type=commonjs -e '
const fs = require("node:fs");
const path = require("node:path");
const candidates = [];
try {
  candidates.push(require.resolve("playwright-core/browsers.json"));
} catch {}
try {
  const manifest = require.resolve("playwright/package.json");
  candidates.push(path.join(path.dirname(manifest), "..", "playwright-core", "browsers.json"));
} catch {}
for (const file of candidates) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const chromium = (data.browsers ?? []).find((entry) => entry.name === "chromium");
    if (chromium && chromium.revision) {
      process.stdout.write(String(chromium.revision));
      process.exit(0);
    }
  } catch {}
}
process.exit(1);
'
  ) 2>/dev/null
}

# `-L` so an image that mounts its browser install through a symlink is still found;
# the depth limit keeps that traversal bounded.
browser_binaries_in() {
  [[ -d "$1" ]] || return 1
  find -L "$1" -maxdepth 4 -type f \( -name chrome -o -name chrome-headless-shell \) 2>/dev/null \
    | head -1 | grep -q .
}

# A root holds a Chromium this repository can actually launch, which means the pinned
# revision. The same rule applies to the default cache: a cache left behind by a
# different Playwright version must not count as installed, or the install that would
# repair it is skipped and the launch fails with "executable doesn't exist". When the
# pin cannot be resolved yet, any Chromium is accepted because nothing can be verified.
root_has_pinned_browser() {
  local directory="$1" revision
  revision="$(pinned_chromium_revision || true)"
  if [[ -z "$revision" ]]; then
    browser_binaries_in "$directory"
    return
  fi
  [[ -d "$directory/chromium-$revision" ]] && browser_binaries_in "$directory/chromium-$revision"
}

# The pinned binaries under one root. A headless launch runs `chrome-headless-shell`,
# so the headless shell directory counts too, but a root with only the headless shell is
# not reported as the full browser by root_has_pinned_browser.
pinned_binaries_in() {
  local directory="$1" revision subdirectory
  revision="$(pinned_chromium_revision || true)"
  if [[ -z "$revision" ]]; then
    find -L "$directory" -maxdepth 4 -type f \
      \( -name chrome -o -name chrome-headless-shell \) 2>/dev/null
    return
  fi
  for subdirectory in "chromium-$revision" "chromium_headless_shell-$revision"; do
    [[ -d "$directory/$subdirectory" ]] || continue
    find -L "$directory/$subdirectory" -maxdepth 4 -type f \
      \( -name chrome -o -name chrome-headless-shell \) 2>/dev/null
  done
}

# A root is used when it already holds a Playwright Chromium. Directories that are
# not writable must match the pinned revision exactly; a writable one can be
# repaired in place by `playwright install`, so it is accepted as it is.
prebaked_browser_root() {
  local -a candidates=()
  if [[ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]]; then
    candidates+=("$PLAYWRIGHT_BROWSERS_PATH")
  fi
  local directory
  local -a listed=()
  IFS=':' read -r -a listed <<< "$PREBAKED_BROWSER_DIRS"
  candidates+=("${listed[@]}")

  for directory in "${candidates[@]}"; do
    [[ -n "$directory" && -d "$directory" ]] || continue
    if root_has_pinned_browser "$directory"; then
      printf '%s\n' "$directory"
      return 0
    fi
    # A writable root may hold another revision: `playwright install` repairs it in
    # place because --browser-root still reports failure until the pin is there.
    [[ -w "$directory" ]] || continue
    browser_binaries_in "$directory" || continue
    printf '%s\n' "$directory"
    return 0
  done

  return 1
}

# Where this workspace's Chromium actually lives: a prebaked root when one is
# usable, otherwise Playwright's own per-user cache.
browser_root() {
  if [[ -z "$BROWSER_ROOT_CACHE" ]]; then
    BROWSER_ROOT_CACHE="$(prebaked_browser_root || printf '%s\n' "$DEFAULT_BROWSERS_DIR")"
  fi
  printf '%s\n' "$BROWSER_ROOT_CACHE"
}

uses_prebaked_browser() {
  [[ "$(browser_root)" != "$DEFAULT_BROWSERS_DIR" ]]
}

# Idempotent, POSIX-compatible exports. Prepending would clobber a caller's
# LD_LIBRARY_PATH every time this is sourced from a shell profile, so the prefix
# is only appended once and existing precedence is kept. A system runtime and the
# default browser cache need no variables at all, so in that case this prints
# nothing and `eval` of the empty string is a no-op.
print_env() {
  if [[ "$(runtime_mode)" == prefix ]]; then
    cat <<EOF
case ":\${LD_LIBRARY_PATH:-}:" in
  *":$LIB_PATH:"*) ;;
  *) LD_LIBRARY_PATH="$LIB_PATH\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}" ;;
esac
export LD_LIBRARY_PATH
export FONTCONFIG_FILE="$FONTS_CONF"
export FONTCONFIG_PATH="$FONTS_DIR"
EOF
  fi
  if uses_prebaked_browser; then
    printf 'export PLAYWRIGHT_BROWSERS_PATH="%s"\n' "$(browser_root)"
  fi
}

# Every Playwright Chromium binary this workspace can launch. A headless
# `chromium.launch()` runs `chrome-headless-shell`, not `chrome`, so checking only
# `chrome` reports PASS while the headless path still dies on libnspr4.so.
chromium_binaries() {
  local candidate root
  local -a roots=()

  candidate="$(command -v google-chrome chromium chromium-browser 2>/dev/null | head -1 || true)"
  if [[ -n "$candidate" ]]; then
    printf '%s\n' "$candidate"
  fi

  roots+=("$(browser_root)")
  roots+=("$DEFAULT_BROWSERS_DIR")
  for root in "${roots[@]}"; do
    [[ -d "$root" ]] || continue
    pinned_binaries_in "$root"
  done | sort -u
}

# Browser-independent readiness: used as the startup gate and by --persist, so a
# workspace with no browser yet still provisions its libraries and continues to
# the browser install step instead of failing the whole startup chain.
check_libs() {
  local library failed=0

  if has_system_runtime; then
    printf 'PASS Chromium runtime libraries present: system-wide (%s)\n' "$SYSTEM_LIB_DIRS"
    return 0
  fi

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
  (( failed == 0 )) || return 1
  printf 'PASS Chromium runtime libraries present: %d objects and fonts in %s\n' \
    "${#REQUIRED_LIBS[@]}" "$PREFIX"
}

# Full readiness: libraries, fonts and every Chromium binary the workspace has.
check() {
  local binary missing failed=0 search_path=""
  local -a binaries=()
  mapfile -t binaries < <(chromium_binaries)

  check_libs || failed=1

  if (( ${#binaries[@]} == 0 )); then
    local revision
    revision="$(pinned_chromium_revision || true)"
    if [[ -n "$revision" ]]; then
      echo "FAIL no Playwright Chromium at the pinned revision (chromium-$revision); run: bash scripts/setup-playwright-agent.sh --install-browser" >&2
    else
      echo "FAIL no Playwright Chromium installed yet; run: bash scripts/setup-playwright-agent.sh --install-browser" >&2
    fi
    return 1
  fi

  # An empty search path is the point in system mode: `ldd` then proves the loader
  # resolves every object without this repository's help.
  if [[ "$(runtime_mode)" == prefix ]]; then
    search_path="$LIB_PATH"
  fi

  for binary in "${binaries[@]}"; do
    missing="$(LD_LIBRARY_PATH="$search_path" ldd "$binary" 2>/dev/null | grep -c 'not found' || true)"
    if [[ "$missing" -ne 0 ]]; then
      echo "FAIL $binary still misses $missing shared object(s)" >&2
      LD_LIBRARY_PATH="$search_path" ldd "$binary" 2>/dev/null | grep 'not found' >&2 || true
      failed=1
    fi
  done

  (( failed == 0 )) || return 1

  printf 'PASS %d Chromium binaries link with 0 missing shared objects\n' "${#binaries[@]}"
  for binary in "${binaries[@]}"; do
    printf '     %s\n' "$binary"
  done
  if has_system_runtime; then
    printf '     libraries: system-wide (%s)\n' "$SYSTEM_LIB_DIRS"
  else
    printf '     prefix: %s (%s)\n' "$PREFIX" "$(du -sh "$PREFIX" 2>/dev/null | cut -f1)"
  fi
  printf '     browser root: %s\n' "$(browser_root)"
}

# Teach the repository's Playwright CLI where the libraries and the browser are,
# so `playwright cli` launches the bundled Chromium from any shell - including the
# non-interactive `bash -c` shells that never read a profile, and without the
# `--browser=chromium` flag. The CLI reads ~/.playwright/cli.config.json; values
# already present are preserved, a key this script no longer needs is removed so
# a workspace that moved to a system runtime cannot keep a stale path, and every
# path is derived from the environment so it is regenerated per workspace.
write_cli_config() {
  local library_path="" font_config_file="" font_config_path="" browsers_path=""

  mkdir -p "$(dirname -- "$CLI_CONFIG")"
  if ! command -v node >/dev/null 2>&1; then
    echo "WARN node is unavailable; skipped $CLI_CONFIG" >&2
    return 0
  fi
  if [[ "$(runtime_mode)" == prefix ]]; then
    library_path="$LIB_PATH"
    font_config_file="$FONTS_CONF"
    font_config_path="$FONTS_DIR"
  fi
  if uses_prebaked_browser; then
    browsers_path="$(browser_root)"
  fi

  node - "$CLI_CONFIG" "$library_path" "$font_config_file" "$font_config_path" "$HOME" "$browsers_path" <<'NODE'
const fs = require('node:fs');
const [file, libraryPath, fontConfigFile, fontConfigPath, home, browsersPath] = process.argv.slice(2);

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

// Own only the keys this workspace's runtime needs; leave any other key intact.
if (libraryPath) {
  env.LD_LIBRARY_PATH = libraryPath;
  env.FONTCONFIG_FILE = fontConfigFile;
  env.FONTCONFIG_PATH = fontConfigPath;
} else {
  delete env.LD_LIBRARY_PATH;
  delete env.FONTCONFIG_FILE;
  delete env.FONTCONFIG_PATH;
}
if (browsersPath) {
  env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;
} else {
  delete env.PLAYWRIGHT_BROWSERS_PATH;
}

env.HOME ??= home;
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
  printf '     runtime: %s\n' "$(runtime_mode)"
  printf '     browser root: %s\n' "$(browser_root)"
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
  --browser-root)
    # Success means a launchable browser is already there, which is the only safe
    # reason to skip the install. A root holding another revision returns 1 so the
    # install runs and repairs it.
    root="$(browser_root)"
    if root_has_pinned_browser "$root"; then
      printf '%s\n' "$root"
      exit 0
    fi
    revision="$(pinned_chromium_revision || true)"
    printf 'FAIL no Chromium%s installed under %s\n' \
      "${revision:+ at the pinned revision chromium-$revision}" "$root" >&2
    exit 1
    ;;
  "")
    ;;
  *)
    echo "Unknown argument: $1" >&2
    exit 2
    ;;
esac

# A system-wide runtime is used as-is: no apt, no prefix, no exports.
if has_system_runtime; then
  echo "==> Chromium runtime libraries are provided system-wide; skipping download"
  check_libs
  printf '     browser root: %s\n' "$(browser_root)"
  echo
  echo "Environment for this shell:"
  print_env
  exit 0
fi

# Reuse an existing prefix instead of downloading and unpacking the same packages
# again; a restored workspace usually still has it under $HOME.
if check_libs >/dev/null 2>&1; then
  echo "==> Chromium runtime libraries are already provisioned; skipping download"
  check_libs
  printf '     browser root: %s\n' "$(browser_root)"
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

check
echo
echo "Environment for this shell:"
print_env
