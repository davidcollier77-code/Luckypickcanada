import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(process.cwd(), '.github', 'workflows', 'coderabbit-cli-review.yml');
const workflow = readFileSync(workflowPath, 'utf8');

describe('CodeRabbit CLI pull-request review workflow', () => {
  it('runs on main-targeted pull requests and refreshed commits', () => {
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('types: [opened, reopened, synchronize, ready_for_review]');
    expect(workflow).not.toContain('pull_request_target:');
  });

  it('checks for the API key before checking out PR content', () => {
    const credentialCheck = workflow.indexOf('Check for CodeRabbit Agentic API key');
    const checkout = workflow.indexOf('Checkout pull request head');
    expect(credentialCheck).toBeGreaterThanOrEqual(0);
    expect(checkout).toBeGreaterThan(credentialCheck);
    expect(workflow).toContain('secrets.CODERABBIT_API_KEY');
    expect(workflow).toContain('configured=false');
    expect(workflow).toContain('configured=true');
    expect(workflow).toContain('available=false');
    expect(workflow).toContain('available=true');
    expect(workflow).toContain('bootstrap PR that adds this workflow');
    expect(workflow).toContain('CODERABBIT_API_KEY is missing or unavailable');
  });

  it('uses pinned Actions, a pinned CLI version, and the base revision instructions', () => {
    expect(workflow).toMatch(/^        uses: actions\/checkout@[0-9a-f]{40} # v\d/m);
    expect(workflow).toContain('CODERABBIT_VERSION: 0.9.0');
    expect(workflow).toContain('CODERABBIT_CLI_DISABLE_AUTO_UPDATE: "true"');
    expect(workflow).toContain('steps.instructions.outputs.available == \'true\'');
    expect(workflow).toContain('git show "${BASE_SHA}:.coderabbit-cli-instructions.md"');
    expect(workflow).toContain('--config "$RUNNER_TEMP/coderabbit-cli-instructions.md"');
  });

  it('does not enable paid usage credits or auto-fix behavior', () => {
    expect(workflow).toContain('cr review --agent');
    expect(workflow).toContain('--api-key "$CODERABBIT_API_KEY"');
    expect(workflow).not.toContain('--use-credits');
    expect(workflow).not.toContain('git push');
    expect(workflow).not.toContain('gh pr merge');
  });

  it('surfaces sanitized CLI stderr when the review command fails', () => {
    expect(workflow).toContain('Sanitized CodeRabbit CLI stderr (last 30 lines)');
    expect(workflow).toContain('diagnostic = diagnostic.replace(secret, "[REDACTED]")');
    expect(workflow).toContain('No diagnostic text was written to stderr.');
    expect(workflow).toContain('untrusted CLI text from being interpreted as a workflow command');
    expect(workflow).toContain('startswith(("::", "##["))');
  });

  it('keeps the workflow failed when CLI review is incomplete after publishing diagnostics', () => {
    const publisher = workflow.indexOf('name: Publish or update the pull-request review comment');
    const failureGate = workflow.indexOf('name: Fail when CodeRabbit CLI review is incomplete');
    expect(publisher).toBeGreaterThanOrEqual(0);
    expect(failureGate).toBeGreaterThan(publisher);
    expect(workflow).toContain("steps.review.outcome == 'failure'");
    expect(workflow).toContain("steps.publish.outputs.review_complete != 'true'");
  });

  it('updates one comment and clearly separates incomplete reviews from clean results', () => {
    expect(workflow).toContain('<!-- coderabbit-cli-review -->');
    expect(workflow).toContain('gh api --paginate');
    expect(workflow).toContain("--jq '.[] | select(.user.login == \"github-actions[bot]\"");
    expect(workflow).toContain('| tail -n 1)"');
    expect(workflow).not.toContain('--paginate --slurp');
    expect(workflow).toContain('the output did not confirm a complete successful review');
    expect(workflow).toContain('This is not a guarantee that the pull request is defect-free.');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain('pull-requests: write');
  });
});
