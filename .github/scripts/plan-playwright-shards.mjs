#!/usr/bin/env node
/**
 * Plan one Playwright shard from committed duration weights.
 *
 * Every spec file is assigned to exactly one shard, so a file's ordered tests
 * stay together and every committed baseline is still compared. The planner
 * always discovers the spec files itself; the plan file only supplies weights.
 * A missing, invalid or stale plan degrades to equal weights, never to a
 * dropped spec. Any discovery failure exits non-zero, which fails the job
 * rather than silently shrinking coverage.
 */
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SPEC_DIRECTORY = 'tests/visual';
export const PLAN_PATH = 'tests/visual/shard-plan.json';
export const SPEC_SUFFIX = '.spec.ts';

export function discoverSpecFiles(directory = SPEC_DIRECTORY) {
  const found = [];
  const walk = (current, prefix) => {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch (error) {
      throw new Error(`cannot read spec directory ${current}: ${error.message}`);
    }
    for (const entry of entries) {
      if (entry.name === '__screenshots__' || entry.name === 'node_modules') continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(join(current, entry.name), relative);
      } else if (entry.isFile() && entry.name.endsWith(SPEC_SUFFIX)) {
        found.push(relative);
      }
    }
  };
  walk(directory, '');
  return found.sort();
}

export function loadShardPlan(path = PLAN_PATH) {
  if (!existsSync(path)) return { weights: {}, problem: `no shard plan at ${path}` };
  let payload;
  try {
    payload = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { weights: {}, problem: `shard plan is not valid JSON: ${error.message}` };
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { weights: {}, problem: 'shard plan must be a JSON object' };
  }
  const weights = payload.weights_ms;
  if (!weights || typeof weights !== 'object' || Array.isArray(weights)) {
    return { weights: {}, problem: 'shard plan has no weights_ms object' };
  }
  const cleaned = {};
  for (const [file, value] of Object.entries(weights)) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) cleaned[file] = numeric;
  }
  return { weights: cleaned, problem: null };
}

/** Longest-processing-time greedy assignment. Deterministic for equal input. */
export function planShards(files, weights = {}, shards = 2) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('no Playwright spec files were discovered; refusing to plan empty shards');
  }
  if (!Number.isInteger(shards) || shards < 1) {
    throw new Error(`invalid shard count: ${shards}`);
  }
  const known = files.map((file) => weights[file]).filter((value) => Number.isFinite(value));
  const conservative = known.length ? Math.max(...known) : 1;
  const ordered = [...new Set(files)].sort((left, right) => {
    const delta = (weights[right] ?? conservative) - (weights[left] ?? conservative);
    return delta !== 0 ? delta : left.localeCompare(right);
  });

  const buckets = Array.from({ length: shards }, (_, index) => ({
    index: index + 1,
    files: [],
    estimated_ms: 0,
  }));
  for (const file of ordered) {
    const target = buckets.reduce((lightest, bucket) =>
      bucket.estimated_ms < lightest.estimated_ms ? bucket : lightest,
    );
    const weight = Number.isFinite(weights[file]) ? weights[file] : conservative;
    target.files.push(file);
    target.estimated_ms += weight;
  }
  for (const bucket of buckets) bucket.files.sort();

  const assigned = buckets.flatMap((bucket) => bucket.files);
  const unique = new Set(assigned);
  if (unique.size !== files.length || assigned.length !== files.length) {
    throw new Error('shard plan guard failed: a spec file was dropped or duplicated');
  }
  for (const file of files) {
    if (!unique.has(file)) {
      throw new Error(`shard plan guard failed: ${file} is not assigned to any shard`);
    }
  }
  return buckets;
}

function parseArguments(argv) {
  const options = { shard: 1, shards: 2, directory: SPEC_DIRECTORY, plan: PLAN_PATH, summary: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--shard') options.shard = Number(argv[++index]);
    else if (argument === '--shards') options.shards = Number(argv[++index]);
    else if (argument === '--dir') options.directory = argv[++index];
    else if (argument === '--plan') options.plan = argv[++index];
    else if (argument === '--summary') options.summary = argv[++index];
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const files = discoverSpecFiles(options.directory);
  const { weights, problem } = loadShardPlan(options.plan);
  if (problem) console.warn(`::warning::Playwright shard planner: ${problem}; using equal weights.`);
  const buckets = planShards(files, weights, options.shards);
  const selected = buckets.find((bucket) => bucket.index === options.shard);
  if (!selected) throw new Error(`shard ${options.shard} does not exist`);

  const lines = [
    `Shard ${options.shard}/${options.shards}: ${selected.files.length} spec file(s), approx ${Math.round(selected.estimated_ms)} ms`,
    '',
    '| Shard | Spec files | Estimated ms |',
    '| --- | --- | --- |',
    ...buckets.map((bucket) => `| ${bucket.index} | ${bucket.files.length} | ${Math.round(bucket.estimated_ms)} |`),
  ];
  console.log(lines.join('\n'));
  if (options.summary) appendFileSync(options.summary, lines.join('\n') + '\n');
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `files=${selected.files.join(' ')}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `estimated_ms=${Math.round(selected.estimated_ms)}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exit(1);
  }
}
