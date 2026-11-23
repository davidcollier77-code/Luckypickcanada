// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The automatic creative layer: technology selection, resource derivation,
 * sync cues and the building blocks. The probes are mocked so the same tests
 * cover a WebGL-capable device, a Canvas-only device and reduced motion.
 */
const probe = vi.hoisted(() => ({
  webgl: true,
  canvas2d: true,
  reduced: false,
  context: null,
}));

vi.mock('../app/lib/graphics-capabilities.js', () => ({
  RENDER_QUALITY: { HIGH: 'high', BALANCED: 'balanced', CONSTRAINED: 'constrained' },
  supportsWebGL: () => probe.webgl,
  supportsCanvas2D: () => probe.canvas2d,
  prefersReducedMotion: () => probe.reduced,
  onReducedMotionChange: () => () => {},
  watchContextLoss: () => () => {},
  getRenderQuality: () => ({
    tier: 'balanced',
    maxPixelRatio: 1.6,
    particleScale: 0.85,
    sparkBudget: 560,
  }),
  getCanvasPixelRatio: (cap) => Math.min(1.6, Number.isFinite(cap) && cap > 0 ? cap : 1.6),
  getCanvas2DContext: () => probe.context,
}));

import {
  GRAPHICS_TECHNOLOGY,
  MOTION_TECHNOLOGY,
  selectGraphicsTechnologies,
} from '../app/lib/graphics/technologies.js';
import {
  createCreativeSurface,
} from '../app/lib/graphics/runtime.js';
import { createCanvas2DSurface } from '../app/lib/graphics/canvas-surface.js';
import { createAudioSync } from '../app/lib/graphics/audio-sync.js';
import { createMaterialLibrary } from '../app/lib/graphics/materials.js';
import { createLightRig } from '../app/lib/graphics/lighting.js';
import { createParticleField } from '../app/lib/graphics/particles.js';
import {
  creativeResourcesFor,
  getVisualExperience,
  installCreativeExperiences,
  resolveVisualPlan,
} from '../app/lib/graphics/experiences.js';
import { GRAPHICS_RESOURCE_KIND } from '../app/lib/graphics/adapters.js';
import CreativeSurface from '../components/graphics/CreativeSurface.jsx';
import {
  getExperienceDefinition,
  getRegisteredExperiences,
  resetResourceReadiness,
} from '../app/lib/resource-readiness.js';

function fakeThree() {
  class FakeMaterial {
    constructor(options = {}) {
      Object.assign(this, options);
      this.dispose = vi.fn();
    }
  }
  class FakeLight {
    constructor(color, intensity) {
      this.intensity = intensity ?? 1;
      this.color = { set: vi.fn() };
      this.position = { set: vi.fn() };
    }
  }
  class FakeGeometry {
    constructor() {
      this.attributes = {};
      this.dispose = vi.fn();
    }
    setAttribute(name, attribute) {
      this.attributes[name] = attribute;
    }
    getAttribute(name) {
      return this.attributes[name] ?? null;
    }
  }
  return {
    MeshStandardMaterial: FakeMaterial,
    MeshPhysicalMaterial: FakeMaterial,
    PointsMaterial: FakeMaterial,
    BufferGeometry: FakeGeometry,
    BufferAttribute: class {
      constructor(array) {
        this.array = array;
        this.needsUpdate = false;
      }
    },
    Points: class {
      constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
      }
    },
    HemisphereLight: class extends FakeLight {
      constructor(_skyColor, _groundColor, intensity) {
        super(undefined, intensity);
      }
    },
    DirectionalLight: class extends FakeLight {},
    PointLight: class extends FakeLight {},
    AdditiveBlending: 2,
  };
}

