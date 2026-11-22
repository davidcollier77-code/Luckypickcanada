#!/usr/bin/env node
/**
 * Refresh tests/visual/shard-plan.json from Playwright timing artifacts.
 *
 * Owner-run, never automatic: the resulting weights file is reviewed like
 * code. Reads one or more timings.json files (the artifact written by
 * summarize-playwright-timings.mjs), sums each file's projects into one
 * duration per artifact, and keeps the median across artifacts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function mergeTimings(files) {
  const samples = new Map();
  for (const path of files) {
    if (!existsSync(path)) continue;
    let payload;
    try {
      payload = JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      continue;
    }
    const perFile = new Map();
    for (const row of payload.rows || []) {
      if (!row.file) continue;
      perFile.set(row.file, (perFile.get(row.file) || 0) + (Number(row.duration_ms) || 0));
    }
    for (const [file, duration] of perFile) {
      if (!samples.has(file)) samples.set(file, []);
      samples.get(file).push(duration);
    }
  }
  const weights = {};
  for (const file of [...samples.keys()].sort()) {
    const sorted = samples.get(file).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    weights[file] = Math.max(1, Math.round(median));
  }
  return weights;
}

function main() {
  const args = process.argv.slice(2);
  const files = [];
  let source = '';
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--source') source = args[++index] || '';
    else if (args[index].startsWith('--')) {
      console.error(`unknown argument: ${args[index]}`);
      process.exit(2);
    } else files.push(args[index]);
  }
  if (!files.length) {
    console.error('usage: update-playwright-shard-plan.mjs [--source <label>] <timings.json> [...]');
    process.exit(2);
  }
  const weights = mergeTimings(files);
  if (!Object.keys(weights).length) {
    console.error('no timing rows were found; the plan was not changed');
    process.exit(1);
  }
  const plan = {
    version: 1,
    shards: 2,
    generated_from: source ? [source] : files.map((file) => file.split(/[\\/]/).pop()),
    note: 'Weights are per-spec durations from a Visual QA run, summed across the three projects. Refresh with .github/scripts/update-playwright-shard-plan.mjs from the run timings artifacts.',
    weights_ms: weights,
  };
  writeFileSync('tests/visual/shard-plan.json', JSON.stringify(plan, null, 2) + '\n');
  console.log(`Updated tests/visual/shard-plan.json with ${Object.keys(weights).length} weight(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
