import { createLuckShare } from '../../luck-map';

export const runtime = 'nodejs';

export async function POST(request) {
  const formData = await request.formData();
  const result = await createLuckShare({
    name: formData.get('name'),
    province: formData.get('province'),
    checkoutSessionId: formData.get('checkoutSessionId'),
  });

  const redirectUrl = new URL('/#little-luck-map', request.url);

  if (result.error) {
    redirectUrl.searchParams.set('mapError', result.error);
  } else {
    redirectUrl.searchParams.set('shared', '1');
  }

  return Response.redirect(redirectUrl, 303);
}
