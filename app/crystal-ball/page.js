import CrystalBallClient from '../crystal-ball-client/CrystalBallClient';

export const metadata = {
  title: 'Crystal Ball | Lucky Pick Canada',
  description: 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.',
  alternates: { canonical: '/crystal-ball' },
  openGraph: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.',
    url: '/crystal-ball',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Crystal Ball a question and receive a playful, mystical reading from Lucky Pick Canada.',
    images: ['/1785347037732.png'],
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
