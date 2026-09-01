import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from '../lucky-map-of-canada/lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  description: 'See where LuckyPickCanada community stories have been shared across Canada.',
  alternates: { canonical: '/map' },
  openGraph: {
    description: 'See where LuckyPickCanada community stories have been shared across Canada.',
    url: '/where-luck-has-been-found-in-canada',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Where Luck Has Been Found in Canada | LuckyPickCanada.ca',
    description: 'See where LuckyPickCanada community stories have been shared across Canada.',
    images: ['/1785347037732.png'],
  },
};

export default async function WhereLuckHasBeenFoundInCanadaPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
