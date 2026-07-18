export const metadata = {
  title: 'Lucky Pick Canada',
  description: 'Sample Canadian lottery number picks.',
  icons: {
    icon: '/logo.svg?v=maple-clover-20260718',
    shortcut: '/logo.svg?v=maple-clover-20260718',
    apple: '/logo.svg?v=maple-clover-20260718',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
