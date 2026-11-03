import { NextResponse } from 'next/server';
import { getLuckyRevealCount } from '../../lucky-reveal-tally';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public read-only total for the homepage paid-reveal counter. Recording is
 * internal and server-side only; this endpoint never writes.
 */
export async function GET() {
  const total = await getLuckyRevealCount();

  return NextResponse.json(
    { total },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
