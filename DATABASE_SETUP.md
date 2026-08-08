# LuckyPickCanada Database Setup Guide

## Production Bug Fix: Database Initialization for Neon PostgreSQL

This guide provides the complete database setup required to fix the "Lucky Stories database needs to be available" error in production.

## Prerequisites

- Neon PostgreSQL database account (https://neon.tech)
- Database connection string configured in environment variables
- PostgreSQL client or Neon SQL Editor access

## Environment Variables Required

Ensure these environment variables are set in your production environment:

```env
POSTGRES_URL=postgresql://username:password@hostname/database?sslmode=require
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

**Note:** The application checks for `POSTGRES_URL` first, then falls back to `DATABASE_URL`.

## Quick Setup (Recommended)

### Option 1: Using Neon SQL Editor

1. Log in to your Neon dashboard (https://console.neon.tech)
2. Navigate to your project: `summer-silence-20834502`
3. Open the SQL Editor
4. Copy and paste the entire contents of `create-database-schema.sql`
5. Click "Run" to execute the schema

### Option 2: Using psql CLI

```bash
# Connect to your Neon database
psql "postgresql://neondb_owner:npg_QlcWTjK0my3G@ep-mute-voice-at782k6z-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run the schema file
\i create-database-schema.sql
```

### Option 3: Direct SQL Execution

Execute this SQL directly in your database:

```sql
-- Lucky Stories Table
CREATE TABLE IF NOT EXISTS lucky_stories (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    location TEXT,
    story TEXT NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lucky_stories_approved_created 
ON lucky_stories(approved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lucky_stories_location 
ON lucky_stories(location) 
WHERE approved = true;

-- Luck Shares Table (Map)
CREATE TABLE IF NOT EXISTS luck_shares (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    province TEXT NOT NULL,
    checkout_session_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_luck_shares_province 
ON luck_shares(province);

CREATE INDEX IF NOT EXISTS idx_luck_shares_created 
ON luck_shares(created_at DESC);
```

## Verification

After running the schema, verify the tables were created:

```sql
-- Check table existence
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lucky_stories', 'luck_shares');

-- Verify table structure
\d lucky_stories
\d luck_shares
```

## Post-Setup

1. The application will automatically use these tables once they exist
2. The map will no longer show the fallback error message
3. Community stories will be stored and displayed properly

## Troubleshooting

**Error: "The Lucky Stories database is not configured yet"**
- Verify `POSTGRES_URL` or `DATABASE_URL` is set correctly
- Check database connection string includes `?sslmode=require` or `?ssl=true`
- Ensure the database user has CREATE TABLE privileges

**Error: Connection timeout**
- Verify firewall rules allow connections from your deployment platform
- Check that the database is not paused (Neon auto-pauses after inactivity)

**Tables exist but no data shows**
- Check that the application has been redeployed after database setup
- Verify the tables are in the correct schema (usually 'public')
- Test the database connection using the connection string from your environment

## Schema Details

### lucky_stories Table
- Stores community lucky stories
- `approved` defaults to `true` for immediate visibility
- Includes indexes for performance on approved stories

### luck_shares Table  
- Stores Lucky Pick purchase map shares
- Links to Stripe checkout sessions via `checkout_session_id`
- Includes indexes for province aggregation and recent shares

## Security Notes

- Never commit actual database credentials to version control
- Use environment variables for all sensitive connection strings
- The provided schema uses proper indexing for production performance
- Consider setting up regular backups through Neon dashboard

## Support

If you encounter issues:
1. Check Neon dashboard for database status
2. Review application logs for connection errors
3. Verify environment variables are properly set in production
4. Test database connectivity using the Neon SQL Editor
