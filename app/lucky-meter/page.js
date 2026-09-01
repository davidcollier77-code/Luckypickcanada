import LuckyMeterClient from '../lucky-meter-client/LuckyMeterClient';

export const metadata = {
  title: 'Lucky Meter | Lucky Pick Canada',
  description: 'Check your Daily Resonance Ritual and see your luck levels today.',
  alternates: { canonical: '/lucky-meter' },
  openGraph: {
    title: 'Lucky Meter | Lucky Pick Canada',
    description: 'Check your Daily Resonance Ritual and see your luck levels today.',
    url: '/lucky-meter',
    images: [{ url: '/1785347037732.png', width: 1200, height: 630, alt: 'Lucky Pick Canada' }],
  },
  twitter: {
    title: 'Lucky Meter | Lucky Pick Canada',
    description: 'Check your Daily Resonance Ritual and see your luck levels today.',
    images: ['/1785347037732.png'],
  },
};

export default function LuckyMeterPage() {
  return <LuckyMeterClient />;
}
