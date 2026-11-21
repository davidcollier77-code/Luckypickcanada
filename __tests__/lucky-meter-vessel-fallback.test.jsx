import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import LuckyMeterVessel from '../components/LuckyMeterVessel';

/**
 * The CSS vessel is not decoration: it is the first paint and the permanent
 * fallback when WebGL is unavailable or its context is lost. jsdom has no WebGL
 * implementation, which is exactly the condition these tests need, so the
 * component resolves to its fallback renderer for real.
 */

const COLOUR = {
  hex: '#a65e3b',
  name: 'Maple Ember',
  light: false,
  texture: { grain: 0.2, sheen: 0.4 },
};

describe('Lucky Meter CSS vessel fallback', () => {
  afterEach(() => {
    cleanup();
  });

  it('presents the stored colour, fill and vessel phase without WebGL', async () => {
    render(
      <LuckyMeterVessel
        colour={COLOUR}
        fill={0.42}
        pour={0}
        open={1}
        phase="draining"
      />,
    );

    const panel = screen.getByTestId('lucky-colour-panel');
    expect(panel).toHaveAttribute('data-vessel-fill', '0.420');
    expect(panel).toHaveAttribute('data-vessel-phase', 'draining');
    expect(panel).toHaveAttribute('data-vessel-open', '1.00');
    expect(panel).toHaveTextContent(COLOUR.name);
    expect(panel).toHaveTextContent(COLOUR.hex);

    // No WebGL in this environment: the fallback must take over rather than
    // leaving an empty canvas where the vessel belongs.
    await waitFor(() =>
      expect(panel).toHaveAttribute('data-vessel-renderer', 'fallback'),
    );
    expect(screen.getByTestId('lucky-vessel-canvas-host')).not.toHaveClass('is-ready');
    expect(screen.getByTestId('lucky-vessel-highlight')).not.toHaveClass('is-active');
  });

  it('highlights the empty vessel at the end of the drain', () => {
    render(
      <LuckyMeterVessel
        colour={COLOUR}
        fill={0}
        pour={0}
        open={1}
        phase="empty"
      />,
    );

    expect(screen.getByTestId('lucky-colour-panel')).toHaveAttribute(
      'data-vessel-fill',
      '0.000',
    );
    expect(screen.getByTestId('lucky-colour-panel')).toHaveAttribute(
      'data-vessel-phase',
      'empty',
    );
    expect(screen.getByTestId('lucky-vessel-highlight')).toHaveClass('is-active');
  });

  it('supports the opening and full states on the same fallback element', () => {
    const view = render(
      <LuckyMeterVessel colour={COLOUR} fill={0} pour={0} open={0} phase="opening" />,
    );
    const panel = screen.getByTestId('lucky-colour-panel');
    expect(panel).toHaveAttribute('data-vessel-phase', 'opening');
    expect(panel).toHaveAttribute('data-vessel-fill', '0.000');

    view.rerender(
      <LuckyMeterVessel colour={COLOUR} fill={1} pour={1} open={1} phase="holding" />,
    );
    expect(panel).toHaveAttribute('data-vessel-phase', 'holding');
    expect(panel).toHaveAttribute('data-vessel-fill', '1.000');
    expect(panel).toHaveAttribute('data-vessel-open', '1.00');
  });
});
