// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const query = vi.fn();
  // The Neon HTTP driver is callable: sql(text, params), not sql.query(...).
  const database = vi.fn(async (text, params) => query(text, params));
  return { query, database };
});

vi.mock('../app/lib/db-init', () => ({
  getSql: () => mocks.database,
  initializeDatabase: vi.fn(),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => {
    throw new Error('not running in Cloudflare');
  },
}));

import {
  buildProvinceFilter,
  getLuckyStoryMap,
  LUCKY_STORIES_MAX_PAGE_SIZE,
  LUCKY_STORIES_PAGE_SIZE,
  parseLuckyStoriesQuery,
  pickDefaultProvince,
  toLuckyStory,
} from '../app/lucky-stories';

const countsRow = {
  total: '21',
  BC: '1',
  AB: '1',
  SK: '1',
  MB: '1',
  ON: '7',
  QC: '1',
  NB: '1',
  NS: '4',
  PE: '1',
  NL: '1',
  YT: '1',
  NT: '1',
  NU: '1',
};

function storyRow(overrides = {}) {
  return {
    id: '1',
    display_name: 'Nora Bennett',
    location: 'Toronto, Ontario',
    story: '[dev-seed] A borrowed sled came back with a note.',
    created_at: '2026-11-01T12:00:00.000Z',
    reaction_count: '0',
    ...overrides,
  };
}

function installDatabase({ feedFactory } = {}) {
  mocks.query.mockImplementation(async (text, params) => {
    if (text.includes('count(*) as total')) return [countsRow];

    if (text.includes('ls.approved = true and (')) {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      if (feedFactory) return feedFactory({ limit, offset, text, params });
      return Array.from({ length: Math.max(0, Math.min(limit, 7 - offset)) }, (_, index) => storyRow({ id: String(offset + index + 1) }));
    }

    if (text.includes('ls.id = $1::bigint')) {
      return params[0] === '20' ? [storyRow({ id: '20', display_name: 'DevLee', location: 'Yellowknife, NT' })] : [];
    }

    if (text.includes('row_number() over')) {
      return [
        storyRow({ id: '99', display_name: 'Rowan', location: 'Halifax, Nova Scotia' }),
        storyRow({ id: '98', display_name: 'Maya', location: 'Sydney, NS' }),
        storyRow({ id: '97', display_name: 'Owen', location: 'Truro, Nova Scotia' }),
        storyRow({ id: '95', display_name: 'Avery', location: 'Toronto, Ontario' }),
        storyRow({ id: '94', display_name: 'Noah', location: 'Ottawa, ON' }),
      ];
    }

    return [];
  });
}

describe('parseLuckyStoriesQuery', () => {
  it('reads a whitelisted province, bounded page and the supported window', () => {
    const parsed = parseLuckyStoriesQuery(
      new URLSearchParams('province=on&offset=6&limit=99&hours=24&story=42'),
    );

    expect(parsed).toEqual({
      province: 'ON',
      offset: 6,
      limit: LUCKY_STORIES_MAX_PAGE_SIZE,
      hours: 24,
      includeFeed: true,
      storyId: '42',
    });
  });

  it('defaults to the three-row page and ignores invalid values', () => {
    expect(parseLuckyStoriesQuery(new URLSearchParams(''))).toEqual({
      province: null,
      offset: 0,
      limit: LUCKY_STORIES_PAGE_SIZE,
      hours: null,
      includeFeed: true,
      storyId: null,
    });

    expect(parseLuckyStoriesQuery(new URLSearchParams('province=ZZ&offset=-5&limit=-2&story=abc'))).toEqual({
      province: null,
      offset: 0,
      limit: 0,
      hours: null,
      includeFeed: false,
      storyId: null,
    });
  });

  it('supports summary-only refreshes without a story feed', () => {
    const parsed = parseLuckyStoriesQuery(new URLSearchParams('summary=1&province=BC&hours=24'));
    expect(parsed.includeFeed).toBe(false);
    expect(parsed.hours).toBe(24);
    expect(parsed.province).toBe('BC');
  });
});

describe('pickDefaultProvince', () => {
  it('returns the highest published count and resolves ties by canonical order', () => {
    expect(pickDefaultProvince({ ON: 7, BC: 2, NS: 4 })).toBe('ON');
    expect(pickDefaultProvince({ ON: 2, BC: 2 })).toBe('BC');
    expect(pickDefaultProvince({ QC: 1, NS: 1 })).toBe('QC');
  });

  it('falls back to the existing Ontario default when nothing is published', () => {
    expect(pickDefaultProvince({})).toBe('ON');
    expect(pickDefaultProvince()).toBe('ON');
  });
});

