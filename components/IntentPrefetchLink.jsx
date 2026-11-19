'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { shouldPrefetchOnIntent } from '../app/lib/adaptive-performance';
import { useAdaptivePlan } from '../app/lib/use-adaptive-plan';

/**
 * A Next.js link that warms its route only once the visitor shows intent.
 *
 * Next.js prefetches every link that enters the viewport, so the homepage's
 * navigation pre-loaded four routes while the page was still settling. On a
 * mid-tier phone that work measured as 300-400 ms of blocking main-thread time
 * attributed to the router chunk, and it competed with the hero artwork for
 * bandwidth. Deferring the prefetch to hover, focus or touch keeps the
 * instant-navigation warm-up for visitors who actually reach for a link while
 * leaving the initial load clean.
 *
 * The shared adaptive plan decides how strong that intent must be. A measured
 * slow connection or Save-Data waits for a press, tap or keyboard focus instead
 * of a hover, and skips the speculative fetch entirely; a fast connection keeps
 * hover prefetching. The link itself always navigates, and the policy recovers
 * as soon as the connection improves.
 *
 * @param {Record<string, any>} props Link props; `children` and navigation props pass through.
 * @returns {import('react').ReactElement} The same link, prefetching on intent.
 */
export default function IntentPrefetchLink({ children, onPointerEnter, onPointerDown, onFocus, onTouchStart, ...props }) {
  const plan = useAdaptivePlan();
  // 'hover' is a weak signal; a press, tap or focus is a strong one.
  const [intent, setIntent] = useState(null);

  const markHover = useCallback(
    () => setIntent((previous) => (previous === 'strong' ? previous : 'hover')),
    [],
  );
  const markStrong = useCallback(() => setIntent('strong'), []);

  const prefetchEnabled = intent !== null && shouldPrefetchOnIntent(plan, intent);

  // One stable handler per event rather than a factory that builds four new
  // closures on every render.
  const handlePointerEnter = useCallback(
    (event) => {
      markHover();
      if (typeof onPointerEnter === 'function') onPointerEnter(event);
    },
    [markHover, onPointerEnter],
  );

  const handlePointerDown = useCallback(
    (event) => {
      markStrong();
      if (typeof onPointerDown === 'function') onPointerDown(event);
    },
    [markStrong, onPointerDown],
  );

  const handleFocus = useCallback(
    (event) => {
      markStrong();
      if (typeof onFocus === 'function') onFocus(event);
    },
    [markStrong, onFocus],
  );

  const handleTouchStart = useCallback(
    (event) => {
      markStrong();
      if (typeof onTouchStart === 'function') onTouchStart(event);
    },
    [markStrong, onTouchStart],
  );

  return (
    <Link
      {...props}
      prefetch={prefetchEnabled ? undefined : false}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onTouchStart={handleTouchStart}
    >
      {children}
    </Link>
  );
}
