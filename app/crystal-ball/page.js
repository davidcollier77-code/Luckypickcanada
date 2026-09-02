import CrystalBallClient from '../crystal-ball-client/CrystalBallClient';

export const metadata = {
  title: 'Crystal Ball | Lucky Pick Canada',
  description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
  alternates: { canonical: '/crystal-ball' },
  openGraph: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    url: '/crystal-ball',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Crystal Ball | Lucky Pick Canada',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    images: ['/1785347037732.png'],
  },
};

export default function CrystalBallPage() {
  return <CrystalBallClient />;
}
