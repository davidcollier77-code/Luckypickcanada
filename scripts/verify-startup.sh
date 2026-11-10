#!/usr/bin/env bash
# Verify required repository context is available at startup.
# This checks file availability and structure; the agent must still read the content.

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
cd "$REPO_ROOT"

fail() {
  printf '❌ Startup verification failed: %s\n' "$*" >&2
  exit 1
}

required_files=(
  "AGENTS.md"
  "memory-bank/projectBrief.md"
  "memory-bank/activeContext.md"
  "memory-bank/techContext.md"
  "memory-bank/progress.md"
  ".docs/manifest.json"
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || fail "required file is missing: $file"
  [[ -r "$file" ]] || fail "required file is not readable: $file"
  [[ -s "$file" ]] || fail "required file is empty: $file"
done

for file in \
  "memory-bank/projectBrief.md" \
  "memory-bank/activeContext.md" \
  "memory-bank/techContext.md" \
  "memory-bank/progress.md"; do
  grep -Fq "$file" AGENTS.md || fail "AGENTS.md does not reference $file"
done

grep -Fq '.docs/manifest.json' AGENTS.md || fail "AGENTS.md does not reference .docs/manifest.json"
grep -Fq 'Read all four Memory Bank files once' AGENTS.md || fail "AGENTS.md is missing the four-file initialization instruction"

# AGENTS.md is the only file Freebuff injects into the agent context at chat start
# (Freebuff Cloud reads it up to about 64 KiB). If it outgrows that budget the
# initialization instruction can be truncated, which would silently stop the Memory
# Bank from reaching the agent. Fail closed instead of assuming it was loaded.
agents_context_limit=65536
agents_size="$(wc -c < AGENTS.md)"
agents_size="${agents_size//[[:space:]]/}"
if (( agents_size > agents_context_limit )); then
  fail "AGENTS.md is ${agents_size} bytes, over the ~${agents_context_limit}-byte Freebuff context budget; the Memory Bank initialization instruction may be truncated"
fi

command -v node >/dev/null 2>&1 || fail "Node.js is required to validate .docs/manifest.json"

node - "$REPO_ROOT/.docs/manifest.json" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path, "utf8"));
} catch (error) {
  console.error(`❌ Startup verification failed: invalid .docs/manifest.json: ${error.message}`);
  process.exit(1);
}

if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
  console.error("❌ Startup verification failed: .docs/manifest.json must contain a JSON object");
  process.exit(1);
}
if (!manifest.sources || typeof manifest.sources !== "object" || Array.isArray(manifest.sources)) {
  console.error("❌ Startup verification failed: manifest.sources must be an object");
  process.exit(1);
}
if (!Array.isArray(manifest.inventory)) {
  console.error("❌ Startup verification failed: manifest.inventory must be an array");
  process.exit(1);
}
NODE

printf '✅ Startup context check passed.\n'
printf 'Verified: AGENTS.md, all four Memory Bank files, and a valid .docs/manifest.json.\n'
printf 'AGENTS.md is %s bytes, inside the %s-byte Freebuff context budget.\n' "$agents_size" "$agents_context_limit"
printf 'IMPORTANT: This verifies file availability, not model-context loading. Freebuff injects AGENTS.md only;\n'
printf 'follow its initialization step and read all four Memory Bank files, the manifest, and only relevant\n'
printf 'reference documents before task work.\n'
