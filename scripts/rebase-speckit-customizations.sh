#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="${1:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
NEW_BASE_DIR="${2:-}"
if [[ ! -d "$ROOT_DIR" || ! -d "$NEW_BASE_DIR" ]]; then
  echo "Usage: bash scripts/rebase-speckit-customizations.sh REPOSITORY_ROOT NEW_UPSTREAM_TEMPLATE_DIR" >&2
  exit 2
fi
BASE_DIR="$ROOT_DIR/.github/spec-kit/customizations/base"
OVERLAY_DIR="$ROOT_DIR/.github/spec-kit/customizations/overlay"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT
mkdir -p "$TEMP_DIR/merged"
FILES=(speckit.implement.md speckit.plan.md)

# Calculate both merges before writing any file, so conflicts cannot leave a partial rebase.
for file in "${FILES[@]}"; do
  if [[ ! -s "$NEW_BASE_DIR/$file" || ! -s "$BASE_DIR/$file" || ! -s "$OVERLAY_DIR/$file" ]]; then
    echo "ERROR: missing or empty upstream/base/overlay input for $file" >&2
    exit 1
  fi
  if git merge-file -p "$NEW_BASE_DIR/$file" "$BASE_DIR/$file" "$OVERLAY_DIR/$file" > "$TEMP_DIR/merged/$file"; then
    echo "Three-way customization rebase prepared: $file"
  else
    status=$?
    if [[ "$status" -eq 1 ]]; then
      echo "ERROR: upstream Spec Kit changes conflict with Freebuff customizations in $file." >&2
      echo "No command file or stored customization was rewritten; resolve this conflict explicitly." >&2
    else
      echo "ERROR: git merge-file failed for $file with exit code $status." >&2
    fi
    exit 1
  fi
done
for file in "${FILES[@]}"; do
  cp "$NEW_BASE_DIR/$file" "$BASE_DIR/$file"
  cp "$TEMP_DIR/merged/$file" "$OVERLAY_DIR/$file"
  cp "$TEMP_DIR/merged/$file" "$ROOT_DIR/.freebuff/cmds/$file"
done
echo "SUCCESS: upstream Spec Kit updates and Freebuff-specific instructions have both been preserved."
