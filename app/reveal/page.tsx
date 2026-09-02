import RevealClient from './RevealClient';

export const metadata = {
  title: 'Daily Card Reveal | Lucky Pick Canada',
  description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
  alternates: { canonical: '/reveal' },
  openGraph: {
    title: 'Daily Card Reveal | Lucky Pick Canada',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    url: '/reveal',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Daily Card Reveal | Lucky Pick Canada',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    images: ['/1785347037732.png'],
  },
};

export default function RevealPage() {
  return <RevealClient />;
}
