import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

// Stable-fingerprint-first identity — mirrors the Python in devskim.yml
const id = (rule, uri, fp, line) =>
  crypto.createHash('sha256')
    .update(fp ? [rule, uri, fp].join('\0') : [rule, uri, String(line ?? '')].join('\0'), 'utf8')
    .digest('hex').slice(0, 20);

const scan = (results, known = new Set()) => {
  const seen = new Set(known);
  return results.reduce((acc, r) => {
    const rule = r.ruleId ?? 'unknown';
    const phys = (r.locations?.[0] ?? {}).physicalLocation ?? {};
    const uri = phys.artifactLocation?.uri ?? '';
    const line = phys.region?.startLine ?? null;
    const fps = r.partialFingerprints ?? r.fingerprints ?? {};
    const fp = fps.primaryLocationLineHash || fps.primaryLocationStartColumnFingerprint || '';
    const fid = id(rule, uri, fp, line);
    if (seen.has(fid)) return acc;
    seen.add(fid);
    return [...acc, { id: fid, ruleId: rule, msg: r.message?.text }];
  }, []);
};

const R = { ruleId: 'DS1', level: 'warning', message: { text: 'msg' },
  locations: [{ physicalLocation: { artifactLocation: { uri: 'a.js' }, region: { startLine: 1 } } }],
  partialFingerprints: { primaryLocationLineHash: 'fp1' } };

describe('devskim dedup', () => {
  it('appends first finding', () => {
    expect(scan([R])).toHaveLength(1);
  });

  it('skips already-recorded finding', () => {
    const ids = new Set(scan([R]).map(x => x.id));
    expect(scan([R], ids)).toHaveLength(0);
  });

  it('same fingerprint + different message = no duplicate', () => {
    const ids = new Set(scan([R]).map(x => x.id));
    expect(scan([{ ...R, message: { text: 'new wording' } }], ids)).toHaveLength(0);
  });

  it('different ruleId = new finding appended', () => {
    const ids = new Set(scan([R]).map(x => x.id));
    const out = scan([{ ...R, ruleId: 'DS2' }], ids);
    expect(out).toHaveLength(1);
    expect(out[0].ruleId).toBe('DS2');
  });
});
