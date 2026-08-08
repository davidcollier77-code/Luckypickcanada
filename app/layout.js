import './globals.css';
import '../themes/default/index.css';

const siteUrl = 'https://luckypickcanada.ca';
const siteTitle = 'LuckyPickCanada | Stories, Lucky Meter & Picks';
const siteDescription = 'Discover your luck with LuckyPickCanada. Enjoy a fun Lucky Meter, personalized lucky picks, lucky cards, and community stories — just for fun.';
const socialImage = '/1785347037732.png';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  keywords: [
    'luckypickcanada', 'lucky stories', 'lucky meter', 'lucky picks', 'fun number picks',
    'canada luck', 'lucky card', 'lucky day', 'lucky color', 'lucky community',
    'share your luck', 'canada stories', 'story map', 'lucky gifts', 'lucky reveal',
    'entertainment only', 'personalized picks', 'maple leaf', 'canadian luck',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: '/',
    siteName: 'LuckyPickCanada',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: socialImage, width: 1407, height: 768, alt: 'LuckyPickCanada hero artwork' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [socialImage],
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
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preload" href="/1785347037732.png" as="image" fetchPriority="high" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
