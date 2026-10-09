#!/usr/bin/env bash
# Regression tests for the fail-closed Spec Kit task-artifact verifier.
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
  git -C "$root" init -b main >/dev/null
  git -C "$root" config user.name "Spec Kit Test"
  git -C "$root" config user.email "spec-kit-test@example.invalid"
  git -C "$root" add .specify/.gitignore
  git -C "$root" commit -m "test fixture base" >/dev/null
}

expect_failure() {
  local name="$1"
  local root="$2"
  if bash "$VERIFY_SCRIPT" "$root" >"$TEST_ROOT/output.log" 2>&1; then
    fail "$name should have been rejected"
  fi
  echo "PASS: $name"
}

expect_success() {
  local name="$1"
  local root="$2"
  if ! bash "$VERIFY_SCRIPT" "$root" >"$TEST_ROOT/output.log" 2>&1; then
    cat "$TEST_ROOT/output.log" >&2
    fail "$name should have passed"
  fi
  echo "PASS: $name"
}

# Missing per-checkout state must fail closed.
root="$TEST_ROOT/missing"
setup_repo "$root"
expect_failure "missing feature.json" "$root"

# Empty state files and invalid state JSON must fail closed.
root="$TEST_ROOT/empty-state"
setup_repo "$root"
: > "$root/.specify/feature.json"
expect_failure "empty feature.json" "$root"

root="$TEST_ROOT/malformed"
setup_repo "$root"
printf '{invalid json\n' > "$root/.specify/feature.json"
expect_failure "malformed feature.json" "$root"

# Empty active feature path must fail closed.
root="$TEST_ROOT/empty-pointer"
setup_repo "$root"
printf '{"feature_directory":"  "}\n' > "$root/.specify/feature.json"
expect_failure "empty feature directory pointer" "$root"

# Paths that escape the checkout root must fail closed.
root="$TEST_ROOT/traversal"
setup_repo "$root"
printf '{"feature_directory":"../../outside"}\n' > "$root/.specify/feature.json"
expect_failure "feature directory traversal" "$root"

# Required artifacts must all exist and be non-empty.
root="$TEST_ROOT/incomplete"
setup_repo "$root"
mkdir -p "$root/specs/001-fixture"
printf '{"feature_directory":"specs/001-fixture"}\n' > "$root/.specify/feature.json"
printf '# Fixture spec\n' > "$root/specs/001-fixture/spec.md"
printf '# Fixture plan\n' > "$root/specs/001-fixture/plan.md"
expect_failure "missing tasks.md" "$root"

root="$TEST_ROOT/missing-spec"
setup_repo "$root"
mkdir -p "$root/specs/001-fixture"
printf '{"feature_directory":"specs/001-fixture"}\n' > "$root/.specify/feature.json"
printf '# Fixture plan\n' > "$root/specs/001-fixture/plan.md"
printf '# Fixture tasks\n' > "$root/specs/001-fixture/tasks.md"
expect_failure "missing spec.md" "$root"

root="$TEST_ROOT/missing-plan"
setup_repo "$root"
mkdir -p "$root/specs/001-fixture"
printf '{"feature_directory":"specs/001-fixture"}\n' > "$root/.specify/feature.json"
printf '# Fixture spec\n' > "$root/specs/001-fixture/spec.md"
printf '# Fixture tasks\n' > "$root/specs/001-fixture/tasks.md"
expect_failure "missing plan.md" "$root"

# Existing artifacts from a prior task must not satisfy the gate by themselves.
root="$TEST_ROOT/stale"
setup_repo "$root"
mkdir -p "$root/specs/001-stale"
printf '# Old spec\n' > "$root/specs/001-stale/spec.md"
printf '# Old plan\n' > "$root/specs/001-stale/plan.md"
printf '# Old tasks\n' > "$root/specs/001-stale/tasks.md"
git -C "$root" add specs
git -C "$root" commit -m "previous task artifacts" >/dev/null
printf '{"feature_directory":"specs/001-stale"}\n' > "$root/.specify/feature.json"
expect_failure "stale feature artifacts unchanged for current task" "$root"

# A complete active task with uncommitted artifacts must pass.
root="$TEST_ROOT/valid-worktree"
setup_repo "$root"
mkdir -p "$root/specs/001-fixture"
printf '{"feature_directory":"specs/001-fixture"}\n' > "$root/.specify/feature.json"
printf '# Fixture spec\n' > "$root/specs/001-fixture/spec.md"
printf '# Fixture plan\n' > "$root/specs/001-fixture/plan.md"
printf '# Fixture tasks\n' > "$root/specs/001-fixture/tasks.md"
expect_success "complete current feature artifacts in worktree" "$root"

# A complete active task committed on a feature branch must also pass.
root="$TEST_ROOT/valid-branch"
setup_repo "$root"
git -C "$root" checkout -b task-branch >/dev/null
mkdir -p "$root/specs/001-fixture"
printf '# Fixture spec\n' > "$root/specs/001-fixture/spec.md"
printf '# Fixture plan\n' > "$root/specs/001-fixture/plan.md"
printf '# Fixture tasks\n' > "$root/specs/001-fixture/tasks.md"
git -C "$root" add specs
git -C "$root" commit -m "current task Spec Kit artifacts" >/dev/null
printf '{"feature_directory":"specs/001-fixture"}\n' > "$root/.specify/feature.json"
expect_success "complete current feature artifacts committed on task branch" "$root"

echo "All Spec Kit task-artifact verifier tests passed."
