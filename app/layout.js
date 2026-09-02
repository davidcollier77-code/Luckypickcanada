import Link from 'next/link';
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
  description: 'Lucky Pick Canada: fun digital entertainment with lucky picks, daily moments, collectible cards, crystal ball & community stories.',
  keywords: ['luckypickcanada', 'lucky stories', 'lucky meter', 'lucky picks', 'fun number picks', 'canada luck', 'lucky card', 'story map', 'canadian luck'],
  metadataBase: new URL('https://luckypickcanada.ca'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lucky Pick Canada | Digital Random Generator & Card Reveals',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    url: 'https://luckypickcanada.ca',
    locale: 'en_CA',
    type: 'website',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lucky Pick Canada | Digital Random Generator & Card Reveals',
    description: 'Discover Lucky Pick Canada, a fun Canadian digital entertainment experience featuring lucky number picks, daily lucky moments, collectible cards, a crystal ball and community stories.',
    images: ['/1785347037732.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
        <link rel="preload" href="/BackgroundEraser_20260724_163638777.png" as="image" fetchPriority="high" />
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
        <main className="relative z-10 w-full overflow-x-hidden max-w-[100vw] pt-0 mt-0 flex flex-col min-h-screen">
          <div className="flex-grow">
            {children}
          </div>
                    <footer className="w-full py-6 px-4 bg-slate-950/80 backdrop-blur-md border-t border-white/10 text-center text-xs text-white/60 relative z-20">
            <div className="max-w-4xl mx-auto space-y-4">
              <p>Lucky Pick Canada · Made for fun, optimism, and a little everyday magic.</p>

              <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-white/70">
                <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
                <Link href="/lucky-meter" className="hover:text-amber-400 transition-colors">Lucky Meter</Link>
                <Link href="/crystal-ball" className="hover:text-amber-400 transition-colors">Crystal Ball</Link>
                <Link href="/reveal" className="hover:text-amber-400 transition-colors">Daily Reveal</Link>
                <Link href="/map" className="hover:text-amber-400 transition-colors">Lucky Map</Link>
                <Link href="/about" className="hover:text-amber-400 transition-colors">About</Link>
              </nav>

              <nav className="flex flex-wrap justify-center gap-4 text-white/50 text-[11px]" aria-label="Social links">
                <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">Facebook Community</a>
                <a href="https://www.facebook.com/luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">Facebook Page</a>
                <a href="https://x.com/luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">X (Twitter)</a>
                <a href="https://www.instagram.com/luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">Instagram</a>
                <a href="https://www.tiktok.com/@luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">TikTok</a>
              </nav>

              <nav className="flex flex-wrap justify-center gap-4 text-white/40 text-[10px]" aria-label="Legal links">
                <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
              </nav>

              <p className="text-[10px] text-white/30 max-w-2xl mx-auto leading-relaxed">
                LuckyPickCanada is a digital entertainment experience created for fun and positive moments. It does not provide lottery or gambling services.
              </p>
              <p className="text-[10px] text-white/30">&copy; {new Date().getFullYear()} Lucky Pick Canada. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </body>
    </html>
  );
}
