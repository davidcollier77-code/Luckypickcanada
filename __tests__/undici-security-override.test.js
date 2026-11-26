import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Source guard for `specs/220-cloudflare-toolchain-maintenance`.
 *
 * The global `undici: 8.12.2` override was removed because it rewrote
 * Wrangler's declared v7 dependency onto Undici 8. Every Undici major line now
 * has to resolve naturally at or above the fixed release for that major, and
 * Wrangler 4.168.0 has to keep its exact published `undici: 7.30.2` request.
 */

const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const lockfile = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');

const WRANGLER_VERSION = '4.168.0';
const WRANGLER_UNDICI_VERSION = '7.30.2';

/** First fixed release for GHSA-xjj6-f33q-929c, keyed by major line. */
const UNDICI_FIXED_FLOOR = {
  6: '6.29.1',
  7: '7.30.1',
  8: '8.12.2',
};

function versionTuple(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Unparseable Undici version: ${version}`);
  return match.slice(1).map(Number);
}

function isAtOrAboveFloor(version) {
  const floor = UNDICI_FIXED_FLOOR[versionTuple(version)[0]];
  if (!floor) return { ok: false, reason: `no advisory floor recorded for Undici ${version}` };

  const [major, minor, patch] = versionTuple(version);
  const [floorMajor, floorMinor, floorPatch] = versionTuple(floor);
  const ok =
    major > floorMajor ||
    (major === floorMajor &&
      (minor > floorMinor || (minor === floorMinor && patch >= floorPatch)));
  return { ok, reason: `Undici ${version} is below its fixed release ${floor}` };
}

/** Package snapshot keys in pnpm-lock.yaml are written at exactly two spaces. */
function packageSnapshotVersions(name) {
  const pattern = new RegExp(`^  '?${name.replace(/[/@]/g, '\\$&')}@(\\d+\\.\\d+\\.\\d+)`, 'gm');
  return [...lockfile.matchAll(pattern)].map((match) => match[1]);
}

/**
 * Read one package snapshot's dependency map. The snapshot starts at a
 * two-space `name@version(...):` key and ends at the next two-space key.
 */
function snapshotDependencies(snapshotKeyPrefix) {
  const lines = lockfile.split(/\r?\n/);
  const start = lines.findIndex(
    (line) => line.startsWith(`  ${snapshotKeyPrefix}`) && line.trimEnd().endsWith(':'),
  );
  if (start === -1) {
    throw new Error(`pnpm-lock.yaml has no ${snapshotKeyPrefix} package snapshot`);
  }

  const dependencies = {};
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^ {2}\S/.test(line)) break;
    const entry = /^ {6}([^:\s][^:]*): (.+)$/.exec(line);
    if (entry) dependencies[entry[1]] = entry[2];
  }
  return dependencies;
}

describe('Undici security override', () => {
  it('does not force any Undici major through a global pnpm override', () => {
    expect(packageJson.pnpm?.overrides).toBeTypeOf('object');
    expect(packageJson.pnpm.overrides.undici).toBeUndefined();
    expect(
      Object.keys(packageJson.pnpm.overrides).filter((key) => key.startsWith('undici')),
    ).toEqual([]);
  });

  it('resolves every Undici major line at or above its fixed advisory release', () => {
    const resolved = [...new Set(packageSnapshotVersions('undici'))];
    expect(resolved.length).toBeGreaterThan(0);

    for (const version of resolved) {
      const { ok, reason } = isAtOrAboveFloor(version);
      expect(ok, reason).toBe(true);
    }
  });

  it('resolves every consumer dependency edge to a patched Undici release', () => {
    const edges = [...new Set([...lockfile.matchAll(/^ {6}undici: (\d+\.\d+\.\d+)$/gm)].map((m) => m[1]))];
    expect(edges.length).toBeGreaterThan(0);

    for (const version of edges) {
      const { ok, reason } = isAtOrAboveFloor(version);
      expect(ok, reason).toBe(true);
    }
  });

  it(`keeps Wrangler ${WRANGLER_VERSION} on its exact declared Undici ${WRANGLER_UNDICI_VERSION} dependency`, () => {
    expect(packageSnapshotVersions('wrangler')).toContain(WRANGLER_VERSION);

    const wranglerDependencies = snapshotDependencies(`wrangler@${WRANGLER_VERSION}(`);
    expect(wranglerDependencies.undici).toBe(WRANGLER_UNDICI_VERSION);
  });
});
