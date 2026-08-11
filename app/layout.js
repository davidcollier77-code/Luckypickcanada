import './globals.css';

const siteUrl = 'https://luckypickcanada.ca';
const socialImage = '/1785347037732.png';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lucky Pick Canada - Daily Luck & Random Pick Generator",
  description: "Discover your daily lucky picks, random numbers, and custom digital card reveals at Lucky Pick Canada. Try your luck today!",
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
    url: 'https://luckypickcanada.ca/',
    siteName: "Lucky Pick Canada",
    title: "Lucky Pick Canada - Daily Luck Generator",
    description: "Discover your daily lucky picks, random numbers, and custom card reveals at Lucky Pick Canada.",
    images: [{ url: 'https://luckypickcanada.ca/og-image.jpg', width: 1200, height: 630, alt: 'Lucky Pick Canada - Daily Luck Generator' }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Pick Canada - Daily Luck Generator",
    description: "Discover your daily lucky picks, random numbers, and custom card reveals at Lucky Pick Canada.",
    images: ['https://luckypickcanada.ca/og-image.jpg'],
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
    <html lang="en-CA">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preload" href="/1785347037732.png" as="image" fetchPriority="high" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://luckypickcanada.ca/#website",
                  "url": "https://luckypickcanada.ca/",
                  "name": "Lucky Pick Canada",
                  "description": "Experience custom digital card reveals and random number generation with Lucky Pick Canada.",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Lucky Pick Canada",
                    "logo": {
                      "@type": "ImageObject",
                      "url": "https://luckypickcanada.ca/logo.png"
                    },
                    "sameAs": [
                      "https://www.facebook.com/yourpage",
                      "https://www.instagram.com/yourprofile",
                      "https://twitter.com/yourhandle"
                    ]
                  }
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://luckypickcanada.ca/#webapp",
                  "name": "Lucky Pick Canada Generator",
                  "url": "https://luckypickcanada.ca/",
                  "applicationCategory": "EntertainmentApplication",
                  "operatingSystem": "All",
                  "browserRequirements": "Requires JavaScript",
                  "description": "Interactive digital card draws, premium tier reveals, and luck-themed entertainment.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "CAD"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
