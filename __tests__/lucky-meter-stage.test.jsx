import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

/**
 * The stage is the only Lucky Meter surface. These tests replace the Three.js
 * scene factory so the component's contract can be driven directly: the CSS
 * fallback is the first paint, the canvas takes over when the scene reports
 * ready, and a lost context returns to the complete CSS composition until the
 * scene is restored.
 */

const sceneFactory = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('../app/lib/lucky-meter/meter-scene', () => ({
  createLuckyMeterScene: sceneFactory.create,
}));

import LuckyMeterStage from '../components/LuckyMeterStage';
import { colourPointerRotation } from '../app/lib/lucky-meter/reveal';

const NAMES = [
  'Spring Mint',
  'Spring Fern',
  'Spring Moss',
  'Spring Lime',
  'Spring Sage',
  'Spring Clover',
  'Autumn Ember',
  'Autumn Amber',
  'Autumn Rust',
  'Autumn Maple',
  'Autumn Copper',
  'Autumn Ochre',
];

const PALETTE = NAMES.map((name, index) => ({
  id: `c${index + 1}`,
  name,
  hex: `#${(0x204060 + index * 0x0a0503).toString(16).slice(0, 6)}`,
  light: index % 2 === 0,
  texture: { grain: 0.2, sheen: 0.4 },
}));

const SCENE = {
  wheelAngle: 225,
  palette: PALETTE,
  colourId: 'c7',
  colourIndex: 6,
  chamberDrain: 0.25,
  vesselFill: 0.4,
  pour: 0.6,
  beam: 0.3,
  leafExit: 1,
  numberReveal: 0.5,
  phase: 'pouring',
  colour: PALETTE[6].hex,
  reducedMotion: false,
};

function stageProps(overrides = {}) {
  return {
    phase: 'pouring',
    wheelAngle: 225,
    colours: PALETTE,
    colourId: 'c7',
    colourSettled: true,
    number: 42,
    numberSettled: true,
    numberReveal: 0.5,
    chamberDrain: 0.25,
    vesselFill: 0.4,
    pour: 0.6,
    beam: 0.3,
    leafExit: 1,
    vesselPhase: 'filling',
    colour: PALETTE[6],
    showDetails: true,
    seasonName: 'Autumn',
    ...overrides,
  };
}

function mountScene() {
  const api = { setState: vi.fn(), dispose: vi.fn(), start: vi.fn(), stop: vi.fn() };
  const callbacks = {};
  sceneFactory.create.mockImplementation(async (options) => {
    Object.assign(callbacks, options);
    return api;
  });
  return { api, callbacks };
}

beforeEach(() => {
  sceneFactory.create.mockReset();
});

afterEach(() => {
  cleanup();
  // The meter-scene module mock is file-scoped; restoring spies keeps this
  // suite's mocks from leaking into any later test in the same file.
  vi.restoreAllMocks();
});

