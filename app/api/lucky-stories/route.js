import { createLuckyStory } from '../../lucky-stories';

export const runtime = 'nodejs';

export async function POST(request) {
  const formData = await request.formData();
  const result = await createLuckyStory({
    name: formData.get('name'),
    location: formData.get('location'),
    story: formData.get('story'),
    website: formData.get('website'),
  });

  const redirectUrl = new URL('/#lucky-stories', request.url);

  if (result.error) {
    redirectUrl.searchParams.set('storyError', result.error);
  } else {
    redirectUrl.searchParams.set('storyShared', '1');
  }

  return Response.redirect(redirectUrl, 303);
}
