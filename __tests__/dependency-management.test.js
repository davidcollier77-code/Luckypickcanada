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

/**
 * Every resolved snapshot version of one exact package name in the lockfile.
 *
 * pnpm writes scoped snapshot keys with surrounding single quotes and appends a
 * peer suffix, for example `'@vitest/mocker@5.1.1(vite@8.3.8(...))':`. Both forms
 * must match, otherwise a scoped package silently yields an empty list and any
 * assertion over it passes without checking anything.
 */
function lockfilePackageVersions(name, source = lockfile) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^ {2}'?${escaped}@(\\d+\\.\\d+\\.\\d+)(?:\\(.*\\))?'?:$`, 'gm');
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

/** Numeric dot-separated version comparison; no pre-release versions are expected. */
function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
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

  it('keeps the Cloudflare build tools exact-pinned and free of the glob 13 minimatch 10 path', () => {
    const adapter = pkg.devDependencies['@opennextjs/cloudflare'];
    const wrangler = pkg.devDependencies.wrangler;

    expect(adapter).toMatch(EXACT_SEMVER);
    expect(wrangler).toMatch(EXACT_SEMVER);
    expect(lockfileDependency('@opennextjs/cloudflare')).toEqual({
      specifier: adapter,
      version: adapter,
    });
    expect(lockfileDependency('wrangler')).toEqual({
      specifier: wrangler,
      version: wrangler,
    });

    // glob 13 declares minimatch ^10, which has no patched release for
    // GHSA-g3hv-75wg-m249. The adapter must resolve glob 14 instead of relying
    // on a cross-major minimatch override.
    expect(lockfile).not.toMatch(/^ {2}glob@13\.\d+\.\d+:/m);
    expect(lockfile).not.toMatch(/^ {2}minimatch@10\.\d+\.\d+:/m);
  });

  it('keeps dependency overrides in pnpm.overrides only', () => {
    expect(pkg.overrides).toBeUndefined();
    expect(pkg.pnpm).toBeTypeOf('object');
    expect(pkg.pnpm.overrides).toBeTypeOf('object');
    expect(Object.keys(pkg.pnpm.overrides).length).toBeGreaterThan(0);
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

  it('keeps only the overrides that a verified requirement still justifies', () => {
    // The Undici majors each have a patched security floor that no consumer
    // range selects on its own (GHSA-scoped per major). Every other historical
    // workaround was removed because normal upstream resolution now selects a
    // supported, patched, within-range version: no bare global pin, no cross-
    // major force, and no override that merely restates a direct dependency.
    expect(Object.keys(pkg.pnpm.overrides).sort()).toEqual([
      'undici@6',
      'undici@7',
      'undici@8',
    ]);
    expect(pkg.pnpm.overrides).toMatchObject({
      'undici@6': '6.29.1',
      'undici@7': '7.30.2',
      'undici@8': '8.13.1',
    });
    expect(pkg.pnpm.overrides.undici).toBeUndefined();
    expect(pkg.pnpm.overrides['minimatch@10']).toBeUndefined();
    expect(pkg.pnpm.overrides['glob@10']).toBeUndefined();
    expect(pkg.pnpm.overrides['brace-expansion@1']).toBeUndefined();
  });

  it('resolves glob, minimatch and brace-expansion to patched releases without overrides', () => {
    // glob 14 is the only glob line in the graph, and 14.0.6 is the first
    // release whose minimatch edge is ^11. A later 14.x patch or minor is a
    // legitimate upgrade, so the guard uses the floor rather than exact equality.
    const globVersions = [...new Set(lockfilePackageVersions('glob'))];
    expect(globVersions.length).toBeGreaterThan(0);
    for (const version of globVersions) {
      expect(version.split('.')[0], `unexpected glob major in ${version}`).toBe('14');
      expect(compareVersions(version, '14.0.6'), `glob ${version} predates minimatch 11`).toBeGreaterThanOrEqual(0);
    }
    expect(lockfile).not.toMatch(/^ {2}'?glob@(?:10|13)\.\d+\.\d+/m);

    // GHSA-g3hv-75wg-m249 (CVE-2026-118764) affects minimatch >=7.0.0 <11.0.1.
    // The remaining 3.x copy is outside the affected range.
    const minimatchVersions = lockfilePackageVersions('minimatch');
    expect(minimatchVersions.length).toBeGreaterThan(0);
    for (const version of minimatchVersions) {
      const major = Number(version.split('.')[0]);
      if (major >= 7) {
        expect(compareVersions(version, '11.0.1'), `vulnerable minimatch ${version}`).toBeGreaterThanOrEqual(0);
      } else {
        expect(major, `unexpected minimatch major in ${version}`).toBeLessThanOrEqual(6);
      }
    }

    // GHSA-v6h2-p8h4-qcjw (CVE-2025-5889) patched floors per major. The
    // advisory's affected lines stop at 4, so 5.x and later are not affected —
    // but that must be an explicit decision per resolved major. A silent skip
    // would pass for any unrecognised major, which is the failure mode this
    // whole guard exists to catch.
    const braceFloors = { 1: '1.1.12', 2: '2.0.2', 3: '3.0.1', 4: '4.0.1' };
    const braceUnaffectedFrom = 5;
    const braceVersions = lockfilePackageVersions('brace-expansion');
    expect(braceVersions.length).toBeGreaterThan(0);
    for (const version of braceVersions) {
      const major = Number(version.split('.')[0]);
      const floor = braceFloors[major];
      if (floor) {
        expect(compareVersions(version, floor), `vulnerable brace-expansion ${version}`).toBeGreaterThanOrEqual(0);
      } else {
        expect(
          major,
          `unexpected brace-expansion major in ${version}; add its patched floor to braceFloors`
        ).toBeGreaterThanOrEqual(braceUnaffectedFrom);
      }
    }
  });

  it('keeps the Vitest internals on the installed Vitest release', () => {
    // A downgraded @vitest/mocker mixed Vitest 5.1.x with 5.0.x internals.
    expect(pkg.pnpm.overrides['@vitest/mocker']).toBeUndefined();
    const mockerVersions = lockfilePackageVersions('@vitest/mocker');
    // An unmatchable lockfile format must fail loudly instead of passing vacuously.
    expect(mockerVersions.length).toBeGreaterThan(0);
    expect(mockerVersions).not.toContain('5.0.5');
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
