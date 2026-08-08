import postgres from 'postgres';

let sql;
let isInitialized = false;

export function getSql() {
  if (!process.env.POSTGRES_URL) {
    return null;
  }

  if (!sql) {
    sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  }

  return sql;
}

/**
 * Initialize all required database tables on startup.
 * Uses CREATE TABLE IF NOT EXISTS for safe automatic provisioning.
 * This function is idempotent and can be called multiple times safely.
 */
export async function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  const database = getSql();
  
  if (!database) {
    return;
  }

  try {
    // Create lucky_stories table with indexes
    await database`
      CREATE TABLE IF NOT EXISTS lucky_stories (
        id BIGSERIAL PRIMARY KEY,
        display_name TEXT NOT NULL,
        location TEXT,
        story TEXT NOT NULL,
        approved BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create luck_shares table for map markers
    await database`
      CREATE TABLE IF NOT EXISTS luck_shares (
        id BIGSERIAL PRIMARY KEY,
        display_name TEXT NOT NULL,
        province TEXT NOT NULL,
        checkout_session_id TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    isInitialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}
