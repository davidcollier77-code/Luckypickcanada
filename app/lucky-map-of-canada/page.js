import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from './lucky-map-of-canada';

export const revalidate = 3600;

export const metadata = {
  description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
  alternates: { canonical: '/map' },
  openGraph: {
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    url: '/lucky-map-of-canada',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Lucky Map of Canada | LuckyPickCanada.ca',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    images: ['/1785347037732.png'],
  },
};

export default async function LuckyMapOfCanadaPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
