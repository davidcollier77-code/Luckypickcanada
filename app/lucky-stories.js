import { getSql, initializeDatabase } from './lib/db-init';
import { sanitizePlainText, sanitizeSingleLine, validatePlainTextField } from './form-security';
import { cached, cacheKey, invalidate } from './lib/kv-cache';
import crypto from 'crypto';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const storyProvinces = [
  { code: 'BC', name: 'British Columbia', aliases: ['bc', 'b.c.', 'british columbia'] },
  { code: 'AB', name: 'Alberta', aliases: ['ab', 'alta', 'alberta'] },
  { code: 'SK', name: 'Saskatchewan', aliases: ['sk', 'sask', 'saskatchewan'] },
  { code: 'MB', name: 'Manitoba', aliases: ['mb', 'manitoba'] },
  { code: 'ON', name: 'Ontario', aliases: ['on', 'ont', 'ontario'] },
  { code: 'QC', name: 'Quebec', aliases: ['qc', 'québec', 'quebec'] },
  { code: 'NB', name: 'New Brunswick', aliases: ['nb', 'n.b.', 'new brunswick'] },
  { code: 'NS', name: 'Nova Scotia', aliases: ['ns', 'n.s.', 'nova scotia'] },
  { code: 'PE', name: 'Prince Edward Island', aliases: ['pe', 'pei', 'p.e.i.', 'prince edward island'] },
  { code: 'NL', name: 'Newfoundland and Labrador', aliases: ['nl', 'nfld', 'newfoundland', 'labrador', 'newfoundland and labrador'] },
  { code: 'YT', name: 'Yukon', aliases: ['yt', 'yukon'] },
  { code: 'NT', name: 'Northwest Territories', aliases: ['nt', 'nwt', 'northwest territories'] },
  { code: 'NU', name: 'Nunavut', aliases: ['nu', 'nunavut'] },
];

/** Stories fetched for the first page and every automatic follow-up page. */
export const LUCKY_STORIES_PAGE_SIZE = 3;
/** Upper bound accepted from a public query string so one request cannot ask for everything. */
export const LUCKY_STORIES_MAX_PAGE_SIZE = 12;
/** Maximum number of stories shown per province in Recent Canadian Activity. */
const RECENT_STORIES_PER_PROVINCE_LIMIT = 3;
/** KV cache-aside namespace for the province summary aggregates. */
const SUMMARY_CACHE_NAMESPACE = 'lucky-stories-summary';

// translate() needs a one-to-one character mapping; keep both strings aligned.
const PROVINCE_ACCENT_FROM = 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ';
const PROVINCE_ACCENT_TO = 'aaaaaaceeeeiiiinoooooouuuuyy';

