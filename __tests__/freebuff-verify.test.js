import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const verificationScript = readFileSync(join(process.cwd(), 'freebuff-verify.sh'), 'utf8');

function countOccurrences(source, fragment) {
  return source.split(fragment).length - 1;
}

describe('Freebuff verification gate control flow', () => {
  it('runs the TypeScript check and production build exactly once', () => {
    expect(countOccurrences(verificationScript, 'pnpm exec tsc --noEmit')).toBe(1);
    expect(countOccurrences(verificationScript, 'pnpm run build')).toBe(1);
  });

  it('stops with a clear failure when the refresh-docs tests fail', () => {
    expect(verificationScript).toMatch(
      /if ! node scripts\/test-refresh-docs\.js; then\s+echo "❌ Refresh Docs Tests failed; remaining verification was not run\." >&2\s+exit 1\s+fi/
    );
  });

  it('fails closed with an explicit exit in every required verification branch', () => {
    const requiredBranches = [
      ['pnpm install --frozen-lockfile', 'pnpm install --frozen-lockfile failed'],
      ['pnpm exec tsc --noEmit', 'Type check failed'],
      ['pnpm run build', 'Build failed'],
      ['node scripts/test-refresh-docs.js', 'Refresh Docs Tests failed'],
    ];

    for (const [command, errorMessage] of requiredBranches) {
      expect(countOccurrences(verificationScript, command)).toBe(1);
      const start = verificationScript.indexOf(`if ! ${command}; then`);
      expect(start).toBeGreaterThanOrEqual(0);

      const end = verificationScript.indexOf('\nfi', start);
      expect(end).toBeGreaterThan(start);
      const branch = verificationScript.slice(start, end);
      expect(branch).toContain(errorMessage);
      expect(branch).toContain('exit 1');
    }
  });
});
