#!/usr/bin/env bash
# Regression tests for changed-artifact Spec Kit task verification.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_SCRIPT="$SCRIPT_DIR/verify-speckit-task.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}
setup_repo() {
  local root="$1"
  mkdir -p "$root/.specify"
  printf 'feature.json\n' > "$root/.specify/.gitignore"
  git -C "$root" init >/dev/null
  git -C "$root" checkout -b main >/dev/null 2>&1 || git -C "$root" symbolic-ref HEAD refs/heads/main
  git -C "$root" config user.name "Spec Kit Test"
  git -C "$root" config user.email "spec-kit-test@example.invalid"
  printf 'fixture\n' > "$root/README.md"
  git -C "$root" add .specify/.gitignore README.md
  git -C "$root" commit -m "test fixture base" >/dev/null
}
write_artifacts() {
  local root="$1"
  local dir="$2"
  mkdir -p "$root/$dir"
  printf '# Current task spec\n' > "$root/$dir/spec.md"
  printf '# Current task plan\n' > "$root/$dir/plan.md"
  printf '# Current task tasks\n' > "$root/$dir/tasks.md"
}
expect_failure() {
  local name="$1"
  local root="$2"
  if env SPEC_KIT_BASE_REF= GITHUB_BASE_REF= GITHUB_ACTIONS= bash "$VERIFY_SCRIPT" "$root" >"$TEST_ROOT/output.log" 2>&1; then
    fail "$name should have been rejected"
  fi
  echo "PASS: $name"
}
expect_success() {
  local name="$1"
  local root="$2"
  if ! env SPEC_KIT_BASE_REF= GITHUB_BASE_REF= GITHUB_ACTIONS= bash "$VERIFY_SCRIPT" "$root" >"$TEST_ROOT/output.log" 2>&1; then
    cat "$TEST_ROOT/output.log" >&2
    fail "$name should have passed"
  fi
  echo "PASS: $name"
}

# No task artifacts must fail closed.
root="$TEST_ROOT/no-artifacts"
setup_repo "$root"
expect_failure "missing task artifacts" "$root"

# All three changed untracked artifacts pass without a feature.json pointer.
root="$TEST_ROOT/local-worktree"
setup_repo "$root"
write_artifacts "$root" ".specify/features/001-fixture"
expect_success "untracked task artifacts without shared pointer" "$root"

# A stale local feature pointer must not override the current task's artifacts.
root="$TEST_ROOT/stale-pointer"
setup_repo "$root"
printf '{"feature_directory":".specify/features/previous-task"}\n' > "$root/.specify/feature.json"
write_artifacts "$root" ".specify/features/001-current"
expect_success "current artifacts win over a stale ignored pointer" "$root"

# A valid task committed to a branch is discoverable by diff from main.
root="$TEST_ROOT/valid-branch"
setup_repo "$root"
git -C "$root" checkout -b task-branch >/dev/null
write_artifacts "$root" "specs/001-fixture"
git -C "$root" add specs
git -C "$root" commit -m "current task Spec Kit artifacts" >/dev/null
expect_success "committed task artifacts on feature branch" "$root"

# Previously committed artifacts on the base branch are stale and do not pass.
root="$TEST_ROOT/stale-base"
setup_repo "$root"
write_artifacts "$root" "specs/001-stale"
git -C "$root" add specs
git -C "$root" commit -m "previous task artifacts" >/dev/null
expect_failure "unchanged artifacts from prior task" "$root"

# Any missing or empty required artifact fails.
root="$TEST_ROOT/missing-tasks"
setup_repo "$root"
mkdir -p "$root/specs/001-fixture"
printf '# Fixture spec\n' > "$root/specs/001-fixture/spec.md"
printf '# Fixture plan\n' > "$root/specs/001-fixture/plan.md"
expect_failure "missing tasks.md" "$root"

root="$TEST_ROOT/empty-plan"
setup_repo "$root"
mkdir -p "$root/specs/001-fixture"
printf '# Fixture spec\n' > "$root/specs/001-fixture/spec.md"
: > "$root/specs/001-fixture/plan.md"
printf '# Fixture tasks\n' > "$root/specs/001-fixture/tasks.md"
expect_failure "empty required artifact" "$root"

# Without a base ref, committed artifacts cannot be proven current and must fail closed.
root="$TEST_ROOT/no-base-committed"
setup_repo "$root"
git -C "$root" checkout -b task-branch >/dev/null
write_artifacts "$root" "specs/001-committed"
git -C "$root" add specs
git -C "$root" commit -m "committed current task artifacts" >/dev/null
git -C "$root" branch -D main >/dev/null
if env SPEC_KIT_BASE_REF= GITHUB_BASE_REF= GITHUB_ACTIONS= bash "$VERIFY_SCRIPT" "$root" >"$TEST_ROOT/output.log" 2>&1; then
  fail "committed artifacts without a comparison base should not pass"
fi
if ! grep -Fq "No comparison base was found" "$TEST_ROOT/output.log"; then
  cat "$TEST_ROOT/output.log" >&2
  fail "missing-base failure should explain that the comparison base is unavailable"
fi
echo "PASS: committed artifacts without a comparison base fail closed with a clear message"

# More than one complete task feature is ambiguous and must be split.
root="$TEST_ROOT/multiple-features"
setup_repo "$root"
write_artifacts "$root" "specs/001-first"
write_artifacts "$root" ".specify/features/002-second"
expect_failure "multiple active feature directories" "$root"

# A partial artifact set in a second feature is still scope ambiguity.
root="$TEST_ROOT/partial-second-feature"
setup_repo "$root"
write_artifacts "$root" "specs/001-current"
mkdir -p "$root/specs/002-leftover"
printf '# Leftover plan\n' > "$root/specs/002-leftover/plan.md"
expect_failure "partial second feature directory" "$root"

echo "All Spec Kit task-artifact verifier tests passed."
