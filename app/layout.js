export const metadata = {
  title: 'Lucky Pick Canada',
  description: 'Sample Canadian lottery number picks.',
  icons: {
    icon: '/logo-maple-clover-20260719.svg',
    shortcut: '/logo-maple-clover-20260719.svg',
    apple: '/logo-maple-clover-20260719.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
