import postgres from 'postgres';
import { validateLuckyStory } from './lucky-stories';

const sql = postgres(process.env.POSTGRES_URL || process.env.DATABASE_URL, {
  ssl: 'require',
});

export async function createLuckyStory({ name, location, story }) {
  const validated = validateLuckyStory({ name, location, story });

  if (validated.error) {
    return { error: validated.error };
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
