# Research: SwiftShader Configuration and Graphics-Rendering Architecture

**Feature**: `165-swiftshader-graphics-architecture`
**Date**: 2026-11-15
**Browser**: Playwright-pinned Chromium 156.0.8078.4
**Host**: Ubuntu 24.04, Node 26.13.0, 8 CPUs, no `/dev/dri` or `/dev/nvidia*`

## Method

Each variant launched the same Playwright Chromium build with the arguments below, then in one page:

1. Read `navigator.gpu`.
2. Create a WebGL 1 context, read `WEBGL_debug_renderer_info`, compile and link a minimal shader,
   draw a 1×1 green triangle, and read the pixel back with `readPixels`.
3. Create a WebGL 2 context and record its version string.
4. Create a Canvas 2D context, fill it, and read a pixel back.
5. When `navigator.gpu` existed, request an adapter (including `forceFallbackAdapter: true`), then a
   device, and report features and limits.
6. Read Chromium's own `SystemInfo.getInfo` GPU feature status over CDP, so the result comes from the
   browser's feature decision rather than from the page alone.

Two Standard launches were included as controls: Playwright's `chromium-headless-shell` and the full
`chromium` channel, each with no launch arguments.

## Results

| Variant | Graphics arguments | WebGL | WebGL2 | Shader + pixel | `webgpu` feature status | `navigator.gpu` |
| --- | --- | --- | --- | --- | --- | --- |
| Standard, headless shell | none | yes | yes | pass | `unavailable_software` | `undefined` |
| Standard, chromium channel | none | yes | yes | pass | `unavailable_software` | `undefined` |
| A (committed SwiftShader config) | `--use-gl=angle --use-angle=swiftshader --enable-gpu` | yes | yes | pass | `unavailable_software` | `undefined` |
| B | A + `--enable-unsafe-swiftshader` | yes | yes | pass | `unavailable_software` | `undefined` |
| C | A + `--enable-unsafe-swiftshader --ignore-gpu-blocklist` | yes | yes | pass | `unavailable_software` | `undefined` |
| D | C + `--enable-unsafe-webgpu` | yes | yes | pass | `unavailable_software` | `undefined` |
| E | D + `--enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader` | yes | yes | pass | `unavailable_software` (`vulkan: enabled_on`) | `undefined` |
| F | E + `--disable-vulkan-surface` | yes | yes | pass | `unavailable_software` | `undefined` |
| G | E + `--enable-features=Vulkan,WebGPU` | yes | yes | pass | `unavailable_software` | `undefined` |
| H | G + `--enable-webgpu-developer-features` | yes (readback) | yes | pass | `unavailable_software` (`gpu_compositing: disabled_software`) | `undefined` |
| I | E without `--enable-unsafe-swiftshader` | yes | yes | pass | `unavailable_software` | `undefined` |

The renderer string was identical in every variant:

```
ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver-5.0.0)
```

Full feature status in the committed configuration:

```
2d_canvas: enabled            gpu_compositing: enabled        webgl: enabled
rasterization: enabled        vulkan: disabled_off             webgpu: unavailable_software
```

`vulkan` became `enabled_on` only when the Vulkan feature flags were passed, which confirms those flags
took effect. WebGPU still reported `unavailable_software` and `navigator.gpu` remained absent, so the
missing capability is not a hidden flag.

No console warning about SwiftShader or software WebGL appeared in any variant, with or without
`--enable-unsafe-swiftshader`.

## Decisions

| Setting | Decision | Reason |
| --- | --- | --- |
| `--use-gl=angle --use-angle=swiftshader --enable-gpu` | Keep | Produces the documented SwiftShader renderer with a working WebGL/WebGL2 pipeline. It is the only explicit request the configuration needs. |
| `--enable-unsafe-swiftshader` | Do not add | WebGL was `enabled` and shaders executed without it. An explicit `--use-angle=swiftshader` request is still honored in this build, so the unsafe opt-in buys nothing here and weakens a browser safeguard. |
| `--ignore-gpu-blocklist` | Do not add | No blocklist was in effect; the flag changed no feature status. It is a host-specific workaround, not a portable default. |
| `--enable-unsafe-webgpu` | Do not add | No adapter and no API exposure with or without it. |
| `--enable-features=Vulkan`, `--use-vulkan=swiftshader`, `--use-webgpu-adapter=swiftshader` | Do not add | They enable software Vulkan (`vulkan: enabled_on`) but produce no WebGPU adapter; Chromium keeps WebGPU unavailable for software adapters in this build. |
| `--enable-webgpu-developer-features` | Do not add | Active regression: `gpu_compositing` fell to `disabled_software` and WebGL to `enabled_readback` with no WebGPU gain. |
| `--disable-gpu` | Do not add | Disables the GPU process and compositing instead of exercising them. |
| `--disable-dev-shm-usage` | CLI wrapper only | Container shared-memory safety; not a graphics setting and not needed by the repository test configuration. |

## Security analysis

Every rejected flag lowers a safeguard:

- `--enable-unsafe-swiftshader` re-enables a fallback path Chromium deliberately restricted.
- `--ignore-gpu-blocklist` overrides the driver blocklist that exists to avoid known-bad GPU/driver
  combinations.
- `--enable-unsafe-webgpu` relaxes the WebGPU availability gate.
- `--enable-webgpu-developer-features` enables unstable developer behaviour.

None of them produced a capability in this environment, so none of them belongs in a committed
configuration. The three retained flags select an existing renderer explicitly; they do not bypass a
security boundary.

## What this does and does not establish

Established by execution:

- WebGL 1 and 2 context creation, shader compilation/linking, draw and pixel readback work under
  Standard and SwiftShader configurations on this host.
- Canvas 2D works in the same sessions.
- Chromium reports WebGPU as `unavailable_software`; no tested flag exposes `navigator.gpu`.
- The committed SwiftShader configuration's renderer string is ANGLE/SwiftShader.

Not established:

- Physical-GPU behaviour or performance: this host has none.
- WebGPU rendering on hardware: no adapter was available.
- That a future Chromium build will keep the same feature status. The probe must be rerun, because
  flags are not a guarantee.
- Mobile Safari, Firefox or WebKit: those binaries are not available here.

## References

- Chromium `SystemInfo.getInfo` CDP domain (browser feature status).
- Chromium ANGLE/SwiftShader launch documentation for the meaning of the tested flags.
- Repository: `playwright.swiftshader.config.ts`, `__tests__/playwright-config-modes.test.js`,
  `app/lib/graphics-capabilities.js`, `specs/161-playwright-swiftshader-mode`,
  `specs/162-graphics-capability-foundation`.
