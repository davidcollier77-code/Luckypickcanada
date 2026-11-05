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

  it('fails closed on each required verification command', () => {
    expect(verificationScript).toContain('if ! pnpm install --frozen-lockfile; then');
    expect(verificationScript).toContain('if ! pnpm exec tsc --noEmit; then');
    expect(verificationScript).toContain('if ! pnpm run build; then');
    expect(verificationScript).toContain('if ! node scripts/test-refresh-docs.js; then');
    expect(verificationScript).not.toContain('return 1 2>/dev/null');
  });
});
