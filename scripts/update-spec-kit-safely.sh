#!/usr/bin/env bash
set -euo pipefail
# Intended for the clean GitHub Actions checkout used by update-spec-kit.yml.
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
FILES=(speckit.implement.md speckit.plan.md)
BASE_DIR="$ROOT_DIR/.github/spec-kit/customizations/base"
OVERLAY_DIR="$ROOT_DIR/.github/spec-kit/customizations/overlay"
TEMP_DIR="$(mktemp -d)"
BACKUP_PATHS=(
  ".freebuff/cmds/speckit.implement.md"
  ".freebuff/cmds/speckit.plan.md"
  ".github/spec-kit/customizations/base/speckit.implement.md"
  ".github/spec-kit/customizations/base/speckit.plan.md"
  ".github/spec-kit/customizations/overlay/speckit.implement.md"
  ".github/spec-kit/customizations/overlay/speckit.plan.md"
)
BACKUPS_READY=false
cleanup() {
  status=$?
  trap - EXIT
  if [[ "$status" -ne 0 && "$BACKUPS_READY" == "true" ]]; then
    echo "Restoring the original Freebuff command and overlay files after updater failure." >&2
    for path in "${BACKUP_PATHS[@]}"; do
      mkdir -p "$ROOT_DIR/$(dirname -- "$path")"
      cp "$TEMP_DIR/original/$path" "$ROOT_DIR/$path" || echo "WARNING: could not restore $path" >&2
    done
  fi
  rm -rf "$TEMP_DIR"
  exit "$status"
}
trap cleanup EXIT

for file in "${FILES[@]}"; do
  current="$ROOT_DIR/.freebuff/cmds/$file"
  base="$BASE_DIR/$file"
  overlay="$OVERLAY_DIR/$file"
  if [[ ! -s "$current" || ! -s "$base" || ! -s "$overlay" ]]; then
    echo "ERROR: required Spec Kit command/base/overlay is missing or empty for $file." >&2
    exit 1
  fi
  if ! cmp -s "$current" "$overlay"; then
    echo "ERROR: $current contains edits not recorded in the approved Freebuff customization overlay." >&2
    echo "The updater stopped before changing anything. Reconcile the new edits before retrying." >&2
    exit 1
  fi
done

mkdir -p "$TEMP_DIR/original" "$TEMP_DIR/new-base"
for path in "${BACKUP_PATHS[@]}"; do
  mkdir -p "$TEMP_DIR/original/$(dirname -- "$path")"
  cp "$ROOT_DIR/$path" "$TEMP_DIR/original/$path"
done
BACKUPS_READY=true
uvx --from specify-cli specify version

# Restore the exact installed upstream copies only while the CLI checks recorded file hashes.
# Freebuff' customized versions remain backed up in the overlay.
for file in "${FILES[@]}"; do cp "$BASE_DIR/$file" "$ROOT_DIR/.freebuff/cmds/$file"; done
uvx --from specify-cli specify integration upgrade generic

# Update installed extensions, then record the resulting upstream templates as the new base.
uvx --from specify-cli specify extension update
for file in "${FILES[@]}"; do cp "$ROOT_DIR/.freebuff/cmds/$file" "$TEMP_DIR/new-base/$file"; done
# new-base now reflects both integration upgrade and extension update; rebase Freebuff overlay onto it.
bash "$ROOT_DIR/scripts/rebase-speckit-customizations.sh" "$ROOT_DIR" "$TEMP_DIR/new-base"

for file in "${FILES[@]}"; do
  cmp -s "$ROOT_DIR/.freebuff/cmds/$file" "$OVERLAY_DIR/$file" || {
    echo "ERROR: rebased command does not match its recorded overlay: $file" >&2
    exit 1
  }
done
echo "SUCCESS: Spec Kit integration/extensions updated; Freebuff instructions were preserved and rebased."
