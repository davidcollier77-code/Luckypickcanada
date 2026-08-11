import './globals.css';

const siteUrl = 'https://luckypickcanada.ca';
const socialImage = '/1785347037732.png';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lucky Pick Canada | Digital Random Generator & Card Reveals",
  description: "Experience the thrill of true randomness with Lucky Pick Canada. Draw digital cards, settle wagers, and unlock premium luck-themed reveals coast to coast.",
  keywords: [
    'luckypickcanada', 'lucky stories', 'lucky meter', 'lucky picks', 'fun number picks',
    'canada luck', 'lucky card', 'lucky day', 'lucky color', 'lucky community',
    'share your luck', 'canada stories', 'story map', 'lucky gifts', 'lucky reveal',
    'entertainment only', 'personalized picks', 'maple leaf', 'canadian luck',
  ],
  alternates: { canonical: 'https://luckypickcanada.ca/' },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://luckypickcanada.ca',
    siteName: "Lucky Pick Canada",
    title: "Lucky Pick Canada | Digital Random Generator & Card Reveals",
    description: "Experience the thrill of true randomness with Lucky Pick Canada. Draw digital cards, settle wagers, and unlock premium luck-themed reveals coast to coast.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Pick Canada | Digital Random Generator & Card Reveals",
    description: "Experience the thrill of true randomness with Lucky Pick Canada. Draw digital cards, settle wagers, and unlock premium luck-themed reveals coast to coast.",
  },
  robots: { index: true, follow: true },
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/BackgroundEraser_20260724_163638777.png', type: 'image/png' }],
    shortcut: '/BackgroundEraser_20260724_163638777.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }) {
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

  return (
    <html lang="en-CA">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preload" href="/1785347037732.png" as="image" fetchPriority="high" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Lucky Pick Canada',
              url: 'https://luckypickcanada.ca',
              description: 'Interactive tier-based pick platform in Canada.',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
