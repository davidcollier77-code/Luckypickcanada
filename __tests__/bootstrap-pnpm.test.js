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

function createFixture(packageManager) {
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

  const npmLog = join(root, 'npm.log');
  const fakeNpm = join(fakeBin, 'npm');
  writeFileSync(fakeNpm, `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$BOOTSTRAP_NPM_LOG"
if [[ "$1" != "install" || "$2" != "-g" || "$3" != "pnpm@10.30.3" ]]; then
  exit 86
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
  echo "10.30.3"
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
    BOOTSTRAP_SCRIPT: join(scripts, 'bootstrap-pnpm.sh'),
    PATH: [fakeBin, dirname(process.execPath), '/usr/bin', '/bin'].join(delimiter),
  };

  return { root, home, npmLog, script: env.BOOTSTRAP_SCRIPT, env };
}

afterEach(() => {
  while (fixtures.length) rmSync(fixtures.pop(), { recursive: true, force: true });
});

describe('pnpm bootstrap failure handling', () => {
  it('returns a non-zero status to a sourced caller without terminating that caller', () => {
    const fixture = createFixture('bun@1.3.0');
    const result = spawnSync(
      'bash',
      ['-c', 'source "$BOOTSTRAP_SCRIPT"; status=$?; printf "CALLER_SURVIVED:%s\\n" "$status"'],
      { cwd: fixture.root, env: fixture.env, encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('CALLER_SURVIVED:1');
    expect(result.stderr).toContain('package.json must pin the package manager');
    expect(existsSync(fixture.npmLog)).toBe(false);
  });

  it('exits non-zero when executed directly and does not attempt an unpinned install', () => {
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

  it('installs the exact pinned version when pnpm is absent from PATHs', () => {
    const fixture = createFixture('pnpm@10.30.3');
    const result = spawnSync('bash', [fixture.script], {
      cwd: fixture.root,
      env: fixture.env,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Using pnpm 10.30.3');
    expect(existsSync(join(fixture.home, '.local', 'bin', 'pnpm'))).toBe(true);
    expect(readFileSync(fixture.npmLog, 'utf8')).toContain(
      'install -g pnpm@10.30.3 --prefix'
    );
  });
});
