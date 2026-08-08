-- LuckyPickCanada Database Schema
-- Run this script in your Neon PostgreSQL database to initialize all required tables

-- Table: lucky_stories
-- Stores community-submitted lucky stories with location and approval status
CREATE TABLE IF NOT EXISTS lucky_stories (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    location TEXT,
    story TEXT NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster querying of approved stories
CREATE INDEX IF NOT EXISTS idx_lucky_stories_approved_created 
ON lucky_stories(approved, created_at DESC);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_lucky_stories_location 
ON lucky_stories(location) 
WHERE approved = true;

-- Table: luck_shares
-- Stores user map shares linked to Lucky Pick purchases
CREATE TABLE IF NOT EXISTS luck_shares (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    province TEXT NOT NULL,
    checkout_session_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster province aggregation
CREATE INDEX IF NOT EXISTS idx_luck_shares_province 
ON luck_shares(province);

-- Index for recent shares queries
CREATE INDEX IF NOT EXISTS idx_luck_shares_created 
ON luck_shares(created_at DESC);

-- Index for checkout session lookup
CREATE INDEX IF NOT EXISTS idx_luck_shares_checkout_session 
ON luck_shares(checkout_session_id) 
WHERE checkout_session_id IS NOT NULL;
