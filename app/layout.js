export const metadata = {
  title: 'Lucky Pick Canada',
  description: 'Sample Canadian lottery number picks.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
