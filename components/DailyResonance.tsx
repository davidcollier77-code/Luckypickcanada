'use client';

import Aurora, { AuroraHandle } from './Aurora';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import ResonanceButton from './ResonanceButton';
import CosmicEventStage from './CosmicEventStage';
import { playButtonClick } from '../app/lib/audio';
import { useDailyResetCountdown } from './daily-reset-countdown';
import { getLocalDateKey } from '../app/lib/daily-reset';
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
import { ENTERTAINMENT_DISCLAIMER, LUCKY_NUMBERS_LABEL } from '../app/lib/lucky-meter/config';

interface DailyResult {
  dateKey: string;
  percentage: number;
  tier: { id: string; label: string; message: string };
  event: { id: string; name: string; numbers: number[] };
  colour: { id: string; name: string; hex: string };
  spark: { id: string; message: string };
}

interface DailyResonanceProps {
  isCompact?: boolean;
}

type ShareStatus = 'idle' | 'copied' | 'failed';

const EMPTY_SOUNDS = () => ({
  buildup: null as any,
  impactMeteor: null as any,
  impactLightning: null as any,
  impactFireworks: null as any,
  fireworkBurst: null as any,
  fireworkBurstAlt: null as any,
  crackle: null as any,
  willowCrackle: null as any,
  fireworkLaunch: null as any,
});

