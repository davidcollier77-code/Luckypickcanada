import { defineConfig } from '@playwright/test';
import standardConfig from './playwright.config';

/**
 * Option B — SwiftShader Playwright.
 *
 * This configuration is selected explicitly with
 * `pnpm exec playwright test --config=playwright.swiftshader.config.ts` (or the
 * `test:visual:swiftshader` package script). It inherits the standard projects and
 * web server, but requests Chromium's ANGLE/SwiftShader backend so graphics and
 * performance investigations exercise a software renderer even on a machine that
 * has a hardware GPU.
 *
 * Measured on the Playwright-pinned Chromium 156.0.8078.4: WebGL 1/2, shader
 * linking and pixel readback succeed with these three arguments, and the renderer
 * reports ANGLE/SwiftShader. WebGPU does not: Chromium reports
 * `webgpu: unavailable_software` and `navigator.gpu` stays undefined with every
 * combination of `--enable-unsafe-webgpu`, `--enable-features=Vulkan`,
 * `--use-vulkan=swiftshader` and `--use-webgpu-adapter=swiftshader`.
 *
 * No unsafe or experimental flag is carried, because none produced a capability
 * here: `--enable-unsafe-swiftshader` is unnecessary when ANGLE/SwiftShader is
 * requested explicitly, and `--enable-webgpu-developer-features` measurably
 * degraded compositing and WebGL readback without exposing WebGPU. Re-run the
 * probe before adding a flag; never infer support from a launch argument.
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
