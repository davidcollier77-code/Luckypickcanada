# Evidence: SwiftShader Configuration and Graphics-Rendering Architecture

**Feature**: `165-swiftshader-graphics-architecture`
**Date**: 2026-11-15
**Environment**: Ubuntu 24.04, Node 26.13.0, 8 CPUs, Playwright Chromium 156.0.8078.4,
no `/dev/dri` and no `/dev/nvidia*` (no physical GPU)

## Graphics probe

Full matrix and decisions: [research.md](./research.md).

| Observation | Result |
| --- | --- |
| Standard, headless shell | WebGL 1/2 yes, shader + pixel pass, `webgpu: unavailable_software`, `navigator.gpu` undefined |
| Standard, chromium channel | WebGL 1/2 yes, shader + pixel pass, `webgpu: unavailable_software`, `navigator.gpu` undefined |
| SwiftShader committed args | Renderer `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) …), SwiftShader driver)`; WebGL 1/2, shader link, pixel `[0,255,0,255]`, `glError` 0 |
| SwiftShader + all proposed WebGPU/Vulkan flags | `vulkan: enabled_on`, `webgpu: unavailable_software`, `navigator.gpu` undefined |
| SwiftShader + `--enable-webgpu-developer-features` | `gpu_compositing: disabled_software`, `webgl: enabled_readback`, still no WebGPU |

No console warning about SwiftShader appeared with or without `--enable-unsafe-swiftshader`.

## Commands actually run

| Command | Result |
| --- | --- |
| `pnpm exec vitest run __tests__/playwright-config-modes.test.js __tests__/playwright-agent-toolkit.test.js` | **PASS** — 2 files, 9/9 tests, exit 0 |
| `pnpm test` | **FAIL** — 79/80 files, 773/774 tests; one pre-existing governance failure (below) |
| `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| `pnpm exec playwright test tests/visual/security-headers.spec.ts --project=desktop --project=mobile-390` | **PASS** — 6/6 |
| `pnpm exec playwright test tests/visual/security-headers.spec.ts --project=mobile-412` | **PASS** — 3/3 |
| `pnpm exec playwright test tests/visual/security-headers.spec.ts --project=desktop --config=playwright.swiftshader.config.ts` | **PASS** — 3/3, 1 worker, SwiftShader renderer |
| WebGL-disabled browser check (`/tmp/lpc-fallback.mjs`, route `/lucky-meter`) | **PASS** — see below |
| `./freebuff-verify.sh` | **PASS** — exit 0; bootstrap, Spec Kit gate, checker tests, type check, production build, 36/36 docs tests |
| Build size (`du -sb .next`) | **PASS** — 370.26 MiB total, 161.17 MiB excluding cache (cap 495 MiB) |

## WebGL-disabled fallback observation

The page ran with `HTMLCanvasElement.prototype.getContext` returning `null` for `webgl`,
`experimental-webgl` and `webgl2`; Canvas 2D stayed available.

```json
{
  "webglAvailable": false,
  "buttons": ["✨Reveal My Resonance", ""],
  "hasStart": true,
  "stageMounted": true,
  "fallback": {
    "children": 2,
    "glowPresent": true,
    "background": "radial-gradient(120% 90% at 20% -10%, rgba(160, 220, 255, 0....",
    "canvasWebgl": true
  },
  "shareVisible": true,
  "errors": []
}
```

The cinematic stage mounted, rendered its static radial-gradient glow instead of WebGL, completed the
sequence, and reached the Share control with no page or console errors.

## Known pre-existing failure (not introduced by this change)

`__tests__/agent-governance-single-source.test.js` fails at line 126 because it looks for the heading
`### Playwright Browser Testing (Freebuff only)`, while `AGENTS.md` currently contains that text without
`###`:

```
$ git show 157008fd^:AGENTS.md | grep -n "Playwright Browser Testing"
79:### Playwright Browser Testing (Freebuff only)
$ git show 157008fd:AGENTS.md | grep -n "Playwright Browser Testing"
86:Playwright Browser Testing (Freebuff only)
$ git status --short AGENTS.md
(no output)
```

Commit `157008fd` ("Update AGENTS.md (#1912)", already on `main`) flattened the headings. The newer
`main` tip `f9d6d9d4` ("Update AGENTS.md (#1913)") still has no `###` headings and no
`Playwright Browser Testing` heading at all, so the guard remains red there too. This branch does not
modify `AGENTS.md`, so the failure exists independently of this diff. `AGENTS.md` is a protected
governance file; repairing either the file or its governance guard requires owner direction and a
separate governance PR.

## Limitations

- No physical GPU exists in this environment, so no hardware-rendered or GPU-performance claim is made.
- WebGPU is genuinely unavailable in this Chromium build (`unavailable_software`); no adapter or device
  was obtained.
- Firefox and WebKit were not run; their binaries are not available here.
- The screenshot-based visual suite was not run; functional desktop, mobile-390 and mobile-412 Playwright
  checks were. No visual baselines changed.
- The full unit suite has the one pre-existing governance failure described above; every other test
  passed.
