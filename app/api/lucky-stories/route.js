import { createLuckyStory, getLuckyStoryMap } from '../../lucky-stories';
import { validatePublicFormSubmission } from '../../spam-protection';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// GET: Fetch the current map data without CDN or browser caching
// Returns community stories, province counts, and total statistics
export async function GET() {
  try {
  const mapData = await getLuckyStoryMap();
    
    // Log data for debugging visibility issues
    console.log('Lucky Stories Map Data:', {
      totalStories: mapData.totalStories,
      provincesWithStories: mapData.provincesWithStories,
      isConfigured: mapData.isConfigured
    });
  const status = mapData.isConfigured ? 200 : 500;

  return NextResponse.json(mapData, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
  } catch (error) {
    console.error('Error fetching lucky stories:', error);
    return NextResponse.json(
      { stories: [], provinceCounts: {}, totalStories: 0, provincesWithStories: 0, isConfigured: false },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

// 2. POST: Handle new story submissions (Maintains your security)
// POST: Handle new story submissions with spam protection
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
  }

  return Response.redirect(redirectUrl, 303);
}
