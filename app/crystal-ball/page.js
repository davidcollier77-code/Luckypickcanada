import CrystalBallClient from '../crystal-ball-client/CrystalBallClient';

export const metadata = {
  title: 'Crystal Ball | Lucky Pick Canada',
  description: 'Ask the Lucky Crystal Ball a question to receive playful, mystical fortunes and daily guidance steeped in Canadian magic.',
  alternates: { canonical: '/crystal-ball' },
  openGraph: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Lucky Crystal Ball a question to receive playful, mystical fortunes and daily guidance steeped in Canadian magic.',
    url: '/crystal-ball',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Lucky Crystal Ball a question to receive playful, mystical fortunes and daily guidance steeped in Canadian magic.',
    images: ['/1785347037732.png'],
  },
};

export default function CrystalBallPage() {
  return <CrystalBallClient />;
}
