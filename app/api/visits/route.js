import { NextResponse } from 'next/server';
import { getClientIp, checkApiRateLimit } from '../../spam-protection';
import { Redis } from '@upstash/redis';

// Initialize Redis client using environment variables automatically
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set
// Initialize Redis client lazily to prevent startup crashes
function getRedisClient() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('Redis connection not configured. Using fallback.');
      return null;
    }
    return Redis.fromEnv();
  } catch (error) {
    console.warn('Redis initialization failed:', error.message);
    return null;
  }
}

// Increment and return the new count
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    // Allow max 5 requests per 10 seconds per IP for visits
    const rateLimit = checkApiRateLimit(ip, 'visits', 5, 10000);

    if (!rateLimit.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const redis = getRedisClient();
    if (!redis) {
      return NextResponse.json({ visits: 0 }); // Graceful fallback
    }
    const visits = await redis.incr('total_visits');
    return NextResponse.json({ visits });
  } catch (error) {
    console.error('Error incrementing visits:', error);
    // Don't return 500 which causes client errors, just return a fallback
    return NextResponse.json({ visits: 0, warning: 'Failed to update visits' }, { status: 200 });
  }
}

// Fetch and return the current count without incrementing
export async function GET(req) {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return NextResponse.json({ visits: 0 }); // Graceful fallback
    }
    const visits = await redis.get('total_visits') || 0;
    return NextResponse.json({ visits: parseInt(visits, 10) });
  } catch (error) {
    console.error('Error fetching visits:', error);
    // Don't return 500 which causes client errors, just return a fallback
    return NextResponse.json({ visits: 0, warning: 'Failed to fetch visits' }, { status: 200 });
  }
}