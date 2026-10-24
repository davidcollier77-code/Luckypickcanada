import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const lockfile = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');

describe('Undici security override', () => {
  it('requires the patched Undici version across the pnpm dependency graph', () => {
    expect(packageJson.pnpm?.overrides?.undici).toBe('8.12.2');
    expect(lockfile).toMatch(/^  undici: 8\.12\.2$/m);
    expect(lockfile).toContain('  undici@8.12.2:');
    expect(lockfile).toContain('  undici@8.12.2: {}');
    expect(lockfile).not.toMatch(/^  undici@8\.10\.2:/m);
    expect(lockfile).not.toMatch(/^[ \t]+undici:[ \t]+8\.10\.2[ \t]*$/m);
  });
});