describe('Lucky Meter stage surface', () => {
  it('paints the complete CSS fallback first, then hands over to the canvas', async () => {
    const { api, callbacks } = mountScene();
    render(
      <LuckyMeterStage {...stageProps()}>
        <p>73%</p>
      </LuckyMeterStage>,
    );

    // The first paint is the fallback: no empty canvas, no missing vessel.
    expect(screen.getByTestId('lucky-meter-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-vessel-canvas-host')).not.toHaveClass('is-ready');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-meter-renderer',
      'pending',
    );

    await waitFor(() => expect(callbacks.onReady).toBeTypeOf('function'));

    act(() => {
      callbacks.onReady();
    });

    expect(screen.queryByTestId('lucky-meter-fallback')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-vessel-canvas-host')).toHaveClass('is-ready');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-meter-renderer',
      'three',
    );
    expect(api.setState).toHaveBeenCalled();
    expect(api.setState.mock.calls[0][0]).toMatchObject({ phase: 'pouring', instant: true });
  });

  it('keeps the complete fallback until the canvas opacity leaves zero', async () => {
    const { callbacks } = mountScene();
    const view = render(<LuckyMeterStage {...stageProps()} />);
    await waitFor(() => expect(callbacks.onReady).toBeTypeOf('function'));

    const host = screen.getByTestId('lucky-vessel-canvas-host');
    // jsdom has no stylesheet, so supply the opacity signal the CSS transition
    // starts from. The fallback must survive the transparent phase.
    host.style.opacity = '0';
    act(() => callbacks.onReady());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(screen.getByTestId('lucky-meter-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-meter-renderer',
      'three',
    );

    host.style.opacity = '0.35';
    await waitFor(() =>
      expect(screen.queryByTestId('lucky-meter-fallback')).not.toBeInTheDocument(),
    );
    view.unmount();
  });

  it('returns to the fallback while the context is lost and recovers after restore', async () => {
    const { callbacks } = mountScene();
    render(<LuckyMeterStage {...stageProps()} />);
    await waitFor(() => expect(callbacks.onReady).toBeTypeOf('function'));
    act(() => callbacks.onReady());
    expect(screen.queryByTestId('lucky-meter-fallback')).not.toBeInTheDocument();

    act(() => callbacks.onContextLost());
    expect(screen.getByTestId('lucky-meter-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-meter-renderer',
      'fallback',
    );
    expect(screen.getByTestId('lucky-vessel-canvas-host')).not.toHaveClass('is-ready');

    act(() => callbacks.onContextRestored());
    expect(screen.queryByTestId('lucky-meter-fallback')).not.toBeInTheDocument();
    expect(screen.getByTestId('lucky-vessel-canvas-host')).toHaveClass('is-ready');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-meter-renderer',
      'three',
    );
  });

  it('keeps the fallback permanently when WebGL is unavailable', async () => {
    const { callbacks } = mountScene();
    render(<LuckyMeterStage {...stageProps()} />);
    await waitFor(() => expect(callbacks.onUnavailable).toBeTypeOf('function'));

    act(() => callbacks.onUnavailable());
    expect(screen.getByTestId('lucky-meter-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute(
      'data-meter-renderer',
      'fallback',
    );
    // The canvas exists but stays transparent; the fallback remains the art.
    expect(screen.getByTestId('lucky-vessel-canvas-host')).not.toHaveClass('is-ready');
  });

  it('draws the fixed 7:30 pointer and twelve chambers without SVG artwork', async () => {
    mountScene();
    const { container } = render(
      <LuckyMeterStage {...stageProps()}>
        <p>73%</p>
      </LuckyMeterStage>,
    );

    const pointer = screen.getByTestId('lucky-meter-pointer');
    expect(pointer).toHaveAttribute('data-position', '7.5');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-pointer', '7.5');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-chamber-count', '12');
    expect(screen.getByTestId('lucky-meter-ring').getAttribute('data-chamber-ids')).toBe(
      PALETTE.map((colour) => colour.id).join(' '),
    );
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-wheel-angle', '225.00');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-number', '42');
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-leaf-exit', '1.00');

    // The whole meter is CSS and geometry, never SVG.
    expect(container.querySelector('svg')).toBeNull();

    const wheel = container.querySelector('.lucky-meter-fallback__wheel');
    expect(wheel.getAttribute('style')).toContain('conic-gradient');
    expect(wheel.getAttribute('style')).toContain(`rotate(210deg)`);
    expect(container.querySelector('.lucky-meter-fallback__drain')).toBeTruthy();
    expect(container.querySelector('.lucky-meter-fallback__pointer')).toBeTruthy();
    expect(container.querySelector('.lucky-meter-fallback__vessel')).toBeTruthy();
    expect(container.querySelector('.lucky-meter-fallback__beam')).toBeTruthy();

    // The receiving vessel shows the pour level it was given and stays full
    // once the pour is complete.
    const liquid = container.querySelector('.lucky-meter-fallback__liquid');
    expect(liquid.getAttribute('style')).toContain('height: 40%');
    expect(screen.getByTestId('lucky-colour-panel')).toHaveAttribute('data-vessel-fill', '0.400');
  });

  it('centres the selected fallback chamber on the pointer and drains that chamber', async () => {
    const step = 360 / PALETTE.length;
    for (const index of [0, 3, 6, 11]) {
      const colour = PALETTE[index];
      const rotation = colourPointerRotation(colour.id, PALETTE);
      const view = render(
        <LuckyMeterStage
          {...stageProps({
            colourId: colour.id,
            colour,
            wheelAngle: rotation,
            chamberDrain: 0.4,
          })}
        />,
      );

      const wheel = view.container.querySelector('.lucky-meter-fallback__wheel');
      const match = wheel.getAttribute('style').match(/rotate\((-?[\d.]+)deg\)/);
      expect(match).not.toBeNull();
      const cssRotation = Number(match[1]);
      // A band centre is index × step + step / 2; after the landing rotation it
      // must sit exactly on the fixed 225° (7:30) pointer.
      const centre = ((index * step + step / 2 + cssRotation) % 360 + 360) % 360;
      expect(centre).toBeCloseTo(225, 6);

      const drain = view.container.querySelector('.lucky-meter-fallback__drain');
      const drainStyle = drain.getAttribute('style');
      expect(drainStyle).toContain('conic-gradient');
      // jsdom omits a default `from 0deg` when it serializes the gradient, so a
      // missing `from` angle means the gradient starts at 0deg.
      const fromMatch = drainStyle.match(/from\s+(-?[\d.]+)deg/);
      const drainFrom = fromMatch ? Number(fromMatch[1]) : 0;
      expect(drainFrom).toBeCloseTo((index * step) % 360, 6);

      view.unmount();
    }
  });

  it('shows the stored colour, number and vessel phase to readers', async () => {
    mountScene();
    render(
      <LuckyMeterStage {...stageProps({ vesselFill: 1, chamberDrain: 1, vesselPhase: 'settled' })}>
        <p>73%</p>
      </LuckyMeterStage>,
    );

    const panel = screen.getByTestId('lucky-colour-panel');
    expect(panel).toHaveAttribute('data-vessel-phase', 'settled');
    expect(panel).toHaveAttribute('data-vessel-fill', '1.000');
    expect(panel).toHaveTextContent(PALETTE[6].name);
    expect(panel).toHaveTextContent(PALETTE[6].hex);
    expect(screen.getByTestId('lucky-vessel-highlight')).toHaveClass('is-active');

    const liquid = document.querySelector('.lucky-meter-fallback__liquid');
    expect(liquid.getAttribute('style')).toContain('height: 100%');
    // Only the selected chamber is drained; the stage reports that drain.
    expect(screen.getByTestId('lucky-meter-ring')).toHaveAttribute('data-pour', '1.000');
  });

  it('disposes the scene on unmount', async () => {
    const { api, callbacks } = mountScene();
    const view = render(<LuckyMeterStage {...stageProps()} />);
    await waitFor(() => expect(callbacks.onReady).toBeTypeOf('function'));

    view.unmount();
    expect(api.dispose).toHaveBeenCalledTimes(1);
  });
});
