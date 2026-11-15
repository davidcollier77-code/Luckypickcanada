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
 * Both layers are decorative: `aria-hidden` and `pointer-events-none`.
 *
 * @param {{ reducedMotion?: boolean }} props
 */
export default function LuckyMeterOrnaments({ reducedMotion = false }) {
  const farRef = useRef(null);
  const nearRef = useRef(null);
  const [nearEnabled, setNearEnabled] = useState(false);

  useEffect(() => {
    let nearAllowed = false;
    try {
      nearAllowed = getRenderQuality().foreground;
    } catch {
      nearAllowed = false;
    }
    setNearEnabled(nearAllowed);
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
