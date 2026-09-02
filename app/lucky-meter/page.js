import LuckyMeterClient from '../lucky-meter-client/LuckyMeterClient';

export const metadata = {
  title: 'Lucky Meter | Lucky Pick Canada',
  description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
  alternates: { canonical: '/lucky-meter' },
  openGraph: {
    title: 'Lucky Meter | Lucky Pick Canada',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    url: '/lucky-meter',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Lucky Meter | Lucky Pick Canada',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    images: ['/1785347037732.png'],
  },
};

export default function LuckyMeterPage() {
  return <LuckyMeterClient />;
}
