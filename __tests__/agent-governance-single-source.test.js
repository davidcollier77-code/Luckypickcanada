import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const agentsPath = join(root, 'AGENTS.md');
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
  it('uses AGENTS.md as the only general repository-governance entrypoint', () => {
    const agents = readAgents();

    expect(agents).toContain(
      'single authoritative workflow and safety policy for every coding agent, including Freebuff',
    );
    expect(agents).not.toContain('.freebuff/freebuff.md');
    expect(existsSync(obsoleteEntryPoint)).toBe(false);
  });

  it('defines the Connected Integrations section and preserves its access rules', () => {
    const agents = readAgents();
    const start = agents.indexOf('### Connected Integrations');
    const end = agents.indexOf('### PR ownership', start);
    const connectedIntegrations = agents.slice(start, end);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(connectedIntegrations).not.toContain('MCP');
    expect(agents).toContain(
      'A connection or initialization alone does not count as actual integration use.',
    );
    expect(connectedIntegrations).toContain(
      'GitHub:** Always available for normal authorized repository work',
    );
    // Recognize every supported browser QA provider without hard-coding tool order or descriptions.
    const supportedBrowserQaTools = ['Playwright', 'Browserless'];

    for (const toolName of supportedBrowserQaTools) {
      expect(connectedIntegrations).toContain(toolName);
    }

    expect(agents).toContain('**Browser QA is mandatory for changes that affect browser-visible behavior or end-to-end user workflows.**');
    // Playwright is the project-local CLI/Test path; Browserless is the sole connected browser fallback.
    expect(connectedIntegrations).toContain('Browserless:** Connected remote-browser capability');
    expect(connectedIntegrations).not.toContain('Browserbase');
    expect(connectedIntegrations).toContain('MUST NOT add or invoke Browserless');
    expect(connectedIntegrations).toContain(
      'Penpot:** Available whenever useful',
    );
    expect(connectedIntegrations).toContain(
      'Penpot:** Available whenever useful for UI design, layout exploration, visual concepts and prototyping.',
    );
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
