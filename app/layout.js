import "./globals.css";

export const metadata = {
  title: "Lucky Pick Canada | Your Daily Luck & Random Pick Generator",
  description: "Discover your daily picks, test your luck, and generate random lucky numbers instantly at Lucky Pick Canada.",
  metadataBase: new URL("https://luckypickcanada.ca"),
  openGraph: {
    title: "Lucky Pick Canada | Your Daily Luck & Pick Generator",
    description: "Discover your daily picks, test your luck, and generate random lucky numbers instantly at Lucky Pick Canada.",
    url: "https://luckypickcanada.ca",
    siteName: "Lucky Pick Canada",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Pick Canada | Your Daily Luck & Pick Generator",
    description: "Discover your daily picks, test your luck, and generate random lucky numbers instantly at Lucky Pick Canada.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
