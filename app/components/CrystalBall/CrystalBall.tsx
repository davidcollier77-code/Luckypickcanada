'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Cinzel, Space_Grotesk, Cormorant_Garamond } from 'next/font/google';
import styles from './CrystalBall.module.css';
import MapleLeafLogo from './MapleLeafLogo';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

type Reading = {
  id: string;
  question: string;
  answer: string;
};

const PLACEHOLDER_FORTUNES = [
  'The northern lights stir within the glass, reflecting quiet possibility. Trust your instincts today, for the currents of fortune are aligning in your favor.',
  'A path once uncertain begins to clear. What you have been waiting for is closer than the mist lets on.',
  'The mists show patience rewarded. Hold steady — the answer you seek arrives on its own schedule, not yours.',
];

async function defaultFortuneGenerator(question: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const pick = PLACEHOLDER_FORTUNES[Math.floor(Math.random() * PLACEHOLDER_FORTUNES.length)];
  return question.trim() ? pick : 'Ask the mists a question first.';
}

export interface CrystalBallProps {
  onSeekFortune?: (question: string) => Promise<string>;
  backHref?: string;
  luckMeterHref?: string;
  communityMapHref?: string;
}

export default function CrystalBall({
  onSeekFortune = defaultFortuneGenerator,
  backHref = '/',
  luckMeterHref = '/luck-meter',
  communityMapHref = '/community-map',
}: CrystalBallProps) {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [currentFortune, setCurrentFortune] = useState<string | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);

  const handleSeekFortune = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || status === 'loading') return;

    setStatus('loading');
    try {
      const answer = await onSeekFortune(trimmed);
      setCurrentFortune(answer);
      setReadings((prev) => [
        { id: `${Date.now()}-${prev.length}-${Math.random().toString(36).substring(2, 9)}`, question: trimmed, answer },
        ...prev,
      ]);
      setQuestion('');
      setStatus('idle');
    } catch (error) {
      console.error('Failed to fetch fortune:', error);
      setCurrentFortune(null);
      setStatus('error');
    }
  }, [question, status, onSeekFortune]);

  const statusHeadline =
    status === 'loading'
      ? 'The mists are stirring…'
      : status === 'error'
        ? 'The connection to the ethereal realm was lost. Please try again.'
        : currentFortune
          ? 'Your fortune has been revealed.'
          : 'Awaiting your question…';

  return (
    <div className={`${styles.page} ${cinzel.variable} ${spaceGrotesk.variable} ${cormorant.variable}`}>
      <div className={styles.aurora} aria-hidden="true">
        <div className={styles.stars} />
        <div className={`${styles.auroraBlob} ${styles.auroraBlob1}`} />
        <div className={`${styles.auroraBlob} ${styles.auroraBlob2}`} />
        <div className={`${styles.auroraBlob} ${styles.auroraBlob3}`} />
      </div>

      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Crystal Ball</h1>
          <p className={styles.subtitle}>
            The northern sky shifts with quiet possibilities tonight. Bring your question to the
            mist and see what luck has in store for you.
          </p>
        </header>

        <div className={styles.ballScene}>
          <div className={styles.ballWrapper}>
            <div className={styles.ball}>
              <div className={styles.ballInnerGlow} />
              <div className={styles.ballSpecular} />
              <div className={styles.ballSpecularSmall} />
              <div className={styles.logoRing}>
                <MapleLeafLogo className={styles.logo} />
              </div>
            </div>
          </div>
          <div className={styles.pedestalGlow} />
          <div className={styles.pedestalTop} />
          <div className={styles.pedestalBase}>
            <span className={styles.plaque}>LUCKYPICKCANADA.CA</span>
          </div>
        </div>

        <section className={styles.card} aria-live="polite">
          <p className={styles.cardStatus}>{statusHeadline}</p>

          {currentFortune ? (
            <p className={styles.fortuneText}>{currentFortune}</p>
          ) : (
            <p className={styles.cardHint}>
              Focus your intent and ask the mists a question to reveal your fortune.
            </p>
          )}

          <textarea
            className={styles.input}
            placeholder="Ask the mists…"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={status === 'loading'}
          />

          <button
            type="button"
            className={styles.seekButton}
            onClick={handleSeekFortune}
            disabled={status === 'loading' || !question.trim()}
          >
            {status === 'loading' ? 'Consulting the Mists…' : 'Seek Fortune'}
          </button>
        </section>

        {readings.length > 0 && (
          <section className={styles.readings}>
            <h2 className={styles.readingsTitle}>Session Readings</h2>
            <ul className={styles.readingsList}>
              {readings.map((reading) => (
                <li key={reading.id} className={styles.readingItem}>
                  <p className={styles.readingQ}>Q: {reading.question}</p>
                  <p className={styles.readingA}>{reading.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className={styles.nav} aria-label="Crystal Ball navigation">
          <Link href={backHref} className={styles.navButton}>
            Back to Home
          </Link>
          <Link href={luckMeterHref} className={styles.navButton}>
            Luck Meter
          </Link>
          <Link href={communityMapHref} className={styles.navButton}>
            Community Map
          </Link>
        </nav>
      </main>
    </div>
  );
}
