import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const lockfile = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');

const PATCHED_BY_MAJOR = {
  6: '6.29.1',
  7: '7.30.2',
  8: '8.13.1',
};
const PATCHED_VERSIONS = Object.values(PATCHED_BY_MAJOR);

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

const packageVersions = [...lockfile.matchAll(/^  undici@(\d+\.\d+\.\d+):/gm)]
  .map((match) => match[1]);
const resolvedVersions = [...lockfile.matchAll(/^[ \t]+undici:[ \t]+(\d+\.\d+\.\d+)[ \t]*$/gm)]
  .map((match) => match[1]);

describe('Undici security overrides', () => {
  it('scopes each supported major to its patched release and keeps no global pin', () => {
    const overrides = packageJson.pnpm?.overrides ?? {};

    expect(overrides.undici).toBeUndefined();
    expect(overrides['undici@6']).toBe(PATCHED_BY_MAJOR[6]);
    expect(overrides['undici@7']).toBe(PATCHED_BY_MAJOR[7]);
    expect(overrides['undici@8']).toBe(PATCHED_BY_MAJOR[8]);
  });

  it('resolves only the patched release for every Undici major in the lockfile', () => {
    expect(packageVersions.length).toBeGreaterThan(0);
    expect(uniqueSorted(packageVersions)).toEqual(uniqueSorted(PATCHED_VERSIONS));

    expect(resolvedVersions.length).toBeGreaterThan(0);
    expect(uniqueSorted(resolvedVersions)).toEqual(uniqueSorted(PATCHED_VERSIONS));

    expect(lockfile).not.toMatch(/^[ \t]+undici:[ \t]+8\.12\.[0-3][ \t]*$/m);
  });

  it('keeps every resolved version at or above its major patched floor', () => {
    for (const version of uniqueSorted([...packageVersions, ...resolvedVersions])) {
      const major = Number(version.split('.')[0]);
      const floor = PATCHED_BY_MAJOR[major];

      expect(floor, `Unexpected Undici major ${major} (${version})`).toBeDefined();
      expect(compareVersions(version, floor)).toBeGreaterThanOrEqual(0);
    }
  });
});
