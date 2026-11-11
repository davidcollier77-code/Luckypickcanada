import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Execution and source guard for `specs/098-visual-qa-chromium-cache`.
 *
 * The classifier is executed against real path lists, so the skip/require
 * decisions (including the fail-closed cases) are verified behaviour rather
 * than pattern matches. The workflow assertions then confirm that those
 * decisions actually drive the Chromium install and the visual regression run.
 */

const root = process.cwd();
const workflowPath = '.github/workflows/visual-qa.yml';
const classifierPath = '.github/scripts/classify-visual-changes.sh';

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const workflow = read(workflowPath);
const playwrightConfig = read('playwright.config.ts');

function classify(paths) {
  return execFileSync('bash', [join(root, classifierPath)], {
    input: Array.isArray(paths) ? paths.join('\n') : paths,
    encoding: 'utf8',
  }).trim();
}

/** Return the YAML block of an exact `- name:` step, without later steps. */
function stepBlock(name) {
  const marker = `      - name: ${name}`;
  const start = workflow.indexOf(marker);
  if (start === -1) return null;
  const rest = workflow.slice(start + marker.length);
  const boundaries = [rest.search(/\n {6}- /), rest.search(/\n {2}[a-zA-Z0-9_-]+:\n/)].filter(
    (index) => index !== -1,
  );
  return rest.slice(0, boundaries.length ? Math.min(...boundaries) : rest.length);
}

/** Return one top-level job block (`  verify:`), without later jobs. */
function jobBlock(name) {
  const marker = `\n  ${name}:\n`;
  const start = workflow.indexOf(marker);
  if (start === -1) return null;
  const rest = workflow.slice(start + marker.length);
  const nextJob = rest.search(/\n {2}[a-zA-Z0-9_-]+:\n/);
  return rest.slice(0, nextJob === -1 ? rest.length : nextJob);
}

describe('visual QA change classification', () => {
  it('requires visual QA for application, theme and asset changes', () => {
    expect(classify(['app/page.js'])).toBe('visual_required=true');
    expect(classify(['themes/default/homepage.css'])).toBe('visual_required=true');
    expect(classify(['public/themes/default/hero.webp'])).toBe('visual_required=true');
    expect(classify(['tests/visual/homepage.spec.ts'])).toBe('visual_required=true');
    expect(classify(['tests/e2e/homepage.spec.ts'])).toBe('visual_required=true');
    expect(classify(['playwright.config.ts'])).toBe('visual_required=true');
  });

  it('requires visual QA when any changed path can affect rendered output', () => {
    expect(classify(['PR_SUMMARY.md', 'app/homepage/Hero.js', 'specs/x/spec.md'])).toBe(
      'visual_required=true',
    );
  });

  it('skips visual QA for documentation, Spec Kit pointer and unit-test-only changes', () => {
    expect(classify(['PR_SUMMARY.md'])).toBe('visual_required=false');
    expect(classify(['.specify/feature.json'])).toBe('visual_required=false');
    expect(classify(['.github/scripts/classify-visual-changes.sh'])).toBe('visual_required=false');
    expect(classify(['__tests__/agent-governance-single-source.test.js'])).toBe('visual_required=false');
    expect(classify(['__tests__/crystal-ball-daily-usage.test.js'])).toBe('visual_required=false');
    expect(
      classify([
        'specs/098-visual-qa-chromium-cache/spec.md',
        'memory-bank/activeContext.md',
        '.docs/manifest.json',
        'AGENTS.md',
      ]),
    ).toBe('visual_required=false');
  });

  it('fails closed when the change set is empty or cannot be classified', () => {
    expect(classify('')).toBe('visual_required=true');
    expect(classify('\n\n')).toBe('visual_required=true');
    // Unknown file types are not documentation-only, so they request visual QA.
    expect(classify(['scripts/unknown-tool.sh'])).toBe('visual_required=true');
    expect(classify(['LICENSE'])).toBe('visual_required=true');
  });

  it('tolerates CRLF input and ignores blank lines', () => {
    expect(classify('README.md\r\n\r\nspecs/x/tasks.md\r\n')).toBe('visual_required=false');
  });
});

