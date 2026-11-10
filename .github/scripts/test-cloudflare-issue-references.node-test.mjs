import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  MAX_ISSUE_REFERENCES,
  collectReferences,
  extractCloudflareIssueIds,
  extractPullRequestNumbers,
} from './cloudflare-issue-references.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('./cloudflare-issue-references.mjs', import.meta.url));
const ISSUE_A = 'a94d47c2-d9e8-468d-ae61-c966c9ab7199';
const ISSUE_B = 'f8607191-3b38-4c40-84e3-6ff40a036b1f';

test('extracts an explicit Cloudflare-Issue trailer from a commit message', () => {
  const message = `fix(oracle): stop double-counting daily fortune\n\nCloudflare-Issue: ${ISSUE_A}\n`;

  assert.deepEqual(extractCloudflareIssueIds(message), [ISSUE_A]);
});

test('accepts the documented reference spellings and normalizes case', () => {
  const text = [
    `Cloudflare-Issue: ${ISSUE_A.toUpperCase()}`,
    `cloudflare issue id = ${ISSUE_B}`,
    'Cloudflare_Issue:not-a-uuid',
  ].join('\n');

  assert.deepEqual(extractCloudflareIssueIds(text), [ISSUE_A, ISSUE_B]);
});

test('ignores bare identifiers that are not labelled as a Cloudflare issue', () => {
  const text = [
    `Related log group ${ISSUE_A} was reviewed.`,
    'Cloudflare-Issue: missing-value',
    'Cloudflare Issue: 12345',
  ].join('\n');

  assert.deepEqual(extractCloudflareIssueIds(text), []);
});

test('de-duplicates repeated references and tolerates non-string input', () => {
  const text = `Cloudflare-Issue: ${ISSUE_A}\nCloudflare-Issue: ${ISSUE_A}`;

  assert.deepEqual(extractCloudflareIssueIds(text), [ISSUE_A]);
  assert.deepEqual(extractCloudflareIssueIds(undefined), []);
  assert.deepEqual(extractCloudflareIssueIds(''), []);
});

test('reads pull request numbers from merge commits and squash commits only', () => {
  assert.deepEqual(extractPullRequestNumbers('Merge pull request #1801 from owner/branch'), [1801]);
  assert.deepEqual(extractPullRequestNumbers('feat: resolve issue (#1802)'), [1802]);
  assert.deepEqual(
    extractPullRequestNumbers('chore: bump deps (#1803)\n\nMerge pull request #1804 from owner/other'),
    [1803, 1804],
  );
  assert.deepEqual(extractPullRequestNumbers('See #1805 for discussion.'), []);
});

test('combines commit trailers with the bodies of the deployed pull requests', () => {
  const references = collectReferences({
    commitMessages: [`fix: de-duplicate oracle reads\n\nCloudflare-Issue: ${ISSUE_A}\n`, 'Merge pull request #1806 from owner/fix'],
    pullRequestBodies: [`Resolves the Workers Observability issue.\n\nCloudflare-Issue: ${ISSUE_B}`],
  });

  assert.deepEqual(references.issueIds, [ISSUE_A, ISSUE_B]);
  assert.deepEqual(references.pullRequestNumbers, [1806]);
});

test('returns no references when nothing was labelled', () => {
  const references = collectReferences({
    commitMessages: ['Merge pull request #1807 from owner/unrelated'],
    pullRequestBodies: ['An unrelated change.'],
  });

  assert.deepEqual(references, { issueIds: [], pullRequestNumbers: [1807] });
});

test('caps the reference list at the Worker resolution limit', () => {
  const commitMessages = Array.from(
    { length: MAX_ISSUE_REFERENCES + 3 },
    (_, index) => `Cloudflare-Issue: 00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  );

  assert.equal(collectReferences({ commitMessages }).issueIds.length, MAX_ISSUE_REFERENCES);
});

test('the command-line interface prints the same JSON it computes', () => {
  const output = execFileSync('node', [SCRIPT_PATH], {
    input: JSON.stringify({ commitMessages: [`Merge pull request #1808 from owner/fix\n\nCloudflare-Issue: ${ISSUE_A}`] }),
    encoding: 'utf8',
  });

  assert.deepEqual(JSON.parse(output), { issueIds: [ISSUE_A], pullRequestNumbers: [1808] });
});

test('the command-line interface rejects invalid JSON input', () => {
  assert.throws(() =>
    execFileSync('node', [SCRIPT_PATH], { input: 'not-json', encoding: 'utf8', stdio: 'pipe' }),
  );
});
