import { afterEach, describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
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

const DEFAULT_MESSAGE = 'Do not store tokens or keys in source code.';
const URI = 'src/fixture.js';

/**
 * Build a fingerprint-less DevSkim result for the nth occurrence of `token` in
 * `source`, the way production DevSkim reports it: absolute charOffset/
 * charLength (UTF-16 units, which is what a JavaScript string index is here),
 * the matched snippet and the reported line/columns.
 */
const at = (source, token, options = {}) => {
  let index = -1;
  for (let seen = 0; seen <= (options.occurrence ?? 0); seen += 1) {
    index = source.indexOf(token, index + 1);
    if (index < 0) throw new Error(`token ${JSON.stringify(token)} not found`);
  }
  const before = source.slice(0, index);
  const startLine = before.split('\n').length;
  const startColumn = index - before.lastIndexOf('\n');
  const region = {
    startLine,
    startColumn,
    endColumn: startColumn + token.length,
  };
  if (options.absolute !== false) {
    region.charOffset = index;
    region.charLength = token.length;
  }
  if (options.snippet !== false) region.snippet = { text: token };
  return {
    ruleId: options.ruleId ?? 'DS173237',
    level: options.level ?? 'error',
    message: { text: options.message ?? DEFAULT_MESSAGE },
    locations: [{
      physicalLocation: {
        artifactLocation: { uri: options.uri ?? URI },
        region,
      },
    }],
    partialFingerprints: options.fingerprints ?? {},
  };
};

const rowsOf = (report) => report.split('\n').flatMap((line) => {
  const match = line.match(/^- \*\*[^*]+\*\* — `([^`]+)` — [^\n]*?<!-- devskim-id:([0-9a-f]{20}) -->$/);
  return match ? [{ where: match[1], id: match[2] }] : [];
});

const wheres = (report) => rowsOf(report).map((row) => row.where);
const ids = (report) => rowsOf(report).map((row) => row.id);

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

  function seedReport(row) {
    fs.appendFileSync(reportPath, `${row}\n`, 'utf8');
  }

  function writeSource(text, uri = URI) {
    const file = path.join(dir, uri);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text, 'utf8');
    return text;
  }

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
    const report = fs.readFileSync(reportPath, 'utf8');
    return { newCount: Number(match[1]), report, rows: rowsOf(report) };
  }

  return { scan, seedReport, writeSource };
}

const sourceWithTokens = (...tokens) => tokens
  .map((token, index) => `const value${index} = "${token}";`)
  .join('\n');

afterEach(() => {
  for (const dir of temporaryDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('DevSkim append-only report implementation', () => {
  it('appends the first occurrence of a finding', () => {
    const { scan } = createFixture();
    const result = scan([finding()]);
    expect(result.newCount).toBe(1);
    expect(result.report).toContain('DS1');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].where).toBe('src/example.js:12');
  });

  it('does not append a repeated finding on the next scan', () => {
    const { scan } = createFixture();
    scan([finding()]);
    const second = scan([finding()]);
    expect(second.newCount).toBe(0);
    expect(second.rows).toHaveLength(1);
  });

  it('does not duplicate a finding when its wording changes but fingerprint stays the same', () => {
    const { scan } = createFixture();
    scan([finding()]);
    const second = scan([finding({ message: { text: 'updated scanner wording' } })]);
    expect(second.newCount).toBe(0);
    expect(second.report).toContain('original wording');
    expect(second.report).not.toContain('updated scanner wording');
  });

  it('does not re-append a fingerprinted finding when the file is renumbered', () => {
    const placement = (line) => finding({ locations: [{ physicalLocation: {
      artifactLocation: { uri: 'src/example.js' },
      region: { startLine: line },
    } }] });
    const { scan } = createFixture();
    scan([placement(12)]);
    const second = scan([placement(40)]);
    expect(second.newCount).toBe(0);
    expect(second.rows).toEqual([{ where: 'src/example.js:12', id: expect.stringMatching(/^[0-9a-f]{20}$/) }]);
  });

  it('keeps a fingerprint-less finding at its recorded location when the file is renumbered', () => {
    const { scan, writeSource } = createFixture();
    const token = 'a'.repeat(56);
    const first = writeSource(sourceWithTokens(token));
    const recorded = scan([at(first, token)]);
    expect(recorded.rows).toHaveLength(1);
    expect(recorded.rows[0].where).toBe(`${URI}:1`);
    const recordedId = recorded.rows[0].id;

    // Two unrelated lines inserted above: the finding itself is unchanged.
    const shifted = writeSource(`const a = 1;\nconst b = 2;\n${sourceWithTokens(token)}`);
    const second = scan([at(shifted, token)]);
    expect(second.newCount).toBe(0);
    expect(second.rows).toEqual([{ where: `${URI}:1`, id: recordedId }]);

    // And again much further down the file.
    const far = writeSource(`${Array.from({ length: 40 }, (_, i) => `// ${i}`).join('\n')}\n${sourceWithTokens(token)}`);
    const third = scan([at(far, token)]);
    expect(third.newCount).toBe(0);
    expect(third.rows).toEqual([{ where: `${URI}:1`, id: recordedId }]);
  });

  it('records the finding inserted between two known ones at its own line, without duplicating or skipping', () => {
    const { scan, writeSource } = createFixture();
    const alpha = 'a'.repeat(56);
    const beta = 'b'.repeat(56);
    const omega = 'c'.repeat(56);

    const first = writeSource(`${sourceWithTokens(alpha)}\n// gap\n${sourceWithTokens(omega)}`);
    const recorded = scan([at(first, alpha), at(first, omega)]);
    expect(recorded.newCount).toBe(2);
    expect(wheres(recorded.report)).toEqual([`${URI}:1`, `${URI}:3`]);
    const [alphaId, omegaId] = ids(recorded.report);
    expect(alphaId).not.toBe(omegaId);

    // A new same-shape finding is inserted between the two known ones.
    const inserted = writeSource(`${sourceWithTokens(alpha)}\n${sourceWithTokens(beta)}\n${sourceWithTokens(omega)}`);
    const second = scan([at(inserted, alpha), at(inserted, beta), at(inserted, omega)]);

    expect(second.newCount).toBe(1);
    expect(wheres(second.report)).toEqual([`${URI}:1`, `${URI}:3`, `${URI}:2`]);
    // The known findings keep their ids and are not recorded twice.
    expect(second.rows[0].id).toBe(alphaId);
    expect(second.rows[1].id).toBe(omegaId);
    expect(new Set(ids(second.report)).size).toBe(3);
    // The genuinely new finding was recorded, at the line it actually occupies.
    expect(second.rows[2].where).toBe(`${URI}:2`);
    expect(second.rows[2].id).not.toBe(alphaId);
    expect(second.rows[2].id).not.toBe(omegaId);
  });

  it('records a new finding after a known one is remediated, and never re-adds the remediated one', () => {
    const { scan, writeSource } = createFixture();
    const alpha = 'a'.repeat(56);
    const omega = 'c'.repeat(56);
    const gamma = 'd'.repeat(56);

    const first = writeSource(`${sourceWithTokens(alpha)}\n// gap\n${sourceWithTokens(omega)}`);
    const recorded = scan([at(first, alpha), at(first, omega)]);
    const [alphaId, omegaId] = ids(recorded.report);
    expect(recorded.newCount).toBe(2);

    // The second finding is remediated: nothing is appended, nothing is removed.
    const remediated = writeSource(`${sourceWithTokens(alpha)}\n// gap\nconst fixed = "redacted";`);
    const afterRemoval = scan([at(remediated, alpha)]);
    expect(afterRemoval.newCount).toBe(0);
    expect(wheres(afterRemoval.report)).toEqual([`${URI}:1`, `${URI}:3`]);

    // A different, genuinely new finding appears where the old one was.
    const replaced = writeSource(`${sourceWithTokens(alpha)}\n// gap\n${sourceWithTokens(gamma)}`);
    const afterReplacement = scan([at(replaced, alpha), at(replaced, gamma)]);
    expect(afterReplacement.newCount).toBe(1);
    expect(wheres(afterReplacement.report)).toEqual([`${URI}:1`, `${URI}:3`, `${URI}:3`]);
    expect(afterReplacement.rows[0].id).toBe(alphaId);
    expect(afterReplacement.rows[1].id).toBe(omegaId);
    expect(afterReplacement.rows[2].id).not.toBe(omegaId);
    expect(afterReplacement.rows[2].id).not.toBe(alphaId);
  });

  it('appends nothing when repeated scans report the same findings', () => {
    const { scan, writeSource } = createFixture();
    const alpha = 'a'.repeat(56);
    const omega = 'c'.repeat(56);
    const source = writeSource(`${sourceWithTokens(alpha)}\n// gap\n${sourceWithTokens(omega)}`);
    const first = scan([at(source, alpha), at(source, omega)]);
    expect(first.newCount).toBe(2);

    const second = scan([at(source, alpha), at(source, omega)]);
    const third = scan([at(source, omega), at(source, alpha)]);
    expect(second.newCount).toBe(0);
    expect(third.newCount).toBe(0);
    expect(third.rows).toEqual(first.rows);
  });

  it('does not let one legacy line-based entry hide a second finding on that line', () => {
    const { scan, seedReport, writeSource } = createFixture();
    const alpha = 'a'.repeat(56);
    const omega = 'c'.repeat(56);
    // The id written before the identity contained anything but rule/uri/line.
    const legacyId = crypto.createHash('sha256')
      .update(['DS173237', URI, '1'].join('\0'))
      .digest('hex')
      .slice(0, 20);
    seedReport(`- **ERROR — DS173237** — \`${URI}:1\` — ${DEFAULT_MESSAGE} <!-- devskim-id:${legacyId} -->`);

    const source = writeSource(`const pair = ["${alpha}", "${omega}"];`);
    const first = scan([at(source, alpha), at(source, omega)]);
    // The legacy entry covers one finding; the other is genuinely new.
    expect(first.newCount).toBe(1);
    expect(first.rows).toHaveLength(2);
    expect(first.rows[0].id).toBe(legacyId);
    expect(first.rows[1].where).toBe(`${URI}:1`);
    expect(first.rows[1].id).not.toBe(legacyId);

    const second = scan([at(source, alpha), at(source, omega)]);
    expect(second.newCount).toBe(0);
    expect(second.rows).toEqual(first.rows);
  });

  it('records an exact duplicate result once and two distinct same-line findings separately', () => {
    const { scan, writeSource } = createFixture();
    const alpha = 'a'.repeat(56);
    const omega = 'c'.repeat(56);
    const source = writeSource(`const pair = ["${alpha}", "${omega}"];`);

    const result = scan([at(source, alpha), at(source, alpha), at(source, omega)]);
    expect(result.newCount).toBe(2);
    expect(wheres(result.report)).toEqual([`${URI}:1`, `${URI}:1`]);
    expect(new Set(ids(result.report)).size).toBe(2);

    const repeated = scan([at(source, alpha), at(source, omega)]);
    expect(repeated.newCount).toBe(0);
    expect(repeated.rows).toEqual(result.rows);
  });

  it('keeps one entry per occurrence for byte-identical findings, whose copies cannot be told apart', () => {
    // Documented limitation: two findings that share rule, message, span text,
    // column and line text (and have no fingerprint) are indistinguishable
    // across scans. The ledger therefore tracks occurrences, not physical
    // copies: an unchanged scan appends nothing and an extra copy appends one
    // entry, but that entry cannot be guaranteed to name the inserted copy.
    const { scan, writeSource } = createFixture();
    const token = 'a'.repeat(56);
    const repeatedLine = `const token = "${token}";`;
    const first = writeSource(`${repeatedLine}\n// gap\n${repeatedLine}`);
    const recorded = scan([at(first, token, { occurrence: 0 }), at(first, token, { occurrence: 1 })]);
    expect(recorded.newCount).toBe(2);
    expect(wheres(recorded.report)).toEqual([`${URI}:1`, `${URI}:3`]);

    const unchanged = scan([at(first, token, { occurrence: 0 }), at(first, token, { occurrence: 1 })]);
    expect(unchanged.newCount).toBe(0);
    expect(unchanged.rows).toHaveLength(2);

    const withCopy = writeSource(`${repeatedLine}\n${repeatedLine}\n// gap\n${repeatedLine}`);
    const inserted = scan([
      at(withCopy, token, { occurrence: 0 }),
      at(withCopy, token, { occurrence: 1 }),
      at(withCopy, token, { occurrence: 2 }),
    ]);
    expect(inserted.newCount).toBe(1);
    expect(inserted.rows).toHaveLength(3);
  });

  it('keeps one identity whether the reported absolute span is usable or not', () => {
    const { scan, writeSource } = createFixture();
    const token = 'a'.repeat(56);
    const source = writeSource(`// header\n${sourceWithTokens(token)}`);
    const plausible = at(source, token);
    const staleOffset = at(source, token);
    staleOffset.locations[0].physicalLocation.region.charOffset += 3;
    const scrambled = scan([staleOffset]);
    expect(scrambled.newCount).toBe(1);
    expect(scrambled.rows[0].where).toBe(`${URI}:2`);

    // A renumbered file with a usable absolute span must produce the id the
    // unusable span produced: identity never depends on charOffset.
    const shifted = writeSource(`// header\n// another\n${sourceWithTokens(token)}`);
    const second = scan([at(shifted, token)]);
    expect(second.newCount).toBe(0);
    expect(second.rows).toEqual(scrambled.rows);

    // Two scans whose absolute spans are both unusable are also stable across
    // a renumber.
    const shiftedAgain = writeSource(
      `// header\n// another\n// and another\n${sourceWithTokens(token)}`
    );
    const staleShifted = at(shiftedAgain, token);
    staleShifted.locations[0].physicalLocation.region.charOffset += 3;
    const third = scan([staleShifted]);
    expect(third.newCount).toBe(0);
    expect(third.rows).toEqual(scrambled.rows);

    expect(plausible.locations[0].physicalLocation.region.charOffset).toBe(source.indexOf(token));
  });

  it('keeps one identity when the same SARIF is appended from a different workspace tree', () => {
    // The report job can reuse an older chore/devskim-report-update-* branch
    // before appending the current run's SARIF, so the checkout may not match the
    // scanned revision. The identity must come from the SARIF alone.
    const { scan, writeSource } = createFixture();
    const token = 'a'.repeat(56);
    const source = writeSource(`// header\n${sourceWithTokens(token)}`);
    const result = at(source, token);
    const recorded = scan([result]);
    expect(recorded.newCount).toBe(1);
    expect(recorded.rows[0].where).toBe(`${URI}:2`);

    // Same SARIF, a workspace whose source has changed underneath it.
    writeSource(`// header\nconst replaced = "different source";`);
    const changed = scan([result]);
    expect(changed.newCount).toBe(0);
    expect(changed.rows).toEqual(recorded.rows);

    // Same SARIF, no workspace source at all.
    writeSource('');
    const absent = scan([result]);
    expect(absent.newCount).toBe(0);
    expect(absent.rows).toEqual(recorded.rows);
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
    expect(second.rows).toHaveLength(2);
  });
});
