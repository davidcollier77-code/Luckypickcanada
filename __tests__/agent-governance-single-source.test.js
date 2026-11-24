import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const agentsPath = join(root, 'AGENTS.md');
const prSubmissionPath = join(root, 'PR_SUBMISSION.md');
const obsoleteEntryPoint = join(root, '.freebuff', 'freebuff.md');
const readAgents = () => readFileSync(agentsPath, 'utf8');
const docsManifest = JSON.parse(readFileSync(join(root, '.docs', 'manifest.json'), 'utf8'));
const taskGroups = Object.keys(docsManifest.groups);

const BASE_SHA = '1'.repeat(40);
const HEAD_SHA = '2'.repeat(40);

function classifyAgentsChange(paths) {
  const directory = mkdtempSync(join(tmpdir(), 'agents-protection-'));
  const changed = join(directory, 'changed.txt');
  const report = join(directory, 'report.json');
  writeFileSync(changed, paths.map((path) => `${path}\n`).join(''));
  let exitCode = 0;
  try {
    execFileSync(
      'python3',
      [
        join(root, '.github', 'scripts', 'agents_md_protection.py'),
        '--changed-files', changed,
        '--base-agents-sha', BASE_SHA,
        '--head-agents-sha', HEAD_SHA,
        '--json', report,
      ],
      { stdio: 'pipe' },
    );
  } catch (error) {
    exitCode = error.status;
  }
  return { exitCode, report: JSON.parse(readFileSync(report, 'utf8')) };
}

