import '../../themes/default/homepage.css';
import CrystalBallClient from '../crystal-ball-client/CrystalBallClient';

export const metadata = {
  title: 'Crystal Ball | Lucky Pick Canada',
  description: 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.',
  alternates: { canonical: '/crystal-ball' },
  openGraph: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.',
    url: '/crystal-ball',
    images: [{ url: '/luckypickcanada-share-1200x630.jpg', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.',
    images: ['/luckypickcanada-share-1200x630.jpg'],
  },
};

export default function CrystalBallPage() {
  return (
    <>
      <div className="homepage-sky-backdrop" aria-hidden="true" />
      <CrystalBallClient />
    </>
  );
}
