import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source guard for `specs/091-freebuff-startup-command`.
 *
 * pnpm 10.30.3 and the committed `pnpm-lock.yaml` are the single authoritative
 * package manager and lockfile. This guard fails when the dependency metadata
 * drifts from that policy.
 */

const root = process.cwd();

function readGuardInput(relativePath) {
  const filePath = join(root, relativePath);
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Dependency-management guard could not read "${relativePath}": ${detail}`, {
      cause: error,
    });
  }
}

let pkg;
try {
  pkg = JSON.parse(readGuardInput('package.json'));
} catch (error) {
  if (error instanceof SyntaxError) {
    throw new Error(`Dependency-management guard found invalid package.json: ${error.message}`, {
      cause: error,
    });
  }
  throw error;
}

const lockfile = readGuardInput('pnpm-lock.yaml');
const dependabot = readGuardInput('.github/dependabot.yml');
const EXACT_SEMVER = /^\d+\.\d+\.\d+$/;

function unquoteYamlScalar(value) {
  const scalar = value.trim();
  if (scalar.startsWith('"') && scalar.endsWith('"')) return JSON.parse(scalar);
  if (scalar.startsWith("'") && scalar.endsWith("'")) {
    return scalar.slice(1, -1).replace(/''/g, "'");
  }
  return scalar;
}

/** Read the root lockfile's top-level `overrides:` block, including quoted scalars. */
function lockfileOverrides(source = lockfile) {
  const lines = source.split(/\r?\n/);
  const sectionStart = lines.findIndex((line) => line === 'overrides:');
  if (sectionStart === -1) {
    throw new Error('pnpm-lock.yaml is missing its top-level overrides: block');
  }

  const entries = {};
  for (let index = sectionStart + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '' || !line.startsWith('  ') || line.startsWith('    ')) break;

    const separator = line.indexOf(': ');
    if (separator < 3) {
      throw new Error(`Unable to parse pnpm-lock.yaml override entry: ${line}`);
    }
    const key = unquoteYamlScalar(line.slice(2, separator));
    const value = unquoteYamlScalar(line.slice(separator + 2));
    entries[key] = value;
  }

  if (Object.keys(entries).length === 0) {
    throw new Error('pnpm-lock.yaml top-level overrides: block is empty or malformed');
  }
  return entries;
}

/** Read one exact direct-dependency key from the root lockfile importer. */
function lockfileDependency(name, source = lockfile) {
  const lines = source.split(/\r?\n/);
  const keyLine = `      ${name}:`;
  const quotedKeyLine = `      '${name}':`;
  const index = lines.findIndex((line) => line === keyLine || line === quotedKeyLine);
  if (index === -1) return null;

  const specifierLine = lines[index + 1] || '';
  const versionLine = lines[index + 2] || '';
  const specifierPrefix = '        specifier: ';
  const versionPrefix = '        version: ';
  if (!specifierLine.startsWith(specifierPrefix) || !versionLine.startsWith(versionPrefix)) {
    return null;
  }

  return {
    specifier: specifierLine.slice(specifierPrefix.length).trim(),
    version: versionLine.slice(versionPrefix.length).trim().split('(')[0],
  };
}

/** Dependabot update entries, keyed by package ecosystem. */
function dependabotEntries() {
  const entries = {};
  let current = null;

  for (const line of dependabot.split(/\r?\n/)) {
    const start = line.match(/^ {2}- package-ecosystem:\s*["']?([^"'\s#]+)["']?\s*$/);
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

  it('matches direct dependency keys exactly even when a prefix sibling appears first', () => {
    const fixture = [
      '  importers:',
      '    .:',
      '      react-dom:',
      '        specifier: 18.0.0',
      '        version: 18.0.0',
      '      react:',
      '        specifier: 19.3.1',
      '        version: 19.3.1',
    ].join('\n');

    expect(lockfileDependency('react', fixture)).toEqual({
      specifier: '19.3.1',
      version: '19.3.1',
    });
  });

  it('reads react and react-dom as separate exact lockfile importer keys', () => {
    expect(lockfileDependency('react')).toEqual({
      specifier: pkg.dependencies.react,
      version: pkg.dependencies.react,
    });
    expect(lockfileDependency('react-dom')).toEqual({
      specifier: pkg.dependencies['react-dom'],
      version: pkg.dependencies['react-dom'],
    });
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

  it('parses quoted override scalars and stops before the next top-level lockfile section', () => {
    const fixture = [
      'overrides:',
      '  plain: 1.0.0',
      '  "quoted-key": "2.0.0"',
      "  'single-key': '3.0.0'",
      'importers:',
      '  .:',
    ].join('\n');

    expect(lockfileOverrides(fixture)).toEqual({
      plain: '1.0.0',
      'quoted-key': '2.0.0',
      'single-key': '3.0.0',
    });
    expect(() => lockfileOverrides('importers:\n  .:')).toThrow(
      'missing its top-level overrides: block'
    );
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
