import postgres from 'postgres';

let sql;

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
      select display_name, location, story, created_at
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
