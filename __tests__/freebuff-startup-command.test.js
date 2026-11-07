import { afterEach, describe, expect, it } from 'vitest';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// The tested, shell-safe form. The README documents exactly this command and the
// assertions below execute it, so documentation drift fails the suite.
const EXPECTED_STARTUP_COMMAND =
  "bash -c 'source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile'";

// The two rejected forms, kept so the guard explains why the wrapper exists.
const PATH_LOSING_COMMAND = 'bash scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile';
const SHELL_DEPENDENT_COMMAND = 'source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile';

const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');

function documentedStartupCommands(markdown) {
  const commands = [];
  const fence = /```bash\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = fence.exec(markdown)) !== null) {
    for (const rawLine of match[1].split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.includes('bootstrap-pnpm.sh')) commands.push(line);
    }
  }
  return commands;
}

const fixtures = [];

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'freebuff-startup-command-'));
  fixtures.push(root);

  const scripts = join(root, 'scripts');
  const fakeBin = join(root, 'fake-bin');
  const home = join(root, 'home');
  mkdirSync(scripts);
  mkdirSync(fakeBin);
  mkdirSync(home);

  // Stand-in for scripts/bootstrap-pnpm.sh: the behaviour under test is that it
  // puts the validated pnpm directory on the PATH of the shell that sources it.
  writeFileSync(
    join(scripts, 'bootstrap-pnpm.sh'),
    [
      '#!/usr/bin/env bash',
      '# Test fixture only.',
      'export PATH="$FREE_BUFF_TEST_BIN:$PATH"',
      'printf "bootstrap-ran\\n"',
    ].join('\n')
  );

  const callLog = join(root, 'pnpm.log');
  const fakePnpm = join(fakeBin, 'pnpm');
  writeFileSync(
    fakePnpm,
    ['#!/usr/bin/env bash', 'printf "%s\\n" "$*" >> "$FREE_BUFF_TEST_LOG"', 'exit 0'].join('\n')
  );
  chmodSync(fakePnpm, 0o755);

  // Deliberately excludes the fake bin, $HOME/.local/bin and anything else that
  // could resolve a pnpm: only the shell itself is reachable.
  const env = {
    ...process.env,
    HOME: home,
    FREE_BUFF_TEST_BIN: fakeBin,
    FREE_BUFF_TEST_LOG: callLog,
    PATH: ['/usr/bin', '/bin'].join(delimiter),
  };
  delete env.CI;
  delete env.PNPM_HOME;
  delete env.COREPACK_HOME;

  return { root, callLog, env };
}

function runInFixture(fixture, shell, command) {
  return spawnSync(shell, ['-c', command], {
    cwd: fixture.root,
    env: fixture.env,
    encoding: 'utf8',
  });
}

const posixShellSupportsSource =
  spawnSync('sh', ['-c', 'source /dev/null'], { encoding: 'utf8' }).status === 0;

afterEach(() => {
  while (fixtures.length) rmSync(fixtures.pop(), { recursive: true, force: true });
});

describe('documented Freebuff startup command', () => {
  it('documents exactly the tested shell-safe form, once', () => {
    const commands = documentedStartupCommands(readme);

    expect(commands).toEqual([EXPECTED_STARTUP_COMMAND]);
    expect(commands[0]).not.toBe(PATH_LOSING_COMMAND);
    expect(commands[0]).not.toBe(SHELL_DEPENDENT_COMMAND);
  });

  it('creates no dependency on the platform shell supporting `source`', () => {
    const [command] = documentedStartupCommands(readme);

    expect(command.startsWith("bash -c '")).toBe(true);
    expect(command).toContain('source scripts/bootstrap-pnpm.sh');
  });
});

describe('documented startup command behaviour (executed)', () => {
  it('installs with pnpm absent from PATH when the outer shell is Bash', () => {
    const fixture = createFixture();
    const [command] = documentedStartupCommands(readme);

    const result = runInFixture(fixture, 'bash', command);

    expect(result.status, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`).toBe(0);
    expect(result.stdout).toContain('bootstrap-ran');
    expect(readFileSync(fixture.callLog, 'utf8')).toContain('install --frozen-lockfile');
  });

  it('installs with pnpm absent from PATH when the outer shell is a POSIX sh', () => {
    const fixture = createFixture();
    const [command] = documentedStartupCommands(readme);

    const result = runInFixture(fixture, 'sh', command);

    expect(result.status, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`).toBe(0);
    expect(readFileSync(fixture.callLog, 'utf8')).toContain('install --frozen-lockfile');
  });

  it('proves the rejected `bash scripts/...` form loses the bootstrap PATH', () => {
    const fixture = createFixture();

    const result = runInFixture(fixture, 'bash', PATH_LOSING_COMMAND);

    expect(result.status).toBe(127);
    expect(result.stdout).toContain('bootstrap-ran');
    expect(result.stderr).toContain('pnpm: command not found');
    expect(existsSync(fixture.callLog)).toBe(false);
  });

  it.skipIf(posixShellSupportsSource)(
    'proves the rejected `source ...` form fails under a POSIX sh',
    () => {
      const fixture = createFixture();

      const result = runInFixture(fixture, 'sh', SHELL_DEPENDENT_COMMAND);

      expect(result.status).toBe(127);
      expect(result.stderr).toContain('source: not found');
      expect(existsSync(fixture.callLog)).toBe(false);
    }
  );
});
