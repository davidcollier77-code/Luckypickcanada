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
  mkdir -p "$root/.github/spec-kit/customizations/base" "$root/.github/spec-kit/customizations/overlay" "$root/.freebuff/cmds" "$root/new-upstream"
  for file in "${FILES[@]}"; do
    cat > "$root/.github/spec-kit/customizations/base/$file" <<'EOF'
# Original Spec Kit template
upstream introductory rule: default
stable rule 01
stable rule 02
stable rule 03
stable rule 04
stable rule 05
stable rule 06
stable rule 07
stable rule 08
stable rule 09
stable rule 10
customization point: upstream default
stable trailing rule
EOF
    cat > "$root/.github/spec-kit/customizations/overlay/$file" <<'EOF'
# Original Spec Kit template
upstream introductory rule: default
stable rule 01
stable rule 02
stable rule 03
stable rule 04
stable rule 05
stable rule 06
stable rule 07
stable rule 08
stable rule 09
stable rule 10
customization point: Freebuff-specific behavior
stable trailing rule
EOF
    if [[ "$mode" == "clean" ]]; then
      cat > "$root/new-upstream/$file" <<'EOF'
# Updated Spec Kit template
new upstream capability: keep
upstream introductory rule: default
stable rule 01
stable rule 02
stable rule 03
stable rule 04
stable rule 05
stable rule 06
stable rule 07
stable rule 08
stable rule 09
stable rule 10
customization point: upstream default
stable trailing rule
EOF
    else
      cat > "$root/new-upstream/$file" <<'EOF'
# Updated Spec Kit template
upstream introductory rule: default
stable rule 01
stable rule 02
stable rule 03
stable rule 04
stable rule 05
stable rule 06
stable rule 07
stable rule 08
stable rule 09
stable rule 10
customization point: conflicting upstream behavior
stable trailing rule
EOF
    fi
    cp "$root/.github/spec-kit/customizations/overlay/$file" "$root/.freebuff/cmds/$file"
  done
}

clean_root="$TEST_ROOT/clean"
make_fixture "$clean_root" clean
bash "$HELPER" "$clean_root" "$clean_root/new-upstream"
for file in "${FILES[@]}"; do
  grep -Fq "Updated Spec Kit template" "$clean_root/.freebuff/cmds/$file"
  grep -Fq "new upstream capability: keep" "$clean_root/.freebuff/cmds/$file"
  grep -Fq "Freebuff-specific behavior" "$clean_root/.freebuff/cmds/$file"
  ! grep -Fq "customization point: upstream default" "$clean_root/.freebuff/cmds/$file"
  cmp -s "$clean_root/.freebuff/cmds/$file" "$clean_root/.github/spec-kit/customizations/overlay/$file"
  cmp -s "$clean_root/new-upstream/$file" "$clean_root/.github/spec-kit/customizations/base/$file"
done
echo "PASS: independent upstream additions and Freebuff customizations are both preserved."

conflict_root="$TEST_ROOT/conflict"
make_fixture "$conflict_root" conflict
for file in "${FILES[@]}"; do cp "$conflict_root/.github/spec-kit/customizations/overlay/$file" "$conflict_root/before-$file"; done
if bash "$HELPER" "$conflict_root" "$conflict_root/new-upstream" > "$TEST_ROOT/conflict.log" 2>&1; then
  echo "FAIL: conflicting upstream customization should have been rejected." >&2
  exit 1
fi
for file in "${FILES[@]}"; do
  cmp -s "$conflict_root/before-$file" "$conflict_root/.github/spec-kit/customizations/overlay/$file"
  cmp -s "$conflict_root/before-$file" "$conflict_root/.freebuff/cmds/$file"
  grep -Fq "upstream default" "$conflict_root/.github/spec-kit/customizations/base/$file"
done
echo "PASS: real conflicts fail closed without partially rewriting commands or overlays."
echo "All Spec Kit customization rebase tests passed."
