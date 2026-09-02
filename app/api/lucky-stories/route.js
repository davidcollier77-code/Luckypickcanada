import { revalidatePath } from 'next/cache';
import { createLuckyStory, getLuckyStoryMap } from '../../lucky-stories';
import { validatePublicFormSubmission } from '../../spam-protection';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// 1. GET: Fetch the current map data with edge caching (1 hour revalidation).
export async function GET() {
  const mapData = await getLuckyStoryMap();
  const status = mapData.isConfigured ? 200 : 500;

  return NextResponse.json(mapData, {
    status,
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}

// 2. POST: Handle new story submissions (Maintains your security)
export async function POST(request) {
  const formData = await request.formData();
  const redirectUrl = new URL('/#lucky-stories', request.url);
  
  const spamCheck = await validatePublicFormSubmission({
    request,
    formData,
    formName: 'lucky-stories',
    duplicateFields: [formData.get('name'), formData.get('location'), formData.get('story')],
  });

  const result = spamCheck.ok
    ? await createLuckyStory({
        name: formData.get('name'),
        location: formData.get('location'),
        story: formData.get('story'),
      })
    : { error: spamCheck.error };

  if (result.error) {
    redirectUrl.searchParams.set('storyError', result.error);
  } else {
    redirectUrl.searchParams.set('storyShared', '1');
    revalidatePath('/map');
    revalidatePath('/where-luck-has-been-found-in-canada');
    revalidatePath('/lucky-map-of-canada');
  }

  return Response.redirect(redirectUrl, 303);
}
