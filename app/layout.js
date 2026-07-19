export const metadata = {
  title: 'LuckyPickCanada – Discover Your Luck with Free Luck Meter, Lucky Picks & Gifts you can send your friends 🍀',
  description: '🍀 Discover your luck with LuckyPickCanada! Try the FREE Luck Meter, explore personalized Lucky Picks, send fun digital lucky gifts, and join a growing community that believes everyone could use a little extra luck. Just for fun and entertainment.',
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
