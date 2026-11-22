import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const verificationScript = readFileSync(join(process.cwd(), 'freebuff-verify.sh'), 'utf8');

function countOccurrences(source, fragment) {
  return source.split(fragment).length - 1;
}

describe('Freebuff verification gate control flow', () => {
  it('runs the complete local matrix exactly once', () => {
    for (const command of [
      'pnpm exec tsc --noEmit',
      'pnpm run test',
      'pnpm run build',
      'node scripts/test-refresh-docs.js',
    ]) {
      expect(countOccurrences(verificationScript, command), command).toBe(1);
    }
    expect(verificationScript).toContain(
      `python3 -m unittest discover -s "$SCRIPT_DIR/.github/scripts" -p 'test_*.py'`,
    );
    expect(verificationScript).toContain('du -sk .next public');
    expect(verificationScript).toContain('495 * 1024 * 1024');
  });

  it('fails closed with an explicit exit in every required verification branch', () => {
    const requiredBranches = [
      ['pnpm install --frozen-lockfile', 'pnpm install --frozen-lockfile failed'],
      [`python3 -m unittest discover -s "$SCRIPT_DIR/.github/scripts" -p 'test_*.py'`, 'QA infrastructure checker tests failed'],
      ['pnpm exec tsc --noEmit', 'Type check failed'],
      ['pnpm run test', 'Unit test suite failed'],
      ['pnpm run build', 'Build failed'],
      ['node scripts/test-refresh-docs.js', 'Refresh Docs Tests failed'],
    ];

    for (const [command, errorMessage] of requiredBranches) {
      const start = verificationScript.indexOf(`if ! ${command}; then`);
      expect(start, command).toBeGreaterThanOrEqual(0);
      const end = verificationScript.indexOf('\nfi', start);
      expect(end).toBeGreaterThan(start);
      const branch = verificationScript.slice(start, end);
      expect(branch).toContain(errorMessage);
      expect(branch).toContain('exit 1');
    }
  });

  it('enforces the 495 MiB cap and reports the measured size', () => {
    expect(verificationScript).toMatch(/if \(\( size_bytes >= max_bytes \)\); then/);
    expect(verificationScript).toContain('reached or exceeded 495 MiB');
    expect(verificationScript).toContain('Combined .next + public');
  });

  it('never runs Playwright, OpenNext, DevSkim or a deployment', () => {
    expect(verificationScript).not.toMatch(/playwright\s+test/);
    expect(verificationScript).not.toContain('opennextjs-cloudflare build');
    expect(verificationScript).not.toContain('pnpm run deploy');
    expect(verificationScript).not.toContain('devskim');
  });

  it('states its coverage boundary honestly', () => {
    expect(verificationScript).toContain('Not covered here: Playwright/Visual QA');
    expect(verificationScript).toContain('the OpenNext artifact build');
    expect(verificationScript).toContain('Those run in GitHub Actions');
  });
});
