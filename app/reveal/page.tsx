import RevealClient from './RevealClient';

export const metadata = {
  title: 'Daily Card Reveal | Lucky Pick Canada',
  description: 'Reveal your daily collectible digital lucky card. Find a calm spark of encouragement and build your digital collection from coast to coast.',
  alternates: { canonical: '/reveal' },
  openGraph: {
    title: 'Daily Card Reveal | Lucky Pick Canada',
    description: 'Reveal your daily collectible digital lucky card. Find a calm spark of encouragement and build your digital collection from coast to coast.',
    url: '/reveal',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Daily Card Reveal | Lucky Pick Canada',
    description: 'Reveal your daily collectible digital lucky card. Find a calm spark of encouragement and build your digital collection from coast to coast.',
    images: ['/1785347037732.png'],
  },
};

export default function RevealPage() {
  return <RevealClient />;
}
