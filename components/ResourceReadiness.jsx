'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { shouldPrefetchOnIntent } from '../app/lib/adaptive-performance';
import { useAdaptivePlan } from '../app/lib/use-adaptive-plan';
import {
  configureRoutePrefetch,
  prepareExperience,
  prepareExperiencesWhenIdle,
  whenIdle,
  whenPageSettled,
} from '../app/lib/resource-readiness';
import { HOMEPAGE_LIKELY_NEXT, experiencesForPath } from '../app/lib/resource-readiness-manifest';

/**
 * Maps a delegated link event to the experience that link leads to. Only
 * same-origin, root-relative links participate; an API, external site or
 * non-registered route is ignored instead of guessed.
 *
 * @param {Event} event
 * @returns {string[]} Experience ids for the link's path.
 */
function experiencesForLinkEvent(event) {
  const target = event?.target;
  if (!target || typeof target.closest !== 'function') return [];
  const link = target.closest('a[href]');
  if (!link) return [];
  const href = link.getAttribute('href');
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return [];
  return experiencesForPath(href);
}

/**
 * Mounts the site-wide resource-readiness hub. It renders nothing and owns no
 * artwork, copy or layout.
 *
 * Responsibilities are deliberately small:
 *   - gives the hub the Next.js router prefetcher for `code` resources;
 *   - prepares the current route's registered resources in an idle period, so
 *     the first paint and hero artwork are never delayed;
 *   - on the homepage, prepares a short, plan-bounded list of likely next
 *     experiences only after the page has loaded and spare capacity exists;
 *   - turns hover, focus and press on registered links into preparation intent,
 *     using the existing prefetch policy rather than a new listener per link.
 *
 * Active-experience protection lives in the hub and is called by the reveal and
 * Daily Resonance animations themselves, not by this component.
 *
 * @returns {null} No rendered output.
 */
export default function ResourceReadiness() {
  const pathname = usePathname();
  const router = useRouter();
  const plan = useAdaptivePlan();
  const planRef = useRef(plan);
  const routerRef = useRef(router);

  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  useEffect(() => {
    routerRef.current = router;
    configureRoutePrefetch((route) => routerRef.current.prefetch(route));
    return () => configureRoutePrefetch(null);
  }, [router]);

  // Current route: idle, and only after the page has settled. The page's own
  // markup, hero image and LCP always win; a slow connection must not have hub
  // preparation competing with its largest paint.
  useEffect(() => {
    const ids = experiencesForPath(pathname);
    if (ids.length === 0) return undefined;
    let cancelIdle = () => {};
    const cancelSettled = whenPageSettled(() => {
      cancelIdle = whenIdle(
        () => {
          for (const id of ids) {
            void prepareExperience(id, { priority: 'critical', trigger: 'route' });
          }
        },
        { timeout: 1200 },
      );
    });
    return () => {
      cancelSettled();
      cancelIdle();
    };
  }, [pathname]);

  // Homepage: wait for load plus a quiet LCP/resource window, then use idle
  // capacity. This is what keeps background preparation out of the load and LCP
  // window on slow connections, where `load` can precede the largest paint.
  useEffect(() => {
    if (pathname !== '/') return undefined;

    let cancelled = false;
    let cancelIdle = () => {};
    const cancelSettled = whenPageSettled(() => {
      if (cancelled) return;
      if (planRef.current?.prefetch === 'none') return;
      cancelIdle = prepareExperiencesWhenIdle(HOMEPAGE_LIKELY_NEXT, {
        trigger: 'homepage-idle',
      });
    });

    return () => {
      cancelled = true;
      cancelSettled();
      cancelIdle();
    };
  }, [pathname]);

  // One delegated listener set for the whole site: no per-link subscription and
  // no competing preloader. The Next.js router still owns route prefetching.
  useEffect(() => {
    const handleHover = (event) => {
      if (!shouldPrefetchOnIntent(planRef.current, 'hover')) return;
      for (const id of experiencesForLinkEvent(event)) {
        void prepareExperience(id, { priority: 'intent', trigger: 'hover' });
      }
    };

    const handleStrongIntent = (event) => {
      if (!shouldPrefetchOnIntent(planRef.current, 'strong')) return;
      for (const id of experiencesForLinkEvent(event)) {
        void prepareExperience(id, { priority: 'intent', trigger: 'focus-or-press' });
      }
    };

    document.addEventListener('pointerover', handleHover, { passive: true });
    document.addEventListener('focusin', handleStrongIntent);
    document.addEventListener('pointerdown', handleStrongIntent, { passive: true });

    return () => {
      document.removeEventListener('pointerover', handleHover);
      document.removeEventListener('focusin', handleStrongIntent);
      document.removeEventListener('pointerdown', handleStrongIntent);
    };
  }, []);

  return null;
}
