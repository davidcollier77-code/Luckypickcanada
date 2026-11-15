#!/usr/bin/env node
/**
 * package-json-scripts-only.mjs — decide whether a package.json change is
 * limited to test/tooling scripts.
 *
 * Usage:
 *   node .github/scripts/package-json-scripts-only.mjs BASE.json HEAD.json
 *
 * Prints exactly one line on standard output: `scripts_only=true` or
 * `scripts_only=false`. Diagnostics go to standard error, and a usage, read or
 * parse failure exits non-zero without printing a decision, so a caller that
 * ignores the exit status cannot mistake an error for a safe skip.
 *
 * `true` means the manifest differs only in scripts whose names are positively
 * recognised as test/tooling commands (`test`, `lint`, `format`, `typecheck`,
 * `type-check`, `check`, `verify`, and their `:<name>` variants). Those scripts
 * run only when a developer or a checker invokes them; nothing in the Next.js
 * build invokes them, so changing them cannot change rendered output. Two
 * manifests with no differences at all also report `true`: nothing in the
 * manifest changed.
 *
 * `false` covers every other case: dependency, export, engine, package-manager
 * or pnpm-override changes, any build/dev/start/install/deploy lifecycle script,
 * an unrecognised script name, invalid JSON and unreadable input. Visual QA
 * therefore keeps running unless the change is positively proven non-rendering.
 */
import { readFileSync } from 'node:fs';

// Script names that only developers and QA checkers invoke. A new or changed
// script outside this family (for example `build`, `dev`, `prepare` or an
// unknown asset generator) keeps visual QA, because it is not positively
// established as non-rendering.
const TOOLING_SCRIPT_NAME =
  /^(test|lint|format|typecheck|type-check|check|verify)(:[A-Za-z0-9._-]+)*$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Key-order-independent form so reordering alone is not a manifest change. */
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function fail(message) {
  process.stderr.write(`package-json-scripts-only: ${message}\n`);
  process.exit(1);
}

function readManifest(path, label) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    fail(`could not read the ${label} manifest: ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    fail(`the ${label} manifest is not valid JSON: ${error.message}`);
  }
  if (!isPlainObject(parsed)) fail(`the ${label} manifest is not a JSON object`);
  return parsed;
}

function scriptMap(manifest, label) {
  const scripts = manifest.scripts;
  if (scripts === undefined) return {};
  if (!isPlainObject(scripts)) fail(`the ${label} manifest's scripts field is not a JSON object`);
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command !== 'string') {
      fail(`the ${label} manifest's "${name}" script is not a string`);
    }
  }
  return scripts;
}

function withoutScripts(manifest) {
  const copy = { ...manifest };
  delete copy.scripts;
  return JSON.stringify(canonical(copy));
}

const [basePath, headPath, ...extraArguments] = process.argv.slice(2);
if (!basePath || !headPath || extraArguments.length > 0) {
  fail('usage: package-json-scripts-only.mjs BASE_PACKAGE_JSON HEAD_PACKAGE_JSON');
}

const base = readManifest(basePath, 'base');
const head = readManifest(headPath, 'head');

if (withoutScripts(base) !== withoutScripts(head)) {
  process.stderr.write(
    'package-json-scripts-only: package.json differs outside "scripts"; visual QA is required.\n',
  );
  process.stdout.write('scripts_only=false\n');
  process.exit(0);
}

const baseScripts = scriptMap(base, 'base');
const headScripts = scriptMap(head, 'head');
const changedScripts = [...new Set([...Object.keys(baseScripts), ...Object.keys(headScripts)])]
  .filter((name) => baseScripts[name] !== headScripts[name])
  .sort();

const unrecognised = changedScripts.filter((name) => !TOOLING_SCRIPT_NAME.test(name));
if (unrecognised.length > 0) {
  process.stderr.write(
    'package-json-scripts-only: changed script(s) are not recognised as test/tooling commands: ' +
      `${unrecognised.join(', ')}; visual QA is required.\n`,
  );
  process.stdout.write('scripts_only=false\n');
  process.exit(0);
}

process.stderr.write(
  changedScripts.length === 0
    ? 'package-json-scripts-only: package.json is unchanged; visual QA is not required for it.\n'
    : `package-json-scripts-only: only test/tooling scripts changed (${changedScripts.join(', ')}); visual QA is not required for package.json.\n`,
);
process.stdout.write('scripts_only=true\n');
