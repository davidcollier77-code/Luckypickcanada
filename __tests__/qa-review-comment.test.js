import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
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
import { join } from 'node:path';

/**
 * Guard for the changed-code review's pull request comment.
 *
 * This is executed, not pattern-matched: the real Python renderer turns a
 * fixture diff into a comment body, and the real workflow step from
 * `pr-scope-verification.yml` runs against a stub `gh` to prove what would be
 * posted. That covers the parts the owner reads — a suggested fix beside every
 * finding, one sticky comment updated in place instead of stacked duplicates,
 * and a size cap that refuses an oversized body rather than cutting a fix.
 */

const root = process.cwd();
const workflowPath = '.github/workflows/pr-scope-verification.yml';
const workflow = readFileSync(join(root, workflowPath), 'utf8');

/** The publish step's shell body, taken from the workflow definition itself. */
function commentStepScript() {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) =>
    line.includes('Publish the changed-code review as a pull request comment'),
  );
  expect(start).toBeGreaterThan(-1);
  const run = lines.findIndex((line, index) => index > start && line.trim() === 'run: |');
  expect(run).toBeGreaterThan(start);
  const body = [];
  for (const line of lines.slice(run + 1)) {
    if (line.trim() && !line.startsWith(' '.repeat(10))) break;
    body.push(line.startsWith(' '.repeat(10)) ? line.slice(10) : '');
  }
  return body.join('\n') + '\n';
}

const fixture = [
  {
    filename: '__tests__/lucky-meter.test.js',
    status: 'modified',
    patch: "@@ -0,0 +1,1 @@\n+it.only('renders the medallion', () => {});",
  },
  {
    filename: 'app/lib/queue.js',
    status: 'modified',
    patch: '@@ -0,0 +1,1 @@\n+} catch { }',
  },
  {
    filename: 'app/lib/legacy.js',
    status: 'modified',
    patch: "@@ -0,0 +1,1 @@\n+document.execCommand('copy');",
  },
];

const STUB_GH = `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$GH_CALL_LOG"
for argument in "$@"; do
  case "$argument" in
    body=@*) cp "\${argument#body=@}" "$POSTED_BODY" ;;
  esac
done
case "$*" in
  *"--method PATCH"*|*"--method POST"*) exit 0 ;;
esac
if [[ -n "\${EXISTING_ID:-}" ]]; then
  printf '[[{"id": %s, "body": "<!-- qa-review-report --> old"}]]' "$EXISTING_ID"
else
  printf '[[]]'
fi
`;

/** Render the comment with the real checker, then run the real workflow step. */
function renderAndPublish({ existingId = '', bodyOverride = null } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'qa-review-comment-'));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const ghPath = join(bin, 'gh');
  writeFileSync(ghPath, STUB_GH);
  chmodSync(ghPath, 0o755);

  const filesPath = join(directory, 'files.json');
  const commentPath = join(directory, 'comment.md');
  writeFileSync(filesPath, JSON.stringify(fixture));
  execFileSync(
    'python3',
    ['.github/scripts/review_pr_changes.py', '--files', filesPath, '--comment', commentPath],
    { cwd: root, stdio: 'pipe' },
  );
  if (bodyOverride !== null) writeFileSync(commentPath, bodyOverride);

  const scriptPath = join(directory, 'comment-step.sh');
  writeFileSync(scriptPath, commentStepScript());
  const callLog = join(directory, 'gh-calls.log');
  const postedBody = join(directory, 'posted.md');
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    GH_TOKEN: 'stub',
    REPOSITORY: 'owner/repo',
    PR_NUMBER: '1925',
    COMMENT_FILE: commentPath,
    GH_CALL_LOG: callLog,
    POSTED_BODY: postedBody,
    EXISTING_ID: existingId,
  };
  execFileSync('bash', [scriptPath], { cwd: root, env, stdio: 'pipe' });

  return {
    comment: readFileSync(commentPath, 'utf8'),
    posted: existsSync(postedBody) ? readFileSync(postedBody, 'utf8') : '',
    calls: existsSync(callLog)
      ? readFileSync(callLog, 'utf8').trim().split('\n').filter(Boolean)
      : [],
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

describe('changed-code review comment', () => {
  it('may write pull request comments while keeping contents read-only', () => {
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('contents: read');
  });

  it('renders a suggested fix for every finding and posts that exact body', () => {
    const run = renderAndPublish();
    try {
      expect(run.comment.startsWith('<!-- qa-review-report -->\n')).toBe(true);
      expect(run.comment).toContain('  - Suggested fix: Remove the focus so the whole suite runs');
      expect(run.comment).toContain('`catch (error) { console.error(error); }`');
      expect(run.comment).toContain('navigator.clipboard.writeText(text)');
      expect(run.comment.match(/^  - What happened: /gm)).toHaveLength(3);
      expect(run.comment.match(/^  - Evidence: /gm)).toHaveLength(3);
      expect(run.comment.match(/^  - Suggested fix: /gm)).toHaveLength(3);
      // No empty fix, and the inline code spans in the evidence stay balanced.
      expect(run.comment).not.toContain('Suggested fix: \n');
      for (const line of run.comment.split('\n').filter((l) => l.startsWith('  - Evidence: '))) {
        expect(line.split('`')).toHaveLength(3);
      }
      expect(Buffer.byteLength(run.comment, 'utf8')).toBeLessThanOrEqual(60000);
      expect(run.posted).toBe(run.comment);
    } finally {
      run.cleanup();
    }
  });

  it('creates the comment once, then updates that same sticky comment', () => {
    const first = renderAndPublish();
    try {
      expect(
        first.calls.some((call) => call.includes('--method POST repos/owner/repo/issues/1925/comments')),
      ).toBe(true);
      expect(first.calls.some((call) => call.includes('--method PATCH'))).toBe(false);
    } finally {
      first.cleanup();
    }

    const second = renderAndPublish({ existingId: '77' });
    try {
      expect(
        second.calls.some((call) => call.includes('--method PATCH repos/owner/repo/issues/comments/77')),
      ).toBe(true);
      expect(second.calls.some((call) => call.includes('--method POST'))).toBe(false);
      expect(second.posted).toBe(second.comment);
    } finally {
      second.cleanup();
    }
  });

  it('does not duplicate or publish an unmarked or oversized body', () => {
    const unmarked = renderAndPublish({ bodyOverride: '## Changed-code review: PASS\n' });
    try {
      expect(unmarked.calls).toEqual([]);
    } finally {
      unmarked.cleanup();
    }

    const oversized = renderAndPublish({
      bodyOverride: '<!-- qa-review-report -->\n' + 'a'.repeat(61000) + '\n',
    });
    try {
      // The step refuses instead of truncating, because truncation could cut a fix.
      expect(oversized.calls).toEqual([]);
    } finally {
      oversized.cleanup();
    }
  });
});
