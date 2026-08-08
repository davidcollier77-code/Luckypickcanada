import { getSql } from './lib/db-init';
import { validateLuckyStory } from './lucky-stories';

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
