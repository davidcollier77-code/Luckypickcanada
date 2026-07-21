import postgres from 'postgres';

let sql;

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

function getSql() {
  if (!process.env.POSTGRES_URL) {
    return null;
  }

  if (!sql) {
    sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  }

  return sql;
}

function cleanText(value, maxLength) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

function normalizeLocation(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getStoryProvince(location) {
  const rawLocation = String(location || '');
  const normalized = normalizeLocation(rawLocation);

  if (!normalized) {
    return null;
  }

  const provinceCodeMatch = storyProvinces.find((province) =>
    new RegExp(`(^|[^A-Za-z])${province.code}([^A-Za-z]|$)`).test(rawLocation),
  );

  if (provinceCodeMatch) {
    return provinceCodeMatch;
  }

  return storyProvinces.find((province) =>
    province.aliases.some((alias) => {
      const cleanAlias = normalizeLocation(alias);

      if (cleanAlias === province.code.toLowerCase()) {
        return false;
      }

      const escapedAlias = cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|\\s)${escapedAlias}(\\s|$)`, 'i').test(normalized);
    }),
  ) || null;
}

function createStoryPreview(story) {
  const cleanStory = cleanText(story, 1500);

  if (cleanStory.length <= 150) {
    return cleanStory;
  }

  return `${cleanStory.slice(0, 147).trim()}...`;
}

function validateLuckyStory({ name, location, story }) {
  const cleanName = cleanText(name, 40);
  const cleanLocation = cleanText(location, 80);
  const cleanStory = cleanText(story, 1500);

  if (!cleanName || cleanName.length < 2) {
    return { error: 'Enter your name with at least 2 characters.' };
  }

  if (!cleanStory || cleanStory.length < 20) {
    return { error: 'Share a lucky story with at least 20 characters.' };
  }

  return {
    name: cleanName,
    location: cleanLocation || null,
    story: cleanStory,
  };
}

async function ensureLuckyStoriesTable(database) {
  await database`
    create table if not exists lucky_stories (
      id bigserial primary key,
      display_name text not null,
      location text,
      story text not null,
      created_at timestamptz not null default now()
    )
  `;
}

export async function createLuckyStory({ name, location, story, website }) {
  if (website) {
    return { ok: true };
  }

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
    await database`
      insert into lucky_stories (display_name, location, story)
      values (${validated.name}, ${validated.location}, ${validated.story})
    `;
  } catch (error) {
    console.error('Lucky Stories failed', error);
    return { error: 'Unable to save this lucky story right now.' };
  }

  return { ok: true };
}

export async function getLuckyStories() {
  const database = getSql();

  if (!database) {
    return { recentStories: [], isConfigured: false };
  }

  try {
    await ensureLuckyStoriesTable(database);

    const recentStories = await database`
      select id, display_name, location, story, created_at
      from lucky_stories
      order by created_at desc
      limit 6
    `;

    return { recentStories, isConfigured: true };
  } catch (error) {
    console.error('Lucky Stories failed', error);
    return { recentStories: [], isConfigured: false };
  }
}

export async function getLuckyStoryMap() {
  const database = getSql();

  if (!database) {
    return { stories: [], provinceCounts: {}, totalStories: 0, provincesWithStories: 0, isConfigured: false };
  }

  try {
    await ensureLuckyStoriesTable(database);

    const rows = await database`
      select id, display_name, location, story, created_at
      from lucky_stories
      order by created_at desc
    `;

    const stories = rows
      .map((entry) => {
        const province = getStoryProvince(entry.location);

        if (!province) {
          return null;
        }

        return {
          id: String(entry.id),
          firstName: entry.display_name,
          province: province.code,
          provinceName: province.name,
          location: entry.location,
          preview: createStoryPreview(entry.story),
          createdAt: entry.created_at?.toISOString?.() || String(entry.created_at || ''),
        };
      })
      .filter(Boolean);

    const provinceCounts = stories.reduce((summary, story) => {
      summary[story.province] = (summary[story.province] || 0) + 1;
      return summary;
    }, {});

    return {
      stories,
      provinceCounts,
      totalStories: rows.length,
      provincesWithStories: Object.keys(provinceCounts).length,
      isConfigured: true,
    };
  } catch (error) {
    console.error('Lucky Stories map failed', error);
    return { stories: [], provinceCounts: {}, totalStories: 0, provincesWithStories: 0, isConfigured: false };
  }
}
