import RevealClient from './RevealClient';

export const revalidate = 0;

export const metadata = {
  title: 'Daily Card Reveal | Lucky Pick Canada',
  description: 'Reveal your daily collectible digital card from Lucky Pick Canada and build your collection of lucky moments.',
  alternates: { canonical: '/reveal' },
  openGraph: {
    title: 'Daily Card Reveal | Lucky Pick Canada',
    description: 'Reveal your daily collectible digital card from Lucky Pick Canada and build your collection of lucky moments.',
    url: '/reveal',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Daily Card Reveal | Lucky Pick Canada',
    description: 'Reveal your daily collectible digital card from Lucky Pick Canada and build your collection of lucky moments.',
    images: ['/1785347037732.png'],
  },
};

export default function RevealPage() {
  return <RevealClient />;
}
