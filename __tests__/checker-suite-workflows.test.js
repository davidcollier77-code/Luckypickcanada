import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');

const reportWorkflow = read('.github/workflows/pr-verification-report.yml');
const reportScript = read('.github/scripts/pr_verification_report.py');
const visualQa = read('.github/workflows/visual-qa.yml');
const devskim = read('.github/workflows/devskim.yml');
const scopeWorkflow = read('.github/workflows/pr-scope-verification.yml');
const integrityWorkflow = read('.github/workflows/verification-integrity.yml');
const protectedWorkflow = read('.github/workflows/protected-files.yml');
const dependabot = read('.github/dependabot.yml');
const upsert = read('.github/scripts/upsert_pr_comment.sh');
const suite = read('.github/scripts/checker_suite.py');

const CATEGORY_NAMES = [
  'QA Checker',
  'DevSkim',
  'PR Scope Verification',
  'Protected File Changes',
  'Verification Integrity',
  'Governance and Workflow Verification',
  'Dependency Health & Vulnerability Review',
];

describe('consolidated PR verification report', () => {
  it('publishes exactly the seven top-level checker categories', () => {
    for (const name of CATEGORY_NAMES) {
      expect(reportScript).toContain(`"${name}"`);
    }
    // The category tuple is the only place the ordered names are declared.
    const block = reportScript.split('CATEGORIES = (')[1].split(')\nCATEGORY_NAMES')[0];
    const names = [...block.matchAll(/\("([a-z-]+)", "([^"]+)"\)/g)].map((match) => match[2]);
    expect(names).toEqual(CATEGORY_NAMES);
  });

  it('limits the report to the four required statuses', () => {
    expect(reportScript).toContain('STATUSES = (PASSED, FAILED, WARNING, NOT_RUN)');
    const statusBlock = reportScript.split('PASSED = "PASSED"')[1].split('STATUSES =')[0];
    expect(statusBlock).toContain('FAILED = "FAILED"');
    expect(statusBlock).toContain('WARNING = "WARNING"');
    expect(statusBlock).toContain('NOT_RUN = "NOT RUN"');
    expect(reportScript).not.toContain('BLOCKED =');
    // The renderer's tables and sections use the report vocabulary only.
    expect(reportScript).toContain('"| # | Checker category | Status | Summary |"');
    expect(reportScript).toContain('"### %d. %s — %s"');
  });

  it('keeps Visual QA inside QA Checker and both shards visible', () => {
    expect(reportScript).toContain('"Visual QA (shard 1/2)"');
    expect(reportScript).toContain('"Visual QA (shard 2/2)"');
    expect(reportScript).toContain('QA_SUPPORTING_CHECKS');
    const block = reportScript.split('CATEGORIES = (')[1].split(')\n')[0];
    expect(block).not.toContain('Visual QA');
    expect(existsSync(join(process.cwd(), '.github/workflows/visual-qa-summary.yml'))).toBe(
      false,
    );
    expect(existsSync(join(process.cwd(), '.github/workflows/checker-suite.yml'))).toBe(false);
  });

  it('publishes one sticky comment and updates it in place', () => {
    expect(reportWorkflow.match(/upsert_pr_comment\.sh/g)).toHaveLength(1);
    expect(reportWorkflow).toContain("'<!-- qa-verification-report -->'");
    expect(reportWorkflow).toContain('Publish or update the consolidated report');
  });

  it('refreshes after owner approvals and never leaves a stale report', () => {
    expect(reportWorkflow).toContain('issue_comment:');
    expect(reportWorkflow).toContain('github.event.issue.number');
    expect(reportWorkflow).toContain(
      "startsWith(github.event.comment.body, '/approve-')",
    );
    expect(reportWorkflow).toContain('check-runs?per_page=100&filter=all');
    expect(reportWorkflow).toContain('[.[].check_runs[]]');
    expect(reportWorkflow).toContain('NOT RUN placeholder');
    expect(reportWorkflow).toContain('RENDER_STATUS');
    expect(upsert).toContain('refusing to leave a stale report visible');
  });

  it('runs Dependency Health and Vulnerability Review on every pull request', () => {
    expect(reportScript).toContain('Dependency Health & Vulnerability Review');
    expect(reportScript).toContain('does not depend on a Dependabot update having run');
    expect(reportScript).toContain('not duplicate the DevSkim security check');
    expect(reportWorkflow).toContain('dependabot/alerts?state=open&per_page=100');
    // The weekly updater stays configured exactly as before.
    expect(dependabot.match(/interval: weekly/g)).toHaveLength(2);
  });

  it('uses only trusted-event triggers and never executes pull request code', () => {
    expect(reportWorkflow).toContain('pull_request_target:');
    expect(reportWorkflow).toContain('workflow_run:');
    expect(reportWorkflow).toContain('ref: main');
    expect(reportWorkflow).not.toContain('pull_request.head.sha');
    expect(reportWorkflow).not.toContain('head.repo');
    expect(reportWorkflow).not.toContain('contents: write');
    expect(reportWorkflow).not.toContain('actions: write');
    expect(reportWorkflow).not.toContain('security-events: write');
    for (const workflow of [
      'Visual QA',
      'DevSkim',
      'Validate OpenNext Repair',
      'PR Scope Verification',
      'Protected File Changes',
      'Verification Integrity',
    ]) {
      expect(reportWorkflow).toContain(workflow);
    }
  });

  it('keeps the upsert script refusing unmarked or oversized bodies', () => {
    expect(upsert).toContain('head -n 1');
    expect(upsert).toContain('60000');
    expect(upsert).toContain('issues/comments/${existing}');
    expect(upsert).toContain('PATCH');
    expect(upsert).toContain('issues/${PR_NUMBER}/comments');
    expect(upsert).toContain('POST');
  });

  it('keeps the advisory checker modes available as detailed evidence', () => {
    for (const mode of ['test-quality', 'performance', 'security-summary', 'browser-summary']) {
      expect(suite).toContain(`"${mode}"`);
    }
    expect(reportScript).toContain('review_test_quality');
    expect(reportScript).toContain('review_performance');
    expect(reportScript).toContain('review_files');
  });
});

describe('preserved automated QA', () => {
  it('keeps the full unit suite, type check and two Playwright shards', () => {
    expect(visualQa).toContain('pnpm run test');
    expect(visualQa).toContain('pnpm exec tsc --noEmit');
    expect(visualQa).toContain('shard: [1, 2]');
    expect(visualQa).toContain('--shard=${{ matrix.shard }}/2');
    expect(visualQa).toContain('name: Visual QA (shard ${{ matrix.shard }}/2)');
    expect(visualQa).toContain('Verify committed visual baselines');
    expect(visualQa).toContain('playwright install --with-deps chromium');
    expect(visualQa).toContain('Upload Playwright report');
    expect(visualQa).toContain('test_pr_verification_report');
    expect(visualQa).toContain('pr_verification_report.py');
  });

  it('keeps DevSkim scanning, suppression, SARIF replay and upload unchanged', () => {
    expect(devskim).toContain('microsoft/DevSkim-Action@');
    expect(devskim).toContain('suppress_devskim_false_positives.py');
    expect(devskim).toContain('test_suppress_devskim_false_positives.py');
    expect(devskim).toContain('verify_devskim_sarif_replay.py');
    expect(devskim).toContain('upload-sarif@');
    expect(devskim).toContain('summarize_devskim_findings.py');
    expect(devskim).toContain('devskim-alerts.raw.sarif');
  });

  it('keeps the weekly Dependabot update configuration', () => {
    expect(dependabot).toContain('package-ecosystem: github-actions');
    expect(dependabot).toContain('package-ecosystem: npm');
    expect(dependabot.match(/interval: weekly/g)).toHaveLength(2);
  });

  it('keeps the scope and protected-file gates in place', () => {
    expect(scopeWorkflow).toContain('check_qa_pr_scope.py');
    expect(scopeWorkflow).not.toContain('<!-- qa-review-report -->');
    expect(scopeWorkflow).toContain('review_pr_changes.py');

    expect(protectedWorkflow).toContain('environment:');
    expect(protectedWorkflow).toContain('name: protected-file-authorization');
    expect(protectedWorkflow).toContain('protected_changed');
    expect(protectedWorkflow).toContain('failing closed');

    expect(integrityWorkflow).toContain('verify_pr_verification_status.py');
    expect(integrityWorkflow).toContain('--wait-seconds');
  });
});
