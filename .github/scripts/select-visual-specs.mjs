#!/usr/bin/env node
/**
 * Select the Playwright specs a change can plausibly affect.
 *
 * Fail-closed and shadow-first:
 *  - any unmapped changed path selects every spec;
 *  - any discovered spec that is not reachable from a rule is reported and
 *    selects every spec (a new spec can never be silently excluded);
 *  - shadow mode (the committed default) only reports the selection and the
 *    job still runs every spec;
 *  - full-sweep runs (merge group, dispatch, weekly) always select everything.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { discoverSpecFiles } from './plan-playwright-shards.mjs';

export const DEFAULT_MAP_PATH = 'tests/visual/impact-map.json';
export const DEFAULT_MODE = 'shadow';

export function loadImpactMap(path = DEFAULT_MAP_PATH) {
  if (!existsSync(path)) return { map: null, problem: `no impact map at ${path}` };
  try {
    const payload = JSON.parse(readFileSync(path, 'utf8'));
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.rules)) {
      return { map: null, problem: 'impact map must be an object with a rules array' };
    }
    return { map: payload, problem: null };
  } catch (error) {
    return { map: null, problem: `impact map is not valid JSON: ${error.message}` };
  }
}

function globToRegExp(pattern) {
  const escaped = String(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function selectSpecs(changedPaths, map, discovered, { mode = DEFAULT_MODE, fullSweep = false } = {}) {
  const all = [...new Set(discovered)].sort();
  const everything = (reason) => ({ mode: 'all', specs: all, reason });
  if (fullSweep) return everything('a full Playwright sweep is required for this event');
  if (!map) return everything('the impact map is unavailable; fail-closed');
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) {
    return everything('the change set is empty or unreadable; fail-closed');
  }

  const always = new Set(
    (map.always_run || []).filter((name) => typeof name === 'string'),
  );
  const selected = new Set(always);
  // A spec is reachable when the map references it anywhere (always_run or a
  // rule), not only when this change selects it. A spec outside the map is a
  // coverage hole and must select every spec.
  const referenced = new Set(always);
  for (const rule of map.rules) {
    if (rule.specs === 'all') continue;
    for (const spec of rule.specs || []) referenced.add(spec);
  }
  const unreachable = all.filter((spec) => !referenced.has(spec));
  if (unreachable.length) {
    return everything(
      `spec(s) unreachable from the impact map (${unreachable.join(', ')}); fail-closed`,
    );
  }
  let unmatched = false;
  let selectAll = false;

  for (const path of changedPaths) {
    let matched = false;
    for (const rule of map.rules) {
      const patterns = Array.isArray(rule.match) ? rule.match : [];
      if (!patterns.some((pattern) => globToRegExp(pattern).test(path))) continue;
      matched = true;
      if (rule.specs === 'all') {
        selectAll = true;
        continue;
      }
      for (const spec of rule.specs || []) {
        selected.add(spec);
      }
    }
    if (!matched) unmatched = true;
  }

  if (selectAll) return everything('a changed path affects shared chrome or global styling');
  if (unmatched) return everything('a changed path is not mapped to any visual spec; fail-closed');
  const specs = all.filter((spec) => selected.has(spec));
  if (specs.length === 0) return everything('the selection is empty; fail-closed');
  if (mode !== 'subset') {
    return { mode: 'shadow', specs: all, would_run: specs, reason: 'shadow mode reports the selection but runs every spec' };
  }
  return { mode: 'subset', specs, reason: `selected ${specs.length} of ${all.length} spec file(s)` };
}

function parseArguments(argv) {
  const options = { files: null, map: DEFAULT_MAP_PATH, mode: process.env.VISUAL_SPEC_SELECTION || DEFAULT_MODE, fullSweep: process.env.VISUAL_FULL_SWEEP === 'true', specs: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--files') options.files = argv[++index];
    else if (argument === '--map') options.map = argv[++index];
    else if (argument === '--mode') options.mode = argv[++index];
    else if (argument === '--specs') options.specs = argv[++index];
    else if (argument === '--full-sweep') options.fullSweep = true;
    else throw new Error(`unknown argument: ${argument}`);
  }
  return options;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options.files) throw new Error('--files is required');
  const changed = readFileSync(options.files, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const discovered = options.specs
    ? readFileSync(options.specs, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : discoverSpecFiles();
  if (!discovered.length) throw new Error('no Playwright spec files were discovered');
  const { map, problem } = loadImpactMap(options.map);
  if (problem) console.warn(`::warning::Visual spec selection: ${problem}`);
  const selection = selectSpecs(changed, map, discovered, { mode: options.mode, fullSweep: options.fullSweep });
  const lines = [
    `Visual spec selection: **${selection.mode}** — ${selection.reason}`,
    '',
    selection.would_run
      ? `Would run: ${selection.specs.length === discovered.length ? 'all specs' : selection.would_run.join(', ')}`
      : `Specs (${selection.specs.length}/${discovered.length}): ${selection.specs.join(', ')}`,
  ];
  console.log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `mode=${selection.mode}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `specs=${selection.specs.join(' ')}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(`::error::Visual spec selection failed: ${error.message}`);
    process.exit(1);
  }
}
