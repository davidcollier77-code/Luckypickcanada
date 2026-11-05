import { afterEach, describe, expect, it } from 'vitest';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const bootstrapSource = join(process.cwd(), 'scripts', 'bootstrap-pnpm.sh');
const fixtures = [];

function createFixture(packageManager, { failNpmInstall = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'freebuff-pnpm-bootstrap-'));
  fixtures.push(root);

  const scripts = join(root, 'scripts');
  const fakeBin = join(root, 'fake-bin');
  const home = join(root, 'home');
  mkdirSync(scripts);
  mkdirSync(fakeBin);
  mkdirSync(home);
  copyFileSync(bootstrapSource, join(scripts, 'bootstrap-pnpm.sh'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ packageManager }, null, 2));

  const expectedVersion = packageManager.startsWith('pnpm@')
    ? packageManager.slice('pnpm@'.length)
    : '';
  const npmLog = join(root, 'npm.log');
  const fakeNpm = join(fakeBin, 'npm');
  writeFileSync(fakeNpm, `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$BOOTSTRAP_NPM_LOG"
if [[ "$1" != "install" || "$2" != "-g" || "$3" != "pnpm@${expectedVersion}" ]]; then
  exit 86
fi
if [[ "\${FAIL_NPM_INSTALL:-0}" == "1" ]]; then
  exit 89
fi
prefix=""
while (($#)); do
  if [[ "$1" == "--prefix" ]]; then
    shift
    prefix="\${1:-}"
    break
  fi
  shift
done
[[ -n "$prefix" ]] || exit 87
mkdir -p "$prefix/bin"
cat > "$prefix/bin/pnpm" <<'PNPM'
#!/usr/bin/env bash
if [[ "\${1:-}" == "--version" ]]; then
  printf '%s\\n' "$EXPECTED_PNPM_VERSION"
  exit 0
fi
exit 0
PNPM
chmod +x "$prefix/bin/pnpm"
`);
  chmodSync(fakeNpm, 0o755);

  const env = {
    ...process.env,
    HOME: home,
    BOOTSTRAP_NPM_LOG: npmLog,
    EXPECTED_PNPM_VERSION: expectedVersion,
    FAIL_NPM_INSTALL: failNpmInstall ? '1' : '0',
    BOOTSTRAP_SCRIPT: join(scripts, 'bootstrap-pnpm.sh'),
    PATH: [fakeBin, dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter),
  };

  return { root, home, npmLog, script: env.BOOTSTRAP_SCRIPT, env, expectedVersion };
}

afterEach(() => {
  while (fixtures.length) rmSync(fixtures.pop(), { recursive: true, force: true });
});

describe('pnpm bootstrap failure handling and caller isolation', () => {
  it('returns a non-zero status to a sourced caller without terminating it or leaking helpers', () => {
    const fixture = createFixture('bun@1.3.0');
    const result = spawnSync(
      'bash',
      [
        '-c',
        'source "$BOOTSTRAP_SCRIPT"; status=$?; ' +
          'declare -F _bootstrap_pnpm_entry >/dev/null && exit 91; ' +
          'declare -F bootstrap_pnpm_main >/dev/null && exit 92; ' +
          'declare -p BOOTSTRAP_PNPM_STATUS >/dev/null 2>&1 && exit 93; ' +
          'printf "CALLER_SURVIVED:%s\\n" "$status"',
      ],
      { cwd: fixture.root, env: fixture.env, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('CALLER_SURVIVED:1');
    expect(result.stderr).toContain('package.json must pin the package manager');
    expect(existsSync(fixture.npmLog)).toBe(false);
  });

  it('exits non-zero when executed directly with an invalid pin and skips installation', () => {
    const fixture = createFixture('pnpm@latest');
    const result = spawnSync('bash', [fixture.script], {
      cwd: fixture.root,
      env: fixture.env,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('packageManager must pin an exact pnpm version');
    expect(existsSync(fixture.npmLog)).toBe(false);
  });

  it('reads a non-default exact pin from package.json and exposes pnpm on the same sourced PATH', () => {
    const fixture = createFixture('pnpm@10.31.4');
    const result = spawnSync(
      'bash',
      [
        '-c',
        'source "$BOOTSTRAP_SCRIPT" || exit $?; ' +
          'printf "PNPM_PATH:%s\\n" "$(command -v pnpm)"; ' +
          'printf "PNPM_VERSION:%s\\n" "$(pnpm --version)"; ' +
          'declare -F _bootstrap_pnpm_entry >/dev/null && exit 91; ' +
          'declare -F bootstrap_pnpm_main >/dev/null && exit 92; ' +
          'declare -p BOOTSTRAP_PNPM_STATUS >/dev/null 2>&1 && exit 93',
      ],
      { cwd: fixture.root, env: fixture.env, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`PNPM_PATH:${join(fixture.home, '.local', 'bin', 'pnpm')}`);
    expect(result.stdout).toContain('PNPM_VERSION:10.31.4');
    expect(existsSync(join(fixture.home, '.local', 'bin', 'pnpm'))).toBe(true);
    expect(readFileSync(fixture.npmLog, 'utf8')).toContain(
      'install -g pnpm@10.31.4 --prefix'
    );
  });

  it('returns an installer failure to a sourced caller without leaving a partial pnpm path', () => {
    const fixture = createFixture('pnpm@10.31.4', { failNpmInstall: true });
    const result = spawnSync(
      'bash',
      [
        '-c',
        'source "$BOOTSTRAP_SCRIPT"; status=$?; ' +
          'printf "CALLER_SURVIVED:%s\\n" "$status"; ' +
          'printf "PNPM_PATH:%s\\n" "$(command -v pnpm || true)"',
      ],
      { cwd: fixture.root, env: fixture.env, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('CALLER_SURVIVED:1');
    expect(result.stdout).toContain('PNPM_PATH:');
    expect(result.stderr).toContain('could not install pnpm 10.31.4');
    expect(existsSync(join(fixture.home, '.local', 'bin', 'pnpm'))).toBe(false);
  });
});
