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
# A commit shaped exactly like the commits Dependabot pushes: authored by the
# Dependabot bot and committed by GitHub web-flow.
dependabot_commit() {
  local root="$1"
  local message="$2"
  git -C "$root" add -A
  GIT_AUTHOR_NAME="dependabot[bot]" \
  GIT_AUTHOR_EMAIL="49699333+dependabot[bot]@users.noreply.github.com" \
  GIT_COMMITTER_NAME="GitHub" \
  GIT_COMMITTER_EMAIL="noreply@github.com" \
  git -C "$root" commit -m "$message" >/dev/null
}
# A commit a human would push, using the fixture identity configured by setup_repo.
human_commit() {
  local root="$1"
  local message="$2"
  git -C "$root" add -A
  git -C "$root" commit -m "$message" >/dev/null
}
expect_failure() {
  local name="$1"
  local root="$2"
  shift 2
  if run_verify "$root" "$@" >"$TEST_ROOT/output.log" 2>&1; then
    cat "$TEST_ROOT/output.log" >&2
    fail "$name should have been rejected"
  fi
  echo "PASS: $name"
}
expect_success() {
  local name="$1"
  local root="$2"
  shift 2
  if ! run_verify "$root" "$@" >"$TEST_ROOT/output.log" 2>&1; then
    cat "$TEST_ROOT/output.log" >&2
    fail "$name should have passed"
  fi
  echo "PASS: $name"
}
# Usage: run_verify ROOT [KEY=VALUE ...]
# Extra arguments must be KEY=VALUE environment assignments; anything else is
# rejected loudly, because `env` would otherwise treat it as the command to run.
run_verify() {
  local root="$1"
  shift
  local arg
  local env_assignment='^[A-Za-z_][A-Za-z0-9_]*='
  for arg in "$@"; do
    if [[ ! "$arg" =~ $env_assignment ]]; then
      echo "run_verify: expected KEY=VALUE environment assignments, got: $arg" >&2
      return 2
    fi
  done
  env SPEC_KIT_BASE_REF= GITHUB_BASE_REF= GITHUB_ACTIONS= "$@" bash "$VERIFY_SCRIPT" "$root"
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

# --- Narrow Dependabot maintenance exemption -------------------------------
DEPENDABOT_AUTHOR="SPEC_KIT_PR_AUTHOR=dependabot[bot]"
HUMAN_AUTHOR="SPEC_KIT_PR_AUTHOR=davidcollier77-code"

# A Dependabot npm/pnpm bump is legitimate maintenance and is exempt.
root="$TEST_ROOT/dependabot-npm-bump"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/opennextjs-cloudflare-1.20.15 >/dev/null
printf '{"devDependencies":{"@opennextjs/cloudflare":"1.20.15"}}\n' > "$root/package.json"
printf 'lockfileVersion: "9.0"\n' > "$root/pnpm-lock.yaml"
dependabot_commit "$root" "chore(deps-dev): bump @opennextjs/cloudflare from 1.20.13 to 1.20.15"
if ! run_verify "$root" "$DEPENDABOT_AUTHOR" >"$TEST_ROOT/output.log" 2>&1; then
  cat "$TEST_ROOT/output.log" >&2
  fail "Dependabot npm maintenance change should have been exempt"
fi
if ! grep -Fq "approved Dependabot maintenance change" "$TEST_ROOT/output.log"; then
  cat "$TEST_ROOT/output.log" >&2
  fail "Dependabot npm exemption should state that it was applied"
fi
echo "PASS: Dependabot npm maintenance change is exempt from task artifacts"

# A Dependabot GitHub Actions version bump is legitimate maintenance and is exempt.
root="$TEST_ROOT/dependabot-actions-bump"
setup_repo "$root"
git -C "$root" checkout -b dependabot/github_actions/astral-sh/setup-uv-10.3.3 >/dev/null
mkdir -p "$root/.github/workflows"
printf 'name: Fixture\n' > "$root/.github/workflows/fixture.yml"
dependabot_commit "$root" "chore(deps): bump astral-sh/setup-uv from 10.3.2 to 10.3.3"
expect_success "Dependabot GitHub Actions maintenance change is exempt from task artifacts" "$root" "$DEPENDABOT_AUTHOR"

# Without the trusted author signal a dependency-only change still needs artifacts.
root="$TEST_ROOT/dependency-only-untrusted-author"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/fixture-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
printf 'lockfileVersion: "9.0"\n' > "$root/pnpm-lock.yaml"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
expect_failure "dependency-only change without the trusted author signal" "$root"
expect_failure "dependency-only change authored by a human pull request" "$root" "$HUMAN_AUTHOR"

# Mixed scope must never qualify, even for a Dependabot author.
root="$TEST_ROOT/dependabot-mixed-app-source"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/mixed-app-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
printf 'lockfileVersion: "9.0"\n' > "$root/pnpm-lock.yaml"
mkdir -p "$root/app/homepage"
printf 'export default function Hero() { return null; }\n' > "$root/app/homepage/Hero.js"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
expect_failure "Dependabot author with an application source change" "$root" "$DEPENDABOT_AUTHOR"

root="$TEST_ROOT/dependabot-mixed-scripts"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/mixed-scripts-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
mkdir -p "$root/scripts"
printf '#!/usr/bin/env bash\necho fixture\n' > "$root/scripts/update-spec-kit-safely.sh"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
expect_failure "Dependabot author with a verification-script change" "$root" "$DEPENDABOT_AUTHOR"

root="$TEST_ROOT/dependabot-mixed-docs"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/mixed-docs-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
printf 'updated fixture documentation\n' >> "$root/README.md"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
expect_failure "Dependabot author with a documentation change" "$root" "$DEPENDABOT_AUTHOR"

root="$TEST_ROOT/dependabot-nested-workflow-path"
setup_repo "$root"
git -C "$root" checkout -b dependabot/github_actions/nested-1.0.1 >/dev/null
mkdir -p "$root/.github/workflows/nested"
printf 'name: Nested fixture\n' > "$root/.github/workflows/nested/fixture.yml"
dependabot_commit "$root" "chore(deps): bump nested action from 1.0.0 to 1.0.1"
expect_failure "Dependabot author with a nested workflow path" "$root" "$DEPENDABOT_AUTHOR"

# A partial artifact set stays an ordinary (failing) task change.
root="$TEST_ROOT/dependabot-partial-artifacts"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/with-artifacts-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
mkdir -p "$root/specs/001-incomplete"
printf '# Incomplete spec\n' > "$root/specs/001-incomplete/spec.md"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
expect_failure "Dependabot author with an incomplete task artifact set" "$root" "$DEPENDABOT_AUTHOR"

# One human commit in the change set disqualifies an otherwise eligible scope.
root="$TEST_ROOT/dependabot-with-human-commit"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/human-followup-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
printf 'lockfileVersion: "9.0"\n' > "$root/pnpm-lock.yaml"
human_commit "$root" "chore: reconcile lockfile by hand"
expect_failure "dependency scope with a hand-authored commit" "$root" "$DEPENDABOT_AUTHOR"

# A commit with no author identity must disqualify the exemption, not be skipped.
root="$TEST_ROOT/dependabot-empty-author-email"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/empty-author-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
printf 'lockfileVersion: "9.0"\n' > "$root/pnpm-lock.yaml"
git -C "$root" add -A
GIT_AUTHOR_NAME="Unknown" \
GIT_AUTHOR_EMAIL="" \
GIT_COMMITTER_NAME="GitHub" \
GIT_COMMITTER_EMAIL="noreply@github.com" \
  git -C "$root" commit -m "chore: synthetic commit without an author email" >/dev/null
expect_failure "dependency scope with a commit that has no author email" "$root" "$DEPENDABOT_AUTHOR"
env SPEC_KIT_BASE_REF="$(git -C "$root" rev-parse HEAD^)" \
  GITHUB_BASE_REF= GITHUB_ACTIONS= "$DEPENDABOT_AUTHOR" \
  bash "$VERIFY_SCRIPT" "$root" >"$TEST_ROOT/empty-author.log" 2>&1 || true
if ! grep -Fq "empty author email" "$TEST_ROOT/empty-author.log"; then
  cat "$TEST_ROOT/empty-author.log" >&2
  fail "an empty author email should be reported as the exemption blocker"
fi
echo "PASS: an empty author email is reported as the exemption blocker"

# Without a comparison base the change set cannot be proven and stays fail-closed.
root="$TEST_ROOT/dependabot-no-base"
setup_repo "$root"
git -C "$root" checkout -b dependabot/npm_and_yarn/no-base-1.0.1 >/dev/null
printf '{"dependencies":{"fixture":"1.0.1"}}\n' > "$root/package.json"
dependabot_commit "$root" "chore(deps): bump fixture from 1.0.0 to 1.0.1"
git -C "$root" branch -D main >/dev/null
expect_failure "Dependabot scope without a comparison base" "$root" "$DEPENDABOT_AUTHOR"

# Both workflows that run the gate must forward the GitHub-reported PR author;
# without that wiring the exemption can never apply in CI.
REPOSITORY_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
for workflow in visual-qa.yml deploy-updater-scheduler.yml; do
  workflow_path="$REPOSITORY_ROOT/.github/workflows/$workflow"
  if [[ ! -f "$workflow_path" ]]; then
    fail "expected governance workflow is missing: $workflow"
  fi
  if ! grep -Fq 'SPEC_KIT_PR_AUTHOR: ${{ github.event.pull_request.user.login }}' "$workflow_path"; then
    fail "$workflow does not forward the pull request author to the governance gate"
  fi
  echo "PASS: $workflow forwards the GitHub-reported pull request author"
done

echo "All Spec Kit task-artifact verifier tests passed."