describe('compact single-source agent governance', () => {
  it('keeps AGENTS.md concise and preserves full-document and agent-scope rules', () => {
    const agents = readAgents();
    const lines = agents.split(/\r?\n/).length;

    expect(lines).toBeLessThanOrEqual(200);
    expect(agents).toContain('Read this entire document before any repository work.');
    expect(agents).toContain('ChatGPT follows 🟢 and 🟣 sections. Freebuff follows 🟢 and 🔵 sections.');
    expect(agents).toContain('A section inherits its parent\'s classification unless explicitly reclassified.');
    expect(agents).toContain('## 🟢 SHARED REPOSITORY REQUIREMENTS');
    expect(agents).toContain('## 🔵 FREEBUFF OPERATING INSTRUCTIONS');
    expect(agents).toContain('## 🟣 CHATGPT OPERATING INSTRUCTIONS');
    expect(agents).toContain('`PR_SUBMISSION.md` is mandatory');
    expect(agents).not.toContain('.freebuff/freebuff.md');
    expect(existsSync(obsoleteEntryPoint)).toBe(false);
    expect(existsSync(prSubmissionPath)).toBe(true);
  });

  it('preserves shared security, build, scope, evidence and Memory Bank safeguards', () => {
    const agents = readAgents();

    expect(agents).toContain('Make the smallest correct change');
    expect(agents).toContain('Identify affected components, dependencies and workflows');
    expect(agents).toContain('strictly below **495 MiB**');
    expect(agents).toContain('Never weaken security, privacy, validation, authentication');
    expect(agents).toContain('Never expose secret values in source, commits, diffs, logs');
    expect(agents).toContain('Never dump or broadly enumerate environment variables or configuration.');
    expect(agents).toContain('Use approved secret stores and platform bindings.');
    expect(agents).toContain('If a secret is exposed, stop further disclosure');
    expect(agents).toContain('NO EVIDENCE = NO CLAIM. NO VERIFIED RESULT = NO VERIFIED COMPLETION.');
    expect(agents).toContain('At task initialization, read and health-check all four core files:');
    for (const file of ['projectBrief.md', 'activeContext.md', 'techContext.md', 'progress.md']) {
      expect(agents).toContain(`memory-bank/${file}`);
    }
    expect(agents).toContain('There are no arbitrary byte or line limits for Memory Bank files or Spec Kit artifacts.');
    expect(agents).toContain('Never store secrets or sensitive configuration.');
  });

  it('keeps scripts/verify-startup.sh in step with the AGENTS.md initialization instruction', () => {
    const instruction = 'At task initialization, read and health-check all four core files:';
    const script = readFileSync(join(root, 'scripts', 'verify-startup.sh'), 'utf8');

    // The startup verification asserts this exact sentence. It once checked wording
    // AGENTS.md no longer used, so step 1 of every startup failed before any work ran.
    expect(readAgents()).toContain(instruction);
    expect(script).toContain(instruction);
    expect(() =>
      execFileSync('bash', [join(root, 'scripts', 'verify-startup.sh')], {
        cwd: root,
        stdio: 'pipe',
      })
    ).not.toThrow();
  });

  it('preserves current Spec Kit sequencing and checker-first task planning', () => {
    const agents = readAgents();
    const start = agents.indexOf('### Spec Kit workflow');
    const end = agents.indexOf('### QA requirements before specification', start);
    const specKit = agents.slice(start, end).toLowerCase();
    const qa = agents.slice(end, agents.indexOf('### Tools and repository scripts', end)).toLowerCase();

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    for (const stage of ['specify', 'plan', 'tasks', 'implement']) {
      expect(specKit).toContain(stage);
    }
    expect(specKit).toContain('fixed version');
    expect(specKit).toContain('command count');
    expect(specKit).toContain('`.freebuff/cmds/` wrappers are freebuff only');
    expect(specKit).toContain('chatgpt must not use them as its own operating instructions.');
    expect(qa).toContain('before preparing or approving a task specification');
    expect(qa).toContain('do not infer behaviour from names');
    expect(qa).toContain('thresholds, approval conditions and pass/fail behaviour');
    expect(qa).toContain('identify the files, behaviours and evidence it examines');
    expect(qa).toContain('never weaken, bypass, suppress or redefine a check');
    expect(agents).toContain('Automatic PR-checker workflows must continue to use Playwright.');
  });

  it('keeps the shared graphics toolkit and existing workbench entry points', () => {
    const agents = readAgents();
    const start = agents.indexOf('### Graphics and creative work');
    const end = agents.indexOf('### Spec Kit workflow', start);
    const section = agents.slice(start, end);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    for (const path of [
      'app/lib/graphics/README.md',
      'docs/graphics-rendering-architecture.md',
      'app/lib/resource-readiness.js',
      '.docs/creation/',
      '.docs/polishing/',
      '_websites_threejs.md',
      '_websites_threejs_llms_txt.md',
      'app/lib/use-creative-experience.js',
      'app/lib/graphics/experiences.js',
      'app/lib/graphics/runtime.js',
      'components/graphics/CreativeWorkbench.jsx',
      'app/lib/graphics/workbench.js',
      'app/lib/graphics/workbench-runtime.js',
      '/workbench/creative',
    ]) {
      expect(section).toContain(path);
    }
    expect(section).toContain('do not create another preloader');
    expect(section).toContain('Three.js is not mandatory');
    expect(section).toContain('does not replace Playwright or required QA');
  });

  it('routes Freebuff task groups from the manifest and preserves its Playwright procedure', () => {
    const agents = readAgents();
    const start = agents.indexOf('## 🔵 FREEBUFF OPERATING INSTRUCTIONS');
    const end = agents.indexOf('## 🟣 CHATGPT OPERATING INSTRUCTIONS', start);
    const freebuff = agents.slice(start, end);
    const commandsDirectory = join(root, '.freebuff', 'cmds');

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(freebuff).toContain('keys under `groups` as the dynamic task-group list');
    expect(freebuff).toContain('matching `.freebuff/<group>.md` files');
    expect(freebuff).toContain('Unlisted `.freebuff/` files are specialist references');
    expect(freebuff).toContain('.agents/skills/playwright-cli/SKILL.md');
    expect(freebuff).toContain('.agents/skills/playwright-cli/references/lucky-pick-canada.md');
    expect(freebuff).toContain('./scripts/playwright-cli.sh');
    expect(freebuff).toContain("Playwright is Freebuff's primary browser tool.");
    expect(freebuff).toContain('Crawlbase is the only fallback');
    expect(freebuff).toContain('does not replace interactive rendering, visual QA or end-to-end testing');
    expect(freebuff).toContain('./freebuff-verify.sh');
    expect(freebuff).toContain('opening a regular, non-draft PR is mandatory');

    expect(taskGroups.length).toBeGreaterThan(0);
    for (const group of taskGroups) {
      expect(existsSync(join(root, '.freebuff', `${group}.md`))).toBe(true);
    }
    for (const name of ['bolt', 'ci', 'palette', 'sentinel']) {
      expect(existsSync(join(root, '.freebuff', `${name}.md`))).toBe(true);
      expect(docsManifest.groups).not.toHaveProperty(name);
    }
    const commandFiles = readdirSync(commandsDirectory).filter((name) => /^speckit\..+\.md$/.test(name));
    expect(commandFiles.length).toBeGreaterThan(0);
    for (const stage of ['specify', 'plan', 'tasks', 'implement']) {
      expect(commandFiles).toContain(`speckit.${stage}.md`);
    }
    for (const file of commandFiles) {
      expect(readFileSync(join(commandsDirectory, file), 'utf8').trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps ChatGPT-only browser, startup and repository-execution boundaries explicit', () => {
    const agents = readAgents();
    const start = agents.indexOf('## 🟣 CHATGPT OPERATING INSTRUCTIONS');
    const section = agents.slice(start);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(section).toContain('follow the ChatGPT Library startup instructions and run the prescribed startup preflight');
    expect(section).toContain('check the current relevant GitHub files');
    expect(section).toContain('For browser testing, ChatGPT must first use its Python Playwright setup');
    expect(section).toContain('configured through the ChatGPT startup script in the ChatGPT Library');
    expect(section).toContain('existing Python Playwright async API and installed Chromium');
    expect(section).toContain('use Browserless as the fallback');
    expect(section).toContain('Firecrawl only if Browserless is unavailable or not working');
    expect(section).toContain('Do not treat retrieval as interactive browser testing.');
    expect(section).not.toContain('ChatGPT cannot execute Playwright.');
    expect(section).toContain('must not use the repository Playwright CLI');
    expect(section).toContain('or Crawlbase');
    expect(section).toContain('Never run Freebuff\'s startup sequence');
    expect(section).toContain('Do not execute repository shell scripts');
    expect(section).toContain('Node.js 26.x and pnpm 10.30.3');
    expect(section).toContain('Follow all shared approvals and `PR_SUBMISSION.md`.');
  });

  it('requires the PR single source of truth and current-head owner handoff', () => {
    const submission = readFileSync(prSubmissionPath, 'utf8');

    expect(submission).toContain('Read it twice for every repository-changing task');
    expect(submission).toContain('## 5. Post-submission verification and handoff');
    expect(submission).toContain("Confirm the report's full current-head SHA exactly matches the live PR head SHA.");
    expect(submission).toContain('Inspect all seven categories');
    expect(submission).toContain('Missing reports, missing categories, stale head SHAs, skipped or cancelled checks, incomplete evidence, unavailable source data and timeouts must never be described as PASSED.');
    expect(submission).toContain('The governance digest approval (`/approve-governance <digest>`) and the protected-file GitHub Environment authorization are separate requirements.');
    expect(submission).toContain('Do not automatically repair failed checks or findings after PR creation.');
    expect(submission).toContain('Merge, enable auto-merge or otherwise complete the PR.');
  });

  it('retains the protected-file workflow and owner authorization gate', () => {
    const workflow = readFileSync(join(root, '.github', 'workflows', 'protected-files.yml'), 'utf8');
    const codeowners = readFileSync(join(root, '.github', 'CODEOWNERS'), 'utf8');

    expect(workflow).toMatch(/paths:[\s\S]*?-\s*['"]AGENTS\.md['"]/);
    expect(workflow).toMatch(/protected_files=\([\s\S]*?"AGENTS\.md"[\s\S]*?\)/);
    expect(workflow).toContain('name: protected-file-authorization');
    expect(workflow).toContain('Explicit human authorization is required before this pull request may merge.');
    expect(workflow).toContain('Detection is failing closed.');
    expect(workflow).toContain('agents_md_protection.py');
    expect(workflow).toContain('pull_request.base.sha');
    expect(codeowners).toMatch(/^\/AGENTS\.md\s+@davidcollier77-code$/m);
  });

  it('allows only dedicated governance changes and refuses unrelated application paths', () => {
    const dedicated = classifyAgentsChange([
      'AGENTS.md',
      '__tests__/agent-governance-single-source.test.js',
      '.github/workflows/protected-files.yml',
      '.github/scripts/agents_md_protection.py',
      '.github/scripts/test_agents_md_protection.py',
      '.github/CODEOWNERS',
      'PR_SUBMISSION.md',
      'memory-bank/activeContext.md',
      'specs/207-compact-agent-governance/spec.md',
      'specs/207-compact-agent-governance/plan.md',
      'specs/207-compact-agent-governance/tasks.md',
    ]);
    expect(dedicated.exitCode).toBe(0);
    expect(dedicated.report.mode).toBe('dedicated');

    const unrelated = classifyAgentsChange(['AGENTS.md', 'app/page.tsx']);
    expect(unrelated.exitCode).toBe(1);
    expect(unrelated.report.mode).toBe('unrelated');
    expect(unrelated.report.offending_paths).toEqual(['app/page.tsx']);
  });

  it('does not accept a title as a protected-file authorization bypass', () => {
    const directory = mkdtempSync(join(tmpdir(), 'agents-protection-'));
    const changed = join(directory, 'changed.txt');
    writeFileSync(changed, 'AGENTS.md\napp/page.tsx\n');
    let exitCode = 0;
    try {
      execFileSync(
        'python3',
        [
          join(root, '.github', 'scripts', 'agents_md_protection.py'),
          '--changed-files', changed,
          '--base-agents-sha', BASE_SHA,
          '--head-agents-sha', HEAD_SHA,
          '--title', 'chore(governance): approved AGENTS.md update',
        ],
        { stdio: 'pipe' },
      );
    } catch (error) {
      exitCode = error.status;
    }
    expect(exitCode).toBe(2);
  });
});
