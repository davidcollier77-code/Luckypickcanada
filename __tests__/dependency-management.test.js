import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source guard for `specs/091-freebuff-startup-command`.
 *
 * pnpm 10.30.3 and the committed `pnpm-lock.yaml` are the single authoritative
 * package manager and lockfile. This guard fails when the dependency metadata
 * drifts from that policy:
 *
 * - React and React DOM must be exact versions, not a moving `latest` tag, and
 *   must match what the lockfile actually installs.
 * - Overrides must live in exactly one place (`pnpm.overrides`, the field pnpm
 *   reads). A second top-level `overrides` list silently does nothing and can
 *   diverge from the one that is applied.
 * - The lockfile's recorded overrides must equal `pnpm.overrides`, so neither
 *   file can drift from the other.
 * - Dependabot must keep the weekly GitHub Actions updates and add weekly npm
 *   (pnpm) updates for the JavaScript dependencies.
 */

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lockfile = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
const dependabot = readFileSync(join(root, '.github', 'dependabot.yml'), 'utf8');

const EXACT_SEMVER = /^\d+\.\d+\.\d+$/;

/** Overrides recorded in the lockfile's top-level `overrides:` block. */
function lockfileOverrides() {
  const block = lockfile.match(/^overrides:\n((?: {2}[^\n]*\n)+)/m);
  if (!block) return {};

  const entries = {};
  for (const line of block[1].trimEnd().split('\n')) {
    const separator = line.indexOf(': ');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().replace(/^'(.*)'$/, '$1');
    const value = line.slice(separator + 2).trim().replace(/^'(.*)'$/, '$1');
    entries[key] = value;
  }
  return entries;
}

/** Specifier recorded for a direct dependency in the lockfile importer. */
/** The negative-lookahead (?![-\w]) ensures an exact YAML key match:
 *  lockfileSpecifier('react') will NOT match a 'react-dom' block. */

function lockfileSpecifier(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    '^\\s+[\'"]?' + escaped + '[\'"]?:\\s*\\n\\s+specifier:\\s*(.+)$',
    'm'
  );
  const match = lockfile.match(pattern);
  return match ? match[1].trim() : null;
}

/** Installed version recorded for a direct dependency in the lockfile importer. */
function lockfileVersion(name) {
  const pattern = new RegExp(`\\n      ${name}:\\n        specifier: [^\\n]+\\n        version: ([^\\n(]+)`);
  const match = lockfile.match(pattern);
  return match ? match[1].trim() : null;
/** The negative-lookahead (?![-\w]) ensures an exact YAML key match:
 *  lockfileVersion('react') will NOT match a 'react-dom' block. */
}
/** Dependabot update entries, keyed by package ecosystem. */
function dependabotEntries() {
  const entries = {};
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('\
  let current = null;

  for (const line of dependabot.split('\n')) {
    const start = line.match(/^ {2}- package-ecosystem: (\S+)\s*$/);
    if (start) {
      current = { body: '' };
      entries[start[1]] = current;
      continue;
    }
    if (current) current.body += `${line}\n`;
  }

  return entries;
}

describe('Dependency management policy', () => {
  it('keeps pnpm 10.30.3 as the only pinned package manager and pnpm-lock.yaml as the only lockfile', () => {
    expect(pkg.packageManager).toBe('pnpm@10.30.3');
    expect(existsSync(join(root, 'pnpm-lock.yaml'))).toBe(true);
    expect(existsSync(join(root, 'package-lock.json'))).toBe(false);
    expect(existsSync(join(root, 'yarn.lock'))).toBe(false);
    expect(existsSync(join(root, 'pnpm-workspace.yaml'))).toBe(false);
  });

  it('pins React and React DOM to the same exact version instead of latest', () => {
    expect(pkg.dependencies.react).not.toBe('latest');
    expect(pkg.dependencies['react-dom']).not.toBe('latest');
    expect(pkg.dependencies.react).toMatch(EXACT_SEMVER);
    expect(pkg.dependencies['react-dom']).toMatch(EXACT_SEMVER);
    expect(pkg.dependencies['react-dom']).toBe(pkg.dependencies.react);
  });

  it('pins React and React DOM to the versions the lockfile already installs', () => {
    for (const name of ['react', 'react-dom']) {
      expect(lockfileSpecifier(name)).toBe(pkg.dependencies[name]);
      expect(lockfileVersion(name)).toBe(pkg.dependencies[name]);
    }
  });

  it('keeps dependency overrides in pnpm.overrides only', () => {
    expect(pkg.overrides).toBeUndefined();
    expect(pkg.pnpm).toBeTypeOf('object');
    expect(pkg.pnpm.overrides).toBeTypeOf('object');
    expect(Object.keys(pkg.pnpm.overrides).length).toBeGreaterThan(0);
  });

  it('preserves the postcss override that the top-level list used to hold', () => {
    expect(pkg.pnpm.overrides.postcss).toBe('^8.5.10');
  });

  it('keeps the lockfile overrides identical to pnpm.overrides', () => {
    const fromLockfile = lockfileOverrides();

    expect(Object.keys(fromLockfile).sort()).toEqual(Object.keys(pkg.pnpm.overrides).sort());
    for (const [name, version] of Object.entries(pkg.pnpm.overrides)) {
      expect(fromLockfile[name]).toBe(String(version));
    }
  });

  it('keeps the pre-existing security overrides that must not be dropped', () => {
    expect(pkg.pnpm.overrides).toMatchObject({
      undici: '8.12.2',
      sharp: '0.35.5',
      'source-map-js': '1.2.2',
      qs: '>=6.16.0',
      'fast-uri': '>=3.1.8',
      '@vitest/mocker': '5.0.5',
      'glob@10': '10.5.0',
    });
  });

  it('configures weekly npm (pnpm) updates and keeps weekly GitHub Actions updates', () => {
    const entries = dependabotEntries();

    expect(Object.keys(entries).sort()).toEqual(['github-actions', 'npm']);
    for (const ecosystem of ['github-actions', 'npm']) {
      expect(entries[ecosystem].body).toMatch(/^ {4}directory: \/$/m);
      expect(entries[ecosystem].body).toMatch(/^ {6}interval: weekly$/m);
    }
    expect(dependabot).toMatch(/^version: 2$/m);
  });
});