describe('buildProvinceFilter', () => {
  it('parameterizes province codes and aliases instead of interpolating request text', () => {
    const filter = buildProvinceFilter('ON');
    expect(filter).not.toBeNull();
    expect(filter.params[0]).toBe('(^|[^a-z])on([^a-z]|$)');
    expect(filter.params).toContain('(^|\\s)ontario(\\s|$)');
    expect(filter.params).toContain('(^|\\s)ont(\\s|$)');
    expect(filter.clause).toContain('$1');
    expect(filter.clause).toContain('regexp_replace');
    expect(filter.clause).not.toContain('ontario');
  });

  it('targets the qualified column and rejects unknown regions', () => {
    const filter = buildProvinceFilter('BC', 'ls.location');
    expect(filter.clause).toContain('ls.location');
    expect(buildProvinceFilter('ZZ')).toBeNull();
  });
});

describe('toLuckyStory', () => {
  it('keeps the author first name and the story text exactly as stored', () => {
    const story = toLuckyStory(storyRow({ display_name: 'DevAvery' }));
    expect(story.firstName).toBe('DevAvery');
    expect(story.story).toBe('[dev-seed] A borrowed sled came back with a note.');
    expect(story.province).toBe('ON');
    expect(story.provinceName).toBe('Ontario');
  });

  it('returns null for a location that is not a Canadian province', () => {
    expect(toLuckyStory(storyRow({ location: 'Atlantis' }))).toBeNull();
  });
});

describe('getLuckyStoryMap paging', () => {
  beforeEach(() => {
    mocks.query.mockReset();
    installDatabase();
  });

  it('reads one three-story page while reporting the full province total', async () => {
    const mapData = await getLuckyStoryMap({ province: 'ON', offset: 0, limit: LUCKY_STORIES_PAGE_SIZE });

    expect(mapData.stories).toHaveLength(3);
    expect(mapData.provinceTotal).toBe(7);
    expect(mapData.totalStories).toBe(21);
    expect(mapData.hasMore).toBe(true);
    expect(mapData.defaultProvince).toBe('ON');
    expect(mapData.selectedProvince).toBe('ON');
    expect(mapData.provinceCounts.ON).toBe(7);

    const feedCall = mocks.query.mock.calls.find(([text]) => text.includes('ls.approved = true and ('));
    expect(feedCall).toBeTruthy();
    const [sql, params] = feedCall;
    expect(sql).toContain('order by ls.created_at desc, ls.id desc');
    expect(params).toContain('(^|[^a-z])on([^a-z]|$)');
    expect(params.slice(-2)).toEqual([3, 0]);
  });

  it('requests the next offset and stops once the province is exhausted', async () => {
    const middle = await getLuckyStoryMap({ province: 'ON', offset: 3, limit: 3 });
    expect(middle.stories).toHaveLength(3);
    expect(middle.hasMore).toBe(true);

    const feedCalls = mocks.query.mock.calls.filter(([text]) => text.includes('ls.approved = true and ('));
    expect(feedCalls.at(-1)[1].slice(-2)).toEqual([3, 3]);

    const last = await getLuckyStoryMap({ province: 'ON', offset: 6, limit: 3 });
    expect(last.stories).toHaveLength(1);
    expect(last.hasMore).toBe(false);
  });

  it('does not read story rows for summary-only requests', async () => {
    await getLuckyStoryMap({ includeFeed: false });

    const feedCalls = mocks.query.mock.calls.filter(([text]) => text.includes('ls.approved = true and ('));
    expect(feedCalls).toHaveLength(0);
  });

  it('returns up to three recent stories per province, not three across Canada', async () => {
    const mapData = await getLuckyStoryMap({ province: 'ON', limit: 0, storyId: '20' });

    expect(mapData.stories).toEqual([]);
    expect(mapData.linkedStory.id).toBe('20');
    expect(mapData.linkedStory.province).toBe('NT');
    expect(mapData.recentStories).toHaveLength(5);

    const countsByProvince = mapData.recentStories.reduce((counts, story) => {
      counts[story.province] = (counts[story.province] || 0) + 1;
      return counts;
    }, {});
    expect(countsByProvince).toEqual({ NS: 3, ON: 2 });

    const recentQuery = mocks.query.mock.calls.find(([text]) => text.includes('row_number() over'));
    expect(recentQuery).toBeTruthy();
    expect(recentQuery[0]).toContain('partition by case');
    expect(recentQuery[0]).toContain('where province_rank <= 3');
    expect(recentQuery[1]).toContain('(^|[^a-z])ns([^a-z]|$)');
    expect(recentQuery[1]).toContain('(^|[^a-z])on([^a-z]|$)');
  });

  it('applies the 24-hour window before ranking recent stories per province', async () => {
    await getLuckyStoryMap({ province: 'ON', limit: 0, hours: 24 });

    const recentQuery = mocks.query.mock.calls.find(([text]) => text.includes('row_number() over'));
    expect(recentQuery).toBeTruthy();
    expect(recentQuery[0]).toContain("ls.created_at >= now() - ($1::int * interval '1 hour')");
    expect(recentQuery[1][0]).toBe(24);
    expect(recentQuery[0]).toContain('partition by case');
  });
});
