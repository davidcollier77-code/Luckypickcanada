import { validatePublicFormSubmission } from '../../spam-protection';
import { createSuggestion } from '../../suggestions';

export const runtime = 'nodejs';

export async function POST(request) {
  const formData = await request.formData();
  const redirectUrl = new URL('/#suggestion-box', request.url);
  const spamCheck = await validatePublicFormSubmission({
    request,
    formData,
    formName: 'suggestion-box',
  });

  const result = spamCheck.ok
    ? await createSuggestion({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
      })
    : { error: spamCheck.error };

  if (result.error) {
    redirectUrl.searchParams.set('suggestionError', result.error);
  } else {
    redirectUrl.searchParams.set('suggested', '1');
  }

  return Response.redirect(redirectUrl, 303);
}