/**
 * The Daily Resonance Lucky Meter.
 *
 * One independent result is generated per local day and persisted to Local
 * Storage only. The real percentage is hidden behind a 4.5-second unpredictable
 * climb/drop/jump animation, flashes on landing, and is then followed by the
 * colour, numbers, Little Spark, event and the event's cinematic sequence.
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
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [announcement, setAnnouncement] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [history, setHistory] = useState(emptyMeterHistory);
  const [todayKey, setTodayKey] = useState<string | null>(null);
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

  // Load today's persisted result. Refresh keeps the revealed result all day.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localKey = getLocalDateKey();
    setTodayKey(localKey);
    const loaded = loadMeterState();
    setHistory(loaded.history);

    if (isResultForDate(loaded.result, localKey)) {
      const saved = loaded.result as DailyResult;
      setResult(saved);
      setDisplayPercentage(saved.percentage);
      setIsRevealed(true);
      setDetailsVisible(true);
      setAnnouncement(
        `Today's resonance is ${saved.percentage} percent. ${saved.tier.label}. ${saved.tier.message}`,
      );
    }
  }, []);

  // Roll over after local midnight, including in an already-open tab. The shared
  // countdown store owns the one-second clock; this effect only reacts to its
  // local date key, so it also follows DST changes.
  useEffect(() => {
    if (!ready || !dateKey) return;
    setTodayKey(dateKey);
    if (result && result.dateKey !== dateKey) {
      clearSequence();
      setResult(null);
      setDisplayPercentage(0);
      setIsRevealing(false);
      setIsRevealed(false);
      setIsFlashing(false);
      setDetailsVisible(false);
      setStageActive(false);
      setShareStatus('idle');
      setAnnouncement('');
      auroraRef.current?.setPhase('idle');
    }
  }, [ready, dateKey, result, clearSequence]);

  // Unload only the Howl instances this component created.
  useEffect(() => {
    return () => {
      clearSequence();
      if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);

      const sounds = soundsRef.current;
      Object.values(sounds).forEach((sound) => {
        if (sound && typeof sound.unload === 'function') sound.unload();
      });
      soundsRef.current = EMPTY_SOUNDS();
    };
  }, [clearSequence]);

  /**
   * Loads the existing Lucky Meter sound set on first reveal. This mission is
   * visual-only and adds no new audio; the established cues are preserved.
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
        crackle: new Howl({ src: ['/sounds/mixkit-magic-sparkles.mp3'], volume: 0.3, loop: true }),
        willowCrackle: new Howl({ src: ['/sounds/mixkit-firework-crackle.mp3'], volume: 1.0 }),
        fireworkLaunch: new Howl({ src: ['/sounds/mixkit-firework-whistle.mp3'], volume: 0.5 }),
      };
    } catch (error) {
      // Audio is optional; a blocked or missing sound must never stop the reveal.
      console.warn('Lucky Meter audio unavailable; continuing without sound.', error);
    }
  }, []);

  const playEventCue = useCallback((cue: string) => {
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

    if (cue === 'meteor') play('impactMeteor', 1.2, 0.5);
    else if (cue === 'meteor-finale') play('impactMeteor', 0.7, 0.95);
    else if (cue === 'lightning') play('impactLightning', 1, 0.55);
    else if (cue === 'lightning-finale') play('impactLightning', 0.8, 1);
    else if (cue === 'firework-launch') play('fireworkLaunch', 1.2, 0.4);
    else if (cue === 'firework-burst') play('fireworkBurst', 1, 0.55);
    else if (cue === 'firework-finale') play('fireworkLaunch', 0.8, 0.7);
    else if (cue === 'firework-willow') play('willowCrackle', 1, 1);
  }, []);

  const handleReveal = useCallback(() => {
    if (isRevealing || isRevealed || typeof window === 'undefined') return;

    const localKey = ready && dateKey ? dateKey : getLocalDateKey();
    const next = createDailyResult({ dateKey: localKey, history }) as DailyResult;
    const nextHistory = appendResultToHistory(history, next);

    // Persist before animating so a refresh mid-reveal still keeps today's result.
    setHistory(nextHistory);
    saveMeterState({ result: next, history: nextHistory });

    setResult(next);
    setShareStatus('idle');
    setAnnouncement('Preparing today’s resonance.');
    finalPercentageRef.current = next.percentage;
    keyframesRef.current = buildRevealKeyframes(next.percentage);
    setStageDuration(getEventDurationMs(next.event.id));
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

    // Preserve the existing total-ritual counter.
    fetch('/api/visits', { method: 'POST' })
      .then((response) => response.json())
      .then((data) => {
        if (isMountedRef.current && data && typeof data.visits === 'number') {
          setTotalVisits(data.visits);
        }
      })
      .catch((error) => console.error('Failed to update visits:', error));

    if (reducedMotion) {
      setDisplayPercentage(next.percentage);
      setIsRevealing(false);
      setIsRevealed(true);
      setDetailsVisible(true);
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.label}. ${next.tier.message}`,
      );
      auroraRef.current?.setPhase('settled', next.event.name);
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
    ready,
    reducedMotion,
    schedule,
  ]);

  const handleStageComplete = useCallback(() => {
    setStageActive(false);
  }, []);

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
    shareTimerRef.current = window.setTimeout(() => {
      if (isMountedRef.current) setShareStatus('idle');
    }, 2400);
  }, [result]);

  const shareLabel =
    shareStatus === 'copied'
      ? 'Copied ✓'
      : shareStatus === 'failed'
        ? 'Sharing unavailable'
        : 'Share My Resonance';

  const isLightColour = result?.colour?.id === 'cream' || result?.colour?.id === 'winter-white';

  return (
    <div
      className={`relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden z-0 ${
        isCompact ? 'min-h-[200px]' : 'min-h-[560px]'
      }`}
    >
      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <Aurora ref={auroraRef} />
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
          style={{ objectPosition: 'center 40%' }}
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

      {!isCompact && (
        <div className="absolute top-4 left-4 z-30">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 resonance-return-link text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90"
          >
            <span aria-hidden>←</span> Return to Home
          </Link>
        </div>
      )}

      <div className="relative z-20 flex w-full flex-1 flex-col items-center justify-center px-4 py-10">
        {totalVisits !== null && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 shadow-lg backdrop-blur-sm animate-fade-in text-slate-300 text-sm tracking-widest uppercase">
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

        {!isRevealed && !isRevealing && (
          <div className="flex flex-col items-center justify-center flex-1 w-full py-8 text-center">
            {/* Visually identical eyebrow line. It is a paragraph, not a heading, so
                the page's first heading is its single H1 (audit D5). */}
            <p className="text-sm tracking-widest text-slate-400 uppercase mb-4">Daily Resonance Ritual</p>
            <h1 className="text-3xl font-light text-white mb-8">AWAKEN TODAY&apos;S RESONANCE</h1>
            <ResonanceButton onClick={handleReveal} />
            <p className="mt-5 max-w-xs text-xs leading-relaxed text-slate-400">
              One reading a day, revealed in a few unforgettable seconds.
            </p>
          </div>
        )}

        {isRevealing && (
          <div className="animate-fade-in flex flex-col items-center justify-center min-h-[16rem] text-center">
            <h1 className="sr-only">Today&apos;s Daily Resonance</h1>
            <p className="mb-5 text-xs uppercase tracking-[0.4em] text-amber-200/70">
              Reading today&apos;s resonance
            </p>
            <div className="text-gold-gradient text-7xl font-bold leading-none tabular-nums md:text-8xl">
              {displayPercentage}
              <span className="ml-1 text-3xl md:text-4xl">%</span>
            </div>
          </div>
        )}

        {isRevealed && result && (
          <div className={`w-full ${isCompact ? 'max-w-[430px]' : 'max-w-2xl'}`}>
            <div className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-slate-950/65 px-4 py-6 shadow-[0_0_70px_rgba(234,190,82,0.16)] backdrop-blur-md md:px-8 md:py-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-12 -top-24 h-44 rounded-full bg-amber-400/10 blur-3xl resonance-number-glow"
              />

              <div className="relative flex flex-col items-center text-center">
                <h1 className="text-[11px] uppercase tracking-[0.4em] text-amber-200/70">
                  Daily Resonance Ritual
                </h1>
                <div className="mt-3 flex items-baseline justify-center">
                  <span
                    className={`text-gold-gradient text-6xl font-bold leading-none tabular-nums md:text-7xl ${
                      isFlashing ? 'animate-lucky-flash' : ''
                    }`}
                  >
                    {displayPercentage}
                  </span>
                  <span className="ml-1 text-2xl font-semibold text-amber-200/80 md:text-3xl">%</span>
                </div>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-amber-100">
                  {result.tier.label}
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-200/90">
                  {result.tier.message}
                </p>
              </div>

              {detailsVisible && (
                <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
                  <section
                    className="animate-resonance-rise rounded-2xl border border-amber-300/20 bg-white/[0.04] p-4"
                    style={{ animationDelay: '0ms' }}
                  >
                    <h2 className="text-[10px] uppercase tracking-[0.28em] text-amber-200/70">
                      Today&apos;s Event
                    </h2>
                    <p className="mt-1 text-lg font-semibold text-white">{result.event.name}</p>
                    {stageActive && (
                      <p className="mt-1 inline-flex items-center gap-2 text-xs text-amber-200/80">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
                        Now playing
                      </p>
                    )}
                  </section>

                  <section
                    className="animate-resonance-rise rounded-2xl border border-amber-300/20 bg-white/[0.04] p-4"
                    style={{ animationDelay: '90ms' }}
                  >
                    <h2 className="text-[10px] uppercase tracking-[0.28em] text-amber-200/70">
                      Today&apos;s Colour
                    </h2>
                    <div className="mt-2 flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`h-10 w-10 shrink-0 rounded-full border shadow-inner ${
                          isLightColour ? 'border-slate-500/70' : 'border-white/25'
                        }`}
                        style={{ backgroundColor: result.colour.hex }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">{result.colour.name}</p>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400">
                          {result.colour.hex}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section
                    className="animate-resonance-rise rounded-2xl border border-amber-300/20 bg-white/[0.04] p-4 sm:col-span-2"
                    style={{ animationDelay: '180ms' }}
                  >
                    <h2 className="text-[10px] uppercase tracking-[0.28em] text-amber-200/70">
                      {LUCKY_NUMBERS_LABEL}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {result.event.numbers.map((number) => (
                        <span
                          key={number}
                          className="inline-flex min-w-12 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-lg font-semibold text-amber-100"
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                      {ENTERTAINMENT_DISCLAIMER}
                    </p>
                  </section>

                  <section
                    className="animate-resonance-rise rounded-2xl border border-amber-300/20 bg-white/[0.04] p-4 sm:col-span-2"
                    style={{ animationDelay: '270ms' }}
                  >
                    <h2 className="text-[10px] uppercase tracking-[0.28em] text-amber-200/70">
                      Little Spark
                    </h2>
                    <p className="mt-1 text-sm italic leading-relaxed text-amber-50/90">
                      “{result.spark.message}”
                    </p>
                  </section>
                </div>
              )}

              {detailsVisible && (
                <div className="relative mt-6 flex w-full flex-col items-center">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="gold-3d-btn mb-6 w-full rounded-full px-6 py-3 font-bold transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:w-auto"
                  >
                    <span className="gold-cta-emoji" aria-hidden="true">
                      ✦
                    </span>
                    {shareLabel}
                  </button>

                  <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">
                    Next Resonance In
                  </p>
                  <div
                    className="text-3xl font-mono text-amber-200 tracking-wider drop-shadow-md tabular-nums"
                    aria-label="Time until daily reset"
                  >
                    {resetCountdown}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    A new reading appears after local midnight.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>
      </div>
    </div>
  );
}
