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
    expect(swiftshaderConfig.use.launchOptions.args).not.toContain('--disable-gpu');
    expect(swiftshaderConfig.workers).toBe(1);
    expect(swiftshaderConfig.retries).toBe(0);
  });

  it('inherits the standard test directory, web server and projects', () => {
    expect(swiftshaderConfig.testDir).toBe(standardConfig.testDir);
    expect(swiftshaderConfig.webServer).toEqual(standardConfig.webServer);
    expect(swiftshaderConfig.projects?.map((project) => project.name)).toEqual(
      standardConfig.projects?.map((project) => project.name),
    );
  });

});
