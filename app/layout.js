export const metadata = {
  title: 'Lucky Pick Canada',
  description: 'Sample Canadian lottery number picks.',
  icons: {
    icon: '/logo.svg?v=brand-logo-20260719',
    shortcut: '/logo.svg?v=brand-logo-20260719',
    apple: '/logo.svg?v=brand-logo-20260719',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
