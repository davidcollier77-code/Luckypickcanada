import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { configurePlaywrightFonts } from './tests/visual/playwright-fontconfig';

/**
 * Freebuff's workspace image ships none of Chromium's shared libraries and refuses
 * root, so `scripts/setup-chromium-libs.sh` unpacks them into `~/.local/chromium-libs`.
 * The browser process inherits this process's environment, so point it at that prefix
 * when it exists. Developer machines and CI runners with system libraries, where the
 * prefix is absent, are unchanged.
 */
function configureChromiumRuntime() {
  if (process.platform !== 'linux') return;

  const prefix =
    process.env.CHROMIUM_LIBS_PREFIX ?? path.join(os.homedir(), '.local', 'chromium-libs');
  if (!fs.existsSync(path.join(prefix, 'usr', 'lib', 'x86_64-linux-gnu', 'libnspr4.so'))) return;

  const libraryDirectories = [
    path.join(prefix, 'usr', 'lib', 'x86_64-linux-gnu'),
    path.join(prefix, 'lib', 'x86_64-linux-gnu'),
    path.join(prefix, 'usr', 'lib'),
    path.join(prefix, 'lib'),
  ].filter((directory) => fs.existsSync(directory));

  const currentDirectories = (process.env.LD_LIBRARY_PATH ?? '').split(':').filter(Boolean);
  const missingDirectories = libraryDirectories.filter(
    (directory) => !currentDirectories.includes(directory),
  );
  if (missingDirectories.length > 0) {
    process.env.LD_LIBRARY_PATH = [...currentDirectories, ...missingDirectories].join(':');
  }

  const fontConfigDirectory = path.join(prefix, 'etc', 'fonts');
  const fontConfigFile = path.join(fontConfigDirectory, 'lpc-fonts.conf');
  if (!process.env.FONTCONFIG_FILE && fs.existsSync(fontConfigFile)) {
    process.env.FONTCONFIG_FILE = fontConfigFile;
  }
  if (!process.env.FONTCONFIG_PATH && fs.existsSync(fontConfigDirectory)) {
    process.env.FONTCONFIG_PATH = fontConfigDirectory;
  }
}

configureChromiumRuntime();
configurePlaywrightFonts();

const PORT = 3000;

export default defineConfig({
  testDir: './tests/visual',
  testMatch: '**/*.spec.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: false,
  // Run independent spec files concurrently; keep tests within each file ordered.
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  // The `github` reporter turns failures into check-run annotations so CI
  // results stay readable without downloading job logs or artifacts.
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    colorScheme: 'dark',
    locale: 'en-CA',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
    { name: 'mobile-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } },
    { name: 'mobile-412', use: { browserName: 'chromium', viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `pnpm dev --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
