import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLuckyMeterMedallionEngine } from '../components/lucky-meter-medallion-engine';
import { createLuckyMeterOrnamentEngine } from '../components/lucky-meter-ornament-engine';
import * as lighting from '../app/lib/gpu-lighting';

/**
 * Both lit renderers watch their canvas for context loss. The interface drops to
 * the static fallback while the context is gone, so the renderers have to
 * recreate their program and buffers on `webglcontextrestored` and report ready
 * again — otherwise a single GPU reset leaves the Lucky Meter on the fallback
 * art for the lifetime of the page.
 *
 * jsdom has no WebGL implementation, so context acquisition is stubbed and the
 * resource helpers are mocked; the context-loss watcher, the animation wiring
 * and the engines themselves run for real.
 */

const glStub = {
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clearDepth: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  depthFunc: vi.fn(),
  blendFunc: vi.fn(),
  deleteProgram: vi.fn(),
};

vi.mock('../app/lib/graphics-capabilities', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getWebGLContext: () => glStub,
    prefersReducedMotion: () => false,
    getRenderQuality: () => ({
      tier: 'high',
      meshSegments: 64,
      ornament: { far: 4, near: 2 },
      foreground: true,
      maxPixelRatio: 2,
      particleScale: 1.2,
      haze: true,
      sparkBudget: 900,
    }),
  };
});

vi.mock('../app/lib/gpu-lighting', () => ({
  createMeshProgram: vi.fn(() => ({ program: {}, uniforms: {}, attributes: {} })),
  createMeshBuffers: vi.fn(() => ({ dispose: vi.fn() })),
  beginMeshFrame: vi.fn(),
  drawMesh: vi.fn(),
}));

let originalRaf;
let originalCancelRaf;
let frameBudget = 0;

beforeEach(() => {
  vi.clearAllMocks();
  frameBudget = 0;
  originalRaf = window.requestAnimationFrame;
  originalCancelRaf = window.cancelAnimationFrame;
  // Bounded synchronous frames: enough for the first draw and the re-announce,
  // without letting the loop recurse forever.
  window.requestAnimationFrame = (callback) => {
    if (frameBudget < 3) {
      frameBudget += 1;
      callback(frameBudget * 16);
    }
    return frameBudget;
  };
  window.cancelAnimationFrame = () => {};
});

afterEach(() => {
  window.requestAnimationFrame = originalRaf;
  window.cancelAnimationFrame = originalCancelRaf;
});

describe('Lucky Meter renderers and WebGL context loss', () => {
  it('rebuilds the medallion resources and re-announces readiness after a restore', () => {
    const canvas = document.createElement('canvas');
    let readyCount = 0;
    let unavailableCount = 0;

    const engine = createLuckyMeterMedallionEngine({
      canvas,
      onReady: () => {
        readyCount += 1;
      },
      onUnavailable: () => {
        unavailableCount += 1;
      },
    });

    expect(engine).not.toBeNull();
    expect(readyCount).toBe(1);
    expect(lighting.createMeshProgram).toHaveBeenCalledTimes(1);
    expect(lighting.createMeshBuffers).toHaveBeenCalledTimes(1);

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(unavailableCount).toBe(1);

    // The browser delivers fresh animation frames once the context is back.
    frameBudget = 0;
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    // A lost context invalidates the program and the buffers, so both must be
    // recreated before the next frame.
    expect(lighting.createMeshProgram).toHaveBeenCalledTimes(2);
    expect(lighting.createMeshBuffers).toHaveBeenCalledTimes(2);
    // The ring switched to its static fallback on loss; the rebuilt renderer
    // must be able to take over again.
    expect(readyCount).toBe(2);

    engine.destroy();
    // The browser delivers fresh animation frames once the context is back.
    frameBudget = 0;
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(lighting.createMeshProgram).toHaveBeenCalledTimes(2);
  });

  it('rebuilds the ornament resources and keeps its leaf composition', () => {
    const canvas = document.createElement('canvas');
    let readyCount = 0;
    let unavailableCount = 0;

    const engine = createLuckyMeterOrnamentEngine({
      canvas,
      layer: 'far',
      onReady: () => {
        readyCount += 1;
      },
      onUnavailable: () => {
        unavailableCount += 1;
      },
    });

    expect(engine).not.toBeNull();
    const leafCount = engine.leafCount;
    expect(leafCount).toBeGreaterThan(0);
    expect(readyCount).toBe(1);

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(unavailableCount).toBe(1);

    // The browser delivers fresh animation frames once the context is back.
    frameBudget = 0;
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(lighting.createMeshProgram).toHaveBeenCalledTimes(2);
    expect(lighting.createMeshBuffers).toHaveBeenCalledTimes(2);
    expect(readyCount).toBe(2);
    // The restored layer reuses the leaves it already placed.
    expect(engine.leafCount).toBe(leafCount);

    engine.destroy();
  });
});
