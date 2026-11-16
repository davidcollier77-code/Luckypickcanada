import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard for the changed-code review's pull request comment.
 *
 * The comment is where a developer actually reads a finding, so this pins the
 * parts that make it work: write access to the pull request thread while the
 * checkout stays read-only, a sticky marker that keeps one comment instead of
 * one per run, both the create and update paths, the GitHub size limit, and the
 * rule that a transient comment failure cannot change the review gate result.
 */

const workflow = readFileSync(
  join(process.cwd(), '.github/workflows/pr-scope-verification.yml'),
  'utf8',
);

function publishStep() {
  const start = workflow.indexOf('Publish the changed-code review');
  expect(start).toBeGreaterThan(-1);
  return workflow.slice(start);
}

describe('changed-code review comment', () => {
  it('may write pull request comments while keeping contents read-only', () => {
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('contents: read');
  });

  it('publishes the review report behind a sticky marker', () => {
    expect(workflow).toContain('<!-- qa-review-report -->');
    expect(workflow).toContain('issues/${PR_NUMBER}/comments');
  });

  it('updates the existing comment instead of stacking duplicates', () => {
    expect(workflow).toContain('--method PATCH');
    expect(workflow).toContain('issues/comments/${existing}');
  });

  it('never turns a comment failure into a gate failure', () => {
    const step = publishStep();
    expect(step).toContain('if: always()');
    expect(step).toContain('continue-on-error: true');
  });

  it('stays inside the GitHub comment size limit', () => {
    const step = publishStep();
    expect(step).toContain('60000');
    expect(step).toContain('Report truncated');
  });
});
