'use client';

/**
 * React binding for the automatic creative-experience layer.
 *
 * A component names its registered experience once. The hook:
 *   - resolves the technology plan for the current device tier, so a component
 *     can adapt (for example, choose the 2D fallback) without probing;
 *   - prepares the experience's derived resources through the existing
 *     resource-readiness hub, at critical priority because the component is on
 *     screen;
 *   - reports readiness and offers an explicit retry.
 *
 * It never draws and never plays audio. Rendering and playback stay with the
 * experience, which keeps the existing artwork, timing and autonomy intact.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PREPARE_PRIORITY,
  getExperienceReadiness,
  isExperiencePrepared,
  prepareExperience,
  whenIdle,
  whenPageSettled,
} from './resource-readiness.js';
import { useAdaptivePlan } from './use-adaptive-plan.js';
import {
  ensureVisualExperienceRegistered,
  getVisualExperience,
  resolveVisualPlan,
} from './graphics/experiences.js';

/**
 * @param {string} id Registered visual-experience id.
 * @param {{ prepare?: boolean, priority?: string }} [options]
 * @returns {{
 *   id: string,
 *   descriptor: object|null,
 *   plan: object|null,
 *   readiness: object|null,
 *   ready: boolean,
 *   prepare: (options?: { priority?: string }) => Promise<object>,
 * }}
 */
export function useCreativeExperience(id, { prepare = true, priority = PREPARE_PRIORITY.CRITICAL } = {}) {
  const adaptivePlan = useAdaptivePlan();
  const descriptor = useMemo(() => getVisualExperience(id), [id]);
  const [readiness, setReadiness] = useState(() => getExperienceReadiness(id));

  const visualPlan = useMemo(() => {
    // The adaptive tier is a real dependency: a tier change re-resolves the
    // technology selection for this device.
    void adaptivePlan?.tier;
    return descriptor ? resolveVisualPlan(id) : null;
  }, [descriptor, id, adaptivePlan?.tier]);

  const prepareNow = useCallback(
    (options = {}) => {
      if (!descriptor) return Promise.resolve(null);
      // A feature added without a manifest entry still prepares its derived
      // resources: the registry registers it here, once.
      ensureVisualExperienceRegistered(descriptor);
      return prepareExperience(id, {
        priority: options.priority ?? priority,
        trigger: options.trigger ?? 'creative-experience',
      }).then((snapshot) => {
        setReadiness(snapshot);
        return snapshot;
      });
    },
    [descriptor, id, priority],
  );

  useEffect(() => {
    if (!prepare || !descriptor) return undefined;

    // Preparation is automatic but never competes with the first paint: on a
    // page that is still loading it waits for the hub's settled window, and on
    // an already-loaded page it uses an idle slice. A component that must
    // prepare immediately (an activation path) calls `prepare()` itself.
    let active = true;
    let cancel = () => {};

    const run = () => {
      if (!active) return;
      cancel = whenIdle(
        () => {
          if (!active) return;
          prepareNow().then(
            (snapshot) => {
              if (active) setReadiness(snapshot);
            },
            () => {
              // The hub reports failures in the snapshot; a rejected preparation
              // must never become an unhandled rejection on the page.
            },
          );
        },
        { timeout: 900 },
      );
    };

    if (typeof document !== 'undefined' && document.readyState !== 'complete') {
      cancel = whenPageSettled(run);
    } else {
      run();
    }

    return () => {
      active = false;
      cancel();
    };
  }, [descriptor, prepare, prepareNow]);

  return {
    id,
    descriptor,
    plan: visualPlan,
    readiness,
    ready: isExperiencePrepared(id),
    prepare: prepareNow,
  };
}

export default useCreativeExperience;
