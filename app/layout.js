import Link from 'next/link';
import './globals.css';

import { Inter, Playfair_Display, Cinzel, Manrope } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-playfair' });
const cinzel = Cinzel({ subsets: ['latin'], display: 'swap', variable: '--font-cinzel', weight: ['600', '700', '800', '900'] });
const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope', weight: ['400', '500', '600', '700', '800'] });

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

/**
 * Renders the root HTML document with shared styles, background, and footer.
 *
 * @param {Object} props - The root layout props.
 * @param {import('react').ReactNode} props.children - The active route's content.
 * @returns {import('react').ReactElement} The document wrapping the route content.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en-CA" className={`m-0 p-0 ${inter.variable} ${playfair.variable} ${cinzel.variable} ${manrope.variable}`}>
      <head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" />

        <link rel="preload" href="/homepage-hero-lucky-pick-canada.webp" as="image" fetchPriority="high" />
        <link rel="stylesheet" href="/themes/default/index.css" />
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
        <div className="homepage-background-foundation fixed inset-0 z-0 h-[100dvh] pointer-events-none overflow-hidden bg-slate-950">
        </div>
        <main className="relative z-10 w-full overflow-x-hidden max-w-[100vw] pt-0 mt-0 flex flex-col min-h-screen">
          <div className="flex-grow">
            {children}
          </div>
                    <footer className="w-full py-8 px-4 bg-slate-950/90 backdrop-blur-md border-t border-white/10 text-center text-xs text-white/80 relative z-20">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 flex flex-col items-center">
              <p>Lucky Pick Canada · Made for fun, optimism, and a little everyday magic.</p>

              <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-white/90 max-w-lg mb-2">
                <Link href="/" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Home</Link>
                <Link href="/lucky-meter" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Lucky Meter</Link>
                <Link href="/crystal-ball" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Crystal Ball</Link>
                <Link href="/reveal" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Daily Reveal</Link>
                <Link href="/map" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Lucky Map</Link>
                <Link href="/about" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">About</Link>
              </nav>

              <nav className="flex flex-wrap justify-center gap-3 sm:gap-4 text-white/75 text-[10px] sm:text-[11px] max-w-sm mb-2" aria-label="Social links">
                <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Facebook Community</a>
                <a href="https://www.facebook.com/luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Facebook Page</a>
                <a href="https://x.com/luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">X (Twitter)</a>
                <a href="https://www.instagram.com/luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">Instagram</a>
                <a href="https://www.tiktok.com/@luckypickcanada" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-1 sm:before:-inset-2 before:content-['']">TikTok</a>
              </nav>

              <div className="w-16 h-px bg-white/10 my-2"></div>
              <nav className="flex flex-wrap justify-center gap-4 text-white/60 text-[10px]" aria-label="Legal links">
                <Link href="/privacy" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-2 before:content-['']">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-amber-400 transition-colors relative before:absolute before:-inset-2 before:content-['']">Terms of Service</Link>
              </nav>

              <p className="text-[10px] text-white/50 max-w-2xl mx-auto leading-relaxed">
                LuckyPickCanada is a digital entertainment experience created for fun and positive moments. It does not provide lottery or gambling services.
              </p>
              <p className="text-[10px] text-white/50">&copy; {new Date().getFullYear()} Lucky Pick Canada. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </body>
    </html>
  );
}
