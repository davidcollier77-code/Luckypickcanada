import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The Lucky Meter mounts its vessel early and hidden so the glass, liquid and
 * stream shaders compile during the anticipation beat. That warm-up must not
 * render for the whole wait: the scene idles once the untouched vessel settles
 * empty, wakes for the visitor's real reading, and ignores the warm-up
 * re-reporting the same zero state.
 *
 * The runtime, and therefore WebGL, is replaced with a fake Three.js surface so
 * these tests drive the scene's own frame clock directly. The geometries,
 * materials, lights and particle field are the real toolkit implementations.
 */

const control = vi.hoisted(() => ({
  frame: null,
  start: null,
  stop: null,
  dispose: null,
}));

vi.mock('../app/lib/graphics/runtime.js', async () => {
  const THREE = await import('three');
  return {
    createCreativeSurface: async ({ onFrame }) => {
      const stage = {
        three: THREE,
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        renderer: {},
        quality: { tier: 'balanced' },
        budget: {},
      };
      control.frame = onFrame;
      control.start = vi.fn();
      control.stop = vi.fn();
      control.dispose = vi.fn();
      return {
        kind: 'three',
        plan: {},
        reactive: null,
        stage,
        effects: null,
        start: control.start,
        stop: control.stop,
        dispose: control.dispose,
      };
    },
  };
});

import { createLuckyMeterVesselScene } from '../app/lib/lucky-meter/vessel-scene.js';

/** The scene's default pour colour, i.e. the untouched warm-up state. */
const WARM_UP_COLOUR = '#a65e3b';

function renderFrame(elapsed) {
  control.frame({
    kind: 'three',
    delta: 16,
    elapsed,
    size: { width: 640, height: 640 },
  });
}

async function mountScene() {
  const scene = await createLuckyMeterVesselScene({ canvas: document.createElement('canvas') });
  expect(scene).not.toBeNull();
  return scene;
}

describe('Lucky Meter vessel hidden warm-up lifecycle', () => {
  let previousWebGL;

  beforeEach(() => {
    previousWebGL = globalThis.WebGLRenderingContext;
    // The scene refuses to run without a WebGL constructor; jsdom has none.
    globalThis.WebGLRenderingContext = function WebGLRenderingContext() {};
  });

  afterEach(() => {
    if (previousWebGL === undefined) delete globalThis.WebGLRenderingContext;
    else globalThis.WebGLRenderingContext = previousWebGL;
    vi.clearAllMocks();
  });

  it('stops the frame loop once the untouched warm-up settles empty', async () => {
    const scene = await mountScene();
    expect(control.start).toHaveBeenCalledTimes(1);

    // The empty vessel keeps a short grace so its first frames still compile
    // the glass, liquid, dust and light shaders the pour will use.
    renderFrame(0.1);
    expect(control.stop).not.toHaveBeenCalled();

    renderFrame(0.3);
    expect(control.stop).toHaveBeenCalledTimes(1);

    // A stopped surface stays stopped: no later frame repeats the stop.
    renderFrame(0.6);
    renderFrame(1.2);
    expect(control.stop).toHaveBeenCalledTimes(1);

    scene.dispose();
    expect(control.dispose).toHaveBeenCalledTimes(1);
  });

  it('restarts the frame loop when the visitor’s reading begins', async () => {
    const scene = await mountScene();
    renderFrame(0.3);
    expect(control.stop).toHaveBeenCalledTimes(1);

    // The reveal opens the vessel and starts the pour: the first real change
    // from the warm-up's zero state must wake the loop again.
    scene.setState({ colour: '#2f8f6b', fill: 0.2, open: 0.12 });
    expect(control.start).toHaveBeenCalledTimes(2);
    expect(control.stop).toHaveBeenCalledTimes(1);

    // With the reading under way the scene is no longer at rest, so it keeps
    // rendering through the pour.
    renderFrame(0.4);
    renderFrame(0.5);
    expect(control.stop).toHaveBeenCalledTimes(1);

    scene.dispose();
  });

  it('restarts after an explicit stop when the visitor’s reading begins', async () => {
    const scene = await mountScene();
    expect(control.start).toHaveBeenCalledTimes(1);

    // A consumer can pause the surface directly; that pause is still an idle
    // stop, so the first real reading must be able to start the loop again.
    scene.stop();
    expect(control.stop).toHaveBeenCalledTimes(1);

    scene.setState({ colour: '#2f8f6b', fill: 0.2, open: 0.12 });
    expect(control.start).toHaveBeenCalledTimes(2);
    expect(control.stop).toHaveBeenCalledTimes(1);

    scene.dispose();
  });

  it('does not restart for unchanged idle states while the warm-up is hidden', async () => {
    const scene = await mountScene();
    renderFrame(0.3);
    expect(control.stop).toHaveBeenCalledTimes(1);
    expect(control.start).toHaveBeenCalledTimes(1);

    // The hidden panel re-renders on its parent's clock and reports the same
    // settled zero state each time. None of these is a new reading.
    scene.setState({ colour: WARM_UP_COLOUR, fill: 0, open: 0 });
    scene.setState({ fill: 0, open: 0 });
    scene.setState({ fill: 0 });
    scene.setState({ pour: 0, open: 0 });
    scene.setState({});

    expect(control.start).toHaveBeenCalledTimes(1);
    expect(control.stop).toHaveBeenCalledTimes(1);

    // The first change still wakes it exactly once, not once per idle call.
    scene.setState({ fill: 0.05 });
    expect(control.start).toHaveBeenCalledTimes(2);

    scene.dispose();
  });
});
