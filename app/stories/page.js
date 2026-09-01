import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from '../lucky-map-of-canada/lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lucky Stories | LuckyPickCanada.ca',
  description: 'Read community Lucky Stories from across Canada.',
  alternates: { canonical: '/stories' },
  openGraph: {
    title: 'Lucky Stories | LuckyPickCanada.ca',
    description: 'Read community Lucky Stories from across Canada.',
    url: '/stories',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Lucky Stories | LuckyPickCanada.ca',
    description: 'Read community Lucky Stories from across Canada.',
    images: ['/1785347037732.png'],
  },
};

export default async function LuckyStoriesPage() {
  const mapData = await getLuckyStoryMap();

  return <LuckyMapOfCanada mapData={mapData} />;
}
