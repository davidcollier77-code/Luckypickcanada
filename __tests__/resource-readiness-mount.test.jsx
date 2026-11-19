// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

const mocks = vi.hoisted(() => ({
  pathname: '/',
  plan: { prefetch: 'intent' },
  router: { prefetch: vi.fn() },
  configureRoutePrefetch: vi.fn(),
  prepareExperience: vi.fn(() => Promise.resolve({})),
  prepareExperiencesWhenIdle: vi.fn(() => () => {}),
  whenIdle: vi.fn((callback) => {
    callback();
    return () => {};
  }),
  whenPageSettled: vi.fn((callback) => {
    callback();
    return () => {};
  }),
  registerExperienceResources: vi.fn(() => () => {}),
  getExperienceDefinition: vi.fn(() => ({})),
  registerResourceAdapter: vi.fn(() => () => {}),
  READINESS: { FETCHED: 'fetched', INITIALIZED: 'initialized' },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => mocks.router,
}));

vi.mock('../app/lib/use-adaptive-plan', () => ({
  useAdaptivePlan: () => mocks.plan,
}));

vi.mock('../app/lib/resource-readiness', () => ({
  configureRoutePrefetch: mocks.configureRoutePrefetch,
  prepareExperience: mocks.prepareExperience,
  prepareExperiencesWhenIdle: mocks.prepareExperiencesWhenIdle,
  whenIdle: mocks.whenIdle,
  whenPageSettled: mocks.whenPageSettled,
  registerExperienceResources: mocks.registerExperienceResources,
  getExperienceDefinition: mocks.getExperienceDefinition,
  registerResourceAdapter: mocks.registerResourceAdapter,
  READINESS: mocks.READINESS,
}));

import ResourceReadiness from '../components/ResourceReadiness';
import { HOMEPAGE_LIKELY_NEXT } from '../app/lib/resource-readiness-manifest';

beforeEach(() => {
  mocks.pathname = '/';
  mocks.plan = { prefetch: 'intent' };
  mocks.router.prefetch.mockClear();
  mocks.configureRoutePrefetch.mockClear();
  mocks.prepareExperience.mockClear();
  mocks.prepareExperiencesWhenIdle.mockClear();
  mocks.whenIdle.mockImplementation((callback) => {
    callback();
    return () => {};
  });
  mocks.whenPageSettled.mockImplementation((callback) => {
    callback();
    return () => {};
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ResourceReadiness mount', () => {
  it('waits for the settle gate before preparing the current route', () => {
    const cancelSettled = vi.fn();
    let settle;
    mocks.whenPageSettled.mockImplementation((callback) => {
      settle = callback;
      return cancelSettled;
    });
    mocks.pathname = '/lucky-meter';

    const view = render(<ResourceReadiness />);
    expect(mocks.prepareExperience).not.toHaveBeenCalled();

    act(() => settle());

    expect(mocks.prepareExperience).toHaveBeenCalledWith('lucky-meter', {
      priority: 'critical',
      trigger: 'route',
    });
    expect(mocks.prepareExperience).toHaveBeenCalledWith('lucky-number-generator', {
      priority: 'critical',
      trigger: 'route',
    });

    view.unmount();
    expect(cancelSettled).toHaveBeenCalled();
  });

  it('does not schedule homepage idle preparation when the plan forbids prefetching', () => {
    mocks.pathname = '/';
    mocks.plan = { prefetch: 'none' };

    render(<ResourceReadiness />);

    expect(mocks.prepareExperiencesWhenIdle).not.toHaveBeenCalled();
  });

  it('schedules the homepage likely-next list once the page settles', () => {
    mocks.pathname = '/';

    render(<ResourceReadiness />);

    expect(mocks.prepareExperiencesWhenIdle).toHaveBeenCalledWith(HOMEPAGE_LIKELY_NEXT, {
      trigger: 'homepage-idle',
    });
  });

  it('injects router.prefetch, delegates intent and removes its listeners on unmount', () => {
    const view = render(<ResourceReadiness />);

    const configure = mocks.configureRoutePrefetch.mock.calls.at(-1)[0];
    expect(configure).toBeTypeOf('function');
    configure('/crystal-ball');
    expect(mocks.router.prefetch).toHaveBeenCalledWith('/crystal-ball');

    const link = document.createElement('a');
    link.setAttribute('href', '/reveal');
    document.body.appendChild(link);

    fireEvent.pointerOver(link);
    expect(mocks.prepareExperience).toHaveBeenCalledWith('reveal', {
      priority: 'intent',
      trigger: 'hover',
    });

    act(() => {
      link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(mocks.prepareExperience).toHaveBeenCalledWith('reveal', {
      priority: 'intent',
      trigger: 'focus-or-press',
    });

    fireEvent.pointerDown(link);
    expect(mocks.prepareExperience).toHaveBeenCalledTimes(3);

    view.unmount();
    mocks.prepareExperience.mockClear();
    fireEvent.pointerOver(link);
    act(() => {
      link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    fireEvent.pointerDown(link);
    expect(mocks.prepareExperience).not.toHaveBeenCalled();

    link.remove();
  });

  it('honours the prefetch policy for hover intent', () => {
    mocks.plan = { prefetch: 'none' };

    render(<ResourceReadiness />);

    const link = document.createElement('a');
    link.setAttribute('href', '/crystal-ball');
    document.body.appendChild(link);

    fireEvent.pointerOver(link);
    expect(mocks.prepareExperience).not.toHaveBeenCalled();

    link.remove();
  });
});
