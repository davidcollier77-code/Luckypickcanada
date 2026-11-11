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

    expect(agents).toContain('This file is the primary repository instruction for Freebuff.');
    expect(agents).toContain('PR submission: "PR_SUBMISSION.md" is mandatory.');
    expect(agents).not.toContain('.freebuff/freebuff.md');
    expect(existsSync(obsoleteEntryPoint)).toBe(false);
    expect(existsSync(prSubmissionPath)).toBe(true);
    expect(agents).toContain('A — PREPARE AND PLAN');
    expect(agents).toContain('B — IMPLEMENT');
    expect(agents).toContain('C — VERIFY AND SUBMIT');
  });

  it('requires PR submission to complete repository-changing tasks without forcing PRs for read-only work', () => {
    const agents = readAgents();
    const handoffStart = agents.indexOf('4. Submit the PR.');
    const handoffEnd = agents.indexOf('\n\nREPOSITORY QA AND VALIDATION', handoffStart);

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

    expect(agents).toContain('REPOSITORY QA AND VALIDATION');
    // These assertions track the approved, merged AGENTS.md baseline. They
    // verify the requirements, not superseded wording from an earlier revision.
    expect(agents).toContain(
      'Inspect the actual repository workflows, scripts, configurations and referenced requirements',
    );
    expect(agents).toContain('Use Playwright as the primary browser automation tool.');
    expect(agents).toContain(
      'Use Browserless as the remote fallback for direct browser tasks.',
    );
    expect(agents).toContain(
      'Use Firecrawl as the primary content-retrieval tool and Crawlbase as its fallback.',
    );
    expect(agents).toContain(
      'The production build must remain strictly below 495 MiB.',
    );
    expect(agents).toContain(
      'Specify, Plan and Tasks in sequence before implementation.',
    );
    expect(agents).toContain('NO EVIDENCE = NO CLAIM.');
    expect(agents).toContain('NO VERIFIED RESULT = NO VERIFIED COMPLETION.');
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

  it('retains every specialist task-group instruction', () => {
    for (const group of taskGroups) {
      expect(existsSync(join(root, '.freebuff', group + '.md'))).toBe(true);
    }
  });

  it('retains the Freebuff Spec Kit command directory', () => {
    expect(existsSync(join(root, '.freebuff', 'cmds', 'speckit.specify.md'))).toBe(true);
    expect(existsSync(join(root, '.freebuff', 'cmds', 'speckit.plan.md'))).toBe(true);
    expect(existsSync(join(root, '.freebuff', 'cmds', 'speckit.tasks.md'))).toBe(true);
    expect(existsSync(join(root, '.freebuff', 'cmds', 'speckit.implement.md'))).toBe(true);
  });
});
