import LuckyMeterClient from '../lucky-meter-client/LuckyMeterClient';

export const metadata = {
  title: 'Lucky Meter | Lucky Pick Canada',
  description: 'Check your Daily Resonance Ritual and see your luck levels today.',
  alternates: { canonical: '/lucky-meter' },
  openGraph: {
    title: 'Lucky Meter | Lucky Pick Canada',
    description: 'Check your Daily Resonance Ritual and see your luck levels today.',
    url: '/lucky-meter',
  },
  twitter: {
    title: 'Lucky Meter | Lucky Pick Canada',
    description: 'Check your Daily Resonance Ritual and see your luck levels today.',
  },
};

export default function LuckyMeterPage() {
  return <LuckyMeterClient />;
}
