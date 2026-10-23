// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({ default: () => null }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('../app/lib/audio', () => ({ playButtonClick: vi.fn() }));

import LuckyMapOfCanada from '../app/lucky-map-of-canada/lucky-map-of-canada';

const mapData = {
  stories: [],
  provinceCounts: {},
  totalStories: 0,
  provincesWithStories: 0,
  isConfigured: true,
};

describe('Lucky Map live story refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('uses a stable no-store URL and skips polls while a request is pending', async () => {
    let resolveInitialRequest;
    const initialRequest = new Promise((resolve) => {
      resolveInitialRequest = resolve;
    });
    const makeResponse = () => ({
      ok: true,
      json: vi.fn().mockResolvedValue(mapData),
    });
    const fetchMock = vi.fn()
      .mockReturnValueOnce(initialRequest)
      .mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mapData) });
    vi.stubGlobal('fetch', fetchMock);

    render(<LuckyMapOfCanada mapData={mapData} />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/lucky-stories', { cache: 'no-store' });

    // Two intervals pass while the initial response is still pending. Neither may start a second request.
    await act(async () => {
      vi.advanceTimersByTime(120_000);
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveInitialRequest(makeResponse());
      await Promise.resolve();
      await Promise.resolve();
    });

    // Once the request settles, the next regular poll may run normally.
    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/lucky-stories', { cache: 'no-store' });
  });
});
