import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source guard for `specs/100-playwright-version-alignment`.
 *
 * The Playwright CLI (`playwright`), the test package the visual specs import
 * (`@playwright/test`) and the browser package (`playwright-chromium`) must
 * resolve to one release. A split set makes the CLI load specs that register
 * their tests through a different runner version, which aborts discovery with
 * "Playwright Test did not expect test() to be called here."
 */

const root = process.cwd();
const PLAYWRIGHT_PACKAGES = ['playwright', '@playwright/test', 'playwright-chromium'];

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const pkg = JSON.parse(read('package.json'));
const lockfile = read('pnpm-lock.yaml');

function unquoteYamlScalar(value) {
  const scalar = value.trim();
  if (scalar.startsWith('"') && scalar.endsWith('"')) return JSON.parse(scalar);
  if (scalar.startsWith("'") && scalar.endsWith("'")) return scalar.slice(1, -1).replace(/''/g, "'");
  return scalar;
}

/** Read one direct dependency entry from the root lockfile importer. */
function importerDependency(name) {
  const lines = lockfile.split(/\r?\n/);
  const keys = [`      ${name}:`, `      '${name}':`];
  const index = lines.findIndex((line) => keys.includes(line));
  if (index === -1) return null;

  const specifierPrefix = '        specifier: ';
  const versionPrefix = '        version: ';
  const specifierLine = lines[index + 1] || '';
  const versionLine = lines[index + 2] || '';
  if (!specifierLine.startsWith(specifierPrefix) || !versionLine.startsWith(versionPrefix)) {
    return null;
  }

  return {
    specifier: unquoteYamlScalar(specifierLine.slice(specifierPrefix.length)),
    version: unquoteYamlScalar(versionLine.slice(versionPrefix.length)).split('(')[0],
  };
}

/** Every `playwright*@x.y.z` package present in the lockfile snapshots section. */
function snapshotVersions() {
  const snapshotsStart = lockfile.indexOf('\nsnapshots:');
  const source = snapshotsStart === -1 ? '' : lockfile.slice(snapshotsStart);
  const versions = new Set();
  for (const match of source.matchAll(/^ {2}(playwright(?:-core|-chromium)?)@(\d+\.\d+\.\d+):/gm)) {
    versions.add(match[2]);
  }
  return [...versions].sort();
}

describe('Playwright version alignment', () => {
  it('declares one shared range for the CLI, test package and Chromium package', () => {
    const ranges = PLAYWRIGHT_PACKAGES.map((name) => {
      const range = pkg.devDependencies[name];
      expect(range, `${name} must stay a direct devDependency`).toBeTruthy();
      return range;
    });

    expect(new Set(ranges).size).toBe(1);
  });

  it('resolves the CLI, test package and Chromium package to the same lockfile version', () => {
    const entries = PLAYWRIGHT_PACKAGES.map((name) => {
      const entry = importerDependency(name);
      expect(entry, `${name} must be resolved in the root lockfile importer`).not.toBeNull();
      return entry;
    });

    expect(new Set(entries.map((entry) => entry.version)).size).toBe(1);
    for (const [index, name] of PLAYWRIGHT_PACKAGES.entries()) {
      expect(entries[index].specifier).toBe(pkg.devDependencies[name]);
    }
  });

  it('leaves no second Playwright version in the lockfile snapshots', () => {
    const versions = snapshotVersions();

    expect(versions.length).toBeGreaterThan(0);
    expect(versions).toHaveLength(1);
    expect(versions[0]).toBe(importerDependency('playwright').version);
  });

  it('keeps operational instructions free of a hardcoded version or revision', () => {
    // The installed lockfile is the single source of truth. Documentation and
    // scripts that drive the tool must not pin a version, so a Dependabot or
    // owner update is picked up without editing them. Dated Spec Kit evidence
    // and measurement records are historical and intentionally excluded.
    const operational = [
      'README.md',
      '.agents/skills/playwright-cli/references/lucky-pick-canada.md',
      'scripts/playwright-cli.sh',
      'scripts/setup-playwright-agent.sh',
      '.github/workflows/visual-qa.yml',
    ];
    for (const path of operational) {
      const text = read(path);
      expect(text, `${path} must not hardcode a Chromium revision`).not.toMatch(
        /\bchromium-\d{3,}\b/,
      );
      expect(text, `${path} must not hardcode a Playwright range`).not.toMatch(
        /\^1\.\d+\.\d+/,
      );
    }
  });
});
