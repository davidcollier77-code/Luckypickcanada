'use client';

import Aurora, { AuroraHandle } from './Aurora';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import ResonanceButton from './ResonanceButton';
import CosmicEventStage from './CosmicEventStage';
import LuckyMeterRing from './LuckyMeterRing';
import { playButtonClick } from '../app/lib/audio';
import { useDailyResetCountdown } from './daily-reset-countdown';
import { getLocalDateKey } from '../app/lib/daily-reset';
import { prefersReducedMotion } from '../app/lib/graphics-capabilities';
import {
  appendResultToHistory,
  emptyMeterHistory,
  isResultForDate,
  loadMeterState,
  saveMeterState,
} from '../app/lib/lucky-meter/storage';
import { createDailyResult } from '../app/lib/lucky-meter/selection';
import {
  buildRevealKeyframes,
  getEventDurationMs,
  REVEAL_TIMING,
  sampleRevealNumber,
} from '../app/lib/lucky-meter/reveal';
import { shareDailyResult } from '../app/lib/lucky-meter/share';
import {
  ENTERTAINMENT_DISCLAIMER,
  EVENTS_BY_ID,
  LUCKY_NUMBERS_LABEL,
} from '../app/lib/lucky-meter/config';

interface DailyResult {
  dateKey: string;
  percentage: number;
  tier: { id: string; label: string; message: string };
  event: { id: string; name: string; numbers: number[] };
  colour: { id: string; name: string; hex: string; light: boolean };
  spark: { id: string; message: string };
}

interface DailyResonanceProps {
  isCompact?: boolean;
}

type ShareStatus = 'idle' | 'copied' | 'failed';
type RingPhase = 'idle' | 'scrambling' | 'landed';

const EMPTY_SOUNDS = () => ({
  buildup: null as any,
  impactMeteor: null as any,
  impactLightning: null as any,
  impactFireworks: null as any,
  fireworkBurst: null as any,
  fireworkBurstAlt: null as any,
  willowCrackle: null as any,
  fireworkLaunch: null as any,
  // Recorded additions. The existing cues above keep their original files.
  finaleBoom: null as any,
  thunderRumble: null as any,
});

/**
 * The Daily Resonance Lucky Meter.
 *
 * One independent result is generated per local day and persisted to Local
 * Storage only. The real percentage is hidden behind a 4.5-second unpredictable
 * climb/drop/jump animation, flashes on landing, and is then followed by the
 * colour, numbers, Little Spark, event and the event's cinematic sequence.
 *
 * The circular meter is mounted in every state. The Home control is only
 * available before the reveal and once the day's event (including its final
 * sparks) has finished; the completion flag is persisted so refreshing during a
 * reveal resumes the event instead of exposing Home early.
 *
 * @param props - Component display options.
 * @param props.isCompact - Reduces layout spacing and hides the home link; defaults to false.
 */
