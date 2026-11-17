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

  const handleIntent = useCallback(
    (handler) => (event) => {
      markIntent();
      if (typeof handler === 'function') handler(event);
    },
    [markIntent],
  );

  return (
    <Link
      {...props}
      prefetch={hasIntent ? undefined : false}
      onPointerEnter={handleIntent(onPointerEnter)}
      onPointerDown={handleIntent(onPointerDown)}
      onFocus={handleIntent(onFocus)}
      onTouchStart={handleIntent(onTouchStart)}
    >
      {children}
    </Link>
  );
}