describe('visual QA workflow wiring', () => {
  it('publishes the classifier result as a job output', () => {
    expect(workflow).toContain('visual_required: ${{ steps.classify.outputs.visual_required }}');
    expect(workflow).toContain(`bash ${classifierPath}`);
    // Every uncertain path in the classification step must request visual QA.
    const classifyStep = stepBlock('Classify pull request change set');
    expect(classifyStep).not.toBeNull();
    expect(classifyStep).toContain('::warning::');
    // One fallback for a failed file listing, two for a failed or unexpected
    // classification, plus the case label that accepts both valid values.
    expect(classifyStep.match(/visual_required=true/g) ?? []).toHaveLength(4);
    expect(classifyStep).toContain('case "$classification" in');
  });

  it('runs verification for every pull request and the browser job only after the classifier', () => {
    const verify = jobBlock('verify');
    expect(verify, 'the stable Visual QA verification job must exist').not.toBeNull();
    expect(verify).toMatch(/name: Visual QA\n {4}needs: changes/);
    expect(verify).not.toContain('visual_required');

    const visual = jobBlock('visual');
    expect(visual, 'the Playwright job must exist').not.toBeNull();
    expect(visual).toContain("if: needs.changes.outputs.visual_required == 'true'");

    // These checks must keep running for every pull request, visual or not.
    // The full suite also contains the two files the former targeted step ran.
    for (const step of ['Run all unit tests', 'Run AGENTS.md Spec Kit verification']) {
      const block = stepBlock(step);
      expect(block, `${step} must remain in the workflow`).not.toBeNull();
      expect(block, `${step} must not be gated on visual changes`).not.toContain('visual_required');
    }
    expect(stepBlock('Run all unit tests')).toContain('pnpm run test');
    expect(stepBlock('Run AGENTS.md Spec Kit verification')).toContain('./freebuff-verify.sh');
    expect(stepBlock('Run AGENTS.md Spec Kit verification')).toContain(
      'SPEC_KIT_PR_AUTHOR: ${{ github.event.pull_request.user.login }}',
    );
    // freebuff-verify.sh runs the TypeScript check and the production build.
    expect(workflow).not.toContain('Run standalone TypeScript check');
    expect(workflow).not.toContain('Run targeted Crystal Ball allowance');
  });

  it('caches Chromium under a Playwright-version and OS key', () => {
    const cacheStep = stepBlock('Restore cached Playwright Chromium');
    expect(cacheStep).not.toBeNull();
    expect(cacheStep).toContain('uses: actions/cache@v6');
    expect(cacheStep).toContain('path: ~/.cache/ms-playwright');
    expect(cacheStep).toContain(
      'key: playwright-chromium-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}',
    );
    // No restore-keys: a version change must invalidate rather than reuse a stale build.
    expect(cacheStep).not.toContain('restore-keys');

    const versionStep = stepBlock('Resolve installed Playwright version');
    expect(versionStep).not.toBeNull();
    expect(versionStep).toContain('pnpm exec playwright --version');
    expect(versionStep).toContain('^[0-9]+\\.[0-9]+\\.[0-9]+$');
    expect(versionStep).toContain('exit 1');
  });

  it('installs only Chromium, and only in the classifier-gated visual job', () => {
    // The whole visual job is gated, so its steps do not repeat the job-level
    // condition. Chromium cache-hit branching stays step-level.
    expect(jobBlock('visual')).toContain(
      "if: needs.changes.outputs.visual_required == 'true'",
    );

    const missInstall = stepBlock('Install Playwright Chromium (cache miss)');
    expect(missInstall).not.toBeNull();
    expect(missInstall).toContain("steps.playwright-cache.outputs.cache-hit != 'true'");
    expect(missInstall).toContain('pnpm exec playwright install --with-deps chromium');

    const hitDeps = stepBlock('Install Playwright system dependencies (cache hit)');
    expect(hitDeps).not.toBeNull();
    expect(hitDeps).toContain("steps.playwright-cache.outputs.cache-hit == 'true'");
    expect(hitDeps).toContain('pnpm exec playwright install-deps chromium');

    // No workflow step may pull in Firefox or WebKit.
    expect(workflow).not.toMatch(/playwright install[^\n]*\b(firefox|webkit)\b/);
    expect(workflow).not.toMatch(/\b(firefox|webkit)\b/i);
  });

  it('gates baseline verification and the visual regression run on the classifier', () => {
    const visual = jobBlock('visual');
    expect(visual).toContain("if: needs.changes.outputs.visual_required == 'true'");
    for (const step of ['Verify committed visual baselines', 'Run visual regression tests']) {
      expect(stepBlock(step), `${step} must remain in the workflow`).not.toBeNull();
    }
    expect(stepBlock('Run visual regression tests')).toContain('pnpm exec playwright test');
  });

  it('runs the complete Playwright suite in two required shards', () => {
    const visual = jobBlock('visual');
    expect(visual).toMatch(/strategy:\n {6}fail-fast: false/);
    expect(visual).toMatch(/shard: \[1, 2\]/);
    expect(visual).toContain('--shard=${{ matrix.shard }}/2');
    expect(visual).toContain('name: Visual QA (shard ${{ matrix.shard }}/2)');
  });

  it('runs independent spec files with two CI workers while keeping in-file tests ordered', () => {
    expect(playwrightConfig).toContain('fullyParallel: false');
    expect(playwrightConfig).toContain('workers: process.env.CI ? 2 : undefined');
    expect(playwrightConfig).not.toContain('workers: process.env.CI ? 1 : undefined');
  });

  it('restores the pnpm store before frozen-lockfile installation', () => {
    const pnpmSetupIndex = workflow.indexOf('      - name: Setup pnpm');
    const nodeSetupIndex = workflow.indexOf('      - name: Use Node.js 26');
    expect(pnpmSetupIndex).toBeGreaterThan(-1);
    expect(nodeSetupIndex).toBeGreaterThan(-1);
    expect(pnpmSetupIndex).toBeLessThan(nodeSetupIndex);

    const nodeStep = stepBlock('Use Node.js 26');
    expect(nodeStep).not.toBeNull();
    expect(nodeStep).toContain('cache: pnpm');
    expect(nodeStep).toContain('cache-dependency-path: pnpm-lock.yaml');

    const installStep = stepBlock('Install dependencies');
    expect(installStep).not.toBeNull();
    expect(installStep).toContain('pnpm install --frozen-lockfile');
  });

  it('keeps all Playwright projects on Chromium', () => {
    expect(playwrightConfig).toContain("browserName: 'chromium'");
    expect(playwrightConfig).not.toMatch(/\b(firefox|webkit)\b/i);
    expect(playwrightConfig.match(/browserName: 'chromium'/g)).toHaveLength(3);
  });
});
