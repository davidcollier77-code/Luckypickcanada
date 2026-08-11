import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from './lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  alternates: { canonical: '/lucky-map-of-canada' },
  description: 'Browse LuckyPickCanada community stories from provinces and territories across Canada.',
  alternates: { canonical: '/map' },
  openGraph: {
    url: '/lucky-map-of-canada',
    description: 'Browse LuckyPickCanada community stories from provinces and territories across Canada.',
    url: '/map',
  },
  twitter: {
    title: 'Lucky Map of Canada | LuckyPickCanada.ca',
    description: 'Browse LuckyPickCanada community stories from provinces and territories across Canada.',
  },
};

export default async function LuckyMapOfCanadaPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
