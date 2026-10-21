import { afterEach, describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const scriptPath = path.resolve(process.cwd(), '.github/scripts/append_devskim_findings.py');
const temporaryDirs = [];

const finding = (overrides = {}) => ({
  ruleId: 'DS1',
  level: 'warning',
  message: { text: 'original wording' },
  locations: [{
    physicalLocation: {
      artifactLocation: { uri: 'src/example.js' },
      region: { startLine: 12 },
    },
  }],
  partialFingerprints: { primaryLocationLineHash: 'stable-fingerprint-1' },
  ...overrides,
});

function createFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devskim-dedup-'));
  temporaryDirs.push(dir);
  const reportPath = path.join(dir, 'devskim-alerts.md');
  const sarifPath = path.join(dir, 'devskim-alerts.sarif');
  const outputPath = path.join(dir, 'github-output.txt');
  fs.writeFileSync(
    reportPath,
    '# DevSkim alerts\n\n<!-- DevSkim findings are appended below this line. -->\n',
    'utf8',
  );

  function scan(results) {
    fs.writeFileSync(sarifPath, JSON.stringify({
      version: '2.1.0',
      runs: [{ results }],
    }), 'utf8');
    fs.writeFileSync(outputPath, '', 'utf8');
    const result = spawnSync('python3', [scriptPath], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: outputPath },
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const match = fs.readFileSync(outputPath, 'utf8').match(/new_count=(\d+)/);
    if (!match) throw new Error('The actual report script did not write new_count to GITHUB_OUTPUT.');
    return {
      newCount: Number(match[1]),
      report: fs.readFileSync(reportPath, 'utf8'),
    };
  }

  return { scan };
}

afterEach(() => {
  for (const dir of temporaryDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('DevSkim append-only report implementation', () => {
  it('appends the first occurrence of a finding', () => {
    const { scan } = createFixture();
    const result = scan([finding()]);
    expect(result.newCount).toBe(1);
    expect(result.report).toContain('DS1');
    expect(result.report).toContain('stable-fingerprint');
  });

  it('does not append a repeated finding on the next scan', () => {
    const { scan } = createFixture();
    scan([finding()]);
    const second = scan([finding()]);
    expect(second.newCount).toBe(0);
    expect((second.report.match(/devskim-id:/g) || []).length).toBe(1);
  });

  it('does not duplicate a finding when its wording changes but fingerprint stays the same', () => {
    const { scan } = createFixture();
    scan([finding()]);
    const second = scan([finding({ message: { text: 'updated scanner wording' } })]);
    expect(second.newCount).toBe(0);
    expect(second.report).toContain('original wording');
    expect(second.report).not.toContain('updated scanner wording');
  });

  it('appends a genuinely new finding without removing existing entries', () => {
    const { scan } = createFixture();
    scan([finding()]);
    const second = scan([finding(), finding({
      ruleId: 'DS2',
      message: { text: 'a genuinely new finding' },
      partialFingerprints: { primaryLocationLineHash: 'stable-fingerprint-2' },
    })]);
    expect(second.newCount).toBe(1);
    expect(second.report).toContain('DS1');
    expect(second.report).toContain('DS2');
    expect((second.report.match(/devskim-id:/g) || []).length).toBe(2);
  });
});
