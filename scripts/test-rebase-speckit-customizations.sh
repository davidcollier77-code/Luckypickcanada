#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT
HELPER="$ROOT_DIR/scripts/rebase-speckit-customizations.sh"
FILES=(speckit.implement.md speckit.plan.md)
make_fixture() {
  local root="$1" mode="$2"
  mkdir -p "$root/.github/spec-kit/customizations/base" "$root/.github/spec-kit/customizations/overlay" "$root/.jules/cmds" "$root/new-upstream"
  for file in "${FILES[@]}"; do
    cat > "$root/.github/spec-kit/customizations/base/$file" <<'EOF'
# Original Spec Kit template
shared rule: preserve
customization point: upstream default
EOF
    cat > "$root/.github/spec-kit/customizations/overlay/$file" <<'EOF'
# Original Spec Kit template
shared rule: preserve
customization point: Jules-specific behavior
EOF
    if [[ "$mode" == "clean" ]]; then
      cat > "$root/new-upstream/$file" <<'EOF'
# Updated Spec Kit template
shared rule: preserve
new upstream capability: keep
customization point: upstream default
EOF
    else
      cat > "$root/new-upstream/$file" <<'EOF'
# Updated Spec Kit template
shared rule: preserve
customization point: conflicting upstream behavior
EOF
    fi
    cp "$root/.github/spec-kit/customizations/overlay/$file" "$root/.jules/cmds/$file"
  done
}
clean_root="$TEST_ROOT/clean"
make_fixture "$clean_root" clean
bash "$HELPER" "$clean_root" "$clean_root/new-upstream"
for file in "${FILES[@]}"; do
  grep -Fq "Updated Spec Kit template" "$clean_root/.jules/cmds/$file"
  grep -Fq "new upstream capability: keep" "$clean_root/.jules/cmds/$file"
  grep -Fq "Jules-specific behavior" "$clean_root/.jules/cmds/$file"
  ! grep -Fq "customization point: upstream default" "$clean_root/.jules/cmds/$file"
  cmp -s "$clean_root/.jules/cmds/$file" "$clean_root/.github/spec-kit/customizations/overlay/$file"
  cmp -s "$clean_root/new-upstream/$file" "$clean_root/.github/spec-kit/customizations/base/$file"
done
echo "PASS: upstream additions and Jules customizations are both preserved."

conflict_root="$TEST_ROOT/conflict"
make_fixture "$conflict_root" conflict
for file in "${FILES[@]}"; do cp "$conflict_root/.github/spec-kit/customizations/overlay/$file" "$conflict_root/before-$file"; done
if bash "$HELPER" "$conflict_root" "$conflict_root/new-upstream" > "$TEST_ROOT/conflict.log" 2>&1; then
  echo "FAIL: conflicting upstream customization should have been rejected." >&2
  exit 1
fi
for file in "${FILES[@]}"; do
  cmp -s "$conflict_root/before-$file" "$conflict_root/.github/spec-kit/customizations/overlay/$file"
  cmp -s "$conflict_root/before-$file" "$conflict_root/.jules/cmds/$file"
  grep -Fq "upstream default" "$conflict_root/.github/spec-kit/customizations/base/$file"
done
echo "PASS: conflicts fail closed without partially rewriting commands or overlays."
echo "All Spec Kit customization rebase tests passed."
