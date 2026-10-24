import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const lockfile = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');

describe('Undici security override', () => {
  it('requires only the patched Undici version across the pnpm dependency graph', () => {
    expect(packageJson.pnpm?.overrides?.undici).toBe('8.12.2');

    const undiciPackageVersions = [...lockfile.matchAll(/^  undici@(\d+\.\d+\.\d+):/gm)]
      .map((match) => match[1]);
    expect(undiciPackageVersions).toEqual(['8.12.2', '8.12.2']);

    const resolvedUndiciVersions = [...lockfile.matchAll(/^[ \t]+undici:[ \t]+(\d+\.\d+\.\d+)[ \t]*$/gm)]
      .map((match) => match[1]);
    expect(resolvedUndiciVersions.length).toBeGreaterThan(0);
    expect([...new Set(resolvedUndiciVersions)]).toEqual(['8.12.2']);
  });
});
