import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from '../lucky-map-of-canada/lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lucky Map | LuckyPickCanada.ca',
  description: 'Explore community Lucky Stories across Canada by province.',
  alternates: { canonical: '/map' },
  openGraph: {
    title: 'Lucky Map | LuckyPickCanada.ca',
    description: 'Explore community Lucky Stories across Canada by province.',
    url: '/map',
  },
  twitter: {
    title: 'Lucky Map | LuckyPickCanada.ca',
    description: 'Explore community Lucky Stories across Canada by province.',
  },
};

export default async function LuckyMapPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
