import { notFound } from 'next/navigation';
import '../../../themes/default/homepage.css';
import CrystalBallPreviewClient from '../../crystal-ball-client/CrystalBallPreviewClient';

export const metadata = {
  title: 'Crystal Ball date preview | Lucky Pick Canada',
  description: 'Development-only preview of the Crystal Ball on any local date.',
  robots: { index: false, follow: false },
};

export default function CrystalBallPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <>
      <div className="homepage-sky-backdrop" aria-hidden="true" />
      <CrystalBallPreviewClient />
    </>
  );
}
