import { createLuckyStory } from '../../lucky-stories';
import { validatePublicFormSubmission } from '../../spam-protection';
import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const runtime = 'nodejs';

// 1. GET: Fetch stories for the frontend (Restores page rendering)
export async function GET() {
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ recentStories: [], isConfigured: false }, { status: 500 });
  }

  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

  try {
    const recentStories = await sql`
      select id, display_name, location, story, created_at
      from lucky_stories
      where approved = true
      order by created_at desc
      limit 2
    `;
    return NextResponse.json({ recentStories, isConfigured: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ recentStories: [], isConfigured: false }, { status: 500 });
  }
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
  }

  return Response.redirect(redirectUrl, 303);
}
