#!/bin/bash
pnpm dev > pnpm_dev.log 2>&1 &
pid=$!
echo "$pid" > pnpm_dev.pid
sleep 2
if ! kill -0 "$pid" 2>/dev/null; then
  cat pnpm_dev.log
  exit 1
fi
