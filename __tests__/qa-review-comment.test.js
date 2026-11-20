import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
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
 * Executed guard for the consolidated PR verification report comment.
 *
 * The real Python renderer turns fixture evidence into the seven-category
 * report, and the real `upsert_pr_comment.sh` publishes it against a stub `gh`
 * to prove the parts the owner reads: one sticky comment updated in place
 * instead of stacked duplicates, the changed-code findings retained inside the
 * QA Checker section, and a size/marker guard that refuses an invalid body
 * rather than cutting a finding in half.
 */

const root = process.cwd();
const HEAD = '0123456789abcdef0123456789abcdef01234567';

const fixtureFiles = [
  {
    filename: 'app/lib/queue.js',
    status: 'modified',
    patch: '@@ -0,0 +1,1 @@\n+} catch { }',
  },
];

const fixtureVerification = {
  pr: { number: 42, head_sha: HEAD, head_ref: 'fixture' },
  head_commit: { sha: HEAD, skip_directives: [] },
  required_checks: [
    {
      name: 'DevSkim scan and Security upload',
      status: 'PASS',
      detail: 'conclusion success',
      head_sha: HEAD,
    },
    {
      name: 'Validate OpenNext build artifacts',
      status: 'PASS',
      detail: 'conclusion success',
      head_sha: HEAD,
    },
    {
      name: 'PR Scope Verification',
      status: 'PASS',
      detail: 'conclusion success',
      head_sha: HEAD,
    },
  ],
  conditional_checks: [
    {
      name: 'Visual QA',
      status: 'PASS',
      detail: 'all matching checks succeeded',
      head_sha: HEAD,
    },
  ],
  other_checks: [],
  stale_check_runs: [],
  overall_status: 'VERIFIED',
  blocking_reasons: [],
};

const STUB_GH = `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$GH_CALL_LOG"
case "$*" in
  *"--jq"*)
    if [[ -n "\${EXISTING_ID:-}" ]]; then
      printf '%s\\n' "$EXISTING_ID"
    fi
    ;;
  *"-X PATCH"*|*"-X POST"*)
    for argument in "$@"; do
      case "$argument" in
        body=@*) cp "\${argument#body=@}" "$POSTED_BODY" ;;
      esac
    done
    ;;
esac
`;

