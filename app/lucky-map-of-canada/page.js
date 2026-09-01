import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from './lucky-map-of-canada';

export const revalidate = 3600;

export const metadata = {
  description: 'Browse LuckyPickCanada community stories from provinces and territories across Canada.',
  alternates: { canonical: '/map' },
  openGraph: {
    description: 'Browse LuckyPickCanada community stories from provinces and territories across Canada.',
    url: '/map',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Lucky Map of Canada | LuckyPickCanada.ca',
    description: 'Browse LuckyPickCanada community stories from provinces and territories across Canada.',
    images: ['/1785347037732.png'],
  },
};

export default async function LuckyMapOfCanadaPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
