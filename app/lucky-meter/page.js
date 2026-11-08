import LuckyMeterClient from '../lucky-meter-client/LuckyMeterClient';

export const metadata = {
  title: 'Luck Generator | Lucky Pick Canada',
  description: 'Awaken your Daily Resonance with Lucky Pick Canada. Check your Luck Generator and reveal your unique digital energy reading.',
  alternates: { canonical: '/lucky-meter' },
  openGraph: {
    title: 'Luck Generator | Lucky Pick Canada',
    description: 'Awaken your Daily Resonance with Lucky Pick Canada. Check your Luck Generator and reveal your unique digital energy reading.',
    url: '/lucky-meter',
    images: [{ url: '/luckypickcanada-share-1200x630.jpg', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Luck Generator | Lucky Pick Canada',
    description: 'Awaken your Daily Resonance with Lucky Pick Canada. Check your Luck Generator and reveal your unique digital energy reading.',
    images: ['/luckypickcanada-share-1200x630.jpg'],
  },
};

export default function LuckyMeterPage() {
  return <LuckyMeterClient />;
}
