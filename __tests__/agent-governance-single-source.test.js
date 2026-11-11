import { existsSync, readFileSync } from 'node:fs';
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

  it('checks the current repository QA and implementation requirements', () => {
    const agents = readAgents();

    expect(agents).toContain('REPOSITORY QA AND VALIDATION');
    expect(agents).toContain(
      'Inspect the actual repository workflows, scripts, configurations and referenced requirements.',
    );
    expect(agents).toContain(
      "Use the repository's Playwright CLI as the primary browser tool.",
    );
    expect(agents).toContain(
      'If Playwright remains unavailable, use Browserless as the fallback for direct browser tasks.',
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

  it('requires explicit owner authorization before AGENTS.md can change', () => {
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
    expect(codeowners).toMatch(/^\/AGENTS\.md\s+@davidcollier77-code$/m);
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
    expect(existsSync(join(root, '.freebuff', 'cmds', 'speckit.implement.md')).toBe(true);
  });
});
