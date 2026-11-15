// @vitest-environment node
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import standardConfig from '../playwright.config.ts';
import swiftshaderConfig from '../playwright.swiftshader.config.ts';

const standardConfigSource = fs.readFileSync(
  new URL('../playwright.config.ts', import.meta.url),
  'utf8',
);

const SWIFTSHADER_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-gpu',
];

// Measured on Chromium 156.0.8078.4: none of these produced a capability that the
// committed three arguments do not already provide, and each weakens a browser
// safeguard or degrades the session. Keeping them out is the investigation result.
const REJECTED_SWIFTSHADER_ARGS = [
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-unsafe-webgpu',
  '--enable-webgpu-developer-features',
  '--enable-features=Vulkan',
  '--use-vulkan=swiftshader',
  '--use-webgpu-adapter=swiftshader',
];

const packageJson = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

describe('Playwright configuration modes', () => {
  it('keeps the standard configuration free of SwiftShader launch settings', () => {
    expect(standardConfig.use.channel).toBeUndefined();
    expect(standardConfig.use.launchOptions).toBeUndefined();
    expect(standardConfig.use.launchOptions?.args).toBeUndefined();
    expect(standardConfigSource).not.toMatch(/swiftshader/i);
  });

  it('forces the SwiftShader backend only in the opt-in configuration', () => {
    expect(swiftshaderConfig.use.launchOptions).toBeDefined();
    expect(swiftshaderConfig.use.launchOptions.args).toEqual(SWIFTSHADER_ARGS);
    expect(swiftshaderConfig.workers).toBe(1);
    expect(swiftshaderConfig.retries).toBe(0);
  });

  it('rejects unsafe and experimental graphics flags the probe found unnecessary', () => {
    for (const flag of REJECTED_SWIFTSHADER_ARGS) {
      expect(swiftshaderConfig.use.launchOptions.args).not.toContain(flag);
    }
  });

  it('exposes the documented SwiftShader package script', () => {
    expect(packageJson.scripts['test:visual']).toBe('playwright test');
    expect(packageJson.scripts['test:visual:swiftshader']).toBe(
      'playwright test --config=playwright.swiftshader.config.ts',
    );
  });

  it('inherits the standard test directory, web server and projects', () => {
    expect(swiftshaderConfig.testDir).toBe(standardConfig.testDir);
    expect(swiftshaderConfig.webServer).toEqual(standardConfig.webServer);
    expect(swiftshaderConfig.projects?.map((project) => project.name)).toEqual(
      standardConfig.projects?.map((project) => project.name),
    );
  });

});
