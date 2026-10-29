'use client';
import { playButtonClick, preloadCrystalBallAudio, playCrystalBallEnergy, stopCrystalBallEnergy, playCrystalBallReveal, playCrystalBallLeaf } from '../../lib/audio';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import styles from './CrystalBall.module.css';
import GoldenLeaf from './GoldenLeaf';

type Reading = {
  id: string;
  question: string;
  answer: string;
};

type LeafFlight = { fromX: number; fromY: number; dx: number; dy: number };
type DailyQuota = { limit: number; remaining: number; resetAt: string } | null;

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours + ':' + minutes + ':' + seconds;
}

function DailyQuotaCountdown({ resetAt }: { resetAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (now === null) return null;

  return (
    <p className={styles.dailyQuotaCountdown} aria-label="Time until daily allowance resets">
      Allowance resets in {formatCountdown(Date.parse(resetAt) - now)}
    </p>
  );
}

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
  dailyQuota?: DailyQuota;
}

export default function CrystalBall({
  onSeekFortune = defaultFortuneGenerator,
  backHref = '/',
  luckMeterHref = '/lucky-meter',
  communityMapHref = '/map',
  dailyQuota = null,
}: CrystalBallProps) {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'preRevealPulse' | 'leafFalling' | 'error' | 'revealing' | 'completionPulse'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFortune, setCurrentFortune] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);

  // Progressive reveal state
  const [revealedCharCount, setRevealedCharCount] = useState<number>(0);
  const [isRevealPaused, setIsRevealPaused] = useState(false);
  const [leafFlight, setLeafFlight] = useState<LeafFlight | null>(null);
  const fortuneChars = useMemo(() => currentFortune ? Array.from(currentFortune) : [], [currentFortune]);

  const words = useMemo(() => {
    const wordsArray: { char: string; index: number }[][] = [];
    let currentWord: { char: string; index: number }[] = [];
    for (let i = 0; i < fortuneChars.length; i++) {
      const char = fortuneChars[i];
      const character = { char, index: i };

      if (char === '\n') {
        if (currentWord.length > 0) wordsArray.push(currentWord);
        currentWord = [];
        wordsArray.push([character]);
        continue;
      }

      currentWord.push(character);
      if (char === ' ') {
        wordsArray.push(currentWord);
        currentWord = [];
      }
    }
    if (currentWord.length > 0) wordsArray.push(currentWord);
    return wordsArray;
  }, [fortuneChars]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ballSceneRef = useRef<HTMLDivElement>(null);
  const ballImageRef = useRef<HTMLImageElement>(null);
  const fortunePanelRef = useRef<HTMLDivElement>(null);
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leafFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    void preloadCrystalBallAudio();
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(motionQuery.matches);
    motionQuery.addEventListener('change', handleMotionPreferenceChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionPreferenceChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
      if (leafFallbackTimeoutRef.current) clearTimeout(leafFallbackTimeoutRef.current);
      stopCrystalBallEnergy();
    };
  }, []);

  // Handle progressive text reveal
  useEffect(() => {
    if (status === 'revealing' && currentFortune && !isRevealPaused) {
      if (revealedCharCount < fortuneChars.length) {
        let delay = prefersReducedMotion ? 0 : 20; // Base 20ms per char

        if (!prefersReducedMotion) {
            const nextChar = fortuneChars[revealedCharCount];
            // Add natural pauses for punctuation
            if (/[.,!?:;]/.test(nextChar)) {
                delay = 125;
            } else if (nextChar === ' ') {
                delay = 30;
            }
        }

        revealTimeoutRef.current = setTimeout(() => {
          setRevealedCharCount(prev => prev + 1);
        }, delay);
      } else {
        // Finished revealing chars, trigger completion pulse
        setStatus('completionPulse');
        timeoutRef.current = setTimeout(() => {
          setStatus('idle');
        }, 1500); // 1.5s warm pulse duration
      }
    }
  }, [status, revealedCharCount, currentFortune, fortuneChars, isRevealPaused, prefersReducedMotion]);

  useEffect(() => {
    if (status !== 'preRevealPulse' || !showResult || !currentFortune || prefersReducedMotion) return;

    const phaseTimeout = setTimeout(() => {
      const image = ballImageRef.current;
      const panel = fortunePanelRef.current;
      if (!image || !panel) {
        setLeafFlight(null);
        setStatus('revealing');
        setIsRevealPaused(false);
        return;
      }

      const imageRect = image.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      // Position a separate leaf over a decorative leaf detail; the source artwork stays untouched.
      const fromX = imageRect.left + imageRect.width * 0.46;
      const fromY = imageRect.top + imageRect.height * 0.39;
      const toX = panelRect.left + panelRect.width * 0.5;
      const toY = panelRect.top + Math.min(34, panelRect.height * 0.3);

      setLeafFlight({ fromX, fromY, dx: toX - fromX, dy: toY - fromY });
      playCrystalBallLeaf();
      setStatus('leafFalling');
    }, 700);

    phaseTimeoutRef.current = phaseTimeout;
    return () => {
      clearTimeout(phaseTimeout);
      if (phaseTimeoutRef.current === phaseTimeout) phaseTimeoutRef.current = null;
    };
  }, [status, showResult, currentFortune]);

  // Recover if an interrupted/throttled CSS animation never emits animationend.
  useEffect(() => {
    if (status !== 'leafFalling' || !leafFlight) return;

    const fallbackTimeout = setTimeout(() => {
      leafFallbackTimeoutRef.current = null;
      setLeafFlight(null);
      setStatus('revealing');
      setIsRevealPaused(false);
    }, 1200);

    leafFallbackTimeoutRef.current = fallbackTimeout;
    return () => {
      clearTimeout(fallbackTimeout);
      if (leafFallbackTimeoutRef.current === fallbackTimeout) leafFallbackTimeoutRef.current = null;
    };
  }, [status, leafFlight]);

  // If reduced motion is enabled or changed mid-session, finish the visible reveal immediately.
  useEffect(() => {
    if (!prefersReducedMotion || !currentFortune) return;
    if (status !== 'preRevealPulse' && status !== 'leafFalling' && status !== 'revealing') return;

    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    if (leafFallbackTimeoutRef.current) clearTimeout(leafFallbackTimeoutRef.current);
    setLeafFlight(null);
    setIsRevealPaused(false);
    setRevealedCharCount(Array.from(currentFortune).length);
    if (status !== 'revealing') setStatus('revealing');
  }, [prefersReducedMotion, status, currentFortune]);

  const handleSeekFortune = useCallback(async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const trimmed = question.trim();
    if (!trimmed || status === 'loading' || status === 'preRevealPulse' || status === 'leafFalling' || status === 'revealing' || status === 'completionPulse') return;

    // Scroll scene into view immediately so it starts while loading
    if (ballSceneRef.current && !prefersReducedMotion) {
        ballSceneRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setStatus('loading');
    setErrorMessage(null);
    setCurrentFortune(null);
    setRevealedCharCount(0);
    setIsRevealPaused(true);
    setShowResult(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

    try {
      const answer = await onSeekFortune(trimmed);
      stopCrystalBallEnergy();
      if (!answer || answer.trim() === '') {
        throw new Error('Received an empty fortune.');
      }
      playCrystalBallReveal();

      // Strip basic Markdown emphasis markers from the fortune output
      const normalizedAnswer = answer.replace(/[*_]{1,2}/g, '');

      setCurrentFortune(normalizedAnswer);
      setReadings((prev) => [
        { id: crypto.randomUUID(), question: trimmed, answer },
        ...prev,
      ]);
      setQuestion('');
      setShowResult(true);
      setRevealedCharCount(0);
      setLeafFlight(null);

      if (prefersReducedMotion) {
        setStatus('revealing');
        setIsRevealPaused(false);
        setRevealedCharCount(Array.from(normalizedAnswer).length);
      } else {
        // Flash first, then let a separate leaf clone fall before typing begins.
        setIsRevealPaused(true);
        setStatus('preRevealPulse');
      }

    } catch (error: unknown) {
      stopCrystalBallEnergy();
      console.error('Failed to fetch fortune:', error);
      setCurrentFortune(null);
      setShowResult(false);
      setLeafFlight(null);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : null);
    }
  }, [question, status, onSeekFortune, prefersReducedMotion]);

  const statusHeadline =
    status === 'loading' || status === 'preRevealPulse' || status === 'leafFalling'
      ? 'The mists are stirring…'
      : status === 'error'
        ? errorMessage || 'The connection to the ethereal realm was lost. Please try again.'
        : currentFortune
          ? 'Ask another question…'
          : 'Awaiting your question…';

  const isBusy = status === 'loading' || status === 'preRevealPulse' || status === 'leafFalling' || status === 'revealing' || status === 'completionPulse';

  return (
    <div className={styles.page}>
      {leafFlight && (
        <div
          aria-hidden="true"
          className={styles.fallingLeafFlight}
          style={{
            left: leafFlight.fromX,
            top: leafFlight.fromY,
            '--leaf-dx': `${leafFlight.dx}px`,
            '--leaf-dy': `${leafFlight.dy}px`,
            '--leaf-mid-x': `${leafFlight.dx * 0.55}px`,
            '--leaf-mid-y': `${leafFlight.dy * 0.55}px`,
          } as CSSProperties}
          onAnimationEnd={() => {
            if (status !== 'leafFalling') return;
            if (leafFallbackTimeoutRef.current) clearTimeout(leafFallbackTimeoutRef.current);
            leafFallbackTimeoutRef.current = null;
            setLeafFlight(null);
            setStatus('revealing');
            setIsRevealPaused(false);
          }}
        >
          <GoldenLeaf className={styles.fallingLeafArtwork} />
        </div>
      )}
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
                (status === 'loading' || status === 'revealing')
                  ? styles.ballInnerGlowLoading
                  : status === 'preRevealPulse'
                    ? styles.ballInnerGlowPreRevealPulse
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
                ref={ballImageRef}
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
            <div ref={fortunePanelRef} className={styles.fortunePanel} aria-live="polite">
              {/* Screen reader only full text */}
              <p className="sr-only">{currentFortune}</p>

              {/* Visible animated text */}
              <div className={styles.fortuneTextResult} aria-hidden="true">
                {words.map((wordObj, wordIndex) => (
                  wordObj.length === 1 && wordObj[0].char === '\n' ? (
                    <br key={`br-${wordIndex}`} />
                  ) : (
                  <span key={`word-${wordIndex}`} className={styles.fortuneWordWrapper}>
                    {wordObj.map(({ char, index: i }) => {
                      const isVisible = i < revealedCharCount;
                      const isCurrent = i === revealedCharCount - 1;
                      const displayChar = char === ' ' ? '\u00A0' : char;
                      return (
                        <span
                          key={`char-${i}`}
                          className={`${styles.fortuneChar} ${isVisible ? styles.fortuneCharVisible : ''}`}
                        >
                          {displayChar}
                          {isCurrent && status === 'revealing' && !prefersReducedMotion && (
                            <span className={styles.leafCursorWrapper}>
                              <GoldenLeaf className={styles.goldenLeafCursor} />
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </span>
                  )
                ))}
                {/* Fallback cursor at the very beginning before first char is typed */}
                {revealedCharCount === 0 && status === 'revealing' && !prefersReducedMotion && !isRevealPaused && (
                   <span className={styles.leafCursorWrapper}>
                     <GoldenLeaf className={styles.goldenLeafCursor} />
                   </span>
                )}
              </div>
            </div>
          )}

        </div>

        <section className={styles.card}>
          <p className={styles.cardStatus}>{statusHeadline}</p>
          {(!showResult || !currentFortune) && (
            <>
              {dailyQuota && (
                <p className={styles.dailyQuota} role="status" aria-live="polite">
                  {dailyQuota.remaining > 0
                    ? `${dailyQuota.remaining} of ${dailyQuota.limit} questions remaining today`
                    : `You’ve used all ${dailyQuota.limit} questions for today. Come back after the daily reset.`}
                </p>
              )}
              {dailyQuota && <DailyQuotaCountdown resetAt={dailyQuota.resetAt} />}

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
                  playCrystalBallEnergy();
                  void handleSeekFortune();
                }}
                disabled={isBusy || question.trim() === "" || dailyQuota?.remaining === 0}
                aria-disabled={undefined}
              >
                {isBusy ? (
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
                    {status === 'loading'
                      ? 'Consulting the Mists…'
                      : status === 'preRevealPulse'
                        ? 'Gathering Energy…'
                        : status === 'leafFalling'
                          ? 'Guiding the Leaf…'
                          : 'Revealing Fortune…'}
                  </>
                ) : (
                  'Seek Fortune'
                )}
              </button>
            </>
          )}

          {showResult && currentFortune && status === 'idle' && (
            <div className={`mt-4 flex flex-col items-center animate-in fade-in duration-500`}>
              {dailyQuota && (
                <p className={`${styles.dailyQuota} mb-4 text-center`} role="status" aria-live="polite">
                  {dailyQuota.remaining > 0
                    ? `${dailyQuota.remaining} of ${dailyQuota.limit} questions remaining today`
                    : `You’ve used all ${dailyQuota.limit} questions for today. Come back after the daily reset.`}
                </p>
              )}
              <button
                type="button"
                className={`${styles.seekButton} inline-flex items-center justify-center`}
                onClick={() => {
                  playButtonClick();
                  setShowResult(false);
                  setCurrentFortune(null);
                  setQuestion('');
                  setStatus('idle');
                }}
              >
                Ask Another Question
              </button>
            </div>
          )}
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
