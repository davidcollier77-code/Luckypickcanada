import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
const scriptsOnlyPath = '.github/scripts/package-json-scripts-only.mjs';

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const workflow = read(workflowPath);
const playwrightConfig = read('playwright.config.ts');

function classify(paths, environment = {}) {
  return execFileSync('bash', [join(root, classifierPath)], {
    input: Array.isArray(paths) ? paths.join('\n') : paths,
    encoding: 'utf8',
    env: { ...process.env, ...environment },
  }).trim();
}

/** Execute the real package.json comparator with two manifests on disk. */
function runScriptsOnly(base, head) {
  const directory = mkdtempSync(join(tmpdir(), 'lqa-package-json-'));
  try {
    const basePath = join(directory, 'base-package.json');
    const headPath = join(directory, 'head-package.json');
    writeFileSync(basePath, typeof base === 'string' ? base : JSON.stringify(base, null, 2));
    writeFileSync(headPath, typeof head === 'string' ? head : JSON.stringify(head, null, 2));
    try {
      const stdout = execFileSync(process.execPath, [join(root, scriptsOnlyPath), basePath, headPath], {
        encoding: 'utf8',
      });
      return { status: 0, stdout: stdout.trim() };
    } catch (error) {
      return { status: error.status, stdout: String(error.stdout ?? '').trim() };
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
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
    expect(classify(['components/Hero.jsx'])).toBe('visual_required=true');
    expect(classify(['app/globals.css'])).toBe('visual_required=true');
    expect(classify(['styles/globals.css'])).toBe('visual_required=true');
    expect(classify(['themes/default/homepage.css'])).toBe('visual_required=true');
    expect(classify(['public/themes/default/hero.webp'])).toBe('visual_required=true');
    expect(classify(['public/images/hero.avif'])).toBe('visual_required=true');
    expect(classify(['public/fonts/inter.woff2'])).toBe('visual_required=true');
    expect(classify(['next.config.mjs'])).toBe('visual_required=true');
    expect(classify(['tailwind.config.js'])).toBe('visual_required=true');
    expect(classify(['tests/visual/homepage.spec.ts'])).toBe('visual_required=true');
    expect(classify(['tests/e2e/homepage.spec.ts'])).toBe('visual_required=true');
    expect(classify(['playwright.config.ts'])).toBe('visual_required=true');
  });

  it('requires visual QA for performance-related changes', () => {
    // Rendering and performance work has to keep its browser coverage; only a
    // change that is positively non-rendering may skip it.
    expect(classify(['app/lib/gpu-particles.js'])).toBe('visual_required=true');
    expect(classify(['components/cosmic-event-engine.js'])).toBe('visual_required=true');
    expect(classify(['scripts/measure-performance.mjs'])).toBe('visual_required=true');
    expect(classify(['tests/performance/lucky-meter-fps.spec.ts'])).toBe(
      'visual_required=true',
    );
    expect(classify(['app/lib/gpu-particles.js', 'specs/170-x/evidence.md'])).toBe(
      'visual_required=true',
    );
    // Ordinary application code stays fail-closed rather than being guessed.
    expect(classify(['app/lib/rate-limit.js'])).toBe('visual_required=true');
  });

  it('requires visual QA when any changed path can affect rendered output', () => {
    expect(classify(['PR_SUMMARY.md', 'app/homepage/Hero.js', 'specs/x/spec.md'])).toBe(
      'visual_required=true',
    );
  });

  it('skips browser QA for the non-visual OpenNext runtime queue configuration', () => {
    expect(classify(['open-next.config.ts'])).toBe('visual_required=false');
  });

  it('skips visual QA for backend API routes and CI-only changes', () => {
    expect(classify(['app/api/checkout/route.js'])).toBe('visual_required=false');
    expect(classify(['app/api/health/route.ts'])).toBe('visual_required=false');
    expect(classify(['pages/api/status.js'])).toBe('visual_required=false');
    expect(classify(['.github/workflows/protected-files.yml'])).toBe('visual_required=false');
    expect(classify(['.github/workflows/visual-qa.yml'])).toBe('visual_required=false');
    expect(classify(['.github/scripts/check_qa_pr_scope.py'])).toBe('visual_required=false');
  });

  it('still requires visual QA when backend or CI changes are mixed with UI changes', () => {
    expect(classify(['app/api/checkout/route.js', '.github/workflows/protected-files.yml', 'app/page.js'])).toBe('visual_required=true');
    expect(classify(['.github/workflows/visual-qa.yml', 'public/themes/default/hero.webp'])).toBe('visual_required=true');
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

  it('skips visual QA for agent skill and Playwright documentation', () => {
    expect(classify(['.agents/skills/playwright-cli/SKILL.md'])).toBe('visual_required=false');
    expect(
      classify(['.agents/skills/playwright-cli/references/lucky-pick-canada.md']),
    ).toBe('visual_required=false');
    expect(classify(['.agents/skills/playwright-cli/references/playwright-tests.md'])).toBe(
      'visual_required=false',
    );
    // The skill tree is documentation even when a file has no Markdown suffix.
    expect(classify(['.agents/skills/playwright-cli/LICENSE'])).toBe('visual_required=false');
    expect(classify(['.agents/skills/playwright-cli/UPSTREAM.md'])).toBe('visual_required=false');
    expect(classify(['docs/graphics-rendering-architecture.md'])).toBe('visual_required=false');
    expect(
      classify([
        '.agents/skills/playwright-cli/SKILL.md',
        'components/Hero.jsx',
      ]),
    ).toBe('visual_required=true');
  });

  it('skips browser QA for repository automation, agent instructions and local instructions', () => {
    // These paths are never bundled by the build.
    expect(classify(['.github/workflows/visual-qa.yml'])).toBe('visual_required=false');
    expect(classify(['.freebuff/ci.md'])).toBe('visual_required=false');
    expect(classify(['.agents/governance.md'])).toBe('visual_required=false');
    // A repository change never hides a rendering change in the same pull request.
    expect(classify(['.github/workflows/visual-qa.yml', 'components/Hero.tsx'])).toBe(
      'visual_required=true',
    );
    // Scripts stay fail-closed: a performance or capture script is not proven
    // non-rendering, so it keeps visual QA.
    expect(classify(['scripts/measure-performance.mjs'])).toBe('visual_required=true');
  });

  it('skips visual QA for standalone Playwright configurations but not the QA configuration', () => {
    expect(classify(['playwright.swiftshader.config.ts'])).toBe('visual_required=false');
    expect(classify(['playwright.experimental.config.ts'])).toBe('visual_required=false');
    expect(classify(['playwright-investigation.config.ts'])).toBe('visual_required=false');
    // The configuration the visual QA job runs changes how baselines are made.
    expect(classify(['playwright.config.ts'])).toBe('visual_required=true');
    // Unrecognised Playwright-adjacent files stay fail-closed.
    expect(classify(['playwright.helpers.ts'])).toBe('visual_required=true');
    expect(classify(['tests/visual/playwright-fontconfig.ts'])).toBe('visual_required=true');
  });

  it('requires visual QA for package.json unless scripts-only is positively established', () => {
    // The default is fail-closed: a caller without a determination keeps visual QA.
    expect(classify(['package.json'])).toBe('visual_required=true');
    expect(classify(['package.json'], { PACKAGE_JSON_SCRIPTS_ONLY: 'false' })).toBe(
      'visual_required=true',
    );
    expect(classify(['package.json'], { PACKAGE_JSON_SCRIPTS_ONLY: '1' })).toBe(
      'visual_required=true',
    );
    expect(classify(['package.json'], { PACKAGE_JSON_SCRIPTS_ONLY: '' })).toBe(
      'visual_required=true',
    );
    // Only the exact positive determination skips visual QA for package.json.
    expect(classify(['package.json'], { PACKAGE_JSON_SCRIPTS_ONLY: 'true' })).toBe(
      'visual_required=false',
    );
    // A scripts-only package.json never hides a rendering change elsewhere.
    expect(
      classify(['package.json', 'app/page.js'], { PACKAGE_JSON_SCRIPTS_ONLY: 'true' }),
    ).toBe('visual_required=true');
    // Only the root manifest is decided this way; nested manifests stay unknown.
    expect(
      classify(['workers/updater-scheduler/package.json'], {
        PACKAGE_JSON_SCRIPTS_ONLY: 'true',
      }),
    ).toBe('visual_required=true');
  });

  it('does not request visual QA for the merged PR #1914 change set', () => {
    // Exact changed-file list of merged PR #1914 (commit d4d261ca).
    const changedPaths = [
      '.agents/skills/playwright-cli/SKILL.md',
      '.agents/skills/playwright-cli/references/lucky-pick-canada.md',
      '.specify/feature.json',
      '__tests__/agent-governance-single-source.test.js',
      '__tests__/playwright-config-modes.test.js',
      'docs/graphics-rendering-architecture.md',
      'memory-bank/activeContext.md',
      'memory-bank/progress.md',
      'memory-bank/techContext.md',
      'package.json',
      'playwright.swiftshader.config.ts',
      'specs/165-swiftshader-graphics-architecture/evidence.md',
      'specs/165-swiftshader-graphics-architecture/plan.md',
      'specs/165-swiftshader-graphics-architecture/research.md',
      'specs/165-swiftshader-graphics-architecture/spec.md',
      'specs/165-swiftshader-graphics-architecture/tasks.md',
    ];

    // #1914's only package.json change added these two test commands.
    const head = JSON.parse(read('package.json'));
    expect(head.scripts['test:visual']).toBe('playwright test');
    expect(head.scripts['test:visual:swiftshader']).toBe(
      'playwright test --config=playwright.swiftshader.config.ts',
    );
    const base = structuredClone(head);
    delete base.scripts['test:visual'];
    delete base.scripts['test:visual:swiftshader'];

    expect(runScriptsOnly(base, head)).toEqual({ status: 0, stdout: 'scripts_only=true' });
    expect(classify(changedPaths, { PACKAGE_JSON_SCRIPTS_ONLY: 'true' })).toBe(
      'visual_required=false',
    );
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

describe('Playwright cache validation', () => {
  function runCacheCheck(root) {
    return execFileSync(
      'bash',
      [join(process.cwd(), '.github/scripts/verify-playwright-cache.sh'), root],
      { encoding: 'utf8' },
    ).trim();
  }

  function temporaryRoot() {
    return mkdtempSync(join(tmpdir(), 'lqa-playwright-cache-'));
  }

  it('reports a cached Chromium executable as ready', () => {
    const root = temporaryRoot();
    try {
      const browser = join(root, 'chromium-1234', 'chrome-linux', 'chrome');
      mkdirSync(join(root, 'chromium-1234', 'chrome-linux'), { recursive: true });
      writeFileSync(browser, '#!/bin/sh\n');
      chmodSync(browser, 0o755);
      expect(runCacheCheck(root)).toBe('ready=true');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects an empty, missing or non-executable cache', () => {
    const empty = temporaryRoot();
    try {
      expect(runCacheCheck(empty)).toBe('ready=false');

      const stale = join(empty, 'chromium-1234', 'chrome-linux', 'chrome');
      mkdirSync(join(empty, 'chromium-1234', 'chrome-linux'), { recursive: true });
      writeFileSync(stale, 'not executable');
      expect(runCacheCheck(empty)).toBe('ready=false');

      // A directory named like the browser is not an executable either.
      mkdirSync(join(empty, 'chromium-5678', 'chrome-linux', 'chrome'), { recursive: true });
      expect(runCacheCheck(empty)).toBe('ready=false');

      expect(runCacheCheck(join(empty, 'absent'))).toBe('ready=false');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('gates the download on the validated cache, not the cache-hit flag', () => {
    const validation = stepBlock('Validate restored Playwright Chromium');
    expect(validation).not.toBeNull();
    expect(validation).toContain('id: playwright-browser');
    expect(validation).toContain('.github/scripts/verify-playwright-cache.sh');
    expect(validation).toContain('no usable Chromium executable');
    // The install still runs on an incomplete cache and still provisions system
    // dependencies when the browser is usable.
    expect(stepBlock('Install Playwright Chromium (browser unavailable)')).toContain(
      "steps.playwright-browser.outputs.ready != 'true'",
    );
    expect(
      stepBlock('Install Playwright system dependencies (browser cached)'),
    ).toContain("steps.playwright-browser.outputs.ready == 'true'");
  });
});

describe('package.json scripts-only classification', () => {
  // Mirrors the shape of this repository's manifest without depending on its
  // current dependency versions.
  const manifest = () => ({
    name: 'app',
    version: '1.0.0',
    scripts: {
      dev: 'next dev --webpack',
      build: 'next build --webpack',
      start: 'next start',
      postbuild: "echo 'Build completed successfully'",
      test: 'vitest run',
    },
    dependencies: { next: '16.4.3' },
    engines: { node: '26.x' },
    pnpm: { overrides: { undici: '8.12.2' } },
  });

  it('accepts added test/tooling commands', () => {
    const head = manifest();
    head.scripts['test:visual'] = 'playwright test';
    head.scripts['test:visual:swiftshader'] =
      'playwright test --config=playwright.swiftshader.config.ts';
    expect(runScriptsOnly(manifest(), head)).toEqual({ status: 0, stdout: 'scripts_only=true' });
  });

  it('accepts changed and removed tooling scripts', () => {
    const head = manifest();
    head.scripts.lint = 'eslint .';
    head.scripts['test:unit'] = 'vitest run';
    delete head.scripts.test;
    expect(runScriptsOnly(manifest(), head)).toEqual({ status: 0, stdout: 'scripts_only=true' });
  });

  it('accepts an unchanged manifest and ignores key order', () => {
    expect(runScriptsOnly(manifest(), manifest())).toEqual({
      status: 0,
      stdout: 'scripts_only=true',
    });

    const head = {
      pnpm: { overrides: { undici: '8.12.2' } },
      engines: { node: '26.x' },
      dependencies: { next: '16.4.3' },
      scripts: {
        test: 'vitest run',
        postbuild: "echo 'Build completed successfully'",
        start: 'next start',
        build: 'next build --webpack',
        dev: 'next dev --webpack',
      },
      version: '1.0.0',
      name: 'app',
    };
    expect(runScriptsOnly(manifest(), head)).toEqual({ status: 0, stdout: 'scripts_only=true' });
  });

  it('rejects dependency changes', () => {
    const head = manifest();
    head.dependencies.next = '17.0.0';
    expect(runScriptsOnly(manifest(), head)).toEqual({ status: 0, stdout: 'scripts_only=false' });
  });

  it('rejects renderer and lifecycle script changes', () => {
    for (const [name, command] of [
      ['build', 'next build'],
      ['dev', 'next dev'],
      ['start', 'next start --port 3000'],
      ['deploy', 'wrangler deploy'],
      ['prepare', 'husky'],
      ['postinstall', 'node scripts/postinstall.mjs'],
      ['prebuild', 'node scripts/prebuild.mjs'],
    ]) {
      const head = manifest();
      head.scripts[name] = command;
      expect(runScriptsOnly(manifest(), head), `${name} must keep visual QA`).toEqual({
        status: 0,
        stdout: 'scripts_only=false',
      });
    }
  });

  it('rejects unrecognised scripts instead of assuming they are tooling', () => {
    const head = manifest();
    head.scripts['generate-assets'] = 'node scripts/generate-assets.mjs';
    head.scripts['test:visual'] = 'playwright test';
    expect(runScriptsOnly(manifest(), head)).toEqual({ status: 0, stdout: 'scripts_only=false' });
  });

  it('rejects changes outside scripts even when tooling scripts also change', () => {
    const head = manifest();
    head.scripts['test:visual'] = 'playwright test';
    head.pnpm.overrides.undici = '8.13.0';
    expect(runScriptsOnly(manifest(), head)).toEqual({ status: 0, stdout: 'scripts_only=false' });

    const renamed = manifest();
    renamed.scripts['test:visual'] = 'playwright test';
    renamed.packageManager = 'pnpm@10.30.3';
    expect(runScriptsOnly(manifest(), renamed)).toEqual({
      status: 0,
      stdout: 'scripts_only=false',
    });
  });

  it('fails closed on invalid JSON, wrong shapes, unreadable input and bad usage', () => {
    expect(runScriptsOnly('{ not json', manifest())).toEqual({ status: 1, stdout: '' });
    expect(runScriptsOnly(manifest(), '[]')).toEqual({ status: 1, stdout: '' });
    expect(runScriptsOnly(manifest(), { ...manifest(), scripts: [] })).toEqual({
      status: 1,
      stdout: '',
    });
    expect(runScriptsOnly(manifest(), { ...manifest(), scripts: { test: 42 } })).toEqual({
      status: 1,
      stdout: '',
    });

    expect(() =>
      execFileSync(
        process.execPath,
        [join(root, scriptsOnlyPath), join(root, 'missing-package.json'), join(root, 'package.json')],
        { encoding: 'utf8', stdio: 'ignore' },
      ),
    ).toThrow();
    expect(() =>
      execFileSync(process.execPath, [join(root, scriptsOnlyPath)], {
        encoding: 'utf8',
        stdio: 'ignore',
      }),
    ).toThrow();
  });
});

describe('visual QA gating matrix', () => {
  // Derived from the workflow definitions above: `verify` has no job-level
  // condition, so its non-browser checks run for every change set, while the
  // `visual` job, its Chromium install and the baseline check are gated on the
  // classifier output.
  const workflow = read(workflowPath);
  const verifyJob = workflow.slice(
    workflow.indexOf('\n  verify:'),
    workflow.indexOf('\n  visual:'),
  );
  const visualJob = workflow.slice(workflow.indexOf('\n  visual:'));

  const matrix = [
    { kind: 'visual', paths: ['components/lucky-meter-medallion-engine.js'], browser: true },
    { kind: 'performance', paths: ['components/cosmic-event-engine.js'], browser: true },
    { kind: 'ordinary application code', paths: ['app/lib/credit-format.js'], browser: true },
    { kind: 'documentation', paths: ['docs/qa-checkers.md'], browser: false },
    { kind: 'tooling and CI', paths: ['.github/workflows/visual-qa.yml', '.freebuff/ci.md'], browser: false },
    { kind: 'ambiguous unknown path', paths: ['data/unknown-blob.bin'], browser: true },
  ];

  it('runs verification for every change set and never installs a browser there', () => {
    expect(verifyJob).not.toMatch(/^    if:/m);
    expect(verifyJob).toContain('Test QA infrastructure checkers');
    expect(verifyJob).toContain('Run all unit tests');
    expect(verifyJob).toContain('Run standalone TypeScript check');
    expect(verifyJob).toContain("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'");
    expect(verifyJob).not.toContain('playwright install');
  });

  it('gates the browser job, Chromium install and baselines on the classifier', () => {
    expect(visualJob).toMatch(
      /^    if: needs\.changes\.outputs\.visual_required == 'true'/m,
    );
    expect(visualJob).toContain('playwright install --with-deps chromium');
    expect(visualJob).toContain('playwright install-deps chromium');
    expect(visualJob).toContain('Verify committed visual baselines');
    expect(visualJob).toContain('Run visual regression tests');
  });

  it('matches the workflow decision for real visual, performance, ordinary, docs, tooling and ambiguous changes', () => {
    const decisions = matrix.map((row) => ({
      kind: row.kind,
      visualRequired: classify(row.paths) === 'visual_required=true',
      expected: row.browser,
    }));
    for (const decision of decisions) {
      expect(decision.visualRequired).toBe(decision.expected);
    }
    // Documentation and tooling are the only non-browser rows: ordinary
    // application code stays fail-closed because it can feed a component.
    expect(decisions.filter((d) => !d.visualRequired).map((d) => d.kind)).toEqual([
      'documentation',
      'tooling and CI',
    ]);
  });
});

describe('visual QA workflow wiring', () => {
  it('establishes package.json scripts-only scope before classifying', () => {
    const classifyStep = stepBlock('Classify pull request change set');
    expect(classifyStep).not.toBeNull();
    expect(classifyStep).toContain('node .github/scripts/package-json-scripts-only.mjs');
    expect(classifyStep).toContain('PACKAGE_JSON_SCRIPTS_ONLY="$package_json_scripts_only"');
    expect(classifyStep).toContain('contents/package.json?ref=${BASE_SHA}');
    expect(classifyStep).toContain('contents/package.json?ref=${HEAD_SHA}');
    expect(classifyStep).toContain("grep -Fxq 'package.json'");
    expect(classifyStep).toContain('package_json_scripts_only=false');
    expect(classifyStep).toContain('treating the manifest as rendering-affecting (fail closed)');
  });

  it('skips Playwright postinstall browser downloads in both QA jobs', () => {
    const installSteps =
      workflow.match(
        / {6}- name: Install dependencies\n(?: {8}.*\n)*? {8}run: pnpm install --frozen-lockfile/g,
      ) ?? [];
    expect(installSteps).toHaveLength(2);
    for (const block of installSteps) {
      expect(block).toContain("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'");
    }

    // Explicit Chromium provisioning is unchanged and never carries the skip.
    expect(stepBlock('Install Playwright Chromium (browser unavailable)')).toContain(
      'pnpm exec playwright install --with-deps chromium',
    );
    expect(stepBlock('Install Playwright system dependencies (browser cached)')).toContain(
      'pnpm exec playwright install-deps chromium',
    );
  });

  it('publishes the classifier result as a job output', () => {
    expect(workflow).toContain('visual_required: ${{ steps.classify.outputs.visual_required }}');
    expect(workflow).toContain(`bash ${classifierPath}`);
    // Every uncertain path in the classification step must request visual QA.
    const classifyStep = stepBlock('Classify pull request change set');
    expect(classifyStep).not.toBeNull();
    expect(classifyStep).toContain('::warning::');
    // One fallback for a failed file listing, two for a failed or unexpected
    // classification, the case label, and the declared-visual-impact override.
    expect(classifyStep.match(/visual_required=true/g) ?? []).toHaveLength(5);
    expect(classifyStep).toContain('case "$classification" in');
    expect(workflow).toContain('Read declared visual impact');
    expect(workflow).toContain('steps.declared-impact.outputs.required');
  });

  it('runs verification for every pull request and the browser job only after the classifier', () => {
    const verify = jobBlock('verify');
    expect(verify, 'the stable Visual QA verification job must exist').not.toBeNull();
    expect(verify).toMatch(/name: Application Verification\n {4}needs: changes/);
    expect(verify).not.toContain('visual_required');

    const visual = jobBlock('visual');
    expect(visual, 'the Playwright job must exist').not.toBeNull();
    expect(visual).toContain("if: needs.changes.outputs.visual_required == 'true'");

    // These checks must keep running for every pull request, visual or not.
    // The full suite also contains the Crystal Ball files the former targeted
    // step ran. Freebuff verification is intentionally not part of QA.
    for (const step of ['Run all unit tests', 'Run standalone TypeScript check']) {
      const block = stepBlock(step);
      expect(block, `${step} must remain in the workflow`).not.toBeNull();
      expect(block, `${step} must not be gated on visual changes`).not.toContain('visual_required');
    }
    expect(stepBlock('Run all unit tests')).toContain('pnpm run test');
    expect(stepBlock('Run standalone TypeScript check')).toContain(
      'pnpm exec tsc --noEmit',
    );
    expect(workflow).toContain('test_review_pr_changes');
    expect(workflow).not.toContain('Run AGENTS.md Spec Kit verification');
    expect(workflow).not.toContain('./freebuff-verify.sh');
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

    const missInstall = stepBlock('Install Playwright Chromium (browser unavailable)');
    expect(missInstall).not.toBeNull();
    expect(missInstall).toContain("steps.playwright-browser.outputs.ready != 'true'");
    expect(missInstall).toContain('pnpm exec playwright install --with-deps chromium');

    const hitDeps = stepBlock('Install Playwright system dependencies (browser cached)');
    expect(hitDeps).not.toBeNull();
    expect(hitDeps).toContain("steps.playwright-browser.outputs.ready == 'true'");
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
    expect(visual).toContain('plan-playwright-shards.mjs');
    expect(visual).toContain('--forbid-only');
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
