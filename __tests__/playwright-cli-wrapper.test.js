import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..');
const wrapper = path.join(repoRoot, 'scripts', 'playwright-cli.sh');

function dryRun(...args) {
  return execFileSync('bash', [wrapper, '--dry-run', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
}

describe('shell script syntax', () => {
  it('parses every script in scripts/ and the root entrypoints', () => {
    const scripts = fs
      .readdirSync(path.join(repoRoot, 'scripts'))
      .filter((name) => name.endsWith('.sh'))
      .map((name) => path.join('scripts', name));

    const entrypoints = ['freebuff-verify.sh', 'start_app.sh'].filter((name) =>
      fs.existsSync(path.join(repoRoot, name)),
    );

    const failures = [];
    for (const script of [...scripts, ...entrypoints]) {
      try {
        execFileSync('bash', ['-n', path.join(repoRoot, script)], { encoding: 'utf8' });
      } catch (error) {
        failures.push(`${script}: ${error.stderr || error.message}`);
      }
    }

    // A script that cannot parse can never provision anything, which is how a
    // single mangled quote once disabled the whole Chromium runtime.
    expect(failures).toEqual([]);
  });
});

describe('playwright-cli wrapper', () => {
  it('adds the pinned Chromium channel to open', () => {
    const command = dryRun('open', 'https://luckypickcanada.ca');
    expect(command).toBe(
      'pnpm exec playwright cli open https://luckypickcanada.ca --browser=chromium',
    );
  });

  it('keeps an explicit browser choice', () => {
    const command = dryRun('open', 'https://luckypickcanada.ca', '--browser=firefox');
    expect(command).toContain('--browser=firefox');
    expect(command).not.toContain('--browser=chromium');
  });

  it('leaves commands that do not launch a browser untouched', () => {
    expect(dryRun('snapshot')).toBe('pnpm exec playwright cli snapshot');
  });

  it('routes test runs to the test runner, which injects its own environment', () => {
    expect(dryRun('test', '--project=desktop')).toBe(
      'pnpm exec playwright test --project=desktop',
    );
  });
});
