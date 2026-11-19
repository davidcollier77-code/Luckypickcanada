'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createCreativeSurface } from '../../app/lib/graphics/runtime';

/**
 * A canvas that builds its own renderer from a capability description.
 *
 * Pass `requirements` (`{ dimension, renderer, particles, postProcessing,
 * reactiveAudio }`) and receive the selected surface through `onSurface`: a
 * Three.js stage with an optional cinematic composer, a managed Canvas 2D
 * context, or a plan-only object when an existing engine keeps ownership of the
 * frame. Call `surface.start()` when the visual should begin and dispose is
 * automatic on unmount.
 *
 * `quality` optionally forces a tier (a deterministic harness), and
 * `onEnvelope` receives the live audio envelope when the plan enables sound
 * reactivity. Both are optional; a normal experience passes only requirements.
 *
 * The element is decorative by default. Pass `aria-hidden={false}` plus a label
 * when the visual carries information; an explicit value always wins.
 *
 * `requirements` is compared by value, so the documented inline descriptor does
 * not rebuild the surface on every parent render.
 *
 * @param {{
 *   requirements?: object,
 *   quality?: { tier?: string, maxPixelRatio?: number },
 *   reducedMotion?: boolean,
 *   className?: string,
 *   style?: object,
 *   onSurface?: (surface: object|null) => void,
 *   onFrame?: (frame: object) => void,
 *   onError?: (error: unknown) => void,
 * }} props
 */
export default function CreativeSurface({
  requirements,
  quality,
  reducedMotion,
  className,
  style,
  onSurface,
  onFrame,
  onError,
  ...canvasProps
}) {
  const canvasRef = useRef(null);
  const callbacksRef = useRef({ onSurface, onFrame, onError });
  callbacksRef.current = { onSurface, onFrame, onError };
  const requirementsRef = useRef(requirements);
  requirementsRef.current = requirements;
  const qualityRef = useRef(quality);
  qualityRef.current = quality;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  // An inline descriptor is a new object on every parent render, so rebuilding
  // on identity would tear down and recreate the whole surface — including a
  // fresh WebGL context — for an unchanged plan. Compare the plain-data
  // descriptor by value; a descriptor that cannot be serialized keeps identity
  // comparison rather than never rebuilding at all.
  const requirementsSignature = useMemo(() => {
    try {
      return JSON.stringify(requirements ?? null);
    } catch {
      return requirements;
    }
  }, [requirements]);

  // A forced tier must rebuild too: it changes the plan the surface resolves.
  const qualitySignature = useMemo(() => {
    try {
      return JSON.stringify(quality ?? null);
    } catch {
      return quality;
    }
  }, [quality]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let disposed = false;
    let surface = null;

    createCreativeSurface({
      canvas,
      requirements: requirementsRef.current,
      quality: qualityRef.current,
      reducedMotion: reducedMotionRef.current,
      onFrame: (frame) => callbacksRef.current.onFrame?.(frame),
      onError: (error) => callbacksRef.current.onError?.(error),
    })
      .then((created) => {
        if (disposed) {
          created?.dispose?.();
          return;
        }
        surface = created;
        callbacksRef.current.onSurface?.(created);
      })
      .catch((error) => {
        // A failed toolkit chunk is a fallback: the caller keeps its artwork.
        callbacksRef.current.onError?.(error);
      });

    return () => {
      disposed = true;
      surface?.dispose?.();
      surface = null;
    };
  }, [requirementsSignature, qualitySignature, reducedMotion]);

  return (
    <canvas
      {...canvasProps}
      ref={canvasRef}
      aria-hidden={canvasProps['aria-hidden'] ?? 'true'}
      className={className}
      style={style}
    />
  );
}
