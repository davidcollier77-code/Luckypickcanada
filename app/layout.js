export const metadata = {
  title: 'Lucky Pick Canada',
  description: 'Sample Canadian lottery number picks.',
  icons: {
    icon: '/lucky-pick-logo.svg',
    shortcut: '/lucky-pick-logo.svg',
    apple: '/lucky-pick-logo.svg',
  },
  openGraph: {
    title: 'Lucky Pick Canada',
    description: '6 Pick and 7 Pick lucky numbers with a Canadian lucky reveal.',
    images: ['/lucky-pick-logo.svg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
