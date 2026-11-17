// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import IntentPrefetchLink from '../components/IntentPrefetchLink';

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
});

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
});
