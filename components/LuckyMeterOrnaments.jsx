'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createLuckyMeterOrnamentEngine } from './lucky-meter-ornament-engine';
import { getRenderQuality } from '../app/lib/graphics-capabilities';

/**
 * The golden maple-leaf environment layers.
 *
 * Two pointer-transparent canvases are mounted around the interface: the far
 * layer sits behind the meter and result panels, and the near layer sits above
 * them so a leaf can pass in front of the medallion. The near layer only exists
 * when the resolved quality profile allows a foreground pass, so a constrained
 * device never pays for it.
 *
 * It also requires a viewport wide enough for the copy to leave side margins.
 * Below that width the copy column spans nearly the full screen, and a
 * foreground leaf can only cross it - so on a phone the leaves stay behind the
 * text and a headline is never obscured for the sake of a depth cue.
 *
 * Both layers are decorative: `aria-hidden` and `pointer-events-none`.
 *
 * @param {{ reducedMotion?: boolean }} props
 */

/** Minimum viewport width that leaves usable margins beside the copy column. */
const NEAR_LAYER_MIN_WIDTH = 900;

export default function LuckyMeterOrnaments({ reducedMotion = false }) {
  const farRef = useRef(null);
  const nearRef = useRef(null);
  const [nearEnabled, setNearEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    // matchMedia is the accurate signal, but not every environment has it (the
    // test runner does not), so fall back to the current width.
    const query =
      typeof window.matchMedia === 'function'
        ? window.matchMedia(`(min-width: ${NEAR_LAYER_MIN_WIDTH}px)`)
        : null;
    const sync = () => {
      let nearAllowed = false;
      try {
        const wideEnough = query ? query.matches : window.innerWidth >= NEAR_LAYER_MIN_WIDTH;
        nearAllowed = Boolean(getRenderQuality().foreground) && wideEnough;
      } catch {
        nearAllowed = false;
      }
      setNearEnabled(nearAllowed);
    };
    sync();
    query?.addEventListener?.('change', sync);
    return () => query?.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    let engine = null;
    try {
      engine = createLuckyMeterOrnamentEngine({ canvas: farRef.current, layer: 'far' });
    } catch {
      engine = null;
    }
    return () => engine?.destroy?.();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !nearEnabled) return undefined;
    let engine = null;
    try {
      engine = createLuckyMeterOrnamentEngine({ canvas: nearRef.current, layer: 'near' });
    } catch {
      engine = null;
    }
    return () => engine?.destroy?.();
  }, [reducedMotion, nearEnabled]);

  return (
    <>
      <canvas
        ref={farRef}
        aria-hidden="true"
        data-testid="lucky-meter-ornaments-far"
        className="pointer-events-none absolute inset-0 z-[6] h-full w-full"
      />
      {nearEnabled && !reducedMotion && (
        <canvas
          ref={nearRef}
          aria-hidden="true"
          data-testid="lucky-meter-ornaments-near"
          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
        />
      )}
    </>
  );
}
