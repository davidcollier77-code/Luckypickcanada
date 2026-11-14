import { defineConfig } from '@playwright/test';
import standardConfig from './playwright.config';

/**
 * Option B — SwiftShader Playwright.
 *
 * This configuration is selected explicitly with
 * `pnpm exec playwright test --config=playwright.swiftshader.config.ts` (or the
 * `test:visual:swiftshader` package script). It inherits the standard projects and
 * web server, but forces Chromium's ANGLE/SwiftShader backend so graphics and
 * performance investigations exercise the software GPU path even on a machine
 * that has a hardware GPU.
 *
 * `--disable-gpu` is deliberately absent: it would disable the GPU process and
 * compositing instead of exercising them. One worker keeps two software renderers
 * from competing for the same CPUs, and retries stay off so a launch or rendering
 * failure is visible on the first run.
 *
 * Normal QA and every CI workflow continue to use `playwright.config.ts`.
 */
export default defineConfig({
  ...standardConfig,
  workers: 1,
  retries: 0,
  use: {
    ...standardConfig.use,
    launchOptions: {
      ...standardConfig.use.launchOptions,
      args: [
        ...(standardConfig.use?.launchOptions?.args ?? []),
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-gpu',
      ],
    },
  },
});
