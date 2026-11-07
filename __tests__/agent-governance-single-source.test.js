import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const agentsPath = join(root, 'AGENTS.md');
const obsoleteEntryPoint = join(root, '.freebuff', 'freebuff.md');

let agents;

beforeAll(() => {
  try {
    agents = readFileSync(agentsPath, 'utf8');
  } catch (err) {
    throw new Error(
      `Unable to read AGENTS.md at ${agentsPath}: ${err.message}`
    );
  }
});
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
    expect(agents).toContain(
      'single authoritative workflow and safety policy for every coding agent, including Freebuff',
    );
    expect(agents).not.toContain('.freebuff/freebuff.md');
    expect(existsSync(obsoleteEntryPoint)).toBe(false);
  });

  it('preserves the MCP connection-versus-use clarification', () => {
    expect(agents).toContain(
      'A connection or initialization alone does not count as MCP use.',
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
