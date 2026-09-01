import CrystalBallClient from '../crystal-ball-client/CrystalBallClient';

export const metadata = {
  title: 'Crystal Ball | Lucky Pick Canada',
  description: 'Ask the Lucky Crystal Ball a question to receive playful, mystical fortunes and daily guidance steeped in Canadian magic.',
  alternates: { canonical: '/crystal-ball' },
  openGraph: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Lucky Crystal Ball a question to receive playful, mystical fortunes and daily guidance steeped in Canadian magic.',
    url: '/crystal-ball',
  },
  twitter: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Ask the Lucky Crystal Ball a question to receive playful, mystical fortunes and daily guidance steeped in Canadian magic.',
  },
};

export default function CrystalBallPage() {
  return <CrystalBallClient />;
}
