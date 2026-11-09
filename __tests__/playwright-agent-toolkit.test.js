import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.cwd());
const packageManifestPath = path.join(root, 'package.json');
if (!existsSync(packageManifestPath)) {
  throw new Error(
    `Expected Vitest to run from the repository root; package.json not found at ${packageManifestPath}`,
  );
}
const skillRoot = path.join(root, '.agents/skills/playwright-cli');
const upstreamReferences = [
  'element-attributes.md',
  'playwright-tests.md',
  'pr-attachments.md',
  'request-mocking.md',
  'running-code.md',
  'session-management.md',
  'storage-state.md',
  'test-generation.md',
  'tracing.md',
  'video-recording.md',
];

describe('Playwright CLI agent toolkit', () => {
  it('ships the upstream skill, every linked reference and license', () => {
    expect(existsSync(path.join(skillRoot, 'SKILL.md'))).toBe(true);
    expect(existsSync(path.join(skillRoot, 'LICENSE'))).toBe(true);
    expect(existsSync(path.join(skillRoot, 'UPSTREAM.md'))).toBe(true);

    const skill = readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
    for (const name of upstreamReferences) {
      expect(existsSync(path.join(skillRoot, 'references', name)), name).toBe(true);
      expect(skill).toContain(`references/${name}`);
    }
  });

  it('documents the eight Lucky Pick Canada browser-work capabilities', () => {
    const guide = readFileSync(
      path.join(skillRoot, 'references/lucky-pick-canada.md'),
      'utf8',
    );
    const headings = [
      '### 1. Browser automation and interaction',
      '### 2. Responsive and mobile QA',
      '### 3. Test generation, execution, debugging and repair',
      '### 4. Network and API inspection',
      '### 5. Console debugging, traces and execution history',
      '### 6. Visual QA, screenshots and element inspection',
      '### 7. Cookies, local/session storage and authentication state',
      '### 8. Documents, media and PR evidence',
    ];
    for (const heading of headings) expect(guide).toContain(heading);
  });

  it('reuses the local Playwright packages and does not add a second CLI dependency', () => {
    const guide = readFileSync(
      path.join(skillRoot, 'references/lucky-pick-canada.md'),
      'utf8',
    );
    const setup = readFileSync(path.join(root, 'scripts/setup-playwright-agent.sh'), 'utf8');
    const manifest = JSON.parse(readFileSync(packageManifestPath, 'utf8'));

    expect(guide).toContain('pnpm exec playwright cli');
    expect(setup).toContain('pnpm exec playwright cli --help');
    expect(manifest.devDependencies.playwright).toBeDefined();
    expect(manifest.devDependencies['@playwright/test']).toBeDefined();
    expect(manifest.devDependencies['playwright-chromium']).toBeDefined();
    expect(manifest.devDependencies['@playwright/cli']).toBeUndefined();
    expect(manifest.dependencies?.['@playwright/cli']).toBeUndefined();
  });

  it('records the pinned upstream release and Apache-2.0 license', () => {
    const upstream = readFileSync(path.join(skillRoot, 'UPSTREAM.md'), 'utf8');
    const license = readFileSync(path.join(skillRoot, 'LICENSE'), 'utf8');
    expect(upstream).toContain('v0.1.23');
    expect(upstream).toContain('0a808078d96496cf2a8fa725143c870354f63cda');
    expect(license).toContain('Apache License');
    expect(license).toContain('Version 2.0');
  });
});
