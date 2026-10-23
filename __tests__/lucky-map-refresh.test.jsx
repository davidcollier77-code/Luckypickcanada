// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startLuckyStoriesRefresh } from '../app/lucky-map-of-canada/lucky-stories-refresh';

const mapData = {
  stories: [],
  provinceCounts: {},
  totalStories: 0,
  provincesWithStories: 0,
  isConfigured: true,
};

describe('Lucky Map live story refresh', () => {
  let stopRefresh;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopRefresh?.();
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
    const setMapData = vi.fn();
    const fetchMock = vi.fn()
      .mockReturnValueOnce(initialRequest)
      .mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mapData) });
    vi.stubGlobal('fetch', fetchMock);

    stopRefresh = startLuckyStoriesRefresh(setMapData);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/lucky-stories', { cache: 'no-store' });

    // Two intervals pass while the initial response is still pending. Neither may start a second request.
    vi.advanceTimersByTime(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveInitialRequest(makeResponse());
    await initialRequest;
    await vi.runAllMicrotasksAsync();
    expect(setMapData).toHaveBeenCalledWith(mapData);

    // Once the request settles, the next regular poll may run normally.
    vi.advanceTimersByTime(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/lucky-stories', { cache: 'no-store' });
  });
});
