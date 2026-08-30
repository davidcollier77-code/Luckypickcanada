import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client using environment variables automatically
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set
const redis = Redis.fromEnv();

// Increment and return the new count
export async function POST(req) {
  try {
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
    const visits = await redis.get('total_visits') || 0;
    return NextResponse.json({ visits: parseInt(visits, 10) });
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}
