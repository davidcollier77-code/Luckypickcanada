export const metadata = {
  title: 'LuckyPickCanada – Discover Your Luck with Free Luck Meter, Lucky Picks & Gifts 🍀',
  description: 'Sample Canadian lottery number picks.',
  icons: {
    icon: '/file_00000000e8b8722f909e901d9b84325d.png',
    shortcut: '/file_00000000e8b8722f909e901d9b84325d.png',
    apple: '/file_00000000e8b8722f909e901d9b84325d.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
