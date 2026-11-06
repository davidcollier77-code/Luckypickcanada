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
  const nextStep = rest.search(/\n {6}- /);
  return rest.slice(0, nextStep === -1 ? rest.length : nextStep);
}

describe('visual QA change classification', () => {
  it('requires visual QA for application, theme and asset changes', () => {
    expect(classify(['app/page.js'])).toBe('visual_required=true');
    expect(classify(['themes/default/homepage.css'])).toBe('visual_required=true');
    expect(classify(['public/themes/default/hero.webp'])).toBe('visual_required=true');
    expect(classify(['tests/visual/homepage.spec.ts'])).toBe('visual_required=true');
    expect(classify(['playwright.config.ts'])).toBe('visual_required=true');
  });

  it('requires visual QA when any changed path can affect rendered output', () => {
    expect(classify(['PR_SUMMARY.md', 'app/homepage/Hero.js', 'specs/x/spec.md'])).toBe(
      'visual_required=true',
    );
  });

  it('skips visual QA for documentation-only changes', () => {
    expect(classify(['PR_SUMMARY.md'])).toBe('visual_required=false');
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

  it('runs the visual job only after the classifier and keeps the unrelated QA steps', () => {
    const dependsOnClassifier = /name: Visual QA\n {4}needs: changes/.test(workflow);
    expect(dependsOnClassifier).toBe(true);

    // These checks must keep running for every pull request, visual or not.
    for (const step of [
      'Run targeted Crystal Ball allowance and Oracle validation unit tests',
      'Run all unit tests',
      'Run standalone TypeScript check',
      'Run AGENTS.md Spec Kit verification',
    ]) {
      const block = stepBlock(step);
      expect(block, `${step} must remain in the workflow`).not.toBeNull();
      expect(block, `${step} must not be gated on visual changes`).not.toContain('visual_required');
    }
    expect(stepBlock('Run AGENTS.md Spec Kit verification')).toContain(
      'SPEC_KIT_PR_AUTHOR: ${{ github.event.pull_request.user.login }}',
    );
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

  it('installs only Chromium, and only when visual QA is required', () => {
    const missInstall = stepBlock('Install Playwright Chromium (cache miss)');
    expect(missInstall).not.toBeNull();
    expect(missInstall).toContain("visual_required == 'true'");
    expect(missInstall).toContain("steps.playwright-cache.outputs.cache-hit != 'true'");
    expect(missInstall).toContain('pnpm exec playwright install --with-deps chromium');

    const hitDeps = stepBlock('Install Playwright system dependencies (cache hit)');
    expect(hitDeps).not.toBeNull();
    expect(hitDeps).toContain("visual_required == 'true'");
    expect(hitDeps).toContain("steps.playwright-cache.outputs.cache-hit == 'true'");
    expect(hitDeps).toContain('pnpm exec playwright install-deps chromium');

    // No workflow step may pull in Firefox or WebKit.
    expect(workflow).not.toMatch(/playwright install[^\n]*\b(firefox|webkit)\b/);
    expect(workflow).not.toMatch(/\b(firefox|webkit)\b/i);
  });

  it('gates baseline verification and the visual regression run on the classifier', () => {
    for (const step of ['Verify committed visual baselines', 'Run visual regression tests']) {
      const block = stepBlock(step);
      expect(block, `${step} must remain in the workflow`).not.toBeNull();
      expect(block).toContain("if: needs.changes.outputs.visual_required == 'true'");
    }
    expect(stepBlock('Run visual regression tests')).toContain('pnpm exec playwright test');
  });

  it('keeps all Playwright projects on Chromium', () => {
    expect(playwrightConfig).toContain("browserName: 'chromium'");
    expect(playwrightConfig).not.toMatch(/\b(firefox|webkit)\b/i);
    expect(playwrightConfig.match(/browserName: 'chromium'/g)).toHaveLength(3);
  });
});
