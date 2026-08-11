import { NextResponse } from 'next/server';

export default function proxy(request) {
  const host = request.headers.get('host');

  if (host === 'www.luckypickcanada.ca') {
    const url = request.nextUrl.clone();
    url.host = 'luckypickcanada.ca';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
