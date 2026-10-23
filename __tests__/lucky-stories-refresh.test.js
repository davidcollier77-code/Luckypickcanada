// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getLuckyStoryMap: vi.fn(),
}));

vi.mock('../app/lucky-stories', () => ({
  createLuckyStory: vi.fn(),
  getLuckyStoryMap: mocks.getLuckyStoryMap,
}));

vi.mock('../app/spam-protection', () => ({
  validatePublicFormSubmission: vi.fn(),
}));

import { GET } from '../app/api/lucky-stories/route.js';

const story = {
  id: '8',
  firstName: 'Susie',
  province: 'QC',
  provinceName: 'Quebec',
  story: 'A real saved Lucky Story.',
  preview: 'A real saved Lucky Story.',
  createdAt: '2026-07-22T16:29:47.194Z',
};

describe('Lucky Stories GET freshness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stored stories with no-store headers', async () => {
    mocks.getLuckyStoryMap.mockResolvedValue({
      stories: [story],
      provinceCounts: { QC: 1 },
      totalStories: 1,
      provincesWithStories: 1,
      isConfigured: true,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stories).toEqual([story]);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
  });

  it('also prevents caching an unavailable-database response', async () => {
    mocks.getLuckyStoryMap.mockResolvedValue({
      stories: [],
      provinceCounts: {},
      totalStories: 0,
      provincesWithStories: 0,
      isConfigured: false,
    });

    const response = await GET();

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
  });
});