beforeEach(() => {
  probe.webgl = true;
  probe.canvas2d = true;
  probe.reduced = false;
  probe.context = null;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('automatic technology selection', () => {
  it('selects Three.js for 3D and post-processing when WebGL exists', () => {
    const plan = selectGraphicsTechnologies({ dimension: '3d', postProcessing: true });
    expect(plan.renderer).toBe(GRAPHICS_TECHNOLOGY.THREE);
    expect(plan.postProcessing).toBe(true);
    expect(plan.fallbacks).toEqual([GRAPHICS_TECHNOLOGY.CANVAS2D, GRAPHICS_TECHNOLOGY.DOM]);
  });

  it('never takes over an existing WebGL engine', () => {
    const plan = selectGraphicsTechnologies({ renderer: 'webgl', dimension: '2d' });
    expect(plan.renderer).toBe(GRAPHICS_TECHNOLOGY.WEBGL);
    expect(plan.postProcessing).toBe(false);
  });

  it('falls back to Canvas 2D and then DOM when WebGL is unavailable', () => {
    probe.webgl = false;
    expect(selectGraphicsTechnologies({ dimension: '3d' }).renderer).toBe(GRAPHICS_TECHNOLOGY.CANVAS2D);
    probe.canvas2d = false;
    expect(selectGraphicsTechnologies({ dimension: '3d' }).renderer).toBe(GRAPHICS_TECHNOLOGY.DOM);
  });

  it('chooses Canvas 2D for a 2D particle layer and DOM for atmosphere', () => {
    expect(selectGraphicsTechnologies({ particles: true }).renderer).toBe(GRAPHICS_TECHNOLOGY.CANVAS2D);
    expect(selectGraphicsTechnologies({}).renderer).toBe(GRAPHICS_TECHNOLOGY.DOM);
  });

  it('selects no motion under reduced motion and keeps the renderer', () => {
    probe.reduced = true;
    const plan = selectGraphicsTechnologies({ dimension: '3d', timeline: true });
    expect(plan.renderer).toBe(GRAPHICS_TECHNOLOGY.THREE);
    expect(plan.motion).toBe(MOTION_TECHNOLOGY.NONE);
  });

  it('chooses GSAP only for a requested timeline and Howler only for sound', () => {
    expect(selectGraphicsTechnologies({ timeline: true }).motion).toBe(MOTION_TECHNOLOGY.GSAP);
    expect(selectGraphicsTechnologies({}).motion).toBe(MOTION_TECHNOLOGY.CSS);
    expect(selectGraphicsTechnologies({ audio: true }).audio).toBe('howler');
  });
});

describe('resource derivation and automatic registration', () => {
  beforeEach(() => {
    resetResourceReadiness();
  });

  it('derives module, texture, model and audio resources from one descriptor', () => {
    const resources = creativeResourcesFor({
      id: 'demo',
      chunks: ['three', 'gsap'],
      textures: [{ id: 'demo-texture', url: '/texture.avif', bytes: 10 }],
      models: [{ id: 'demo-model', url: '/model.glb', bytes: 20 }],
      audio: [{ id: 'demo-cue', prepare: () => Promise.resolve() }],
    });

    expect(resources.map((resource) => resource.kind)).toEqual([
      GRAPHICS_RESOURCE_KIND.MODULE,
      GRAPHICS_RESOURCE_KIND.MODULE,
      'audio',
      GRAPHICS_RESOURCE_KIND.TEXTURE,
      GRAPHICS_RESOURCE_KIND.MODEL,
    ]);
    expect(resources[0].chunk).toBe('three');
    expect(resources[2].background).toBe(false);
  });

  it('registers every visual experience and the graphics adapters automatically', () => {
    const result = installCreativeExperiences();
    const ids = getRegisteredExperiences().map((definition) => definition.id);
    // Only experiences with derived resources need auto-registration; the
    // manifest already owns the image-only map and generator entries.
    expect(ids).toEqual(
      expect.arrayContaining(['reveal', 'lucky-meter', 'crystal-ball']),
    );
    expect(result.registered.length).toBeGreaterThan(0);

    const reveal = getExperienceDefinition('reveal');
    const kinds = reveal.resources.map((resource) => resource.kind);
    expect(kinds).toContain(GRAPHICS_RESOURCE_KIND.MODULE);
    expect(kinds).toContain('audio');

    const meter = getExperienceDefinition('lucky-meter');
    expect(meter.resources.find((resource) => resource.id === 'lucky-meter-audio').kind).toBe('audio');
  });

  it('resolves each existing experience to its registered renderer', () => {
    expect(getVisualExperience('lucky-meter')).not.toBeNull();
    // The dimensional meter is one Three.js scene; reveal stays Canvas 2D.
    expect(resolveVisualPlan('lucky-meter').renderer).toBe(GRAPHICS_TECHNOLOGY.THREE);
    expect(resolveVisualPlan('reveal').renderer).toBe(GRAPHICS_TECHNOLOGY.CANVAS2D);
    expect(resolveVisualPlan('unknown')).toBeNull();
  });
});

describe('managed canvas surface and runtime', () => {
  it('creates a managed Canvas 2D surface, draws once and disposes safely', () => {
    const setTransform = vi.fn();
    probe.context = { setTransform };
    const canvas = document.createElement('canvas');
    const onFrame = vi.fn();

    const surface = createCanvas2DSurface({ canvas, onFrame });
    expect(surface).not.toBeNull();
    expect(setTransform).toHaveBeenCalled();

    surface.render();
    expect(onFrame).toHaveBeenCalledTimes(1);

    surface.dispose();
    expect(() => surface.dispose()).not.toThrow();
  });

  it('returns null when the canvas cannot provide a 2D context', () => {
    const canvas = document.createElement('canvas');
    expect(createCanvas2DSurface({ canvas })).toBeNull();
  });

  it('builds the selected surface without throwing for an existing engine', async () => {
    const canvas = document.createElement('canvas');
    const surface = await createCreativeSurface({
      canvas,
      requirements: { renderer: 'webgl' },
    });
    expect(surface.kind).toBe(GRAPHICS_TECHNOLOGY.WEBGL);
    expect(() => surface.dispose()).not.toThrow();
  });

  it('returns null with no canvas so the caller keeps its artwork', async () => {
    await expect(createCreativeSurface({ requirements: { dimension: '3d' } })).resolves.toBeNull();
  });
});

describe('creative building blocks', () => {
  it('builds physical material presets and disposes the set', () => {
    const THREE = fakeThree();
    const library = createMaterialLibrary(THREE, { quality: { tier: 'balanced' } });
    const gold = library.gold();
    const glass = library.glass();

    expect(gold.metalness).toBe(1);
    expect(glass.transmission).toBe(0);

    library.dispose();
    expect(gold.dispose).toHaveBeenCalled();
    expect(glass.dispose).toHaveBeenCalled();
  });

  it('caps the light rig at the tier budget and decays an event pulse', () => {
    const THREE = fakeThree();
    const rig = createLightRig(THREE, { budget: { maxLights: 1 } });
    expect(rig.lights).toHaveLength(1);

    const wide = createLightRig(THREE, { quality: { tier: 'high' } });
    expect(wide.lights.length).toBe(4);

    rig.pulse(1);
    rig.update(0.1);
    expect(rig.lights[0].intensity).toBeGreaterThan(0.5);
    rig.update(10);
    expect(rig.lights[0].intensity).toBeCloseTo(0.55, 5);
    expect(() => rig.dispose()).not.toThrow();
  });

  it('bounds a particle field by the quality budget', () => {
    const THREE = fakeThree();
    const field = createParticleField(THREE, {
      count: 10_000,
      quality: { sparkBudget: 120, particleScale: 1 },
    });
    expect(field.count).toBe(120);
    expect(field.points).not.toBeNull();

    field.update(0.016, 0.5);
    expect(field.points.geometry.getAttribute('position').needsUpdate).toBe(true);
    field.dispose();
    expect(() => field.dispose()).not.toThrow();
  });
});

describe('synchronised audio cues', () => {
  it('plays each cue once per run and never after teardown', () => {
    const play = vi.fn();
    const sync = createAudioSync({ resolve: () => ({ play }) });

    expect(sync.cue('chime')).toBe(true);
    expect(sync.cue('chime')).toBe(false);
    expect(play).toHaveBeenCalledTimes(1);

    sync.dispose();
    expect(sync.cue('whoosh')).toBe(false);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('honours a muted plan and attaches cues to timeline positions', () => {
    const play = vi.fn();
    const calls = [];
    const timeline = { isMotionTimeline: true, call: (fn, at) => calls.push([fn, at]) };
    const sync = createAudioSync({
      resolve: () => ({ play }),
      shouldPlay: () => false,
    });
    sync.attach(timeline, [{ at: 0.4, cue: 'chime' }, { at: 'drop', cue: 'boom' }]);

    expect(calls.map(([, at]) => at)).toEqual([0.4, 'drop']);
    calls[0][0]();
    expect(play).not.toHaveBeenCalled();
  });

  it('gives a raw GSAP timeline the empty params array before the position', () => {
    const play = vi.fn();
    const calls = [];
    const rawTimeline = { call: (...args) => calls.push(args) };
    const sync = createAudioSync({ resolve: () => ({ play }) });

    sync.attach(rawTimeline, [{ at: 'drop', cue: 'boom' }]);

    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual([]);
    expect(calls[0][2]).toBe('drop');
    calls[0][0]();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('treats a missing sound or a throwing resolver as a skipped cue', () => {
    const sync = createAudioSync({
      resolve: (name) => {
        if (name === 'broken') throw new Error('blocked');
        return null;
      },
    });
    expect(sync.cue('missing')).toBe(false);
    expect(sync.cue('broken')).toBe(false);
  });
});

describe('CreativeSurface React wrapper', () => {
  it('stays decorative by default and lets a caller override aria-hidden', () => {
    const { container, rerender } = render(
      React.createElement(CreativeSurface, { requirements: { renderer: 'webgl' } }),
    );
    expect(container.querySelector('canvas').getAttribute('aria-hidden')).toBe('true');

    rerender(
      React.createElement(CreativeSurface, {
        requirements: { renderer: 'webgl' },
        'aria-hidden': false,
        'aria-label': 'Lucky chart',
      }),
    );
    expect(container.querySelector('canvas').getAttribute('aria-hidden')).toBe('false');
  });

  it('does not rebuild the surface for an equal inline descriptor', async () => {
    const onSurface = vi.fn();

    const { rerender } = render(
      React.createElement(CreativeSurface, { requirements: { renderer: 'webgl' }, onSurface }),
    );
    await waitFor(() => expect(onSurface).toHaveBeenCalledTimes(1));

    // Each render creates a new object with the same values, which is the
    // documented usage; the surface must not be rebuilt for it.
    rerender(React.createElement(CreativeSurface, { requirements: { renderer: 'webgl' }, onSurface }));
    rerender(React.createElement(CreativeSurface, { requirements: { renderer: 'webgl' }, onSurface }));
    await Promise.resolve();

    expect(onSurface).toHaveBeenCalledTimes(1);
  });
});
