#!/usr/bin/env bash
# Compute build and visual applicability from a fetched pull request.
#
# Usage: compute-applicability.sh <pr.json> <files.json>
#
# Prints GitHub-output key=value lines. Every failure path prints
# build_required=true and visual_required=true: the trusted audit must never
# relax a gate because a file list, a manifest comparison or the declared QA
# scope could not be read.
set -euo pipefail

PR_JSON="${1:?pull request JSON is required}"
FILES_JSON="${2:?changed-file JSON is required}"
REPOSITORY="${REPOSITORY:?REPOSITORY is required}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

fail_closed() {
  echo "::warning::$1 Requiring the build and visual QA (fail-closed)."
  printf 'build_required=true\nbuild_reason=%s\nvisual_required=true\nvisual_reason=%s\n' "$1" "$1"
  exit 0
}

[[ -s "$PR_JSON" && -s "$FILES_JSON" ]] || fail_closed "The pull request evidence is missing"

base_sha="$(jq -r '.base.sha // empty' "$PR_JSON" 2>/dev/null || true)"
head_sha="$(jq -r '.head.sha // empty' "$PR_JSON" 2>/dev/null || true)"
[[ -n "$base_sha" && -n "$head_sha" ]] || fail_closed "The pull request has no base or head SHA"

scripts_only=false
if jq -e 'any(.[]; .filename == "package.json")' "$FILES_JSON" >/dev/null 2>&1; then
  scratch="$(mktemp -d)"
  trap 'rm -rf "$scratch"' EXIT
  if gh api -H 'Accept: application/vnd.github.raw' \
       "repos/${REPOSITORY}/contents/package.json?ref=${base_sha}" >"$scratch/base.json" 2>/dev/null \
     && gh api -H 'Accept: application/vnd.github.raw' \
       "repos/${REPOSITORY}/contents/package.json?ref=${head_sha}" >"$scratch/head.json" 2>/dev/null \
     && [[ "$(cd "$ROOT" && node .github/scripts/package-json-scripts-only.mjs "$scratch/base.json" "$scratch/head.json" 2>/dev/null || true)" == "scripts_only=true" ]]; then
    scripts_only=true
  fi
fi

declared="false"
body_file="$(mktemp)"
jq -r '.body // ""' "$PR_JSON" >"$body_file" 2>/dev/null || true
if python3 - "$body_file" <<'PYEOF'
import json
import re
import sys

try:
    with open(sys.argv[1], encoding="utf-8") as handle:
        body = handle.read()
except OSError:
    print("false")
    raise SystemExit(0)
match = re.search(r"<!-- qa-scope:start -->(.*?)<!-- qa-scope:end -->", body, re.S)
if not match:
    print("false")
    raise SystemExit(0)
try:
    payload = json.loads(match.group(1))
except json.JSONDecodeError:
    print("true")
    raise SystemExit(0)
impact = payload.get("visual_impact") if isinstance(payload, dict) else None
print("true" if isinstance(impact, dict) and impact.get("required") is True else "false")
PYEOF
then
  declared="true"
fi
rm -f "$body_file"

arguments=(
  --files "$FILES_JSON"
  --classify-visual
  --package-json-scripts-only "$scripts_only"
  --format github
)
if [[ "$declared" == "true" ]]; then
  arguments+=(--declared-visual-required)
fi

cd "$ROOT"
if ! decision="$(python3 .github/scripts/pr_applicability.py "${arguments[@]}" 2>&1)"; then
  fail_closed "The applicability classifier failed"
fi
if ! grep -q '^build_required=' <<<"$decision" || ! grep -q '^visual_required=' <<<"$decision"; then
  fail_closed "The applicability classifier returned no decision"
fi
printf '%s\n' "$decision"
