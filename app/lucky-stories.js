import { getSql, initializeDatabase } from './lib/db-init';
import { sanitizePlainText, sanitizeSingleLine, validatePlainTextField } from './form-security';

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

export function createStoryPreview(story) {
  const cleanStory = sanitizePlainText(story, 1500);

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
    maxLength: 1500,
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

  return { ok: true };
}

export async function getLuckyStoryMap() {
  const database = getSql();

  if (!database) {
    return { stories: [], provinceCounts: {}, totalStories: 0, provincesWithStories: 0, isConfigured: false };
  }

  try {
    await ensureLuckyStoriesTable(database);
    const [rows, locations] = await Promise.all([
      database`
        select id, display_name, location, story, created_at
        from lucky_stories
        where approved = true
        order by created_at desc
        limit 100
      `,
      database`
        select location
        from lucky_stories
        where approved = true
      `,
    ]);
    const stories = rows
      .map((row) => {
        const province = getStoryProvince(row.location);

        if (!province) return null;

        return {
          id: String(row.id),
          firstName: sanitizeSingleLine(row.display_name, 40).split(' ')[0],
          province: province.code,
          provinceName: province.name,
          story: sanitizePlainText(row.story, 1500),
          preview: createStoryPreview(row.story),
          createdAt: row.created_at,
        };
      })
      .filter(Boolean);
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
