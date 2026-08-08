import { getSql } from './lib/db-init';
import { validateLuckyStory } from './lucky-stories';

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
    return { error: validated.error };
  }

  const sql = getSql();
  if (!sql) {
    return { error: 'The Lucky Stories database is not configured yet.' };
  }

  try {
    await ensureLuckyStoriesTable(sql);
    await sql`
      INSERT INTO stories (name, location, story)
      VALUES (${validated.name}, ${validated.location}, ${validated.story})
    `;
    return { success: true };
  } catch (err) {
    console.error('Database Error:', err);
    return { error: 'Failed to save your story to the database.' };
  }
}
