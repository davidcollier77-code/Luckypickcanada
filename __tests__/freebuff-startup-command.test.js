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

// The tested, shell-safe form. README.md documents exactly this command as the value for the Freebuff project
// startup setting, and the assertions below execute it, so documentation drift fails the suite.
//
//   bash -lc        - the login profile supplies node/npm, which the bootstrap needs under a minimal PATH.
//   verify-startup  - reports context availability before any dependency work, so a later failure cannot hide it.
//   source ...      - keeps the bootstrap PATH export in the shell that runs the install.
//   CI=true install - keeps pnpm non-interactive with the frozen lockfile.
//   playwright cli  - proves the repository-local Playwright agent CLI is runnable.
//   chromium libs   - provisions Chromium's Linux runtime libraries without root, only when the check fails.
//   --env           - exports the library and font paths in the shell that runs the launch probe.
//   probe           - installs the project-pinned Chromium and proves a real headless launch.
const EXPECTED_STARTUP_COMMAND =
  "bash -lc 'bash scripts/verify-startup.sh && source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile && pnpm exec playwright cli --help && (bash scripts/setup-chromium-libs.sh --check >/dev/null 2>&1 || bash scripts/setup-chromium-libs.sh) && eval \"$(bash scripts/setup-chromium-libs.sh --env)\" && bash scripts/setup-playwright-agent.sh --install-browser --probe-browser'";

// The rejected forms, kept so the guard explains why the wrapper exists.
const PATH_LOSING_COMMAND =
  "bash -lc 'bash scripts/verify-startup.sh && bash scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile && pnpm exec playwright cli --help'";
const SHELL_DEPENDENT_COMMAND =
  'bash scripts/verify-startup.sh && source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile && pnpm exec playwright cli --help';

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

  // Stand-in for scripts/verify-startup.sh: it must run before the bootstrap and
  // the install, so its output order is what the assertions check.
  writeFileSync(
    join(scripts, 'verify-startup.sh'),
    ['#!/usr/bin/env bash', '# Test fixture only.', 'printf "verify-startup-ran\\n"'].join('\n')
  );

  // Stand-in for scripts/setup-chromium-libs.sh: --check reports the unavailable
  // libraries so the provisioning branch runs, and --env must reach the shell that
  // launches the probe.
  writeFileSync(
    join(scripts, 'setup-chromium-libs.sh'),
    [
      '#!/usr/bin/env bash',
      '# Test fixture only.',
      'case "${1:-}" in',
      '  --check) printf "check\\n" >> "$FREE_BUFF_TEST_LIBS_LOG"; exit 1 ;;',
      '  --env) printf "env\\n" >> "$FREE_BUFF_TEST_LIBS_LOG"; printf \'export FIXTURE_CHROMIUM_LIBS=1\\n\' ;;',
      '  *) printf "provision\\n" >> "$FREE_BUFF_TEST_LIBS_LOG" ;;',
      'esac',
    ].join('\n')
  );

  // Stand-in for scripts/setup-playwright-agent.sh: the launch probe itself is not
  // executed in the fixture, only its place in the chain and its arguments are.
  writeFileSync(
    join(scripts, 'setup-playwright-agent.sh'),
    [
      '#!/usr/bin/env bash',
      '# Test fixture only.',
      'printf "probe-ran\\n"',
      'printf "%s\\n" "$*" > "$FREE_BUFF_TEST_PROBE_LOG"',
    ].join('\n')
  );

  const callLog = join(root, 'pnpm.log');
  const probeLog = join(root, 'probe.log');
  const libsLog = join(root, 'libs.log');
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
    FREE_BUFF_TEST_PROBE_LOG: probeLog,
    FREE_BUFF_TEST_LIBS_LOG: libsLog,
    PATH: ['/usr/bin', '/bin'].join(delimiter),
  };
  delete env.CI;
  delete env.PNPM_HOME;
  delete env.COREPACK_HOME;

  return { root, callLog, probeLog, libsLog, env };
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

    expect(command.startsWith("bash -lc '")).toBe(true);
    expect(command).toContain('source scripts/bootstrap-pnpm.sh');
  });

  it('checks startup context before installing dependencies or the Playwright CLI', () => {
    const [command] = documentedStartupCommands(readme);

    const contextCheck = command.indexOf('bash scripts/verify-startup.sh');
    const bootstrap = command.indexOf('source scripts/bootstrap-pnpm.sh');
    const install = command.indexOf('pnpm install --frozen-lockfile');
    const playwright = command.indexOf('pnpm exec playwright cli --help');

    expect(contextCheck).toBeGreaterThanOrEqual(0);
    expect(contextCheck).toBeLessThan(bootstrap);
    expect(bootstrap).toBeLessThan(install);
    expect(install).toBeLessThan(playwright);
  });

  it('provisions Chromium libraries before exporting them and probing a launch', () => {
    const [command] = documentedStartupCommands(readme);

    const libsCheck = command.indexOf('setup-chromium-libs.sh --check');
    const libsProvision = command.indexOf('|| bash scripts/setup-chromium-libs.sh)');
    const libsEnv = command.indexOf('setup-chromium-libs.sh --env');
    const probe = command.indexOf('setup-playwright-agent.sh --install-browser --probe-browser');
    const cli = command.indexOf('pnpm exec playwright cli --help');

    expect(libsCheck).toBeGreaterThan(cli);
    expect(libsCheck).toBeLessThan(libsProvision);
    expect(libsProvision).toBeLessThan(libsEnv);
    expect(libsEnv).toBeLessThan(probe);
  });

  it('keeps the frozen install non-interactive', () => {
    const [command] = documentedStartupCommands(readme);

    expect(command).toContain('CI=true pnpm install --frozen-lockfile');
  });
});

describe('documented startup command behaviour (executed)', () => {
  for (const shell of ['bash', 'sh']) {
    it(`reports context first and installs with pnpm absent from PATH under ${shell}`, () => {
      const fixture = createFixture();
      const [command] = documentedStartupCommands(readme);

      const result = runInFixture(fixture, shell, command);

      expect(result.status, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`).toBe(0);
      expect(result.stdout.indexOf('verify-startup-ran')).toBeGreaterThanOrEqual(0);
      expect(result.stdout.indexOf('verify-startup-ran')).toBeLessThan(
        result.stdout.indexOf('bootstrap-ran')
      );
      expect(result.stdout.indexOf('probe-ran')).toBeGreaterThan(
        result.stdout.indexOf('bootstrap-ran')
      );
      // The check is silenced by the documented command, so the fixture records each
      // Chromium step in a log: check, provision when the check fails, then export.
      expect(readFileSync(fixture.libsLog, 'utf8').trim().split('\n')).toEqual([
        'check',
        'provision',
        'env',
      ]);
      expect(readFileSync(fixture.probeLog, 'utf8').trim()).toBe(
        '--install-browser --probe-browser'
      );
      expect(readFileSync(fixture.callLog, 'utf8').trim().split('\n')).toEqual([
        'install --frozen-lockfile',
        'exec playwright cli --help',
      ]);
    });
  }

  it('proves the rejected `bash scripts/...` form loses the bootstrap PATH', () => {
    const fixture = createFixture();

    const result = runInFixture(fixture, 'bash', PATH_LOSING_COMMAND);

    expect(result.status).toBe(127);
    expect(result.stdout).toContain('verify-startup-ran');
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
