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
    // Browser QA has three tools in a strict priority order, not three interchangeable options.
    const playwrightIndex = connectedIntegrations.indexOf(
      '**Playwright:** Primary browser tool. Use first when available.',
    );
    const browserlessIndex = connectedIntegrations.indexOf(
      '**Browserless:** Mandatory fallback when Playwright is unavailable or fails. No additional approval required.',
    );
    const browserbaseIndex = connectedIntegrations.indexOf(
      '**Browserbase:** Last-resort fallback when Playwright and Browserless are unavailable or unsuitable. Requires explicit owner approval.',
    );

    expect(playwrightIndex).toBeGreaterThanOrEqual(0);
    expect(browserlessIndex).toBeGreaterThan(playwrightIndex);
    expect(browserbaseIndex).toBeGreaterThan(browserlessIndex);

    // Browserless is the automatic second choice; Browserbase is approval-gated.
    expect(connectedIntegrations).toContain(
      'Browserless and Browserbase are for Freebuff\'s direct browser-based task work.',
    );
    expect(connectedIntegrations).toContain(
      'Do not add either service to, or trigger either service from, automatic PR-checker workflows.',
    );
    expect(agents).toContain(
      '**Browser QA is mandatory.** Use this order: **1. Playwright** (primary); **2. Browserless** if Playwright is unavailable or fails; **3. Browserbase** only if both are unavailable or unsuitable, with explicit owner approval.',
    );
    expect(connectedIntegrations).toContain(
      'Stitch:** Available whenever useful',
    );
    expect(connectedIntegrations).toContain(
      'Use it sparingly to conserve usage.',
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
