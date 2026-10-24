#!/usr/bin/env bash
set -euo pipefail

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "Run this command from inside a LuckyPickCanada Git worktree." >&2
  exit 2
fi

INSTRUCTIONS_FILE="$REPO_ROOT/.coderabbit-cli-instructions.md"
if [[ ! -f "$INSTRUCTIONS_FILE" ]]; then
  echo "CodeRabbit CLI instructions are missing: $INSTRUCTIONS_FILE" >&2
  exit 2
fi

if ! command -v cr >/dev/null 2>&1; then
  cat >&2 <<'EOF'
CodeRabbit CLI (cr) is not installed.
Install it using the instructions in docs/coderabbit-cli.md, then run:
  cr auth login
  cr doctor
EOF
  exit 127
fi

exec cr review --config "$INSTRUCTIONS_FILE" "$@"
