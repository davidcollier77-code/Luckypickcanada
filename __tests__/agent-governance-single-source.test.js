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

  it('preserves the MCP connection-versus-use clarification', () => {
    const agents = readAgents();

    // Tracks the current wording in AGENTS.md section 5. An earlier revision
    // phrased the same rule as a separate sentence; rewording must keep the
    // requirement that a listed MCP or a connection alone is not MCP use.
    expect(agents).toContain(
      'Do not use an MCP merely because it is available, expand task scope through an MCP, or treat connection/initialization alone as MCP use.',
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
