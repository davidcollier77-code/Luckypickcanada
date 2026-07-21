import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from '../lucky-map-of-canada/lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lucky Map of Canada 🍀 | LuckyPickCanada.ca',
  description: 'Explore where LuckyPickCanada community stories have been shared across Canada using the existing Lucky Stories collection.',
  alternates: {
    canonical: '/where-luck-has-been-found-in-canada',
  },
};

export default async function WhereLuckHasBeenFoundInCanadaPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
