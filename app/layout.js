import './globals.css';

export const metadata = {
  metadataBase: new URL('https://luckypickcanada.ca'),
  title: 'LuckyPickCanada | Stories, Lucky Meter & Picks',
  description: 'Discover your luck with LuckyPickCanada 🍀 Enjoy a fun Lucky Meter, personalized lucky picks, lucky cards, and community stories — just for fun.',
  keywords: [
    'luckypickcanada',
    'lucky stories',
    'lucky meter',
    'lucky picks',
    'fun number picks',
    'canada luck',
    'lucky card',
    'lucky day',
    'lucky color',
    'lucky community',
    'share your luck',
    'canada stories',
    'story map',
    'lucky gifts',
    'lucky reveal',
    'entertainment only',
    'personalized picks',
    'maple leaf',
    'canadian luck',
  ],
  alternates: {
    canonical: '/',
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/BackgroundEraser_20260724_163638777.png', type: 'image/png' }],
    shortcut: '/BackgroundEraser_20260724_163638777.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
