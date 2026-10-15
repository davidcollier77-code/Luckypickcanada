'use client';
import { playButtonClick } from '../../lib/audio';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './CrystalBall.module.css';
import GoldenLeaf from './GoldenLeaf';

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
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const pick = PLACEHOLDER_FORTUNES[randomBuffer[0] % PLACEHOLDER_FORTUNES.length];
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
  luckMeterHref = '/lucky-meter',
  communityMapHref = '/map',
}: CrystalBallProps) {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'revealing' | 'completionPulse'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFortune, setCurrentFortune] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);

  // Progressive reveal state
  const [revealedWordCount, setRevealedWordCount] = useState<number>(0);
  const fortuneWords = currentFortune ? currentFortune.split(' ') : [];
  const hasFinishedRevealing = currentFortune && revealedWordCount >= fortuneWords.length;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ballSceneRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useRef<boolean>(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  // Handle progressive text reveal
  useEffect(() => {
    if (status === 'revealing' && currentFortune) {
      if (revealedWordCount < fortuneWords.length) {
        // Calculate dynamic delay: ~150ms per word, but slightly varied or bounded if desired.
        // For standard reading pace, 100-200ms per word feels natural. Let's use 120ms.
        const delay = prefersReducedMotion.current ? 0 : 120;

        revealTimeoutRef.current = setTimeout(() => {
          setRevealedWordCount(prev => prev + 1);
        }, delay);
      } else {
        // Finished revealing words, trigger completion pulse
        setStatus('completionPulse');
        timeoutRef.current = setTimeout(() => {
          setStatus('idle');
        }, 1500); // 1.5s warm pulse duration
      }
    }
  }, [status, revealedWordCount, currentFortune, fortuneWords.length]);

  const handleSeekFortune = useCallback(async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const trimmed = question.trim();
    if (!trimmed || status === 'loading' || status === 'revealing' || status === 'completionPulse') return;

    // Scroll scene into view if needed
    if (ballSceneRef.current && !prefersReducedMotion.current) {
        const rect = ballSceneRef.current.getBoundingClientRect();
        // If the top of the scene is above viewport or bottom is below, smooth scroll.
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            ballSceneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    setStatus('loading');
    setErrorMessage(null);
    setCurrentFortune(null);
    setRevealedWordCount(0);
    setShowResult(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

    try {
      const answer = await onSeekFortune(trimmed);
      if (!answer || answer.trim() === '') {
        throw new Error('Received an empty fortune.');
      }

      setCurrentFortune(answer);
      setReadings((prev) => [
        { id: crypto.randomUUID(), question: trimmed, answer },
        ...prev,
      ]);
      setQuestion('');

      setStatus('revealing');
      setShowResult(true);

      // If prefers reduced motion, immediately show all text
      if (prefersReducedMotion.current) {
          setRevealedWordCount(answer.split(' ').length);
      }

    } catch (error: unknown) {
      console.error('Failed to fetch fortune:', error);
      setCurrentFortune(null);
      setShowResult(false);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : null);
    }
  }, [question, status, onSeekFortune]);

  const statusHeadline =
    status === 'loading'
      ? 'The mists are stirring…'
      : status === 'error'
        ? errorMessage || 'The connection to the ethereal realm was lost. Please try again.'
        : currentFortune
          ? 'Ask another question…'
          : 'Awaiting your question…';

  const isBusy = status === 'loading' || status === 'revealing' || status === 'completionPulse';

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Crystal Ball</h1>
          <p className={styles.subtitle}>
            Focus on a question, set your intention, and see what the Crystal Ball reveals.
          </p>
        </header>

        <div className={styles.ballScene} ref={ballSceneRef}>
          <div className={styles.ballWrapper}>
            <div
              className={`${styles.ballInnerGlow} ${
                status === 'loading'
                  ? styles.ballInnerGlowLoading
                  : status === 'completionPulse'
                    ? styles.ballInnerGlowPulse
                    : ''
              }`}
              aria-hidden="true"
            />
            <picture className={styles.ballArtwork}>
              <source srcSet="/assets/crystal-ball-pedestal.avif" type="image/avif" />
              <source srcSet="/assets/crystal-ball-pedestal.webp" type="image/webp" />
              <img
                src="/assets/crystal-ball-pedestal.png"
                alt="Canadian crystal ball with a jeweled maple leaf, emerald clover, sapphire pendant, and ornate gold pedestal"
                className={styles.ballImage}
                width={716}
                height={875}
                loading="eager"
                decoding="async"
              />
            </picture>
            <div className={styles.plaqueOverlay}>
              <span className={styles.plaque}>LUCKYPICKCANADA.CA</span>
            </div>
          </div>

          {showResult && currentFortune && (
            <div className={styles.fortunePanel} aria-live="polite">
              {/* Screen reader only full text */}
              <p className="sr-only">{currentFortune}</p>

              {/* Visible animated text */}
              <div className={styles.fortuneTextResult} aria-hidden="true">
                {/* The Golden Leaf Guide */}
                {!prefersReducedMotion.current && status === 'revealing' && (
                   <GoldenLeaf className={styles.goldenLeafGuide} />
                )}

                {fortuneWords.map((word, i) => (
                  <span
                    key={i}
                    className={`${styles.fortuneWord} ${i < revealedWordCount ? styles.fortuneWordVisible : ''}`}
                  >
                    {word}{' '}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className={styles.card} aria-live="polite">
          <p className={styles.cardStatus}>{statusHeadline}</p>

          {!showResult && !currentFortune && (
            <p className={styles.cardHint}>
              Focus your intent and ask the mists a question to reveal your fortune.
            </p>
          )}

          <label htmlFor="crystal-ball-question" className="sr-only">
            Your question for the crystal ball
          </label>
          <textarea
            id="crystal-ball-question"
            className={styles.input}
            placeholder="What’s on your mind?"
            rows={2}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={isBusy}
          />

          <button
            type="button"
            className={`${styles.seekButton} inline-flex items-center justify-center`}
            onClick={() => {
              playButtonClick();
              void handleSeekFortune();
            }}
            disabled={isBusy || !question.trim()}
            aria-disabled={isBusy || !question.trim()}
          >
            {status === 'loading' ? (
              <>
                <svg
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none -ml-1 mr-2 h-4 w-4 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Consulting the Mists…
              </>
            ) : (
              'Seek Fortune'
            )}
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
