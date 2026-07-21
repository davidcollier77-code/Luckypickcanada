import { createLuckShare } from '../../luck-map';
import { validatePublicFormSubmission } from '../../spam-protection';

export const runtime = 'nodejs';

export async function POST(request) {
  const formData = await request.formData();
  const redirectUrl = new URL('/#little-luck-map', request.url);
  const spamCheck = await validatePublicFormSubmission({
    request,
    formData,
    formName: 'little-luck-map',
    duplicateFields: [formData.get('name'), formData.get('province'), formData.get('checkoutSessionId')],
  });

  const result = spamCheck.ok
    ? await createLuckShare({
        name: formData.get('name'),
        province: formData.get('province'),
        checkoutSessionId: formData.get('checkoutSessionId'),
      })
    : { error: spamCheck.error };

  if (result.error) {
    redirectUrl.searchParams.set('mapError', result.error);
  } else {
    redirectUrl.searchParams.set('shared', '1');
  }

  return Response.redirect(redirectUrl, 303);
}
