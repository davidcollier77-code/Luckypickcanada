import { notFound } from 'next/navigation';
import CreativeWorkbench from '../../../components/graphics/CreativeWorkbench';
import { isWorkbenchEnabled } from '../../lib/graphics/workbench.js';

/**
 * The Creative Workbench route.
 *
 * Development only. A production deployment answers 404 unless it explicitly
 * sets `CREATIVE_WORKBENCH=1` for a deliberate review environment, so a visitor
 * can never reach the sandbox. The page is dynamic so that decision is made per
 * request instead of being frozen into a prerendered build artifact.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Creative Workbench (development only)',
  robots: { index: false, follow: false },
};

export default function CreativeWorkbenchPage() {
  if (!isWorkbenchEnabled(process.env)) notFound();
  return <CreativeWorkbench />;
}
