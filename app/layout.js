import './globals.css';
import { headers } from 'next/headers';


// Use Next.js build ID for cache-busting, automatically updated on each build
// This ensures CSS cache invalidation without manual version bumps
const buildId = process.env.CF_PAGES_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.BUILD_ID || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
const cssPath = `/themes/default/index.css?v=${buildId}`;

const siteUrl = 'https://luckypickcanada.ca';
const socialImage = '/1785347037732.png';

export const metadata = {
  title: 'Lucky Pick Canada | Digital Random Generator & Card Reveals',
  description: 'Experience the thrill of true randomness with Lucky Pick Canada. Draw digital cards, settle wagers, and unlock premium luck-themed reveals coast to coast.',
  keywords: ['luckypickcanada', 'lucky stories', 'lucky meter', 'lucky picks', 'fun number picks', 'canada luck', 'lucky card', 'story map', 'canadian luck'],
  metadataBase: new URL('https://luckypickcanada.ca'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lucky Pick Canada | Digital Random Generator & Card Reveals',
    description: 'Experience the thrill of true randomness with Lucky Pick Canada. Draw digital cards, settle wagers, and unlock premium luck-themed reveals coast to coast.',
    url: 'https://luckypickcanada.ca',
    siteName: 'Lucky Pick Canada',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lucky Pick Canada | Digital Random Generator & Card Reveals',
    description: 'Experience the thrill of true randomness with Lucky Pick Canada. Draw digital cards, settle wagers, and unlock premium luck-themed reveals coast to coast.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-CA" className="m-0 p-0">
      <head>
        <link rel="stylesheet" href={cssPath} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preload" href="/1785347037732.png" as="image" fetchPriority="high" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Lucky Pick Canada',
              url: 'https://luckypickcanada.ca',
              description: 'Interactive tier-based pick platform in Canada.',
            }),
          }}
        />
      </head>
      <body className="m-0 p-0">
        <div className="fixed inset-0 z-0 h-[100dvh] pointer-events-none overflow-hidden bg-slate-950">
        </div>
        <main className="relative z-10 w-full overflow-x-hidden max-w-[100vw] pt-0 mt-0">
          {children}
        </main>
      </body>
    </html>
  );
}
