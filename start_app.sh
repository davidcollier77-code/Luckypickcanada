#!/bin/bash
pnpm dev > pnpm_dev.log 2>&1 &
echo $! > pnpm_dev.pid
