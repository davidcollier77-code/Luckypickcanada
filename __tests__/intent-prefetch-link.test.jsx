// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import IntentPrefetchLink from '../components/IntentPrefetchLink';
import { refreshAdaptivePlan } from '../app/lib/adaptive-performance';

// The real next/link needs an app-router context, so the mock records the
// prefetch value the component passes and renders a plain anchor.
vi.mock('next/link', () => {
  const React = require('react');
  const MockLink = React.forwardRef(({ prefetch, children, ...props }, ref) =>
    React.createElement(
      'a',
      { ...props, ref, 'data-prefetch': prefetch === false ? 'off' : 'on' },
      children,
    ),
  );
  return { default: MockLink };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  delete navigator.connection;
  act(() => refreshAdaptivePlan());
});

function useConnection(connection) {
  Object.defineProperty(navigator, 'connection', { value: connection, configurable: true });
  act(() => refreshAdaptivePlan());
}

describe('IntentPrefetchLink', () => {
  it('keeps the route unprefetched until the visitor shows intent', () => {
    render(
      <IntentPrefetchLink href="/lucky-meter">Luck Generator</IntentPrefetchLink>,
    );

    expect(screen.getByRole('link')).toHaveAttribute('data-prefetch', 'off');
  });

  it.each([
    ['pointerEnter', 'onPointerEnter'],
    ['pointerDown', 'onPointerDown'],
    ['focus', 'onFocus'],
    ['touchStart', 'onTouchStart'],
  ])('turns prefetching on and forwards the %s handler', (eventName, handlerName) => {
    const handler = vi.fn();
    render(
      <IntentPrefetchLink href="/crystal-ball" {...{ [handlerName]: handler }}>
        Crystal Ball
      </IntentPrefetchLink>,
    );

    const link = screen.getByRole('link');
    fireEvent[eventName](link);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(link).toHaveAttribute('data-prefetch', 'on');
  });

  it('keeps working when no intent handler is supplied', () => {
    render(<IntentPrefetchLink href="/about">About</IntentPrefetchLink>);

    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link);

    expect(link).toHaveAttribute('data-prefetch', 'on');
  });

  it('waits for a press instead of a hover when Save-Data is on', () => {
    useConnection({ saveData: true, downlink: 20, rtt: 30 });
    render(<IntentPrefetchLink href="/lucky-meter">Luck Generator</IntentPrefetchLink>);

    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link);
    expect(link).toHaveAttribute('data-prefetch', 'off');

    fireEvent.pointerDown(link);
    expect(link).toHaveAttribute('data-prefetch', 'off');
  });

  it('waits for a press on a measured slow connection', () => {
    useConnection({ downlink: 0.4, rtt: 700 });
    render(<IntentPrefetchLink href="/crystal-ball">Crystal Ball</IntentPrefetchLink>);

    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link);
    expect(link).toHaveAttribute('data-prefetch', 'off');
  });

  it('allows hover prefetching again when the connection recovers', () => {
    useConnection({ downlink: 0.4, rtt: 700 });
    render(<IntentPrefetchLink href="/reveal">Reveal</IntentPrefetchLink>);

    const link = screen.getByRole('link');
    fireEvent.pointerEnter(link);
    expect(link).toHaveAttribute('data-prefetch', 'off');

    useConnection({ downlink: 30, rtt: 30 });

    expect(link).toHaveAttribute('data-prefetch', 'on');
  });
});
