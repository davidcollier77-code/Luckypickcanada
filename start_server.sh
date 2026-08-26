#!/bin/bash
PORT=3001 node .next/standalone/server.js > server.log 2>&1 &
echo $! > server.pid
