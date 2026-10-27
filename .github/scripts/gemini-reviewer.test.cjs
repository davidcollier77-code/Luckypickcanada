const assert = require('assert');
const { generateFindingId, serializeReviewState, extractReviewState, parseSelectedIds, parseReviewAction, buildReviewVerdict } = require('./gemini-reviewer.cjs');

// Test generateFindingId
const finding1 = { path: 'src/app.js', line: 10, title: 'Missing await' };
const finding2 = { path: 'src/app.js', line: 10, title: 'missing await' };
const finding3 = { path: 'src/utils.js', line: 5, title: 'No return' };

const id1 = generateFindingId(finding1);
const id2 = generateFindingId(finding2);
const id3 = generateFindingId(finding3);

assert.strictEqual(id1, id2, 'Finding IDs should be case-insensitive on title');
assert.notStrictEqual(id1, id3, 'Different findings should have different IDs');
assert.match(id1, /^[a-f0-9]{12}$/, 'Finding ID should be a 12-character SHA-256 prefix');

// Test serializeReviewState and extractReviewState
const sha = 'abcdef1234567890abcdef1234567890abcdef12';
const findings = [
  { ...finding1, problem: 'Not awaiting', fix: 'Add await', suggestion: 'await foo()', inline: true },
  { ...finding3, problem: 'Missing return', fix: 'Add return', suggestion: null, inline: false }
];

const stateStr = serializeReviewState(sha, findings);
assert.ok(stateStr.includes('<!-- gemini-review-state: {'), 'State should be in a hidden comment');
assert.ok(stateStr.includes(id1), 'State should contain finding ID');
assert.ok(stateStr.includes(id3), 'State should contain finding ID');

const extracted = extractReviewState('Some text before\n' + stateStr + '\nSome text after');
assert.deepStrictEqual(extracted.sha, sha, 'Extracted SHA should match');
assert.strictEqual(extracted.findings.length, 2, 'Should extract all findings');
assert.strictEqual(extracted.findings[0].id, id1, 'Extracted finding should have correct ID');
assert.strictEqual(extracted.findings[0].title, finding1.title, 'Extracted finding should have correct title');

// Test the checkbox-selection flow without exposing finding IDs as user commands.
const tick = String.fromCharCode(96);
const findingCheckbox = '- [x] Finding ' + tick + id1 + tick + ': selected finding';
assert.deepStrictEqual(parseSelectedIds(findingCheckbox), [id1], 'Selected finding checkbox should resolve to its internal ID');
assert.strictEqual(parseReviewAction(findingCheckbox, ''), null, 'Selecting a finding alone must not start a repair');
const selectedActionBody = findingCheckbox + '\n- [x] 🛠️ **Fix selected findings**';
assert.deepStrictEqual(parseReviewAction(selectedActionBody, ''), {
  mode: 'fix-selected', targetFinding: [id1]
}, 'Selected-repair action should target only checked findings');
assert.strictEqual(parseReviewAction(selectedActionBody, selectedActionBody), null, 'An already-checked action should not trigger twice');
assert.deepStrictEqual(parseReviewAction('- [x] 🪄 **Fix all findings**', ''), {
  mode: 'fix'
}, 'Fix-all action should request the full eligible finding set');
assert.strictEqual(parseReviewAction('- [ ] 🪄 **Fix all findings**', ''), null, 'Unchecked action must not trigger a repair');

// Test coverage reporting check (Coverage Gaps logic)
const noGaps = buildReviewVerdict([{path: 'x', title: 'y'}], []);
assert.strictEqual(noGaps.marker, '🔴', 'Should flag actionable findings');

const withGapsNoFindings = buildReviewVerdict([], ['Batch 1 failed']);
assert.strictEqual(withGapsNoFindings.marker, '🟡', 'Should flag incomplete review');

const noGapsNoFindings = buildReviewVerdict([], []);
assert.strictEqual(noGapsNoFindings.marker, '🟢', 'Should flag complete review with no findings');

console.log('All reviewer state and ID tests passed.');
