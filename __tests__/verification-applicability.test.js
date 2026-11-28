import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');

const validate = read('.github/workflows/validate-open-next-repair.yml');
const visual = read('.github/workflows/visual-qa.yml');
const integrity = read('.github/workflows/verification-integrity.yml');
const reportWorkflow = read('.github/workflows/pr-verification-report.yml');
const reportScript = read('.github/scripts/pr_verification_report.py');
const auditScript = read('.github/scripts/verify_pr_verification_status.py');
const helper = read('.github/scripts/compute-applicability.sh');
const devskim = read('.github/workflows/devskim.yml');
const dependabot = read('.github/dependabot.yml');

describe('build applicability gate', () => {
  it('classifies before the protected build job and gates it fail-closed', () => {
    expect(validate).toContain('name: Detect build changes');
    expect(validate).toContain('build_required: ${{ steps.classify.outputs.build_required }}');
    expect(validate).toContain('needs: changes');
    expect(validate).toContain(
      "if: needs.changes.outputs.build_required != 'false'",
    );
    expect(validate).toMatch(/requiring the build \(fail closed\)/);
    // A missing or unexpected decision keeps the build required.
    expect(validate).toContain('decision="build_required=true"');
    // The 495 MiB hard cap and OpenNext validation are untouched.
    expect(validate).toContain('495 * 1024 * 1024');
    expect(validate).toContain('pnpm exec opennextjs-cloudflare build');
    expect(validate).toContain('pnpm exec wrangler build --config ./wrangler.jsonc');
  });

  it('always builds for merge groups and manual dispatches', () => {
    expect(validate).toContain("if [[ \"$EVENT_NAME\" != 'pull_request'");
    expect(validate).toContain('A full build is required for $EVENT_NAME');
  });
});

describe('trusted applicability recomputation', () => {
  it('recomputes from the trusted checkout, never from the pull request head', () => {
    expect(reportWorkflow).toContain('ref: main');
    expect(reportWorkflow).toContain('compute-applicability.sh');
    expect(integrity).toContain('compute-applicability.sh');
    expect(reportWorkflow.indexOf('compute-applicability.sh')).toBeGreaterThan(
      reportWorkflow.indexOf('Fetch pull request, diff, comments and current-head checks'),
    );
    expect(reportWorkflow).toContain('--build-required');
    expect(reportWorkflow).toContain('--visual-required');
    expect(integrity).toContain('--build-required');
    expect(integrity).toContain('--visual-required');
  });

  it('fails closed when the classifier, file list or declaration cannot be read', () => {
    expect(helper).toContain('fail_closed');
    expect(helper).toContain('build_required=true');
    expect(helper).toContain('visual_required=true');
    expect(helper).toContain('any(.[]; .filename == "package.json")');
    expect(helper).toContain('impact.get("required")');
    expect(helper).toContain('--declared-visual-required');
  });

  it('makes a required-but-skipped check blocking and a not-applicable one harmless', () => {
    expect(auditScript).toContain('BUILD_CHECK');
    expect(auditScript).toContain('applicability(build_required)');
    expect(auditScript).toContain('record["blocking"] = visual_applicable is True');
    expect(auditScript).toContain('record["applicable"] = False');
    expect(auditScript).toContain('for record in required + conditional:');
  });

  it('reports an authorized skip honestly instead of warning or passing', () => {
    const skipContract = read('.github/scripts/qa_skip.py');
    expect(reportScript).toContain('"Application Verification"');
    expect(skipContract).toContain('SKIPPED — NOT APPLICABLE');
    expect(reportScript).toContain('qa_skip.is_authorized_record');
    expect(reportScript).toContain('row.get("applicable") is not False');
    expect(reportScript).toContain('conditional_required');
    // The individual skip is never a category status, so the fixed four
    // statuses and seven categories are unchanged.
    expect(reportScript).not.toContain('BLOCKED =');
  });
});

describe('preserved safeguards', () => {
  it('keeps the always-on application verification for every pull request', () => {
    expect(visual).toContain('name: Application Verification');
    const verify = visual.slice(visual.indexOf('\n  verify:'), visual.indexOf('\n  visual:'));
    expect(verify).not.toMatch(/^    if:/m);
    expect(verify).toContain('pnpm run test');
    expect(verify).toContain('pnpm exec tsc --noEmit');
    // The browser install is unconditional inside the classifier-gated job, so
    // it cannot silently reuse a browser from an older Playwright version.
    expect(visual).toContain('Install Chromium with its system dependencies');
    expect(visual).not.toContain('verify-playwright-cache.sh');
  });

  it('keeps DevSkim, CodeQL default setup and Dependabot unchanged', () => {
    expect(devskim).toContain('microsoft/DevSkim-Action@');
    expect(devskim).toContain('upload-sarif@');
    expect(devskim).toContain('suppress_devskim_false_positives.py');
    expect(dependabot.match(/interval: weekly/g)).toHaveLength(2);
    // CodeQL is GitHub default setup; no repository CodeQL workflow exists.
    expect(() => read('.github/workflows/codeql.yml')).toThrow();
  });
});
