import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from './lucky-map-of-canada';

export const revalidate = 3600;

export const metadata = {
  description: 'Browse LuckyPickCanada community stories from provinces and territories across Canada.',
  alternates: { canonical: '/map' },
  openGraph: {
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
