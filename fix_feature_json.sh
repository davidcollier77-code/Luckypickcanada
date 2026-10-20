#!/usr/bin/env bash
set -euo pipefail

cat <<'MESSAGE'
This helper is retired.
.specify/feature.json is machine-local checkout state and must not be staged,
committed, or included in a PR. The Spec Kit verification gate now discovers
the task from its changed spec.md, plan.md, and tasks.md artifacts.

Run ./jules-verify.sh to validate the task artifacts.
MESSAGE
