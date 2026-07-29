import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from '../lucky-map-of-canada/lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Where Luck Has Been Found in Canada | LuckyPickCanada.ca',
  description: 'See where LuckyPickCanada community stories have been shared across Canada.',
  alternates: { canonical: '/map' },
  openGraph: {
    title: 'Where Luck Has Been Found in Canada | LuckyPickCanada.ca',
    description: 'See where LuckyPickCanada community stories have been shared across Canada.',
    url: '/map',
  },
  twitter: {
    title: 'Where Luck Has Been Found in Canada | LuckyPickCanada.ca',
    description: 'See where LuckyPickCanada community stories have been shared across Canada.',
  },
};

export default async function WhereLuckHasBeenFoundInCanadaPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
