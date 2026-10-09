#!/usr/bin/env bash
# Fail-closed guard for Jules task-level Spec Kit execution and artifact freshness.
set -euo pipefail

if [[ $# -gt 1 ]]; then
  echo "Usage: bash scripts/verify-speckit-task.sh [repository-root]" >&2
  exit 2
fi

DEFAULT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_INPUT="${1:-$DEFAULT_ROOT}"
if ! REPO_ROOT="$(cd -- "$ROOT_INPUT" 2>/dev/null && pwd)"; then
  echo "❌ Spec Kit governance check: repository root does not exist: $ROOT_INPUT" >&2
  exit 1
fi

if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Spec Kit governance check: root is not a Git working tree." >&2
  exit 1
fi

FEATURE_STATE="$REPO_ROOT/.specify/feature.json"
if [[ ! -s "$FEATURE_STATE" ]]; then
  echo "❌ Spec Kit governance check: .specify/feature.json is missing or empty." >&2
  echo "Run the specify stage for this Jules task before verification." >&2
  exit 1
fi

if ! FEATURE_DIR="$(node - "$REPO_ROOT" "$FEATURE_STATE" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [root, featureStatePath] = process.argv.slice(2);
try {
  const state = JSON.parse(fs.readFileSync(featureStatePath, "utf8"));
  if (typeof state.feature_directory !== "string" || !state.feature_directory.trim()) {
    throw new Error('feature_directory must be a non-empty string');
  }

  const resolvedRoot = path.resolve(root);
  const resolvedFeature = path.resolve(resolvedRoot, state.feature_directory);
  const relative = path.relative(resolvedRoot, resolvedFeature);

  if (
    relative === "" ||
    relative === "." ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error('feature_directory must resolve to a directory inside the repository root');
  }

  process.stdout.write(resolvedFeature);
} catch (error) {
  console.error(`Invalid .specify/feature.json: ${error.message}`);
  process.exit(1);
}
NODE
)"; then
  echo "❌ Spec Kit governance check: could not resolve a safe active feature directory." >&2
  exit 1
fi

FEATURE_RELATIVE_DIR="${FEATURE_DIR#"$REPO_ROOT"/}"
if [[ -z "$FEATURE_RELATIVE_DIR" || "$FEATURE_RELATIVE_DIR" == "$FEATURE_DIR" ]]; then
  echo "❌ Spec Kit governance check: could not derive a repository-relative feature path." >&2
  exit 1
fi

# Prefer an explicit task/base ref; otherwise use the common remote/local
# default branches. Fail closed if a branch-only artifact change cannot be verified.
BASE_REF="${SPEC_KIT_BASE_REF:-}"
if [[ -z "$BASE_REF" ]]; then
  for candidate in origin/main main origin/master master; do
    if git -C "$REPO_ROOT" rev-parse --verify --quiet "${candidate}^{commit}" >/dev/null; then
      BASE_REF="$candidate"
      break
    fi
  done
fi

for artifact in spec.md plan.md tasks.md; do
  artifact_path="$FEATURE_RELATIVE_DIR/$artifact"
  if [[ ! -s "$FEATURE_DIR/$artifact" ]]; then
    echo "❌ Spec Kit governance check: required task artifact is missing or empty: $FEATURE_DIR/$artifact" >&2
    exit 1
  fi

  # Require proof this task actually created or updated each active artifact.
  # This blocks a stale feature.json pointing at a complete feature from a
  # previous task. It accepts uncommitted/staged new artifacts and committed
  # artifact changes on the current feature branch compared with its base.
  changed=false
  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain --untracked-files=all -- "$artifact_path")" ]]; then
    changed=true
  fi

  if [[ "$changed" != true && -n "$BASE_REF" ]]; then
    if git -C "$REPO_ROOT" diff --name-only "${BASE_REF}...HEAD" -- "$artifact_path" 2>/dev/null | grep -Fqx -- "$artifact_path"; then
      changed=true
    fi
  fi

  if [[ "$changed" != true ]]; then
    echo "❌ Spec Kit governance check: $artifact_path is not changed in the current task worktree/branch. A stale feature pointer does not satisfy Spec Kit execution." >&2
    echo "Set SPEC_KIT_BASE_REF if the task branch uses a nonstandard base ref." >&2
    exit 1
  fi
done

echo "✅ Spec Kit task artifacts verified and current:"
printf ' - %s\n' "$FEATURE_DIR/spec.md" "$FEATURE_DIR/plan.md" "$FEATURE_DIR/tasks.md"
