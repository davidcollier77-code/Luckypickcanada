import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `playwright.config.ts` points Chromium at the workspace's private library and
 * font prefix. A shell can inherit FONTCONFIG_FILE/FONTCONFIG_PATH from another
 * workspace; if that path is gone, fontconfig fails to load and the provisioned
 * fonts are silently dropped. These tests load the real config module against a
 * temporary prefix so the guard is exercised, not just inspected.
 */
const originalEnv = {
  CHROMIUM_LIBS_PREFIX: process.env.CHROMIUM_LIBS_PREFIX,
  FONTCONFIG_FILE: process.env.FONTCONFIG_FILE,
  FONTCONFIG_PATH: process.env.FONTCONFIG_PATH,
  LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH,
};

const prefixes = [];

function makePrefix() {
  const prefix = fs.mkdtempSync(path.join(os.tmpdir(), 'lpc-chromium-prefix-'));
  prefixes.push(prefix);
  fs.mkdirSync(path.join(prefix, 'usr', 'lib', 'x86_64-linux-gnu'), { recursive: true });
  fs.writeFileSync(path.join(prefix, 'usr', 'lib', 'x86_64-linux-gnu', 'libnspr4.so'), '');
  fs.mkdirSync(path.join(prefix, 'etc', 'fonts'), { recursive: true });
  fs.writeFileSync(path.join(prefix, 'etc', 'fonts', 'lpc-fonts.conf'), '<fontconfig></fontconfig>');
  return prefix;
}

describe.skipIf(process.platform !== 'linux')('Playwright config Chromium runtime', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
    vi.unstubAllEnvs();
    vi.resetModules();
    for (const prefix of prefixes.splice(0)) {
      fs.rmSync(prefix, { recursive: true, force: true });
    }
  });

  it('replaces an inherited fontconfig path that no longer exists', async () => {
    const prefix = makePrefix();
    const staleDirectory = path.join(prefix, 'another-workspace', 'etc', 'fonts');

    vi.stubEnv('CHROMIUM_LIBS_PREFIX', prefix);
    vi.stubEnv('FONTCONFIG_FILE', path.join(staleDirectory, 'lpc-fonts.conf'));
    vi.stubEnv('FONTCONFIG_PATH', staleDirectory);
    vi.stubEnv('LD_LIBRARY_PATH', '');

    await import('../playwright.config.ts');

    expect(process.env.FONTCONFIG_FILE).toBe(path.join(prefix, 'etc', 'fonts', 'lpc-fonts.conf'));
    expect(process.env.FONTCONFIG_PATH).toBe(path.join(prefix, 'etc', 'fonts'));
    expect(process.env.LD_LIBRARY_PATH).toContain(path.join(prefix, 'usr', 'lib', 'x86_64-linux-gnu'));
  });

  it('keeps an inherited fontconfig path that exists', async () => {
    const prefix = makePrefix();
    const customDirectory = path.join(prefix, 'custom-fonts');
    fs.mkdirSync(customDirectory, { recursive: true });
    const customFile = path.join(customDirectory, 'fonts.conf');
    fs.writeFileSync(customFile, '<fontconfig></fontconfig>');

    vi.stubEnv('CHROMIUM_LIBS_PREFIX', prefix);
    vi.stubEnv('FONTCONFIG_FILE', customFile);
    vi.stubEnv('FONTCONFIG_PATH', customDirectory);

    await import('../playwright.config.ts');

    expect(process.env.FONTCONFIG_FILE).toBe(customFile);
    expect(process.env.FONTCONFIG_PATH).toBe(customDirectory);
  });
});
