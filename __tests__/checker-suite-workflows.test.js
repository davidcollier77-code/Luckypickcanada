import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');

const suite = read('.github/workflows/checker-suite.yml');
const summary = read('.github/workflows/visual-qa-summary.yml');
const upsert = read('.github/scripts/upsert_pr_comment.sh');
const checker = read('.github/scripts/checker_suite.py');

describe('independent checker workflows', () => {
  it('uses only triggers that do not run pull-request code with write access', () => {
    expect(suite).toContain('pull_request_target:');
    expect(summary).toContain('workflow_run:');
    for (const workflow of [suite, summary]) {
      expect(workflow).not.toContain('\n  pull_request:');
      expect(workflow).toContain('pull-requests: write');
      expect(workflow).toContain('ref: main');
    }
  });

  it('never checks out the pull request head in a workflow that can comment', () => {
    for (const workflow of [suite, summary]) {
      expect(workflow).not.toContain('pull_request.head.sha');
      expect(workflow).not.toContain('head.repo');
    }
  });

  it('publishes each responsibility through its own sticky marker', () => {
    const pairs = [
      ['<!-- qa-test-quality -->', 'test-quality'],
      ['<!-- qa-performance -->', 'performance'],
      ['<!-- qa-security-summary -->', 'security-summary'],
      ['<!-- qa-browser-summary -->', 'browser-summary'],
    ];
    for (const [marker, mode] of pairs) {
      expect(checker).toContain(`"${mode}": "${marker}"`);
    }
    const workflowText = suite + summary;
    for (const [marker] of pairs) {
      expect(workflowText).toContain(`'${marker}'`);
    }
  });

  it('keeps every comment step advisory and self-updating', () => {
    const publishSteps = (suite + summary)
      .split('- name: Publish')
      .slice(1)
      .map((chunk) => chunk.split('\n      - ')[0]);
    expect(publishSteps.length).toBe(4);
    for (const step of publishSteps) {
      expect(step).toContain('continue-on-error: true');
      expect(step).toContain('if: always()');
      expect(step).toContain('upsert_pr_comment.sh');
    }
  });

  it('refuses an unmarked or oversized body instead of truncating it', () => {
    expect(upsert).toContain('head -n 1');
    expect(upsert).toContain('60000');
    expect(upsert).toContain('issues/comments/${existing}');
    expect(upsert).toContain('PATCH');
    expect(upsert).toContain('issues/${PR_NUMBER}/comments');
    expect(upsert).toContain('POST');
  });

  it('keeps the four checker modes in one advisory module', () => {
    for (const mode of ['test-quality', 'performance', 'security-summary', 'browser-summary']) {
      expect(checker).toContain(`"${mode}"`);
    }
    expect(checker).toContain('MARKERS');
  });

  it('does not grant security-events write or actions write', () => {
    for (const workflow of [suite, summary]) {
      expect(workflow).not.toContain('security-events: write');
      expect(workflow).not.toContain('actions: write');
      expect(workflow).not.toContain('contents: write');
    }
  });
});