function normalizeLocation(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to escape special regex characters
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// PERFORMANCE OPTIMIZATION (Bolt ⚡):
// Precompile regular expressions for location matching outside the function.
// Previously, these were created dynamically on every call, which became a
// bottleneck when processing many records (e.g., in getLuckyStoryMap).
const PRECOMPILED_PROVINCES = storyProvinces.map((province) => {
  return {
    ...province,
    codeRegex: new RegExp(`(^|[^A-Za-z])${escapeRegExp(province.code)}([^A-Za-z]|$)`, 'i'),
    aliasRegexes: province.aliases
      .map((alias) => {
        const cleanAlias = normalizeLocation(alias);
        if (cleanAlias === province.code.toLowerCase()) {
          return null;
        }
        const escapedAlias = cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|\\s)${escapedAlias}(\\s|$)`, 'i');
      })
      .filter(Boolean),
  };
});

export function getStoryProvince(location) {
  const rawLocation = String(location || '');
  const normalized = normalizeLocation(rawLocation);

  if (!normalized) {
    return null;
  }

  const provinceCodeMatch = PRECOMPILED_PROVINCES.find((province) =>
    province.codeRegex.test(rawLocation),
  );

  if (provinceCodeMatch) {
    return provinceCodeMatch;
  }

  const aliasMatch = PRECOMPILED_PROVINCES.find((province) =>
    province.aliasRegexes.some((regex) => regex.test(normalized)),
  );

  return aliasMatch || null;
}

export function createStoryPreview(story) {
  const cleanStory = sanitizePlainText(story, 300);

  if (cleanStory.length <= 150) {
    return cleanStory;
  }

  return `${cleanStory.slice(0, 147).trim()}...`;
}

export function validateLuckyStory({ name, location, story }) {
  const cleanName = validatePlainTextField({
    value: name,
    label: 'Name',
    minLength: 2,
    maxLength: 40,
    required: true,
    allowUrls: false,
  });
  const cleanLocation = validatePlainTextField({
    value: location,
    label: 'Location',
    maxLength: 80,
    allowUrls: false,
  });
  const cleanStory = validatePlainTextField({
    value: story,
    label: 'Lucky story',
    minLength: 20,
    maxLength: 600,
    required: true,
    allowUrls: false,
  });

  if (cleanName.error) return cleanName;
  if (cleanLocation.error) return cleanLocation;
  if (cleanStory.error) return cleanStory;

  return {
    name: sanitizeSingleLine(cleanName.value, 40),
    location: sanitizeSingleLine(cleanLocation.value, 80) || null,
    story: cleanStory.value,
  };
}

/**
 * Builds the parameterized SQL predicate that matches one province, mirroring
 * getStoryProvince: province/territory codes match word boundaries in the raw
 * location, and aliases match normalized words.
 *
 * @param {Object} province - Entry from storyProvinces.
 * @param {string} column - Trusted column expression such as 'location' or 'ls.location'.
 * @param {number} startIndex - First positional parameter number for this predicate.
 * @returns {{ clause: string, params: string[] }} SQL predicate and its values.
 */
function provinceFilterParts(province, column, startIndex) {
  const params = [];
  const clauses = [];
  const placeholder = (pattern) => {
    params.push(pattern);
    return `$${startIndex + params.length - 1}`;
  };

  clauses.push(
    `lower(coalesce(${column}, '')) ~ ${placeholder(
      `(^|[^a-z])${province.code.toLowerCase()}([^a-z]|$)`,
    )}`,
  );

  const normalizedColumn = `regexp_replace(lower(translate(coalesce(${column}, ''), '${PROVINCE_ACCENT_FROM}', '${PROVINCE_ACCENT_TO}')), '[^a-z0-9.]+', ' ', 'g')`;

  for (const alias of province.aliases) {
    const cleanAlias = normalizeLocation(alias);
    if (!cleanAlias || cleanAlias === province.code.toLowerCase()) continue;
    clauses.push(`${normalizedColumn} ~ ${placeholder(`(^|\\s)${escapeRegExp(cleanAlias)}(\\s|$)`)}`);
  }

  return { clause: `(${clauses.join(' or ')})`, params };
}

/**
 * Returns a parameterized province predicate for a known region code.
 *
 * @param {string} provinceCode - Province or territory code.
 * @param {string} [column] - Trusted column expression to match.
 * @returns {{ clause: string, params: string[] } | null} Null for an unknown code.
 */
export function buildProvinceFilter(provinceCode, column = 'location') {
  const province = storyProvinces.find((entry) => entry.code === provinceCode);
  if (!province) return null;
  return provinceFilterParts(province, column, 1);
}

/**
 * Picks the province with the highest published story count. Ties resolve in
 * the canonical storyProvinces order so every visit makes the same choice.
 *
 * @param {Record<string, number>} provinceCounts - Published counts by code.
 * @returns {string} Province code, or 'ON' when nothing is published.
 */
export function pickDefaultProvince(provinceCounts = {}) {
  let bestCode = null;
  let bestCount = 0;

  for (const province of storyProvinces) {
    const count = Number(provinceCounts[province.code]) || 0;
    if (count > bestCount) {
      bestCode = province.code;
      bestCount = count;
    }
  }

  return bestCode || 'ON';
}

/**
 * Parses the public Lucky Stories query string. Province codes are whitelisted,
 * page size and offset are bounded, and only the supported time window is read.
 *
 * @param {URLSearchParams} searchParams - Request query parameters.
 * @returns {{ province: string|null, offset: number, limit: number, hours: number|null, includeFeed: boolean, storyId: string|null }}
 */
export function parseLuckyStoriesQuery(searchParams) {
  const rawProvince = String(searchParams?.get?.('province') || '').trim().toUpperCase();
  const province = storyProvinces.some((entry) => entry.code === rawProvince) ? rawProvince : null;

  const rawOffset = Number.parseInt(searchParams?.get?.('offset') || '0', 10);
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

  const rawLimitParam = searchParams?.get?.('limit');
  const rawLimit = rawLimitParam === null || rawLimitParam === undefined ? Number.NaN : Number.parseInt(rawLimitParam, 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 0), LUCKY_STORIES_MAX_PAGE_SIZE)
    : LUCKY_STORIES_PAGE_SIZE;

  const hours = searchParams?.get?.('hours') === '24' ? 24 : null;
  const includeFeed = searchParams?.get?.('summary') !== '1' && limit > 0;

  const rawStoryId = String(searchParams?.get?.('story') || '');
  const storyId = /^\d{1,20}$/.test(rawStoryId) ? rawStoryId : null;

  return { province, offset, limit, hours, includeFeed, storyId };
}

/**
 * Maps a lucky_stories row to the public story shape.
 *
 * @param {Object} row - Database row with display_name, location, story, created_at and reaction_count.
 * @returns {Object|null} Public story, or null when the location is not a Canadian province.
 */
export function toLuckyStory(row) {
  if (!row) return null;

  const province = getStoryProvince(row.location);
  if (!province) return null;

  return {
    id: String(row.id),
    firstName: sanitizeSingleLine(row.display_name, 40).split(' ')[0],
    province: province.code,
    provinceName: province.name,
    story: sanitizePlainText(row.story, 600),
    preview: createStoryPreview(row.story),
    createdAt: row.created_at,
    reactionCount: parseInt(row.reaction_count, 10) || 0,
  };
}

async function ensureLuckyStoriesTable(database) {
  await database`
    create table if not exists lucky_stories (
      id bigserial primary key,
      display_name text not null,
      location text,
      story text not null,
      approved boolean not null default true,
      created_at timestamptz not null default now()
    )
  `;
}

/**
 * Reads published province counts with one aggregate query.
 * Counts describe every published row, never just the loaded page.
 *
 * @param {Function} database - Neon SQL client.
 * @param {{ hours?: number|null }} [options] - Restrict to a rolling time window.
 * @returns {Promise<{ counts: Record<string, number>, total: number }>}
 */
async function fetchProvinceCounts(database, { hours = null } = {}) {
  const params = [];
  let nextIndex = 1;
  let windowClause = '';

  if (hours) {
    params.push(hours);
    windowClause = ` and created_at >= now() - ($${nextIndex}::int * interval '1 hour')`;
    nextIndex += 1;
  }

  const selects = [];
  for (const province of storyProvinces) {
    const parts = provinceFilterParts(province, 'location', nextIndex);
    params.push(...parts.params);
    nextIndex += parts.params.length;
    selects.push(`count(*) filter (where ${parts.clause}${windowClause}) as "${province.code}"`);
  }

  const [row] = await database(
    `select count(*) as total, ${selects.join(', ')} from lucky_stories where approved = true`,
    params,
  );

  const counts = {};
  for (const province of storyProvinces) {
    const value = parseInt(row?.[province.code], 10);
    if (value > 0) counts[province.code] = value;
  }

  return { counts, total: parseInt(row?.total, 10) || 0 };
}

/**
 * Reads the newest published stories for the Recent Canadian Activity section.
 * The result is bounded to three stories per province and is independent of paging.
 *
 * @param {Function} database - Neon SQL client.
 * @param {{ hours?: number|null }} [options] - Restrict to a rolling time window.
 * @returns {Promise<Array<Object>>} Newest mapped stories.
 */
async function fetchRecentStories(database, { hours = null } = {}) {
  const params = [];
  let nextIndex = 1;
  let windowClause = '';

  if (hours) {
    params.push(hours);
    windowClause = ` and ls.created_at >= now() - (${nextIndex}::int * interval '1 hour')`;
    nextIndex += 1;
  }

  // Derive the partition key from the same province aliases used by the feed.
  // This keeps activity grouped correctly even when locations use abbreviations.
  const provinceCases = storyProvinces.map((province) => {
    const parts = provinceFilterParts(province, 'ls.location', nextIndex);
    params.push(...parts.params);
    nextIndex += parts.params.length;
    return `when ${parts.clause} then '${province.code}'`;
  });
  const provinceExpression = `case ${provinceCases.join(' ')} else null end`;

  const rows = await database(
    `
      with ranked_stories as (
        select
          ls.id,
          ls.display_name,
          ls.location,
          ls.story,
          ls.created_at,
          count(lr.id) as reaction_count,
          row_number() over (
            partition by ${provinceExpression}
            order by ls.created_at desc, ls.id desc
          ) as province_rank
        from lucky_stories ls
        left join lucky_story_reactions lr on ls.id = lr.story_id
        where ls.approved = true${windowClause}
        group by ls.id
      )
      select id, display_name, location, story, created_at, reaction_count
      from ranked_stories
      where province_rank <= ${RECENT_STORIES_PER_PROVINCE_LIMIT}
      order by created_at desc, id desc
    `,
    params,
  );

  return rows.map(toLuckyStory).filter(Boolean);
}

/**
 * Reads one province-scoped page of published stories. Province filtering and
 * the optional time window are applied in SQL, so no other province's stories
 * are returned or discarded in the browser.
 *
 * @param {Function} database - Neon SQL client.
 * @param {{ province: string, offset: number, limit: number, hours: number|null }} options - Page request.
 * @returns {Promise<Array<Object>>} Mapped stories for the page.
 */
async function fetchStoryPage(database, { province, offset, limit, hours }) {
  const filter = buildProvinceFilter(province, 'ls.location');
  if (!filter) return [];

  const params = [...filter.params];
  let windowClause = '';

  if (hours) {
    params.push(hours);
    windowClause = ` and ls.created_at >= now() - ($${params.length}::int * interval '1 hour')`;
  }

  params.push(limit, offset);

  const rows = await database(
    `
      select ls.id, ls.display_name, ls.location, ls.story, ls.created_at, count(lr.id) as reaction_count
      from lucky_stories ls
      left join lucky_story_reactions lr on ls.id = lr.story_id
      where ls.approved = true and ${filter.clause}${windowClause}
      group by ls.id
      order by ls.created_at desc, ls.id desc
      limit $${params.length - 1} offset $${params.length}
    `,
    params,
  );

  return rows.map(toLuckyStory).filter(Boolean);
}

/**
 * Reads one published story for a shared link.
 *
 * @param {Function} database - Neon SQL client.
 * @param {string} storyId - Validated numeric story id.
 * @returns {Promise<Object|null>} The linked story, or null.
 */
async function fetchLinkedStory(database, storyId) {
  const rows = await database(
    `
      select ls.id, ls.display_name, ls.location, ls.story, ls.created_at, count(lr.id) as reaction_count
      from lucky_stories ls
      left join lucky_story_reactions lr on ls.id = lr.story_id
      where ls.approved = true and ls.id = $1::bigint
      group by ls.id
      limit 1
    `,
    [storyId],
  );

  return rows.length ? toLuckyStory(rows[0]) : null;
}

function emptyLuckyStoryMap() {
  return {
    stories: [],
    linkedStory: null,
    provinceCounts: {},
    allTimeProvinceCounts: {},
    totalStories: 0,
    provincesWithStories: 0,
    recentStories: [],
    defaultProvince: 'ON',
    selectedProvince: 'ON',
    provinceTotal: 0,
    hasMore: false,
    isConfigured: false,
  };
}

/**
 * Loads the province summary aggregates, using the existing KV cache-aside
 * helper when the runtime provides it. Cached values cover only bounded
 * aggregates and the three recent stories, never the collection.
 *
 * @param {Function} database - Neon SQL client.
 * @param {number|null} hours - Optional rolling window in hours.
 * @returns {Promise<Object>} Summary aggregates.
 */
async function loadStorySummary(database, hours) {
  const fetcher = async () => {
    const [allTime, windowCounts, recentStories] = await Promise.all([
      fetchProvinceCounts(database),
      hours ? fetchProvinceCounts(database, { hours }) : Promise.resolve(null),
      fetchRecentStories(database, { hours }),
    ]);

    return {
      provinceCounts: windowCounts ? windowCounts.counts : allTime.counts,
      allTimeProvinceCounts: allTime.counts,
      totalStories: allTime.total,
      provincesWithStories: Object.keys(allTime.counts).length,
      recentStories,
    };
  };

  let cfEnv = null;
  let cfCtx = null;
  try {
    const context = getCloudflareContext();
    cfEnv = context?.env;
    cfCtx = context;
  } catch (e) {
    // getCloudflareContext throws outside the Cloudflare runtime; read Neon directly.
  }

  if (cfEnv?.LUCKYPICK_KV && cfCtx?.waitUntil) {
    const key = cacheKey(SUMMARY_CACHE_NAMESPACE, hours ? { window: `${hours}h` } : {});
    return cached(cfEnv, cfCtx, key, fetcher);
  }

  return fetcher();
}

/**
 * Invalidates every cached summary window after a write that changes stories.
 */
async function invalidateStorySummaryCache() {
  try {
    const ctx = getCloudflareContext();
    if (ctx?.env?.LUCKYPICK_KV) {
      await Promise.all([
        invalidate(ctx.env, cacheKey(SUMMARY_CACHE_NAMESPACE)),
        invalidate(ctx.env, cacheKey(SUMMARY_CACHE_NAMESPACE, { window: '24h' })),
      ]);
    }
  } catch (err) {
    console.warn('Failed to invalidate Lucky Stories summary cache', err);
  }
}

export async function createLuckyStory({ name, location, story }) {
  const validated = validateLuckyStory({ name, location, story });

  if (validated.error) {
    return validated;
  }

  const database = getSql();

  if (!database) {
    return { error: 'The Lucky Community Stories database is not configured yet.' };
  }

  try {
    await ensureLuckyStoriesTable(database);
    await initializeDatabase();
    await database`
      insert into lucky_stories (display_name, location, story)
      values (${validated.name}, ${validated.location}, ${validated.story})
    `;
  } catch (error) {
    console.error('Lucky Stories submission failed', error);
    return { error: 'Unable to share your lucky story.' };
  }

  await invalidateStorySummaryCache();

  return { ok: true };
}

/**
 * Reads the Lucky Stories page payload: province summary aggregates, one
 * province-scoped page of stories, the recent activity slice and an optional
 * shared-link story.
 *
 * @param {Object} [options] - Page request.
 * @param {string|null} [options.province] - Requested province code.
 * @param {number} [options.offset] - Page offset.
 * @param {number} [options.limit] - Page size.
 * @param {number|null} [options.hours] - Optional rolling window in hours.
 * @param {boolean} [options.includeFeed] - Whether to read story rows.
 * @param {string|null} [options.storyId] - Linked story id.
 * @returns {Promise<Object>} Map payload.
 */
export async function getLuckyStoryMap({
  province = null,
  offset = 0,
  limit = LUCKY_STORIES_PAGE_SIZE,
  hours = null,
  includeFeed = true,
  storyId = null,
} = {}) {
  const database = getSql();

  if (!database) {
    return emptyLuckyStoryMap();
  }

  try {
    await ensureLuckyStoriesTable(database);

    const summary = await loadStorySummary(database, hours);
    const defaultProvince = pickDefaultProvince(summary.allTimeProvinceCounts);
    const selectedProvince = province && storyProvinces.some((entry) => entry.code === province)
      ? province
      : defaultProvince;
    const provinceTotal = summary.provinceCounts[selectedProvince] || 0;

    const safeOffset = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
    const rawLimit = Number.isFinite(limit) ? Math.floor(limit) : 0;
    const pageSize = Math.min(Math.max(rawLimit, 0), LUCKY_STORIES_MAX_PAGE_SIZE);

    let stories = [];
    if (includeFeed && pageSize > 0 && provinceTotal > safeOffset) {
      stories = await fetchStoryPage(database, {
        province: selectedProvince,
        offset: safeOffset,
        limit: pageSize,
        hours,
      });
    }

    const linkedStory = storyId ? await fetchLinkedStory(database, storyId) : null;

    return {
      stories,
      linkedStory,
      provinceCounts: summary.provinceCounts,
      allTimeProvinceCounts: summary.allTimeProvinceCounts,
      totalStories: summary.totalStories,
      provincesWithStories: summary.provincesWithStories,
      recentStories: summary.recentStories,
      defaultProvince,
      selectedProvince,
      provinceTotal,
      hasMore: includeFeed && pageSize > 0 && safeOffset + stories.length < provinceTotal,
      isConfigured: true,
    };
  } catch (error) {
    console.error('Lucky Stories lookup failed', error);
    return emptyLuckyStoryMap();
  }
}

export async function addStoryReaction(storyId, clientIp) {
  const database = getSql();

  if (!database) {
    return { error: 'Database not available.' };
  }

  if (!clientIp) {
    return { error: 'Unable to identify client.' };
  }

  const clientHash = crypto.createHash('sha256').update(clientIp).digest('hex');

  try {
    // Attempt to insert reaction
    await database`
      insert into lucky_story_reactions (story_id, client_hash)
      values (${storyId}, ${clientHash})
      on conflict (story_id, client_hash) do nothing
    `;

    // Fetch the updated count
    const [result] = await database`
      select count(*) as count
      from lucky_story_reactions
      where story_id = ${storyId}
    `;

    await invalidateStorySummaryCache();

    return { ok: true, count: parseInt(result.count, 10) || 0 };
  } catch (error) {
    console.error('Adding story reaction failed', error);
    return { error: 'Unable to add reaction.' };
  }
}
