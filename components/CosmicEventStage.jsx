'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createCosmicEventEngine } from './cosmic-event-engine';

const FALLBACK_GLOWS = {
  meteor:
    'radial-gradient(120% 90% at 20% -10%, rgba(160, 220, 255, 0.34) 0%, rgba(80, 150, 255, 0.12) 38%, rgba(2, 7, 12, 0) 70%)',
  lightning:
    'radial-gradient(90% 80% at 50% -5%, rgba(210, 225, 255, 0.38) 0%, rgba(120, 150, 255, 0.16) 42%, rgba(2, 7, 12, 0) 72%)',
  fireworks:
    'radial-gradient(70% 60% at 50% 22%, rgba(255, 206, 120, 0.32) 0%, rgba(200, 120, 40, 0.13) 45%, rgba(2, 7, 12, 0) 75%)',
};

/**
 * Mounts the WebGL cinematic stage for one event run.
 *
 * The far surface sits behind the meter and result content. A second, fully
 * transparent near surface is composited above the interface so near meteors,
 * foreground lightning and the finale's golden sparks pass in front of the
 * meter and supporting panels. Both surfaces are pointer-transparent, so every
 * control remains clickable throughout.
 *
 * If WebGL is unavailable, a static glow keeps the moment visually complete and
 * the caller still receives a completion callback after the documented
 * duration.
 *
 * @param {{
 *   eventId: 'meteor' | 'lightning' | 'fireworks',
 *   durationMs: number,
 *   reducedMotion?: boolean,
 *   onCue?: (cue: string) => void,
 *   onComplete?: () => void,
 * }} props
 */
export default function CosmicEventStage({
  eventId,
  durationMs,
  reducedMotion = false,
  onCue,
  onComplete,
}) {
  const canvasRef = useRef(null);
  const foregroundRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [hasForeground, setHasForeground] = useState(false);
  const onCueRef = useRef(onCue);
  const onCompleteRef = useRef(onComplete);

  onCueRef.current = onCue;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let finished = false;
    let completed = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      onCompleteRef.current?.();
    };

    const safeDuration = Math.max(1200, Number(durationMs) || 0);

    if (reducedMotion) {
      // Respect reduced motion: no animation, no WebGL loop, a calm glow only.
      // DevSkim DS172411 is a false positive here: the callback is a local
      // closure and no request data, string or user input reaches the timer.
      const reducedTimer = /* DevSkim: ignore DS172411 */ window.setTimeout(() => {
        completed = true;
        finishOnce();
      }, 900);
      return () => window.clearTimeout(reducedTimer);
    }

    let engine = null;
    try {
      engine = createCosmicEventEngine({
        canvas: canvasRef.current,
        foregroundCanvas: foregroundRef.current,
        eventId,
        durationMs: safeDuration,
        onCue: (cue) => onCueRef.current?.(cue),
        onDone: () => {
          completed = true;
          finishOnce();
        },
        onContextLost: () => setFallback(true),
      });
    } catch {
      engine = null;
    }

    if (!engine) setFallback(true);
    setHasForeground(Boolean(engine?.hasForeground));
    // Safety net: the stage can never leave the UI stuck if the loop fails.
    // Same verified-safe timer as above: a fixed delay with a local closure.
    const safetyTimer = /* DevSkim: ignore DS172411 */ window.setTimeout(() => {
      if (!completed) setFallback(true);
      finishOnce();
    }, safeDuration + 450);

    return () => {
      window.clearTimeout(safetyTimer);
      if (engine) engine.destroy();
    };
  }, [eventId, durationMs, reducedMotion]);

  return (
    <>
      <div
        data-testid="cosmic-event-stage"
        data-event={eventId}
        data-duration={durationMs}
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
        aria-hidden="true"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {(fallback || reducedMotion) && (
          <div
            className="absolute inset-0 opacity-80"
            style={{ background: FALLBACK_GLOWS[eventId] || FALLBACK_GLOWS.meteor }}
          />
        )}
      </div>

      {/* Foreground layer: above the meter and interface, but never interactive. */}
      <canvas
        ref={foregroundRef}
        data-testid="cosmic-event-foreground"
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-40 h-full w-full ${
          hasForeground ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}
