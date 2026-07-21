import { createLuckyStory } from '../../lucky-stories';
import { validatePublicFormSubmission } from '../../spam-protection';

export const runtime = 'nodejs';

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
