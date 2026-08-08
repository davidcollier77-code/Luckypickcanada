import { neon } from '@neondatabase/serverless';
import { getCloudflareContext } from '@opennextjs/cloudflare';

let sql;
let isInitialized = false;

export function getSql() {
  // Try to get Cloudflare context environment variables first, fall back to process.env
  let cfEnv;
  try {
    cfEnv = getCloudflareContext()?.env;
  } catch (e) {
    cfEnv = null;
  }
  
  // Check multiple common environment variable names as fallbacks
  const connectionString = 
    (cfEnv?.POSTGRES_URL || process.env.POSTGRES_URL) || 
    (cfEnv?.DATABASE_URL || process.env.DATABASE_URL) || 
    (cfEnv?.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL_NON_POOLING) || 
    (cfEnv?.POSTGRES_PRISMA_URL || process.env.POSTGRES_PRISMA_URL);
  
  if (!connectionString) {
    console.error(
      'Neon database connection failed: No connection string found. ' +
      'Checked environment variables: DATABASE_URL, POSTGRES_URL, ' +
      'POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL'
    );
    return null;
  }

  if (!sql) {
    sql = neon(connectionString);
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
