import './globals.css';

const siteUrl = 'https://luckypickcanada.ca';
const socialImage = '/1785347037732.png';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lucky Pick Canada | Your Daily Luck & Random Pick Generator",
  description: "Discover your daily picks, test your luck, and generate random lucky numbers instantly at Lucky Pick Canada.",
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
    url: 'https://luckypickcanada.ca',
    siteName: "Lucky Pick Canada",
    title: "Lucky Pick Canada | Your Daily Luck & Pick Generator",
    description: "Discover your daily picks, test your luck, and generate random lucky numbers instantly at Lucky Pick Canada.",
    images: [{ url: socialImage, width: 1407, height: 768, alt: 'LuckyPickCanada hero artwork' }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Pick Canada | Your Daily Luck & Pick Generator",
    description: "Discover your daily picks, test your luck, and generate random lucky numbers instantly at Lucky Pick Canada.",
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preload" href="/1785347037732.png" as="image" fetchPriority="high" />
      </head>
      <body>{children}</body>
    </html>
  );
}
