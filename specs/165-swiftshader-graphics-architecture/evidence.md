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
| `pnpm exec vitest run __tests__/agent-governance-single-source.test.js` | **PASS** — 10/10 after aligning expectations with the current `AGENTS.md` |
| `pnpm test` | **PASS** — 80/80 files, 774/774 tests, exit 0 |
| `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| `pnpm exec playwright test tests/visual/security-headers.spec.ts --project=desktop --project=mobile-390` | **PASS** — 6/6 |
| `pnpm exec playwright test tests/visual/security-headers.spec.ts --project=mobile-412` | **PASS** — 3/3 |
| `pnpm exec playwright test tests/visual/security-headers.spec.ts --project=desktop --config=playwright.swiftshader.config.ts` | **PASS** — 3/3, 1 worker, SwiftShader renderer |
| WebGL-disabled browser check (`/tmp/lpc-fallback.mjs`, route `/lucky-meter`) | **PASS** — see below |
| `./freebuff-verify.sh` | **PASS** — exit 0; bootstrap, Spec Kit gate, checker tests, type check, production build, 36/36 docs tests |
| Build size (`du -sb .next`) | **PASS** — 387.04 MiB total, 160.32 MiB excluding cache (cap 495 MiB) |

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

## Governance test alignment

The governance guard was written for an earlier `AGENTS.md` layout. PR #1913 replaced that file with the
unified ChatGPT/Freebuff instruction set, so assertions that looked for the old entry-point sentence,
section headings, browser-fallback ordering, Playwright option labels and Spec Kit counts no longer
matched. The instructions were correct; the expectations were stale.

Only `__tests__/agent-governance-single-source.test.js` changed:

| Previous expectation | Current instruction checked |
| --- | --- |
| "This file is the primary repository instruction for Freebuff." | "This document establishes the repository governance and operating requirements for ChatGPT and Freebuff." |
| "4. Submit the PR." and a `PROJECT-WIDE TECHNICAL RULES` boundary | "4. SUBMIT THE PR" and the Freebuff/ChatGPT section boundary |
| "task-planning input" | "This is a task-planning requirement…" |
| "Use Playwright as the primary browser automation tool." | "Playwright is Freebuff's primary browser automation tool." |
| Browserless/Firecrawl fallback sentences | The current Freebuff rule ("Crawlbase is Freebuff's first and only fallback") plus the ChatGPT Browserless/Firecrawl rules, both asserted |
| Playwright "Option A/B" block in `AGENTS.md` | `AGENTS.md` now designates `.agents/skills/playwright-cli/SKILL.md` and its reference as authoritative; the guard asserts that delegation and verifies `Standard`, `SwiftShader`, `playwright.swiftshader.config.ts` and `not a physical-GPU benchmark` in the skill file |
| "all nine command definitions" / "four core stages" in `AGENTS.md` | Current Spec Kit requirements: current command definitions, prescribed stage order, mandatory template sections, owner notification, wording-only updates and no silent workflow change; all nine command files are still asserted |

No coverage area was dropped. PR-submission handoff, QA planning requirements, the build-size cap,
evidence statements, Playwright wrapper and mode separation, ChatGPT's exclusion, the Spec Kit workflow
and every task-group file remain guarded. The nine-command check now validates the command files that
`AGENTS.md` delegates to, rather than a hardcoded count in the prose.

`AGENTS.md` and `PR_SUBMISSION.md` were not modified. Verification: the focused governance suite passes
10/10, the full suite passes 80/80 files and 774/774 tests, `tsc --noEmit` exits 0, and
`./freebuff-verify.sh` exits 0 with the build below the cap.

## Limitations

- No physical GPU exists in this environment, so no hardware-rendered or GPU-performance claim is made.
- WebGPU is genuinely unavailable in this Chromium build (`unavailable_software`); no adapter or device
  was obtained.
- Firefox and WebKit were not run; their binaries are not available here.
- The screenshot-based visual suite was not run; functional desktop, mobile-390 and mobile-412 Playwright
  checks were. No visual baselines changed.
- No unit-test failures remain; the governance guard passes against the current instructions.
