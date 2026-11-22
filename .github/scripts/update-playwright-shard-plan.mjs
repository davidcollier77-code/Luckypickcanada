#!/usr/bin/env node
/**
 * Refresh tests/visual/shard-plan.json from Playwright timing artifacts.
 *
 * Owner-run, never automatic: the resulting weights file is reviewed like
 * code. Reads one or more timings.json files (the artifact written by
 * summarize-playwright-timings.mjs) and keeps the median per spec file.
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
    for (const row of payload.rows || []) {
      if (!row.file) continue;
      if (!samples.has(row.file)) samples.set(row.file, []);
      samples.get(row.file).push(Number(row.duration_ms) || 0);
    }
  }
  const weights = {};
  for (const [file, values] of samples) {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    weights[file] = Math.max(1, Math.round(median));
  }
  return weights;
}

function main() {
  const files = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));
  if (!files.length) {
    console.error('usage: update-playwright-shard-plan.mjs <timings.json> [...]');
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
    generated_from: files,
    weights_ms: weights,
  };
  writeFileSync('tests/visual/shard-plan.json', JSON.stringify(plan, null, 2) + '\n');
  console.log(`Updated tests/visual/shard-plan.json with ${Object.keys(weights).length} weight(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