function renderAndPublish({ existingId = '', bodyOverride = null } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'qa-verification-report-'));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const ghPath = join(bin, 'gh');
  writeFileSync(ghPath, STUB_GH);
  chmodSync(ghPath, 0o755);

  const write = (name, value) => {
    const path = join(directory, name);
    writeFileSync(path, JSON.stringify(value));
    return path;
  };

  const prPath = write('pr.json', {
    number: 42,
    body: '## Purpose\nFixture report rendering.\n',
    head: { sha: HEAD, ref: 'fixture' },
    changed_files: fixtureFiles.length,
    user: { login: 'freebuff-agent' },
  });
  const filesPath = write('files.json', fixtureFiles);
  const commentsPath = write('comments.json', []);
  const checksPath = write('checks.json', {
    check_runs: [
      {
        name: 'Visual QA',
        status: 'completed',
        conclusion: 'success',
        head_sha: HEAD,
      },
    ],
  });
  const verificationPath = write('verification.json', fixtureVerification);
  const alertsPath = write('alerts.json', []);
  const dependencyAlertsPath = write('dependency-alerts.json', []);
  const commentPath = join(directory, 'comment.md');

  const rendered = spawnSync(
    'python3',
    [
      '.github/scripts/pr_verification_report.py',
      '--pull-request',
      prPath,
      '--files',
      filesPath,
      '--comments',
      commentsPath,
      '--checks',
      checksPath,
      '--verification',
      verificationPath,
      '--alerts',
      alertsPath,
      '--dependency-alerts',
      dependencyAlertsPath,
      '--owner',
      'davidcollier77-code',
      '--comment',
      commentPath,
    ],
    { cwd: root, encoding: 'utf8' },
  );

  if (bodyOverride !== null) writeFileSync(commentPath, bodyOverride);

  const callLog = join(directory, 'gh-calls.log');
  const postedBody = join(directory, 'posted.md');
  const published = spawnSync(
    'bash',
    ['.github/scripts/upsert_pr_comment.sh', '<!-- qa-verification-report -->', commentPath],
    {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        GH_TOKEN: 'stub',
        REPOSITORY: 'owner/repo',
        PR_NUMBER: '42',
        GH_CALL_LOG: callLog,
        POSTED_BODY: postedBody,
        EXISTING_ID: existingId,
      },
    },
  );

  return {
    renderStatus: rendered.status,
    publishStatus: published.status,
    comment: existsSync(commentPath) ? readFileSync(commentPath, 'utf8') : '',
    posted: existsSync(postedBody) ? readFileSync(postedBody, 'utf8') : '',
    calls: existsSync(callLog)
      ? readFileSync(callLog, 'utf8').trim().split('\n').filter(Boolean)
      : [],
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

describe('consolidated verification report comment', () => {
  it('renders every category and keeps changed-code findings with a suggested fix', () => {
    const run = renderAndPublish();
    try {
      expect(run.renderStatus).toBe(1); // a missing declaration is FAILED, and the body is still rendered
      expect(run.comment.startsWith('<!-- qa-verification-report -->\n')).toBe(true);
      for (const name of [
        'QA Checker',
        'DevSkim',
        'PR Scope Verification',
        'Protected File Changes',
        'Verification Integrity',
        'Governance and Workflow Verification',
        'Dependency Health & Vulnerability Review',
      ]) {
        expect(run.comment).toContain(name);
      }
      expect(run.comment.match(/^### \d\. /gm)).toHaveLength(7);
      expect(run.comment).toContain('Automated changed-code review');
      expect(run.comment).toContain('What happened:');
      expect(run.comment).toContain('`catch (error) { console.error(error); }`');
      expect(run.comment).toContain('Evidence: `} catch { }`');
      expect(run.comment).toContain('**NOT RUN**');
      expect(Buffer.byteLength(run.comment, 'utf8')).toBeLessThanOrEqual(60000);
    } finally {
      run.cleanup();
    }
  });

  it('creates the comment once, then updates that same sticky comment', () => {
    const first = renderAndPublish();
    try {
      expect(first.publishStatus).toBe(0);
      expect(
        first.calls.some((call) => call.includes('-X POST repos/owner/repo/issues/42/comments')),
      ).toBe(true);
      expect(first.calls.some((call) => call.includes('PATCH'))).toBe(false);
      expect(first.posted).toBe(first.comment);
    } finally {
      first.cleanup();
    }

    const second = renderAndPublish({ existingId: '77' });
    try {
      expect(second.publishStatus).toBe(0);
      expect(
        second.calls.some((call) => call.includes('PATCH repos/owner/repo/issues/comments/77')),
      ).toBe(true);
      expect(second.calls.some((call) => call.includes('-X POST'))).toBe(false);
      expect(second.posted).toBe(second.comment);
    } finally {
      second.cleanup();
    }
  });

  it('does not publish an unmarked or oversized body', () => {
    const unmarked = renderAndPublish({ bodyOverride: '## Verification report\n' });
    try {
      expect(unmarked.publishStatus).not.toBe(0);
      expect(unmarked.calls).toEqual([]);
    } finally {
      unmarked.cleanup();
    }

    const oversized = renderAndPublish({
      bodyOverride: '<!-- qa-verification-report -->\n' + 'a'.repeat(61000) + '\n',
    });
    try {
      expect(oversized.publishStatus).not.toBe(0);
      expect(oversized.calls).toEqual([]);
    } finally {
      oversized.cleanup();
    }
  });
});
