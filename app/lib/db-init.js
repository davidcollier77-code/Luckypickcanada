/q dev Please update app/lib/db-init.js so that table initialization runs automatically in the background whenever getSql() is invoked, guaranteeing the lucky_stories and luck_shares tables are created on startup. Here is the code:

import { neon } from '@neondatabase/serverless';
import { getCloudflareContext } from '@opennextjs/cloudflare';

let sqlInstance = null;
let initPromise = null;

export function getSql() {
  if (sqlInstance) {
    return sqlInstance;
  }

  let cfEnv;
  try {
    cfEnv = getCloudflareContext()?.env;
  } catch (e) {
    cfEnv = null;
  }
  
  const connectionString = 
    (cfEnv?.POSTGRES_URL || process.env.POSTGRES_URL) || 
    (cfEnv?.DATABASE_URL || process.env.DATABASE_URL) || 
    (cfEnv?.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL_NON_POOLING) || 
    (cfEnv?.POSTGRES_PRISMA_URL || process.env.POSTGRES_PRISMA_URL);
  
  if (!connectionString) {
    console.error('Neon database connection failed: No connection string found.');
    return null;
  }

  sqlInstance = neon(connectionString);

  // Automatically kick off table initialization in the background
  initializeDatabase().catch(err => {
    console.error('Background table initialization error:', err);
  });

  return sqlInstance;
}

export async function initializeDatabase() {
  const sql = getSql();
  if (!sql) return;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS lucky_stories (
            id BIGSERIAL PRIMARY KEY,
            display_name TEXT NOT NULL,
            location TEXT,
            story TEXT NOT NULL,
            approved BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS luck_shares (
            id BIGSERIAL PRIMARY KEY,
            display_name TEXT NOT NULL,
            province TEXT NOT NULL,
            checkout_session_id TEXT UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;
      } catch (error) {
        console.error('Database initialization failed:', error);
        initPromise = null;
      }
    })();
  }

  await initPromise;
}
