import '../../themes/default/homepage.css';
import { Suspense } from 'react';
import { MapErrorBoundary } from '../components/map-error-boundary';
import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from '../lucky-map-of-canada/lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lucky Community Stories | LuckyPickCanada.ca',
  description: 'Explore Lucky Community Stories to read community tales of luck and everyday magic from across the country.',
  alternates: { canonical: '/map' },
  openGraph: {
    title: 'Lucky Community Stories | LuckyPickCanada.ca',
    description: 'Explore Lucky Community Stories to read community tales of luck and everyday magic from across the country.',
    url: '/map',
    images: [{ url: '/luckypickcanada-share-1200x630.jpg', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Lucky Community Stories | LuckyPickCanada.ca',
    description: 'Explore Lucky Community Stories to read community tales of luck and everyday magic from across the country.',
    images: ['/luckypickcanada-share-1200x630.jpg'],
  },
};

function MapLoadingSkeleton() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div style={{ width: '50px', height: '50px', border: '5px solid rgba(250,204,21,0.2)', borderTopColor: '#facc15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '1rem', color: '#facc15', fontWeight: 'bold' }}>Loading Lucky Community Stories...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

async function MapFetcher() {
  const mapData = await getLuckyStoryMap();
  return <LuckyMapOfCanada mapData={mapData} />;
}

export default function LuckyMapPage() {
  return (
    <MapErrorBoundary>
      <Suspense fallback={<MapLoadingSkeleton />}>
        <MapFetcher />
      </Suspense>
    </MapErrorBoundary>
  );
}
