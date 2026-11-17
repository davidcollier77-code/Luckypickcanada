'use client';

import { useEffect, useState } from 'react';
import { getAdaptivePlan, subscribeToAdaptivePlan } from './adaptive-performance';

/**
 * Subscribes a component to the shared adaptive plan.
 *
 * Every consumer shares one set of browser listeners through the adaptive layer,
 * so adding this hook to several components does not add several background
 * subscriptions. The initial state is the plan available at render time and is
 * replaced after mount and whenever a condition changes.
 *
 * @returns {ReturnType<typeof getAdaptivePlan>} The current adaptation plan.
 */
export function useAdaptivePlan() {
  const [plan, setPlan] = useState(getAdaptivePlan);

  useEffect(() => subscribeToAdaptivePlan(setPlan), []);

  return plan;
}

export default useAdaptivePlan;
