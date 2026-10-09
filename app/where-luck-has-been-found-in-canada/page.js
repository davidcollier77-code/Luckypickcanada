import { Suspense } from 'react';
import { MapErrorBoundary } from '../components/map-error-boundary';
import { getLuckyStoryMap } from '../lucky-stories';
import LuckyMapOfCanada from '../lucky-map-of-canada/lucky-map-of-canada';

export const dynamic = 'force-dynamic';

export const metadata = {
  description: 'Discover where luck has been found in Canada. Explore our interactive map featuring community stories of everyday magic and fortunate moments.',
  alternates: { canonical: '/map' },
  openGraph: {
    description: 'Discover where luck has been found in Canada. Explore our interactive map featuring community stories of everyday magic and fortunate moments.',
    url: '/where-luck-has-been-found-in-canada',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Where Luck Has Been Found in Canada | LuckyPickCanada.ca',
    description: 'Discover where luck has been found in Canada. Explore our interactive map featuring community stories of everyday magic and fortunate moments.',
    images: ['/1785347037732.png'],
  },
};

function MapLoadingSkeleton() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div style={{ width: '50px', height: '50px', border: '5px solid rgba(250,204,21,0.2)', borderTopColor: '#facc15', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '1rem', color: '#facc15', fontWeight: 'bold' }}>Loading Lucky Map...</p>
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

export default function WhereLuckHasBeenFoundInCanadaPage() {
  return (
    <MapErrorBoundary>
      <Suspense fallback={<MapLoadingSkeleton />}>
        <MapFetcher />
      </Suspense>
    </MapErrorBoundary>
  );
}
