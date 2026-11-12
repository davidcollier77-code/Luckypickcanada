'use client';
import { playButtonClick, preloadCrystalBallAudio, playCrystalBallEnergy, stopCrystalBallEnergy, playCrystalBallReveal, playCrystalBallLeaf } from '../../lib/audio';

import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import styles from './CrystalBall.module.css';
import GoldenLeaf from './GoldenLeaf';
import { useDailyResetCountdown } from '../../../components/daily-reset-countdown';
import { composeGreeting, readDailyGreeting } from '../../crystal-ball-client/greetings';
import { getLocalMoment } from '../../lib/local-time';

type Status =
  | 'idle'
  | 'loading'
  | 'preRevealPulse'
  | 'leafFalling'
  | 'error'
  | 'revealing'
  | 'completionPulse';

type FollowUpStatus = 'idle' | 'loading' | 'error' | 'done';

type LeafFlight = { fromX: number; fromY: number; dx: number; dy: number };

const PLACEHOLDER_FORTUNES = [
  'The northern lights stir within the glass, reflecting quiet possibility. Trust your instincts today, for the currents of fortune are aligning in your favour.',
  'A path once uncertain begins to clear. What you have been waiting for is closer than the mist lets on.',
  'The mists show patience rewarded. Hold steady — the answer you seek arrives on its own schedule, not yours.',
];

const GREETING_CHAR_DELAY_MS = 32;
const FOLLOW_UP_ANSWER_CHAR_DELAY_MS = 26;

type CharacterInfo = { char: string; index: number };
type WordInfo = { chars: CharacterInfo[]; startIndex: number };

function buildReadingWords(chars: CharacterInfo[]): WordInfo[] {
  const wordsArray: WordInfo[] = [];
  let currentWord: CharacterInfo[] = [];
  let currentStart = 0;

  for (let i = 0; i < chars.length; i++) {
    const character = chars[i];

    if (character.char === '\n') {
      if (currentWord.length > 0) wordsArray.push({ chars: currentWord, startIndex: currentStart });
      currentWord = [];
      wordsArray.push({ chars: [character], startIndex: i });
      currentStart = i + 1;
      continue;
    }

    if (currentWord.length === 0) currentStart = i;
    currentWord.push(character);
    if (character.char === ' ') {
      wordsArray.push({ chars: currentWord, startIndex: currentStart });
      currentWord = [];
      currentStart = i + 1;
    }
  }

  if (currentWord.length > 0) wordsArray.push({ chars: currentWord, startIndex: currentStart });
  return wordsArray;
}

