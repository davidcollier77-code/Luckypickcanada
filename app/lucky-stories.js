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

export async function createLuckyStory({ name, location, story }) {
  const validated = validateLuckyStory({ name, location, story });

  if (validated.error) {
    return validated;
  }

  const database = getSql();

  if (!database) {
    return { error: 'The Lucky Stories database is not configured yet.' };
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

  // Invalidate cache before returning success
  try {
    const ctx = getCloudflareContext();
    if (ctx?.env?.LUCKYPICK_KV) {
      await invalidate(ctx.env, cacheKey('lucky-stories-map'));
    }
  } catch (err) {
    console.warn('Failed to invalidate cache after story creation', err);
    // Continue even if cache invalidation fails
  }

  return { ok: true };
}

export async function getLuckyStoryMap() {
  const database = getSql();

  if (!database) {
    return { stories: [], provinceCounts: {}, totalStories: 0, provincesWithStories: 0, isConfigured: false };
  }

  try {
    await ensureLuckyStoriesTable(database);

    let cfEnv = null;
    let cfCtx = null;
    try {
      const context = getCloudflareContext();
      cfEnv = context.env;
      cfCtx = context;
    } catch (e) {
      // getCloudflareContext might throw if not running in CF environment
    }

    const fetcher = async () => {
      return await Promise.all([
        database`
          select ls.id, ls.display_name, ls.location, ls.story, ls.created_at, count(lr.id) as reaction_count
          from lucky_stories ls
          left join lucky_story_reactions lr on ls.id = lr.story_id
          where ls.approved = true
          group by ls.id, ls.display_name, ls.location, ls.story, ls.created_at
          order by ls.created_at desc
          limit 100
        `,
        database`
          select location
          from lucky_stories
          where approved = true
        `,
      ]);
    };

    const [rows, locations] = (cfEnv && cfEnv.LUCKYPICK_KV && cfCtx && cfCtx.waitUntil)
      ? await cached(cfEnv, cfCtx, cacheKey('lucky-stories-map'), fetcher)
      : await fetcher();

    const stories = rows.reduce((acc, row) => {
      const province = getStoryProvince(row.location);

      if (!province) return acc;

      acc.push({
        id: String(row.id),
        firstName: sanitizeSingleLine(row.display_name, 40).split(' ')[0],
        province: province.code,
        provinceName: province.name,
        story: sanitizePlainText(row.story, 600),
        preview: createStoryPreview(row.story),
        createdAt: row.created_at,
        reactionCount: parseInt(row.reaction_count, 10) || 0,
      });

      return acc;
    }, []);
    const provinceCounts = locations.reduce((counts, row) => {
      const province = getStoryProvince(row.location);

      if (province) {
        counts[province.code] = (counts[province.code] || 0) + 1;
      }

      return counts;
    }, {});

    return {
      stories,
      provinceCounts,
      totalStories: locations.length,
      provincesWithStories: Object.keys(provinceCounts).length,
      isConfigured: true,
    };
  } catch (error) {
    console.error('Lucky Stories lookup failed', error);
    return { stories: [], provinceCounts: {}, totalStories: 0, provincesWithStories: 0, isConfigured: false };
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

    // Invalidate cache
    try {
      const ctx = getCloudflareContext();
      if (ctx?.env?.LUCKYPICK_KV) {
        await invalidate(ctx.env, cacheKey('lucky-stories-map'));
      }
    } catch (err) {
      console.warn('Failed to invalidate cache after reaction', err);
    }

    return { ok: true, count: parseInt(result.count, 10) || 0 };
  } catch (error) {
    console.error('Adding story reaction failed', error);
    return { error: 'Unable to add reaction.' };
  }
}
