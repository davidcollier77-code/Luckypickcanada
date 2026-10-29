import { NextResponse } from 'next/server';
import { addStoryReaction } from '../../../lucky-stories';
import { getClientIp, checkApiRateLimit } from '../../../spam-protection';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { storyId } = await request.json();

    if (!storyId || typeof storyId !== 'string' || !/^\d+$/.test(storyId) || storyId.length > 20) {
      return NextResponse.json({ error: 'Missing or invalid story ID' }, { status: 400 });
    }

    const ip = getClientIp(request);

    // Apply a reasonable rate limit: max 30 reactions per minute from the same IP
    const rateLimit = await checkApiRateLimit(ip, 'react_story', 30, 60000);
    if (!rateLimit.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const result = await addStoryReaction(storyId, ip);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Attempt to trigger Next.js cache revalidation for paths that might display stories
    try {
      revalidatePath('/map');
      revalidatePath('/where-luck-has-been-found-in-canada');
      revalidatePath('/lucky-map-of-canada');
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ count: result.count }, { status: 200 });
  } catch (error) {
    console.error('Failed to process reaction request', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