export default function DailyResonance({ isCompact = false }: DailyResonanceProps) {
  const [result, setResult] = useState<DailyResult | null>(null);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [stageActive, setStageActive] = useState(false);
  const [stageDuration, setStageDuration] = useState(0);
  const [eventCompleted, setEventCompleted] = useState(false);
  // Home stays unmounted until the persisted lifecycle has been read, so a
  // refresh never paints it for a frame before an unfinished event resumes.
  const [hasLoaded, setHasLoaded] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [announcement, setAnnouncement] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [history, setHistory] = useState(emptyMeterHistory);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  const { ready, dateKey, formatted: resetCountdown } = useDailyResetCountdown();

  const auroraRef = useRef<AuroraHandle>(null);
  const soundsRef = useRef<Record<string, any>>(EMPTY_SOUNDS());
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const shareTimerRef = useRef<number | null>(null);
  const finalPercentageRef = useRef(0);
  const keyframesRef = useRef<Array<{ at: number; value: number }>>([]);
  const revealStartRef = useRef(0);
  const isMountedRef = useRef(true);
  const visitsAbortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<DailyResult | null>(null);
  const historyRef = useRef(emptyMeterHistory());
  const stageDurationRef = useRef(0);
  const eventCompletedRef = useRef(false);
  const thunderRef = useRef({ count: 0, lastAt: 0 });

  const ringPhase: RingPhase = isRevealing ? 'scrambling' : isRevealed ? 'landed' : 'idle';

  // The Home control is available only before Start and after today's complete
  // cinematic. `result && !eventCompleted` keeps it hidden across a refresh.
  const showHome =
    hasLoaded && !isCompact && !isRevealing && !stageActive && (!result || eventCompleted);

  const clearSequence = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timer = window.setTimeout(callback, delayMs);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const persistLifecycle = useCallback(
    (
      nextResult: DailyResult | null,
      nextHistory: ReturnType<typeof emptyMeterHistory>,
      completed: boolean,
      duration: number,
    ) => {
      if (!nextResult) return;
      saveMeterState({
        result: nextResult,
        history: nextHistory,
        eventCompleted: completed,
        stageDurationMs: duration,
      });
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reduced motion is respected for the scramble, the landing flash and the
  // cinematic stage; the result is presented calmly instead.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);

  // Load today's persisted result. Refresh keeps the revealed result all day
  // and, when the event never finished, resumes that event without returning
  // the Home control prematurely.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localKey = getLocalDateKey();
    const loaded = loadMeterState();
    setHistory(loaded.history);
    historyRef.current = loaded.history;
    setHasLoaded(true);

    if (isResultForDate(loaded.result, localKey)) {
      const saved = loaded.result as DailyResult;
      // Only a stored duration inside this event's documented window is reused;
      // anything else gets a fresh in-window duration so the finale can always
      // finish naturally rather than being truncated.
      const eventWindow = EVENTS_BY_ID.get(saved.event.id);
      const storedDuration = loaded.stageDurationMs;
      const duration =
        eventWindow &&
        storedDuration >= eventWindow.minDurationMs &&
        storedDuration <= eventWindow.maxDurationMs
          ? storedDuration
          : getEventDurationMs(saved.event.id);
      const completed = loaded.eventCompleted === true;

      resultRef.current = saved;
      stageDurationRef.current = duration;
      eventCompletedRef.current = completed;
      thunderRef.current = { count: 0, lastAt: 0 };

      setResult(saved);
      setDisplayPercentage(saved.percentage);
      setIsRevealed(true);
      setDetailsVisible(true);
      setStageDuration(duration);
      setEventCompleted(completed);
      setAnnouncement(
        `Today's resonance is ${saved.percentage} percent. ${saved.tier.label}. ${saved.tier.message}`,
      );

      if (!completed) {
        if (prefersReducedMotion()) {
          eventCompletedRef.current = true;
          setEventCompleted(true);
          auroraRef.current?.setPhase('settled', saved.event.name);
          saveMeterState({
            result: saved,
            history: loaded.history,
            eventCompleted: true,
            stageDurationMs: duration,
          });
        } else {
          // Resume the unfinished cinematic from the start of its event. The
          // result stays visible and Home remains hidden until it completes.
          setStageActive(true);
        }
      }
    }
  }, []);

  // Roll over after local midnight, including in an already-open tab. The shared
  // countdown store owns the one-second clock; this effect only reacts to its
  // local date key, so it also follows DST changes.
  useEffect(() => {
    if (!ready || !dateKey) return;
    if (result && result.dateKey !== dateKey) {
      clearSequence();
      resultRef.current = null;
      historyRef.current = emptyMeterHistory();
      stageDurationRef.current = 0;
      eventCompletedRef.current = false;
      thunderRef.current = { count: 0, lastAt: 0 };
      setResult(null);
      setDisplayPercentage(0);
      setIsRevealing(false);
      setIsRevealed(false);
      setIsFlashing(false);
      setDetailsVisible(false);
      setStageActive(false);
      setEventCompleted(false);
      setShareStatus('idle');
      setAnnouncement('');
      auroraRef.current?.setPhase('idle');
    }
  }, [ready, dateKey, result, clearSequence]);

  // Unload only the Howl instances this component created.
  useEffect(() => {
    return () => {
      clearSequence();
      visitsAbortRef.current?.abort();
      visitsAbortRef.current = null;
      if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);

      const sounds = soundsRef.current;
      Object.values(sounds).forEach((sound) => {
        if (sound && typeof sound.unload === 'function') sound.unload();
      });
      soundsRef.current = EMPTY_SOUNDS();
    };
  }, [clearSequence]);

  /**
   * Loads the Lucky Meter sound set on first reveal. The established buildup,
   * meteor, lightning, whistle and firework cues are unchanged; two new
   * recorded cues are added for the finale boom and thunder.
   */
  const ensureRevealAudio = useCallback(async () => {
    if (soundsRef.current.buildup) return;
    try {
      const howlerModule = await import('howler');
      const Howl = howlerModule.Howl;
      soundsRef.current = {
        buildup: new Howl({ src: ['/freesound_community-starship-rail-gun-charge-35904.mp3'], volume: 0.8 }),
        impactMeteor: new Howl({ src: ['/dragon-studio-whoosh-cinematic-376875.mp3'], volume: 1.0 }),
        impactLightning: new Howl({ src: ['/sounds/mixkit-cinematic-impact.mp3'], volume: 1.0 }),
        impactFireworks: new Howl({ src: ['/freesound_community-fireworks-1-94483.mp3'], volume: 1.0 }),
        fireworkBurst: new Howl({ src: ['/freesound_community-fireworks-1-94483.mp3'] }),
        fireworkBurstAlt: new Howl({ src: ['/sounds/mixkit-magical-impact.mp3'] }),
        willowCrackle: new Howl({ src: ['/sounds/mixkit-firework-crackle.mp3'], volume: 1.0 }),
        fireworkLaunch: new Howl({ src: ['/sounds/mixkit-firework-whistle.mp3'], volume: 0.5 }),
        finaleBoom: new Howl({ src: ['/sounds/lucky-meter-finale-boom.wav'], volume: 1.0 }),
        thunderRumble: new Howl({ src: ['/sounds/lucky-meter-thunder-rumble.wav'], volume: 0.24 }),
      };
    } catch (error) {
      // Audio is optional; a blocked or missing sound must never stop the reveal.
      console.warn('Lucky Meter audio unavailable; continuing without sound.', error);
    }
  }, []);

  const playEventCue = useCallback((cue: string) => {
    if (!isMountedRef.current) return;
    const sounds = soundsRef.current;
    const play = (key: string, rate = 1, volume = 0.6) => {
      const sound = sounds[key];
      if (!sound) return;
      try {
        const id = sound.play();
        if (typeof sound.rate === 'function') sound.rate(rate, id);
        if (typeof sound.volume === 'function') sound.volume(volume, id);
      } catch {
        // A failed cue never affects the visual sequence.
      }
    };
    const variation = (spread = 0.08) => 1 + (Math.random() * 2 - 1) * spread;

    // Subtle recorded thunder, linked to the strike and deliberately throttled
    // so overlapping strikes never become a wall of noise.
    const maybeThunder = (isFinale: boolean) => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (thunderRef.current.count >= 2) return;
      // The first rumble always plays; later ones keep a minimum spacing.
      if (thunderRef.current.count > 0 && now - thunderRef.current.lastAt < 2500) return;
      thunderRef.current = { count: thunderRef.current.count + 1, lastAt: now };
      play('thunderRumble', variation(0.05), isFinale ? 0.32 : 0.22);
    };

    if (cue === 'meteor') play('impactMeteor', 1.2, 0.5);
    else if (cue === 'meteor-finale') play('impactMeteor', 0.7, 0.95);
    else if (cue === 'lightning') {
      // The existing lightning sound is preserved exactly as it was.
      play('impactLightning', 1, 0.55);
      maybeThunder(false);
    } else if (cue === 'lightning-finale') {
      play('impactLightning', 0.8, 1);
      maybeThunder(true);
    } else if (cue === 'firework-launch') play('fireworkLaunch', variation(0.06), 0.4);
    else if (cue === 'firework-burst') play('fireworkBurst', variation(0.07), 0.55);
    else if (cue === 'firework-burst-silver') play('fireworkBurstAlt', 1.12 * variation(0.05), 0.42);
    else if (cue === 'firework-finale') play('fireworkLaunch', 0.8, 0.7);
    else if (cue === 'finale-boom') {
      // A real recording, mixed noticeably louder and deeper than the opening
      // bursts but kept below unity so the extra low end cannot clip.
      play('finaleBoom', 1, 0.96);
    } else if (cue === 'firework-willow') play('willowCrackle', 1, 0.85);
  }, []);

  const handleReveal = useCallback(() => {
    if (isRevealing || isRevealed || typeof window === 'undefined') return;

    const localKey = ready && dateKey ? dateKey : getLocalDateKey();
    let next: DailyResult;
    try {
      next = createDailyResult({ dateKey: localKey, history }) as DailyResult;
    } catch (error) {
      // A bad local date or a corrupt history must not crash the page.
      console.error('Unable to prepare today’s resonance:', error);
      setAnnouncement('Today’s resonance could not be prepared. Please try again.');
      return;
    }
    const nextHistory = appendResultToHistory(history, next);
    const duration = getEventDurationMs(next.event.id);

    // Persist before animating so a refresh mid-reveal still keeps today's result.
    resultRef.current = next;
    historyRef.current = nextHistory;
    stageDurationRef.current = duration;
    eventCompletedRef.current = false;
    thunderRef.current = { count: 0, lastAt: 0 };

    setHistory(nextHistory);
    saveMeterState({
      result: next,
      history: nextHistory,
      eventCompleted: false,
      stageDurationMs: duration,
    });

    setResult(next);
    setShareStatus('idle');
    setEventCompleted(false);
    setAnnouncement('Preparing today’s resonance.');
    finalPercentageRef.current = next.percentage;
    keyframesRef.current = buildRevealKeyframes(next.percentage);
    setStageDuration(duration);
    clearSequence();

    void playButtonClick().catch(() => {});
    void ensureRevealAudio().then(() => {
      if (!isMountedRef.current) return;
      try {
        soundsRef.current.buildup?.play();
      } catch {
        // Optional audio only.
      }
    });

    // Preserve the existing total-ritual counter. A newer reveal or unmount
    // aborts an older request so a late response cannot overwrite the count.
    visitsAbortRef.current?.abort();
    const visitsController = new AbortController();
    visitsAbortRef.current = visitsController;
    fetch('/api/visits', { method: 'POST', signal: visitsController.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Visit counter responded with ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (isMountedRef.current && data && typeof data.visits === 'number') {
          setTotalVisits(data.visits);
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.error('Failed to update visits:', error);
      })
      .finally(() => {
        if (visitsAbortRef.current === visitsController) visitsAbortRef.current = null;
      });

    if (reducedMotion) {
      setDisplayPercentage(next.percentage);
      setIsRevealing(false);
      setIsRevealed(true);
      setDetailsVisible(true);
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.label}. ${next.tier.message}`,
      );
      auroraRef.current?.setPhase('settled', next.event.name);
      // No cinematic runs under reduced motion, so the reading is complete as
      // soon as every detail is visible and Home may return.
      eventCompletedRef.current = true;
      setEventCompleted(true);
      persistLifecycle(next, nextHistory, true, duration);
      return;
    }

    setDisplayPercentage(5);
    setIsRevealing(true);
    setIsRevealed(false);
    setDetailsVisible(false);
    setStageActive(false);
    auroraRef.current?.setPhase('awaken');
    schedule(() => auroraRef.current?.setPhase('gather'), 1500);

    revealStartRef.current = performance.now();
    const step = () => {
      if (!isMountedRef.current) return;
      const elapsed = performance.now() - revealStartRef.current;
      if (elapsed >= REVEAL_TIMING.scrambleMs) return;
      setDisplayPercentage(
        sampleRevealNumber(elapsed, keyframesRef.current, finalPercentageRef.current),
      );
      rafRef.current = window.requestAnimationFrame(step);
    };
    rafRef.current = window.requestAnimationFrame(step);

    // Landing: reveal the real percentage and tier, flash it, then leave it visible.
    schedule(() => {
      if (!isMountedRef.current) return;
      setIsRevealing(false);
      setIsRevealed(true);
      setDisplayPercentage(next.percentage);
      setIsFlashing(true);
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.label}. ${next.tier.message}`,
      );
      auroraRef.current?.setPhase('impact', next.event.name);
      schedule(() => auroraRef.current?.setPhase('settled', next.event.name), 1000);

      const buildup = soundsRef.current.buildup;
      try {
        if (buildup && typeof buildup.fade === 'function') buildup.fade(0.8, 0, 500);
        schedule(() => {
          try {
            if (buildup) buildup.stop();
          } catch {
            // Optional audio only.
          }
        }, 540);
      } catch {
        // Optional audio only.
      }
    }, REVEAL_TIMING.scrambleMs);

    schedule(
      () => setIsFlashing(false),
      REVEAL_TIMING.scrambleMs + REVEAL_TIMING.flashMs + 40,
    );

    // Reveal colour, numbers, Little Spark and event after the percentage.
    schedule(
      () => setDetailsVisible(true),
      REVEAL_TIMING.scrambleMs + REVEAL_TIMING.detailsDelayMs,
    );

    // Start the cinematic event after its short beat of anticipation.
    schedule(
      () => setStageActive(true),
      REVEAL_TIMING.scrambleMs + REVEAL_TIMING.detailsDelayMs + REVEAL_TIMING.eventDelayMs,
    );
  }, [
    clearSequence,
    dateKey,
    ensureRevealAudio,
    history,
    isRevealed,
    isRevealing,
    persistLifecycle,
    ready,
    reducedMotion,
    schedule,
  ]);

  const handleStageComplete = useCallback(() => {
    setStageActive(false);
    setEventCompleted(true);
    eventCompletedRef.current = true;
    // Persist only after the event has actually completed, including the last
    // visible golden sparks. A refresh before this point resumes the event.
    persistLifecycle(
      resultRef.current,
      historyRef.current,
      true,
      stageDurationRef.current,
    );
  }, [persistLifecycle]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    void playButtonClick().catch(() => {});

    const outcome = await shareDailyResult(result);
    if (!isMountedRef.current) return;

    if (outcome.status === 'copied') {
      setShareStatus('copied');
    } else if (outcome.status === 'failed') {
      setShareStatus('failed');
    } else {
      // Shared, or the visitor cancelled the native sheet: no clipboard copy.
      setShareStatus('idle');
      return;
    }

    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
    shareTimerRef.current = /* DevSkim: ignore DS172411 */ window.setTimeout(() => {
      if (isMountedRef.current) setShareStatus('idle');
    }, 2400);
  }, [result]);

  const shareLabel =
    shareStatus === 'copied'
      ? 'Copied ✓'
      : shareStatus === 'failed'
        ? 'Sharing unavailable'
        : 'Share My Resonance';

  const isLightColour = result?.colour?.light === true;

  const ringSizeClasses = isCompact ? 'mt-3' : 'mt-8 sm:mt-9';
  const panelClass =
    'rounded-2xl border border-amber-300/20 bg-slate-950/55 shadow-[inset_0_1px_0_rgba(255,240,190,0.08)] backdrop-blur-sm';

  return (
    <div
      className={`relative flex w-full flex-1 flex-col items-center overflow-x-hidden z-0 ${
        isCompact ? 'min-h-[200px]' : 'min-h-[100svh]'
      }`}
    >
      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <Aurora ref={auroraRef} />
      {/* The Milky Way artwork, responsive sources, position and overlay are
          intentionally unchanged from the approved Lucky Meter design. */}
      <picture className="absolute inset-0 w-full h-full -z-20 pointer-events-none">
        <source
          srcSet="/images/lucky-meter-night-sky-640w.avif 640w, /images/lucky-meter-night-sky-1024w.avif 1024w, /images/lucky-meter-night-sky.avif 1400w"
          sizes="100vw"
          type="image/avif"
        />
        <source
          srcSet="/images/lucky-meter-night-sky-640w.webp 640w, /images/lucky-meter-night-sky-1024w.webp 1024w, /images/lucky-meter-night-sky.webp 1400w"
          sizes="100vw"
          type="image/webp"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/lucky-meter-night-sky.webp"
          srcSet="/images/lucky-meter-night-sky-640w.webp 640w, /images/lucky-meter-night-sky-1024w.webp 1024w, /images/lucky-meter-night-sky.webp 1400w"
          sizes="100vw"
          alt=""
          role="presentation"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover -z-20 pointer-events-none"
          style={{ objectPosition: "center 40%" }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="absolute inset-0 bg-slate-950/40 -z-10 pointer-events-none" />

      {stageActive && result && (
        <CosmicEventStage
          eventId={result.event.id as 'meteor' | 'lightning' | 'fireworks'}
          durationMs={stageDuration}
          reducedMotion={reducedMotion}
          onCue={playEventCue}
          onComplete={handleStageComplete}
        />
      )}

      {showHome && (
        <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5">
          <Link
            href="/"
            data-testid="lucky-meter-home"
            aria-label="Return to Home"
            className="gold-3d-btn lucky-home-btn rounded-full font-bold transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10.6 12 3l9 7.6" />
              <path d="M5.6 9.6V21h12.8V9.6" />
            </svg>
            <span>Home</span>
          </Link>
        </div>
      )}

      <div
        className={`relative z-20 flex w-full flex-1 flex-col items-center justify-end ${
          isCompact ? 'px-2 pb-3 pt-6' : 'px-4 pb-5 pt-20 sm:px-6 sm:pb-8'
        }`}
      >
        <div className={`flex w-full flex-col items-center ${isCompact ? '' : 'max-w-3xl'}`}>
          {totalVisits !== null && !isCompact && (
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 shadow-lg backdrop-blur-sm animate-fade-in text-slate-300 text-[11px] sm:text-xs tracking-widest uppercase">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>
                Total Resonance Rituals:{' '}
                <strong className="text-emerald-400 font-bold ml-1">
                  {totalVisits.toLocaleString()}
                </strong>
              </span>
            </div>
          )}

          {!isRevealed && !isRevealing && !result && (
            <div className="flex w-full flex-col items-center text-center">
              {/* Visually identical eyebrow line. It is a paragraph, not a heading, so
                  the page's first heading is its single H1 (audit D5). */}
              <p className="text-sm tracking-widest text-slate-400 uppercase mb-4">Daily Resonance Ritual</p>
              <h1
                className={`font-light text-white text-balance ${
                  isCompact ? 'text-xl mb-2' : 'text-2xl sm:text-3xl md:text-4xl mb-3'
                }`}
              >
                AWAKEN TODAY&apos;S RESONANCE
              </h1>
              <p
                className={`max-w-sm text-slate-300/85 text-balance ${
                  isCompact ? 'hidden' : 'text-sm leading-relaxed mb-4'
                }`}
              >
                One reading a day, revealed in a few unforgettable seconds.
              </p>
              <div className={isCompact ? 'mt-1' : 'mt-1'}>
                <ResonanceButton onClick={handleReveal} />
              </div>
            </div>
          )}

          <LuckyMeterRing phase={ringPhase} compact={isCompact} className={ringSizeClasses}>
            {isRevealing ? (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Today&apos;s Daily Resonance</h1>
                <p className="mb-2 text-[clamp(0.45rem,1.1vh,0.625rem)] uppercase tracking-[0.3em] text-amber-200/70">
                  Reading today&apos;s resonance
                </p>
                <div className="text-gold-gradient text-[clamp(1.9rem,7vh,4.25rem)] font-bold leading-none tabular-nums">
                  {displayPercentage}
                  <span className="ml-0.5 align-top text-[0.42em]">%</span>
                </div>
                <p className="mt-3 text-[9px] uppercase tracking-[0.28em] text-slate-400 sm:text-[10px]">
                  The sky is listening
                </p>
              </div>
            ) : isRevealed && result ? (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Today&apos;s Daily Resonance</h1>
                <p className="mb-1 text-[clamp(0.45rem,1.1vh,0.625rem)] uppercase tracking-[0.3em] text-amber-200/65">
                  Daily Resonance
                </p>
                <div
                  className={`text-gold-gradient font-bold leading-none tabular-nums ${
                    isCompact ? 'text-4xl' : 'text-[clamp(2rem,7.4vh,4.5rem)]'
                  } ${isFlashing ? 'animate-lucky-flash' : ''}`}
                >
                  {displayPercentage}
                  <span className="ml-0.5 align-top text-[0.42em]">%</span>
                </div>
                <p className="mt-1.5 text-[clamp(0.5rem,1.4vh,0.75rem)] font-semibold uppercase tracking-[0.16em] text-amber-100">
                  {result.tier.label}
                </p>
                <p className="mt-1 max-w-[13rem] text-[clamp(0.5rem,1.25vh,0.6875rem)] leading-snug text-slate-200/85">
                  {result.tier.message}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Daily Resonance Ritual</h1>
                <p className="text-[8px] uppercase tracking-[0.4em] text-amber-200/60 sm:text-[9px]">
                  Daily Resonance
                </p>
                <span className="text-gold-gradient mt-1 text-4xl font-light leading-none tracking-[0.18em] sm:text-5xl">
                  —
                </span>
                <p className="mt-2 text-[8px] uppercase tracking-[0.3em] text-slate-400 sm:text-[9px]">
                  Awaiting the reading
                </p>
              </div>
            )}
          </LuckyMeterRing>

          {isRevealed && result && (
            <div className={`w-full ${isCompact ? 'mt-2' : 'mt-4 sm:mt-5'}`}>
              {detailsVisible && (
                <div
                  className={`mx-auto w-full ${
                    isCompact ? 'max-w-[260px]' : 'max-w-2xl'
                  } animate-resonance-rise`}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <section className={`${panelClass} p-2.5 sm:p-3`}>
                      <h2 className="text-[9px] uppercase tracking-[0.24em] text-amber-200/70">
                        Today&apos;s Event
                      </h2>
                      <p className="mt-0.5 text-[13px] font-semibold leading-tight text-white sm:text-base">
                        {result.event.name}
                      </p>
                      {stageActive && (
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] text-amber-200/80">
                          <span className="h-1 w-1 animate-pulse rounded-full bg-amber-300" />
                          Now playing
                        </p>
                      )}
                    </section>

                    <section className={`${panelClass} p-2.5 sm:p-3`}>
                      <h2 className="text-[9px] uppercase tracking-[0.24em] text-amber-200/70">
                        Today&apos;s Colour
                      </h2>
                      <div className="mt-1 flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className={`h-8 w-8 shrink-0 rounded-full border shadow-inner ${
                            isLightColour ? 'border-slate-500/70' : 'border-white/25'
                          }`}
                          style={{ backgroundColor: result.colour.hex }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white sm:text-base">
                            {result.colour.name}
                          </p>
                          <p className="text-[9px] uppercase tracking-widest text-slate-400">
                            {result.colour.hex}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className={`${panelClass} p-2.5 sm:p-3`}>
                      <h2 className="text-[9px] uppercase tracking-[0.24em] text-amber-200/70">
                        {LUCKY_NUMBERS_LABEL}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {result.event.numbers.map((number) => (
                          <span
                            key={number}
                            className="inline-flex min-w-8 items-center justify-center rounded-lg border border-amber-300/40 bg-amber-400/10 px-1.5 py-1 text-sm font-semibold text-amber-100 sm:min-w-9 sm:px-2 sm:text-base"
                          >
                            {number}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section className={`${panelClass} p-2.5 sm:p-3`}>
                      <h2 className="text-[9px] uppercase tracking-[0.24em] text-amber-200/70">
                        Little Spark
                      </h2>
                      <p className="mt-0.5 text-[10px] italic leading-snug text-amber-50/90 sm:text-xs">
                        “{result.spark.message}”
                      </p>
                    </section>
                  </div>

                  {!isCompact && (
                    <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
                      {ENTERTAINMENT_DISCLAIMER}
                    </p>
                  )}

                  <div className="mt-3 flex w-full flex-col items-center">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="gold-3d-btn w-full rounded-full px-6 py-2.5 font-bold transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:w-auto"
                    >
                      <span className="gold-cta-emoji" aria-hidden="true">
                        ✦
                      </span>
                      {shareLabel}
                    </button>

                    <div className="mt-3 flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-0.5">
                      <p className="text-[9px] text-slate-400 uppercase tracking-[0.24em]">
                        Next Resonance In
                      </p>
                      <div
                        className="text-xl font-mono text-amber-200 tracking-wider drop-shadow-md tabular-nums sm:text-2xl"
                        aria-label="Time until daily reset"
                      >
                        {resetCountdown}
                      </div>
                    </div>
                    {!isCompact && (
                      <p className="mt-1 text-[10px] text-slate-500">
                        A new reading appears after local midnight.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="sr-only" role="status" aria-live="polite">
            {announcement}
          </div>
        </div>
      </div>
    </div>
  );
}
