import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client using environment variables automatically
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set
// Initialize Redis client lazily to prevent startup crashes
function getRedisClient() {
  try {
    return Redis.fromEnv();
  } catch (error) {
    console.error('Redis initialization failed:', error);
    throw new Error('Redis connection not configured');
  }
}

// Increment and return the new count
export async function POST(req) {
  try {
    const redis = getRedisClient();
    const visits = await redis.incr('total_visits');
    return NextResponse.json({ visits });
  } catch (error) {
    console.error('Error incrementing visits:', error);
    return NextResponse.json({ error: 'Failed to update visits' }, { status: 500 });
  }
}

// Fetch and return the current count without incrementing
export async function GET(req) {
  try {
    const redis = getRedisClient();
    const visits = await redis.get('total_visits') || 0;
    return NextResponse.json({ visits: parseInt(visits, 10) });
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}