// A typing tick only changes the word that gained a character, so memoizing the
// words keeps the rest of the reading out of the render. The visible animation
// is unchanged: each character still fades and lifts into place.
const ReadingWord = memo(function ReadingWord({
  chars,
  startIndex,
  visibleChars,
  hasCursor,
}: {
  chars: CharacterInfo[];
  startIndex: number;
  visibleChars: number;
  hasCursor: boolean;
}) {
  return (
    <span className={styles.fortuneWordWrapper}>
      {chars.map(({ char, index }) => {
        const isVisible = index - startIndex < visibleChars;
        return (
          <span
            key={`char-${index}`}
            className={`${styles.fortuneChar} ${isVisible ? styles.fortuneCharVisible : ''}`}
          >
            {char === ' ' ? '\u00A0' : char}
            {hasCursor && index === startIndex + visibleChars - 1 && (
              <span className={styles.leafCursorWrapper}>
                <GoldenLeaf className={styles.goldenLeafCursor} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
});

const ReadingText = memo(function ReadingText({
  text,
  revealedCount,
  showCursor,
  className,
}: {
  text: string;
  revealedCount: number;
  showCursor: boolean;
  className: string;
}) {
  const chars = useMemo(
    () => Array.from(text, (char, index) => ({ char, index })),
    [text],
  );
  const words = useMemo(() => buildReadingWords(chars), [chars]);
  const cursorIndex = showCursor ? revealedCount - 1 : -1;

  return (
    <div className={className} aria-hidden="true">
      {words.map((word, wordIndex) =>
        word.chars.length === 1 && word.chars[0].char === '\n' ? (
          <br key={`br-${wordIndex}`} />
        ) : (
          <ReadingWord
            key={`word-${wordIndex}`}
            chars={word.chars}
            startIndex={word.startIndex}
            visibleChars={Math.min(Math.max(revealedCount - word.startIndex, 0), word.chars.length)}
            hasCursor={
              cursorIndex >= word.startIndex &&
              cursorIndex < word.startIndex + word.chars.length
            }
          />
        ),
      )}
      {revealedCount === 0 && showCursor && (
        <span className={styles.leafCursorWrapper}>
          <GoldenLeaf className={styles.goldenLeafCursor} />
        </span>
      )}
    </div>
  );
});

async function defaultFortuneGenerator(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return PLACEHOLDER_FORTUNES[randomBuffer[0] % PLACEHOLDER_FORTUNES.length];
}

async function defaultFollowUpGenerator(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return 'The mists lean closer: the answer you are looking for is already forming in the small choices you make today.';
}

export interface CrystalBallProps {
  onGenerateFortune?: () => Promise<string>;
  onAskFollowUp?: (question: string) => Promise<string>;
  initialFortune?: string | null;
  initialFollowUp?: { question: string; answer: string } | null;
  fortuneUsed?: boolean;
  followUpUsed?: boolean;
  backHref?: string;
  luckMeterHref?: string;
  communityMapHref?: string;
}

export default function CrystalBall({
  onGenerateFortune = defaultFortuneGenerator,
  onAskFollowUp = defaultFollowUpGenerator,
  initialFortune = null,
  initialFollowUp = null,
  fortuneUsed = false,
  followUpUsed = false,
  backHref = '/',
  luckMeterHref = '/lucky-meter',
  communityMapHref = '/map',
}: CrystalBallProps) {
  const { ready: resetReady, formatted: resetCountdown, dateKey, now } =
    useDailyResetCountdown();

  const [dailyGreeting, setDailyGreeting] = useState('');
  const [greetingCharCount, setGreetingCharCount] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFortune, setCurrentFortune] = useState<string | null>(initialFortune);
  const [showResult, setShowResult] = useState(Boolean(initialFortune));
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(
    initialFollowUp?.answer || null,
  );
  const [savedFollowUpQuestion, setSavedFollowUpQuestion] = useState(
    initialFollowUp?.question || '',
  );
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>(
    initialFollowUp?.answer ? 'done' : 'idle',
  );
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpPanelOpen, setFollowUpPanelOpen] = useState(false);
  const [answerRevealedCount, setAnswerRevealedCount] = useState<number>(
    initialFollowUp?.answer ? Array.from(initialFollowUp.answer).length : 0,
  );
  const answerShouldTypeRef = useRef(false);
  const followUpTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Progressive reveal state
  const [revealedCharCount, setRevealedCharCount] = useState<number>(
    initialFortune ? Array.from(initialFortune).length : 0,
  );
  const [isRevealPaused, setIsRevealPaused] = useState(false);
  const [leafFlight, setLeafFlight] = useState<LeafFlight | null>(null);

  // The daily personality is chosen once per local day, then combined with the
  // salutation for the current local period. The shared one-second clock lets
  // the greeting change at a period boundary without a reload.
  useEffect(() => {
    if (!dateKey) return;
    setDailyGreeting(readDailyGreeting(undefined, dateKey).text);
  }, [dateKey]);

  const greeting = useMemo(
    () =>
      dailyGreeting
        ? composeGreeting(dailyGreeting, getLocalMoment(new Date(now || Date.now())))
        : '',
    [dailyGreeting, now],
  );

  const fortuneChars = useMemo(() => currentFortune ? Array.from(currentFortune) : [], [currentFortune]);
  const greetingChars = useMemo(() => (greeting ? Array.from(greeting) : []), [greeting]);
  const answerChars = useMemo(() => (followUpAnswer ? Array.from(followUpAnswer) : []), [followUpAnswer]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ballSceneRef = useRef<HTMLDivElement>(null);
  const ballImageRef = useRef<HTMLImageElement>(null);
  const fortunePanelRef = useRef<HTMLDivElement>(null);
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leafFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const greetingComplete = greetingCharCount >= greetingChars.length;
  const answerTyping =
    Boolean(followUpAnswer) && answerRevealedCount < answerChars.length && !prefersReducedMotion;

  const isBusy = status === 'loading' || status === 'preRevealPulse' || status === 'leafFalling' || status === 'revealing' || status === 'completionPulse';

  useEffect(() => {
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

  // Adopt a fortune saved by this tab or another tab once the current reveal is
  // not busy, so a storage event can never interrupt the animation.
  useEffect(() => {
    if (!initialFortune || initialFortune === currentFortune || isBusy) return;
    setCurrentFortune(initialFortune);
    setShowResult(true);
    setStatus('idle');
    setRevealedCharCount(Array.from(initialFortune).length);
  }, [initialFortune, currentFortune, isBusy]);

  // Adopt a saved follow-up without replaying the fortune sequence.
  useEffect(() => {
    if (!initialFollowUp || followUpAnswer === initialFollowUp.answer) return;
    setSavedFollowUpQuestion(initialFollowUp.question);
    setFollowUpAnswer(initialFollowUp.answer);
    setFollowUpStatus('done');
    answerShouldTypeRef.current = false;
    setAnswerRevealedCount(Array.from(initialFollowUp.answer).length);
  }, [initialFollowUp, followUpAnswer]);

  // Type the daily greeting with the same decorative leaf cursor as a reading.
  useEffect(() => {
    if (!greeting) return;
    if (prefersReducedMotion) {
      setGreetingCharCount(greetingChars.length);
      return;
    }

    let index = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setGreetingCharCount(0);

    const tick = () => {
      index += 1;
      setGreetingCharCount(index);
      if (index < greetingChars.length) {
        timer = setTimeout(tick, GREETING_CHAR_DELAY_MS);
      }
    };

    timer = setTimeout(tick, 180);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [greeting, greetingChars, prefersReducedMotion]);

  // Type a newly received answer; a restored answer is shown in full.
  useEffect(() => {
    if (!followUpAnswer) return;
    if (!answerShouldTypeRef.current || prefersReducedMotion) {
      answerShouldTypeRef.current = false;
      setAnswerRevealedCount(answerChars.length);
      return;
    }

    let index = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setAnswerRevealedCount(0);

    const tick = () => {
      index += 1;
      setAnswerRevealedCount(index);
      if (index < answerChars.length) {
        timer = setTimeout(tick, FOLLOW_UP_ANSWER_CHAR_DELAY_MS);
      } else {
        answerShouldTypeRef.current = false;
      }
    };

    timer = setTimeout(tick, 140);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [followUpAnswer, answerChars, prefersReducedMotion]);

  // Focus the native keyboard on open and keep the panel in view on mobile.
  useEffect(() => {
    if (!followUpPanelOpen) return;
    let cancelled = false;
    let raf1: ReturnType<typeof requestAnimationFrame>;
    let raf2: ReturnType<typeof requestAnimationFrame>;
    // Double-rAF ensures the panel is committed to the DOM and any CSS transition
    // has started before we focus the textarea. A fixed 80 ms was too short on slow devices.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        const field = followUpTextareaRef.current;
        if (!field) return;
        field.focus({ preventScroll: true });
        field.scrollIntoView({
          block: 'center',
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [followUpPanelOpen, prefersReducedMotion]);

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
    if (revealTimeoutRef.current) { clearTimeout(revealTimeoutRef.current); revealTimeoutRef.current = null; }
    setLeafFlight(null);
    setIsRevealPaused(false);
    setRevealedCharCount(fortuneChars.length);
    if (status !== 'revealing') setStatus('revealing');
  }, [prefersReducedMotion, status, currentFortune]);

  const primeCrystalBallAudio = useCallback(() => {
    void preloadCrystalBallAudio();
  }, []);

  const handleGenerateFortune = useCallback(async () => {
    if (isBusy || fortuneUsed) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

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
    setLeafFlight(null);
    setFollowUpQuestion('');
    setFollowUpAnswer(null);
    setSavedFollowUpQuestion('');
    setFollowUpStatus('idle');
    setFollowUpError(null);
    setFollowUpPanelOpen(false);
    setAnswerRevealedCount(0);
    answerShouldTypeRef.current = false;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

    try {
      const answer = await onGenerateFortune();
      stopCrystalBallEnergy();
      if (!answer || answer.trim() === '') {
        throw new Error('Received an empty fortune.');
      }
      playCrystalBallReveal();

      // Strip basic Markdown emphasis markers from the fortune output
      const normalizedAnswer = answer.replace(/[*_]{1,2}/g, '');

      setCurrentFortune(normalizedAnswer);
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
  }, [isBusy, fortuneUsed, onGenerateFortune, prefersReducedMotion]);

  const handleAskFollowUp = useCallback(async () => {
    const trimmed = followUpQuestion.trim();
    if (!trimmed || followUpStatus === 'loading' || followUpUsed || !currentFortune) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setFollowUpStatus('loading');
    setFollowUpError(null);

    try {
      const answer = await onAskFollowUp(trimmed);
      stopCrystalBallEnergy();
      if (!answer || answer.trim() === '') {
        throw new Error('Received an empty follow-up answer.');
      }
      playCrystalBallReveal();
      setSavedFollowUpQuestion(trimmed);
      setFollowUpAnswer(answer.replace(/[*_]{1,2}/g, ''));
      setAnswerRevealedCount(0);
      // NOTE: ordering matters. The typing effect (which depends on `followUpAnswer`)
      // reads `answerShouldTypeRef` when it runs after this handler's batched state
      // updates are committed. The ref must be set synchronously here, in the same
      // handler, so it is already true when the effect fires.
      answerShouldTypeRef.current = true;
      setFollowUpQuestion('');
      setFollowUpPanelOpen(false);
      setFollowUpStatus('done');
    } catch (error: unknown) {
      stopCrystalBallEnergy();
      setFollowUpStatus('error');
      setFollowUpError(error instanceof Error ? error.message : null);
    }
  }, [followUpQuestion, followUpStatus, followUpUsed, currentFortune, onAskFollowUp]);

  const statusHeadline =
    status === 'loading' || status === 'preRevealPulse' || status === 'leafFalling'
      ? 'The mists are stirring…'
      : status === 'error'
        ? errorMessage || 'The connection to the ethereal realm was lost. Please try again.'
        : currentFortune
          ? 'Your daily fortune'
          : fortuneUsed
            ? 'Today’s fortune has already been revealed.'
            : 'The mists are waiting…';

  const busyLabel =
    status === 'loading'
      ? 'Consulting the Mists…'
      : status === 'preRevealPulse'
        ? 'Gathering Energy…'
        : status === 'leafFalling'
          ? 'Guiding the Leaf…'
          : 'Revealing Fortune…';

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
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.greeting} data-testid="crystal-ball-greeting">
            <span className="sr-only">{greeting || '\u00A0'}</span>
            <span className={styles.greetingTyped} aria-hidden="true">
              {greetingChars.slice(0, greetingCharCount).join('')}
              {greeting && !greetingComplete && !prefersReducedMotion && (
                <span className={styles.leafCursorWrapper}>
                  <GoldenLeaf className={styles.goldenLeafCursor} />
                </span>
              )}
            </span>
          </div>
          <h1 className={styles.title}>Crystal Ball</h1>
          <p className={styles.subtitle}>
            A fresh Canadian fortune is waiting in the glass. Press the button and let the mists do the rest.
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
              {/* The artwork box is clamp(280px, 75vw, 420px), so 420w covers 1x and the
                  716w source covers high-density displays. */}
              <source
                srcSet="/assets/crystal-ball-pedestal-420w.avif 420w, /assets/crystal-ball-pedestal.avif 716w"
                sizes="(max-width: 560px) 75vw, 420px"
                type="image/avif"
              />
              <source
                srcSet="/assets/crystal-ball-pedestal-420w.webp 420w, /assets/crystal-ball-pedestal.webp 716w"
                sizes="(max-width: 560px) 75vw, 420px"
                type="image/webp"
              />
              <img
                ref={ballImageRef}
                src="/assets/crystal-ball-pedestal.png"
                alt="Canadian crystal ball with a jeweled maple leaf, emerald clover, sapphire pendant, and ornate gold pedestal"
                className={styles.ballImage}
                width={716}
                height={875}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <div className={styles.plaqueOverlay} aria-hidden="true">
              <span className={styles.plaque}>LUCKYPICKCANADA.CA</span>
            </div>
          </div>

          {showResult && currentFortune && (
            <div ref={fortunePanelRef} className={styles.fortunePanel} aria-live="polite">
              {/* Screen reader only full text */}
              <p className="sr-only">{currentFortune}</p>

              {/* Visible animated text */}
              <ReadingText
                text={currentFortune}
                revealedCount={revealedCharCount}
                showCursor={
                  status === 'revealing' && !prefersReducedMotion && !isRevealPaused
                }
                className={styles.fortuneTextResult}
              />
            </div>
          )}

        </div>

        <section className={styles.card}>
          <p
            className={styles.cardStatus}
            role={status === 'error' ? 'alert' : undefined}
          >
            {statusHeadline}
          </p>

          <p className={styles.dailyQuotaCountdown} aria-label="Time until daily reset">
            Daily reset in {resetReady ? resetCountdown : '--:--:--'}
          </p>

          {!currentFortune && !fortuneUsed && (
            <button
              type="button"
              className={`${styles.seekButton} gold-3d-btn inline-flex items-center justify-center`}
              onPointerEnter={primeCrystalBallAudio}
              onPointerDown={primeCrystalBallAudio}
              onFocus={primeCrystalBallAudio}
              onTouchStart={primeCrystalBallAudio}
              onClick={() => {
                primeCrystalBallAudio();
                playButtonClick();
                playCrystalBallEnergy();
                void handleGenerateFortune();
              }}
              disabled={isBusy}
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
                  {busyLabel}
                </>
              ) : (
                <>
                  <span className="gold-cta-emoji" aria-hidden="true">🔮</span>
                  Generate My Fortune
                </>
              )}
            </button>
          )}

          {!currentFortune && fortuneUsed && (
            <p className={styles.dailyQuota} role="status">
              Today’s fortune has already been delivered. Come back after your next local midnight for a fresh one.
            </p>
          )}

          {currentFortune && status === 'idle' && (
            <section className={styles.followUp} aria-label="Ask a follow-up question">
              {followUpAnswer ? (
                <div
                  className={styles.answerBlock}
                  aria-live="polite"
                  data-testid="crystal-ball-followup-answer"
                >
                  {savedFollowUpQuestion && (
                    <p className={styles.answerQuestion}>
                      <span className={styles.answerQuestionLabel}>You asked:</span>
                      “{savedFollowUpQuestion}”
                    </p>
                  )}
                  <div className={styles.answerDivider} aria-hidden="true" />
                  <p className="sr-only">{followUpAnswer}</p>
                  <ReadingText
                    text={followUpAnswer}
                    revealedCount={answerRevealedCount}
                    showCursor={answerTyping}
                    className={styles.followUpAnswer}
                  />
                  <p className={styles.followUpNote}>
                    That’s your follow-up for today. The Crystal Ball is quiet until the next local midnight.
                  </p>
                </div>
              ) : followUpUsed ? (
                <p className={styles.followUpNote}>
                  You’ve used today’s follow-up question. Come back after your next local midnight for another one.
                </p>
              ) : followUpPanelOpen ? (
                <div
                  className={styles.followUpPanel}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && followUpStatus !== 'loading') {
                      followUpTextareaRef.current?.blur();
                      setFollowUpPanelOpen(false);
                    }
                  }}
                >
                  <p className={styles.panelEyebrow}>One question, whispered into the glass</p>
                  <label htmlFor="crystal-ball-followup" className={styles.panelLabel}>
                    Your follow-up question
                  </label>
                  <textarea
                    id="crystal-ball-followup"
                    ref={followUpTextareaRef}
                    className={styles.followUpTextarea}
                    placeholder="Ask about your fortune…"
                    rows={5}
                    maxLength={120}
                    value={followUpQuestion}
                    onChange={(event) => setFollowUpQuestion(event.target.value)}
                    disabled={followUpStatus === 'loading'}
                    enterKeyHint="send"
                  />
                  <div className={styles.panelMeta} aria-hidden="true">
                    <span>One question per day</span>
                    <span>{followUpQuestion.length}/120</span>
                  </div>

                  <div className={styles.panelActions}>
                    <button
                      type="button"
                      className={`${styles.seekButton} gold-3d-btn inline-flex items-center justify-center`}
                      onClick={() => {
                        // Blurring closes the phone's native keyboard before the request.
                        followUpTextareaRef.current?.blur();
                        playButtonClick();
                        playCrystalBallEnergy();
                        void handleAskFollowUp();
                      }}
                      disabled={followUpStatus === 'loading' || followUpQuestion.trim() === ''}
                    >
                      {followUpStatus === 'loading' ? (
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
                        <>
                          <span className="gold-cta-emoji" aria-hidden="true">🔮</span>
                          Ask the Crystal Ball
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className={styles.panelDismiss}
                      onClick={() => {
                        followUpTextareaRef.current?.blur();
                        setFollowUpPanelOpen(false);
                      }}
                      disabled={followUpStatus === 'loading'}
                    >
                      Never mind
                    </button>
                  </div>

                  {followUpStatus === 'error' && (
                    <p className={styles.followUpError} role="alert">
                      {followUpError || 'The Crystal Ball could not answer that follow-up. Please try again.'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className={styles.followUpPrompt}>
                    Curious about your fortune? Ask the Crystal Ball one follow-up question.
                  </p>
                  <button
                    type="button"
                    className={`${styles.seekButton} gold-3d-btn inline-flex items-center justify-center`}
                    onPointerEnter={primeCrystalBallAudio}
                    onFocus={primeCrystalBallAudio}
                    onClick={() => {
                      primeCrystalBallAudio();
                      playButtonClick();
                      setFollowUpPanelOpen(true);
                    }}
                  >
                    <span className="gold-cta-emoji" aria-hidden="true">🔮</span>
                    Ask a Follow-up Question
                  </button>
                </>
              )}
            </section>
          )}
        </section>

        <nav className={styles.nav} aria-label="Crystal Ball navigation">
          <Link href={backHref} className={styles.navButton}>
            Back to Home
          </Link>
          <Link href={luckMeterHref} className={styles.navButton}>
            Luck Generator
          </Link>
          <Link href={communityMapHref} className={styles.navButton}>
            Community Map
          </Link>
        </nav>
      </div>
    </div>
  );
}
