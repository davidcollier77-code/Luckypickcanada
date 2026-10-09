import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from './lucky-map-of-canada';

export const revalidate = 3600;

export const metadata = {
  description: 'View the Lucky Map of Canada to discover community-shared stories of good fortune from every province and territory.',
  alternates: { canonical: '/map' },
  openGraph: {
    description: 'View the Lucky Map of Canada to discover community-shared stories of good fortune from every province and territory.',
    url: '/lucky-map-of-canada',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Lucky Map of Canada | LuckyPickCanada.ca',
    description: 'View the Lucky Map of Canada to discover community-shared stories of good fortune from every province and territory.',
    images: ['/1785347037732.png'],
  },
};

export default async function LuckyMapOfCanadaPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
