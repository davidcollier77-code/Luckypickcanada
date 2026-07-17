import { createSuggestion } from '../../suggestions';

export const runtime = 'nodejs';

export async function POST(request) {
  const formData = await request.formData();
  const result = await createSuggestion({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    website: formData.get('website'),
  });

  const redirectUrl = new URL('/#suggestion-box', request.url);

  if (result.error) {
    redirectUrl.searchParams.set('suggestionError', result.error);
  } else {
    redirectUrl.searchParams.set('suggested', '1');
  }

  return Response.redirect(redirectUrl, 303);
}
