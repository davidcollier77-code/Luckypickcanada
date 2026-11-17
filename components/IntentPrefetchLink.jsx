'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';

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
 * @param {Object} props Link props; `children` and navigation props pass through.
 * @param {import('react').ReactNode} props.children The link contents.
 * @returns {import('react').ReactElement} The same link, prefetching on intent.
 */
export default function IntentPrefetchLink({ children, onPointerEnter, onPointerDown, onFocus, onTouchStart, ...props }) {
  const [hasIntent, setHasIntent] = useState(false);

  const markIntent = useCallback(() => setHasIntent(true), []);

  // One stable handler per event rather than a factory that builds four new
  // closures on every render.
  const handlePointerEnter = useCallback(
    (event) => {
      markIntent();
      if (typeof onPointerEnter === 'function') onPointerEnter(event);
    },
    [markIntent, onPointerEnter],
  );

  const handlePointerDown = useCallback(
    (event) => {
      markIntent();
      if (typeof onPointerDown === 'function') onPointerDown(event);
    },
    [markIntent, onPointerDown],
  );

  const handleFocus = useCallback(
    (event) => {
      markIntent();
      if (typeof onFocus === 'function') onFocus(event);
    },
    [markIntent, onFocus],
  );

  const handleTouchStart = useCallback(
    (event) => {
      markIntent();
      if (typeof onTouchStart === 'function') onTouchStart(event);
    },
    [markIntent, onTouchStart],
  );

  return (
    <Link
      {...props}
      prefetch={hasIntent ? undefined : false}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      onTouchStart={handleTouchStart}
    >
      {children}
    </Link>
  );
}
