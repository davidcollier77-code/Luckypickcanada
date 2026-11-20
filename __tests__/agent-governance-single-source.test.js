import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const agentsPath = join(root, 'AGENTS.md');
const prSubmissionPath = join(root, 'PR_SUBMISSION.md');
const obsoleteEntryPoint = join(root, '.freebuff', 'freebuff.md');
const readAgents = () => readFileSync(agentsPath, 'utf8');
const taskGroups = [
  'creation',
  'troubleshooting',
  'polishing',
  'testing',
  'security',
  'audio',
  'deep-dive',
  'seo',
];

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
        '--changed-files',
        changed,
        '--base-agents-sha',
        BASE_SHA,
        '--head-agents-sha',
        HEAD_SHA,
        '--json',
        report,
      ],
      { stdio: 'pipe' },
    );
  } catch (error) {
    exitCode = error.status;
  }
  return { exitCode, report: JSON.parse(readFileSync(report, 'utf8')) };
}

describe('single-source agent governance', () => {
  it('uses AGENTS.md as the current repository-governance entrypoint', () => {
    const agents = readAgents();

    expect(agents).toContain(
      'This document establishes the repository governance and operating requirements for ChatGPT and Freebuff.',
    );
    expect(agents).toContain('"PR_SUBMISSION.md" is mandatory.');
    expect(agents).not.toContain('.freebuff/freebuff.md');
    expect(existsSync(obsoleteEntryPoint)).toBe(false);
    expect(existsSync(prSubmissionPath)).toBe(true);
    expect(agents).toContain('A — PREPARE AND PLAN');
    expect(agents).toContain('B — IMPLEMENT');
    expect(agents).toContain('C — VERIFY AND SUBMIT');
  });

  it('requires PR submission to complete repository-changing tasks without forcing PRs for read-only work', () => {
    const agents = readAgents();
    const handoffStart = agents.indexOf('4. SUBMIT THE PR');
    const handoffEnd = agents.indexOf(
      '\n\n---\n\n🟣 CHATGPT OPERATING INSTRUCTIONS',
      handoffStart,
    );

    expect(handoffStart).toBeGreaterThanOrEqual(0);
    expect(handoffEnd).toBeGreaterThan(handoffStart);

    const handoff = agents.slice(handoffStart, handoffEnd);
    expect(handoff).toContain(
      'Every task in which the owner authorizes repository changes must proceed directly',
    );
    expect(handoff).toContain('Opening the PR is mandatory task completion, not an optional follow-up.');
    expect(handoff).toContain('do not wait for the owner to request the PR or give separate permission.');
    expect(handoff).toContain('Read-only investigations, audits, recommendations and advice do not require a PR.');
    expect(handoff).toContain('If the owner explicitly directs that no PR be opened, follow that instruction.');
    expect(handoff).toContain('If a PR cannot safely be opened, report the exact blocker');
    expect(handoff).toContain('A repository-changing task is not complete until its PR has been successfully opened and handed off.');
  });

  it('checks the current repository QA and implementation requirements', () => {
    const agents = readAgents();

    expect(agents).toContain('QA CHECKER REQUIREMENTS — BEFORE TASK SPECIFICATION');
    expect(agents).toContain('This is a task-planning requirement, not something to defer until implementation or pre-submission review.');
    expect(agents).toContain('Use those requirements when defining the task\'s scope, constraints, implementation approach, acceptance criteria and verification plan.');
    expect(agents).not.toContain('REPOSITORY QA AND VALIDATION');
    expect(agents).toContain('COMPLETE THE FINAL CHECKER-REQUIREMENT REVIEW');
    expect(agents).toContain('review the completed implementation and complete diff against every applicable checker requirement');
    expect(agents).toContain('QA CHECKER REQUIREMENTS — BEFORE TASK SPECIFICATION');
    expect(agents).toContain("Playwright is Freebuff's primary browser automation tool.");
    expect(agents).toContain("Crawlbase is Freebuff's first and only fallback");
    expect(agents).toContain('Crawlbase does not replace interactive browser rendering');
    expect(agents).toContain("Browserless is ChatGPT's primary browser tool.");
    expect(agents).toContain('Firecrawl is the fallback for supported content-retrieval tasks.');
    expect(agents).toContain(
      'The production build must remain strictly below 495 MiB.',
    );
    expect(agents).toContain(
      'Complete all required workflow stages in their prescribed order for repository-changing tasks.',
    );
    expect(agents).toContain('NO EVIDENCE = NO CLAIM.');
    expect(agents).toContain('NO VERIFIED RESULT = NO VERIFIED COMPLETION.');
    const submission = readFileSync(prSubmissionPath, 'utf8');
    expect(submission).toContain('Owner-directed exception:');
    expect(submission).toContain('must never infer permission');
    expect(submission).toContain('clear instruction from the repository owner');
    expect(submission).toContain('CI results do not replace this review.');
  });

  it('documents Freebuff Playwright modes and excludes ChatGPT from the CLI system', () => {
    const agents = readAgents();
    const start = agents.indexOf('8. PLAYWRIGHT BROWSER TESTING');
    const end = agents.indexOf('\n\nB — IMPLEMENT', start);
    const section = agents.slice(start, end);
    const skill = readFileSync(
      join(root, '.agents', 'skills', 'playwright-cli', 'SKILL.md'),
      'utf8',
    );

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(section).toContain('./scripts/playwright-cli.sh');
    expect(section).toContain('.agents/skills/playwright-cli/SKILL.md');
    expect(section).toContain('.agents/skills/playwright-cli/references/lucky-pick-canada.md');
    expect(section).toContain('Do not introduce a competing CLI or browser automation setup.');
    expect(section).toContain("Crawlbase is Freebuff's first and only fallback");
    expect(section).toContain('Do not introduce additional browser fallback tools.');

    // AGENTS.md designates the skill files as authoritative for both rendering modes.
    expect(skill).toContain('Standard');
    expect(skill).toContain('SwiftShader');
    expect(skill).toContain('playwright.swiftshader.config.ts');
    expect(skill).toContain('not a physical-GPU benchmark');

    // ChatGPT's exclusion remains explicit in its own operating instructions.
    // #1942 restated it as this list; the CLI entry and maintenance restriction
    // are still asserted below, so the intent is not weakened.
    expect(agents).toContain('ChatGPT must not use or attempt to use:');
    expect(agents).toContain('The repository Playwright CLI.');
    expect(agents).toContain(
      'Do not spend time attempting to initialize, troubleshoot or maintain tools that are not available to ChatGPT.',
    );
  });

  it('requires the protection workflow and owner rule for AGENTS.md', () => {
    const workflow = readFileSync(
      join(root, '.github', 'workflows', 'protected-files.yml'),
      'utf8',
    );
    const codeowners = readFileSync(join(root, '.github', 'CODEOWNERS'), 'utf8');

    expect(workflow).toMatch(/paths:[\s\S]*?-\s*['"]AGENTS\.md['"]/);
    expect(workflow).toMatch(/protected_files=\([\s\S]*?"AGENTS\.md"[\s\S]*?\)/);
    expect(workflow).toContain('name: protected-file-authorization');
    expect(workflow).toContain(
      'Explicit human authorization is required before this pull request may merge.',
    );
    expect(workflow).toContain('Detection is failing closed.');
    expect(workflow).toContain('agents_md_protection.py');
    expect(workflow).toContain('pull_request.base.sha');
    expect(codeowners).toMatch(/^\/AGENTS\.md\s+@davidcollier77-code$/m);
  });

  it('allows a dedicated governance PR but refuses AGENTS.md inside an unrelated PR', () => {
    const dedicated = classifyAgentsChange([
      'AGENTS.md',
      '__tests__/agent-governance-single-source.test.js',
      '.github/workflows/protected-files.yml',
      '.github/scripts/agents_md_protection.py',
      '.github/scripts/test_agents_md_protection.py',
      '.github/CODEOWNERS',
      'PR_SUBMISSION.md',
    ]);
    expect(dedicated.exitCode).toBe(0);
    expect(dedicated.report.mode).toBe('dedicated');

    const unrelated = classifyAgentsChange(['AGENTS.md', 'app/page.tsx']);
    expect(unrelated.exitCode).toBe(1);
    expect(unrelated.report.mode).toBe('unrelated');
    expect(unrelated.report.offending_paths).toEqual(['app/page.tsx']);
  });

  it('does not accept a title or description as an authorization bypass', () => {
    const directory = mkdtempSync(join(tmpdir(), 'agents-protection-'));
    const changed = join(directory, 'changed.txt');
    writeFileSync(changed, 'AGENTS.md\napp/page.tsx\n');
    let exitCode = 0;
    try {
      execFileSync(
        'python3',
        [
          join(root, '.github', 'scripts', 'agents_md_protection.py'),
          '--changed-files',
          changed,
          '--base-agents-sha',
          BASE_SHA,
          '--head-agents-sha',
          HEAD_SHA,
          '--title',
          'chore(governance): approved AGENTS.md update',
        ],
        { stdio: 'pipe' },
      );
    } catch (error) {
      exitCode = error.status;
    }
    expect(exitCode).toBe(2);
  });

  it('requires shared graphics toolkit and resource-readiness guidance for both agents', () => {
    const agents = readAgents();
    const start = agents.indexOf('🟢 SHARED GRAPHICS TOOLKIT AND CREATIVE WORKBENCH');
    const end = agents.indexOf('\\n\\nPR SUBMISSION DOCUMENTATION', start);
    const section = agents.slice(start, end);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(section).toContain('[BOTH — CHATGPT AND FREEBUFF]');
    expect(section).toContain('app/lib/graphics/README.md');
    expect(section).toContain('docs/graphics-rendering-architecture.md');
    expect(section).toContain('app/lib/resource-readiness.js');
    expect(section).toContain('do not create a second preloader');
    expect(section).toContain('.docs/creation/');
    expect(section).toContain('.docs/polishing/');
    expect(section).toContain('_websites_threejs.md');
    expect(section).toContain('_websites_threejs_llms_txt.md');
    expect(section).toContain('app/lib/use-creative-experience.js');
    expect(section).toContain('app/lib/graphics/experiences.js');
    expect(section).toContain('app/lib/graphics/runtime.js');
    expect(section).toContain('components/graphics/CreativeWorkbench.jsx');
    expect(section).toContain('Three.js is not mandatory');
    expect(section).toContain('does not replace required Playwright');
    expect(section).toContain('Preserve existing artwork, functionality, animation, sound, timing and layout');
  });

  it('retains every specialist task-group instruction', () => {
    for (const group of taskGroups) {
      expect(existsSync(join(root, '.freebuff', group + '.md'))).toBe(true);
    }
  });


  it('requires the current Spec Kit workflow and all nine command definitions', () => {
    const agents = readAgents();
    const start = agents.indexOf('8. SPEC KIT REQUIREMENTS');
    const end = agents.indexOf('\n\n9. QA CHECKER REQUIREMENTS', start);
    const workflow = agents.slice(start, end);
    const normalized = workflow.toLowerCase();

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(normalized).toContain('current spec kit command definitions');
    expect(normalized).toContain('current spec kit workflow');
    expect(normalized).toContain(
      'complete all required workflow stages in their prescribed order',
    );
    expect(normalized).toContain('mandatory template sections');
    expect(normalized).toContain('notify the owner');
    expect(normalized).toContain('limited strictly to affected wording');
    expect(normalized).toContain('do not silently change the established project workflow');

    for (const command of [
      'specify',
      'plan',
      'tasks',
      'implement',
      'clarify',
      'analyze',
      'checklist',
      'constitution',
      'converge',
    ]) {
      expect(existsSync(join(root, '.freebuff', 'cmds', `speckit.${command}.md`))).toBe(true);
    }
  });

  it('retains the Freebuff Spec Kit command directory', () => {
    for (const command of [
      'analyze',
      'checklist',
      'clarify',
      'constitution',
      'converge',
      'implement',
      'plan',
      'specify',
      'tasks',
    ]) {
      expect(existsSync(join(root, '.freebuff', 'cmds', `speckit.${command}.md`))).toBe(true);
    }
  });
});
