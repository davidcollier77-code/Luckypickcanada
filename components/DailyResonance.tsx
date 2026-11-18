'use client';

import Aurora, { AuroraHandle } from './Aurora';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import GoldenLeaf from '../app/components/CrystalBall/GoldenLeaf';
import ResonanceButton from './ResonanceButton';
import CosmicEventStage from './CosmicEventStage';
import LuckyMeterOrnaments from './LuckyMeterOrnaments';
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
  DEGREES_PER_COLOUR,
  buildColourSpin,
  buildDialSpin,
  buildNumberSpin,
  getColourIndex,
  getEventDurationMs,
  luckyNumberToAngle,
  normalizeAngle,
  percentageToAngle,
  REVEAL_TIMING,
  sampleColourSpin,
  sampleDialSpin,
  sampleNumberSpin,
} from '../app/lib/lucky-meter/reveal';
import { shareDailyResult } from '../app/lib/lucky-meter/share';
import {
  ENTERTAINMENT_DISCLAIMER,
  EVENTS_BY_ID,
  LUCKY_COLOUR_LABEL,
  LUCKY_NUMBER_LABEL,
  LUCKY_NUMBER_MAX,
  LUCKY_NUMBER_MIN,
} from '../app/lib/lucky-meter/config';
import {
  getCueLayers,
  isEventCue,
  SUSTAINED_EVENT_SOUNDS,
} from '../app/lib/lucky-meter/event-audio';

interface DailyResult {
  dateKey: string;
  percentage: number;
  tier: { id: string; label: string; message: string };
  event: { id: string; name: string };
  luckyNumber: number;
  colour: { id: string; name: string; hex: string; light: boolean };
  spark: { id: string; message: string };
}

interface DailyResonanceProps {
  isCompact?: boolean;
}

type ShareStatus = 'idle' | 'copied' | 'failed';
type RingPhase = 'idle' | 'scrambling' | 'landed';

/**
 * The three motions that start together and settle in order. The percentage
 * dial settles first, the Lucky Number pointer second and the segmented colour
 * ring last, all within roughly 1.25 seconds.
 */
interface RevealMotion {
  dialAngle: number;
  percentage: number;
  numberAngle: number;
  number: number;
  colourRotation: number;
}

function initialMotion(): RevealMotion {
  return {
    dialAngle: 0,
    percentage: 0,
    numberAngle: 0,
    number: LUCKY_NUMBER_MIN,
    colourRotation: 0,
  };
}

function settledMotion(result: DailyResult): RevealMotion {
  return {
    dialAngle: percentageToAngle(result.percentage),
    percentage: result.percentage,
    numberAngle: luckyNumberToAngle(result.luckyNumber),
    number: result.luckyNumber,
    // The selected segment rests under the fixed marker at 12 o'clock.
    colourRotation: normalizeAngle(-getColourIndex(result.colour.id) * DEGREES_PER_COLOUR),
  };
}

const EMPTY_SOUNDS = () => ({
  buildup: null as any,
  impactMeteor: null as any,
  impactLightning: null as any,
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
 * One complete result is generated per local day and persisted to Local
 * Storage only. The percentage is independent of the Lucky Number and the Lucky
 * Colour; all three motions start together and settle in a staggered order
 * before the percentage-selected cinematic begins. Only after that cinematic
 * finishes does the reusable Crystal Ball GoldenLeaf move to the prominent Spark
 * area and write the message like a quill. The countdown appears beneath Home
 * once the writing is complete.
 *
 * The circular medallion is mounted in every state. The Home control is only
 * available before the reveal and once the day's cinematic has finished; the
 * completion flags are persisted so refreshing resumes an unfinished stage
 * instead of replaying a finished one or exposing Home early.
 *
 * @param props - Component display options.
 * @param props.isCompact - Reduces layout spacing and hides the home link; defaults to false.
 */
export default function DailyResonance({ isCompact = false }: DailyResonanceProps) {
  const [result, setResult] = useState<DailyResult | null>(null);
  const [motion, setMotion] = useState<RevealMotion>(initialMotion);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [numberSettled, setNumberSettled] = useState(false);
  const [colourSettled, setColourSettled] = useState(false);
  const [stageActive, setStageActive] = useState(false);
  const [stageDuration, setStageDuration] = useState(0);
  const [eventCompleted, setEventCompleted] = useState(false);
  // The Spark's quill writing. It begins only after the cinematic has finished
  // and its completion is persisted so a refresh resumes the writing in place.
  const [sparkWriting, setSparkWriting] = useState(false);
  const [sparkCharCount, setSparkCharCount] = useState(0);
  const [sparkComplete, setSparkComplete] = useState(false);
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
  const dialSpinRef = useRef<ReturnType<typeof buildDialSpin> | null>(null);
  const numberSpinRef = useRef<ReturnType<typeof buildNumberSpin> | null>(null);
  const colourSpinRef = useRef<ReturnType<typeof buildColourSpin> | null>(null);
  const revealStartRef = useRef(0);
  const isMountedRef = useRef(true);
  const visitsAbortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<DailyResult | null>(null);
  const historyRef = useRef(emptyMeterHistory());
  const stageDurationRef = useRef(0);
  const eventCompletedRef = useRef(false);
  const sparkCompletedRef = useRef(false);
  const finalPercentageRef = useRef(0);
  const thunderRef = useRef({ count: 0, lastAt: 0, finalePlayed: false });
  const eventSoundInstancesRef = useRef<Record<string, Array<{ id: number; volume: number }>>>({});
  // Fade-out timers for cues that can outlive their action (thunder, crackle).
  const audioStopTimersRef = useRef<number[]>([]);

  const ringPhase: RingPhase = isRevealing ? 'scrambling' : isRevealed ? 'landed' : 'idle';

  // The Home control is available only before Start and after today's complete
  // cinematic. `result && !eventCompleted` keeps it hidden across a refresh.
  const showHome =
    hasLoaded && !isCompact && !isRevealing && !stageActive && (!result || eventCompleted);
  // The countdown waits for the quill, so the finished Spark is never covered by
  // a reset clock that still says the day is over.
  const showCountdown = showHome && sparkComplete;

  const sparkChars = useMemo(
    () => (result?.spark?.message ? Array.from(result.spark.message) : []),
    [result],
  );

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

  /**
   * Fades out any cue that could outlive its action and then stops it. Called
   * when the cinematic finishes, when the day rolls over and on unmount, so no
   * thunder, crackle or boom continues after the animation has gone.
   */
  const stopEventAudio = useCallback((fadeMs = 320) => {
    const sounds = soundsRef.current;
    const activeInstances = eventSoundInstancesRef.current;
    SUSTAINED_EVENT_SOUNDS.forEach((key) => {
      const sound = sounds[key];
      const instances = activeInstances[key] ?? [];
      if (!sound || instances.length === 0) return;

      instances.forEach(({ id, volume }) => {
        let shouldScheduleStop = false;
        try {
          if (typeof sound.fade === 'function') {
            // Howler's id argument targets this cue instance and its authored gain.
            sound.fade(volume, 0, fadeMs, id);
            shouldScheduleStop = true;
          } else {
            sound.stop(id);
          }
        } catch {
          try {
            sound.stop(id);
          } catch {
            // Optional audio only.
          }
        }

        if (shouldScheduleStop) {
          const timer = window.setTimeout(() => {
            try {
              sound.stop(id);
            } catch {
              // Optional audio only.
            }
          }, fadeMs + 60);
          audioStopTimersRef.current.push(timer);
        }
      });
    });
    eventSoundInstancesRef.current = {};
  }, []);

  const persistLifecycle = useCallback(
    (
      nextResult: DailyResult | null,
      nextHistory: ReturnType<typeof emptyMeterHistory>,
      completed: boolean,
      duration: number,
      sparkDone: boolean,
    ) => {
      if (!nextResult) return;
      saveMeterState({
        result: nextResult,
        history: nextHistory,
        eventCompleted: completed,
        sparkCompleted: sparkDone,
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

  // Reduced motion is respected for the three spins, the landing flash, the
  // cinematic stage and the quill; the result is presented calmly instead.
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
  // and resumes only the stage that never finished: an unfinished cinematic
  // replays its event, a finished cinematic resumes the Spark writing, and a
  // finished Spark shows its completed message with the countdown.
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
      sparkCompletedRef.current = loaded.sparkCompleted === true;
      thunderRef.current = { count: 0, lastAt: 0, finalePlayed: false };

      setResult(saved);
      setMotion(settledMotion(saved));
      setIsRevealed(true);
      setNumberSettled(true);
      setColourSettled(true);
      setStageDuration(duration);
      setEventCompleted(completed);
      setAnnouncement(
        `Today's resonance is ${saved.percentage} percent. ${saved.tier.label}. ${saved.tier.message} Lucky Number ${saved.luckyNumber}. Lucky Colour ${saved.colour.name}.`,
      );

      if (loaded.sparkCompleted === true) {
        setSparkCharCount(Array.from(saved.spark.message).length);
        setSparkComplete(true);
      }

      if (!completed) {
        if (prefersReducedMotion()) {
          // Nothing is animated, so the reading and its Spark are complete.
          eventCompletedRef.current = true;
          sparkCompletedRef.current = true;
          setEventCompleted(true);
          setSparkCharCount(Array.from(saved.spark.message).length);
          setSparkComplete(true);
          auroraRef.current?.setPhase('settled', saved.event.name);
          saveMeterState({
            result: saved,
            history: loaded.history,
            eventCompleted: true,
            sparkCompleted: true,
            stageDurationMs: duration,
          });
        } else {
          // Resume the unfinished cinematic from the start of its event. The
          // result stays visible and Home remains hidden until it completes.
          setStageActive(true);
        }
      } else if (loaded.sparkCompleted !== true && !prefersReducedMotion()) {
        // The cinematic finished but the quill did not: finish the writing
        // rather than skipping the finale or replaying the event.
        setSparkWriting(true);
      } else if (loaded.sparkCompleted !== true && prefersReducedMotion()) {
        sparkCompletedRef.current = true;
        setSparkCharCount(Array.from(saved.spark.message).length);
        setSparkComplete(true);
        saveMeterState({
          result: saved,
          history: loaded.history,
          eventCompleted: true,
          sparkCompleted: true,
          stageDurationMs: duration,
        });
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
      stopEventAudio();
      resultRef.current = null;
      historyRef.current = emptyMeterHistory();
      stageDurationRef.current = 0;
      eventCompletedRef.current = false;
      sparkCompletedRef.current = false;
      thunderRef.current = { count: 0, lastAt: 0, finalePlayed: false };
      setResult(null);
      setMotion(initialMotion());
      setIsRevealing(false);
      setIsRevealed(false);
      setIsFlashing(false);
      setNumberSettled(false);
      setColourSettled(false);
      setStageActive(false);
      setEventCompleted(false);
      setSparkWriting(false);
      setSparkCharCount(0);
      setSparkComplete(false);
      setShareStatus('idle');
      setAnnouncement('');
      auroraRef.current?.setPhase('idle');
    }
  }, [ready, dateKey, result, clearSequence, stopEventAudio]);

  // Unload only the Howl instances this component created.
  useEffect(() => {
    return () => {
      clearSequence();
      visitsAbortRef.current?.abort();
      visitsAbortRef.current = null;
      if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);

      audioStopTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      audioStopTimersRef.current = [];

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
      // A cue that fails to load must never stop the reveal, but it should be
      // diagnosable in the field instead of failing silently.
      const onLoadError = (id: number, error: unknown) => {
        console.warn('Lucky Meter audio load failed:', id, error);
      };
      soundsRef.current = {
        buildup: new Howl({ src: ['/freesound_community-starship-rail-gun-charge-35904.mp3'], volume: 0.8, onloaderror: onLoadError }),
        impactMeteor: new Howl({ src: ['/dragon-studio-whoosh-cinematic-376875.mp3'], volume: 1.0, onloaderror: onLoadError }),
        impactLightning: new Howl({ src: ['/sounds/mixkit-cinematic-impact.mp3'], volume: 1.0, onloaderror: onLoadError }),
        fireworkBurst: new Howl({ src: ['/freesound_community-fireworks-1-94483.mp3'], onloaderror: onLoadError }),
        fireworkBurstAlt: new Howl({ src: ['/sounds/mixkit-magical-impact.mp3'], onloaderror: onLoadError }),
        willowCrackle: new Howl({ src: ['/sounds/mixkit-firework-crackle.mp3'], volume: 1.0, onloaderror: onLoadError }),
        fireworkLaunch: new Howl({ src: ['/sounds/mixkit-firework-whistle.mp3'], volume: 0.5, onloaderror: onLoadError }),
        finaleBoom: new Howl({ src: ['/sounds/lucky-meter-finale-boom.wav'], volume: 1.0, onloaderror: onLoadError }),
        thunderRumble: new Howl({ src: ['/sounds/lucky-meter-thunder-rumble.wav'], volume: 0.24, onloaderror: onLoadError }),
      };
    } catch (error) {
      // Audio is optional; a blocked or missing sound must never stop the reveal.
      console.warn('Lucky Meter audio unavailable; continuing without sound.', error);
    }
  }, []);

  const playEventCue = useCallback((cue: string) => {
    if (!isMountedRef.current || !isEventCue(cue)) return;
    const sounds = soundsRef.current;
    const play = (key: string, rate: number, volume: number) => {
      const sound = sounds[key];
      if (!sound) return;
      try {
        const id = sound.play();
        if (typeof sound.rate === 'function') sound.rate(rate, id);
        if (typeof sound.volume === 'function') sound.volume(volume, id);
        if (SUSTAINED_EVENT_SOUNDS.includes(key) && typeof id === 'number') {
          const instances = eventSoundInstancesRef.current[key] ?? [];
          instances.push({ id, volume });
          eventSoundInstancesRef.current[key] = instances;
        }
      } catch {
        // A failed cue never affects the visual sequence.
      }
    };

    // Normal strikes are capped at two. The finale has one reserved rumble slot,
    // while the same spacing guard prevents any two thunder cues from stacking.
    if (cue.startsWith('thunder-')) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const isFinaleThunder = cue === 'thunder-finale';
      if (isFinaleThunder && thunderRef.current.finalePlayed) return;
      if (!isFinaleThunder && thunderRef.current.count >= 2) return;
      if (thunderRef.current.count > 0 && now - thunderRef.current.lastAt < 2200) return;
      thunderRef.current = {
        count: thunderRef.current.count + 1,
        lastAt: now,
        finalePlayed: thunderRef.current.finalePlayed || isFinaleThunder,
      };
    }

    // One action, one sound. The cue map owns the rate and the mix, including
    // the layered, deeper finale boom.
    getCueLayers(cue).forEach((layer) => play(layer.sound, layer.rate, layer.volume));
  }, []);

  /** Persists "the quill finished" so a refresh keeps the completed message. */
  const markSparkComplete = useCallback(() => {
    sparkCompletedRef.current = true;
    setSparkComplete(true);
    setSparkWriting(false);
    persistLifecycle(
      resultRef.current,
      historyRef.current,
      eventCompletedRef.current,
      stageDurationRef.current,
      true,
    );
  }, [persistLifecycle]);

  // The GoldenLeaf types the Spark one character at a time, carrying its cursor
  // at the writing edge. Reduced motion shows the complete message at once.
  useEffect(() => {
    if (!sparkWriting || !result) return undefined;
    const chars = Array.from(result.spark.message);

    if (reducedMotion) {
      setSparkCharCount(chars.length);
      markSparkComplete();
      return undefined;
    }

    let index = 0;
    let cancelled = false;
    let timer = 0;
    setSparkCharCount(0);

    const tick = () => {
      if (cancelled) return;
      index += 1;
      setSparkCharCount(index);
      if (index < chars.length) {
        const character = chars[index - 1];
        timer = window.setTimeout(
          tick,
          /[.,!?:;]/.test(character)
            ? REVEAL_TIMING.sparkPunctuationPauseMs
            : REVEAL_TIMING.sparkMsPerCharacter,
        );
      } else {
        markSparkComplete();
      }
    };

    timer = window.setTimeout(tick, REVEAL_TIMING.sparkStartDelayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sparkWriting, result, reducedMotion, markSparkComplete]);

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
    sparkCompletedRef.current = false;
    thunderRef.current = { count: 0, lastAt: 0, finalePlayed: false };

    setHistory(nextHistory);
    saveMeterState({
      result: next,
      history: nextHistory,
      eventCompleted: false,
      sparkCompleted: false,
      stageDurationMs: duration,
    });

    setResult(next);
    setShareStatus('idle');
    setEventCompleted(false);
    setSparkWriting(false);
    setSparkCharCount(0);
    setSparkComplete(false);
    setAnnouncement('Preparing today’s resonance.');
    finalPercentageRef.current = next.percentage;
    dialSpinRef.current = buildDialSpin(next.percentage);
    numberSpinRef.current = buildNumberSpin(next.luckyNumber);
    colourSpinRef.current = buildColourSpin(next.colour.id);
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
      setMotion(settledMotion(next));
      setIsRevealing(false);
      setIsRevealed(true);
      setNumberSettled(true);
      setColourSettled(true);
      setSparkCharCount(Array.from(next.spark.message).length);
      setSparkComplete(true);
      sparkCompletedRef.current = true;
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.label}. ${next.tier.message} Lucky Number ${next.luckyNumber}. Lucky Colour ${next.colour.name}.`,
      );
      auroraRef.current?.setPhase('settled', next.event.name);
      // No cinematic and no quill run under reduced motion, so the reading is
      // complete immediately and Home plus the countdown may show.
      eventCompletedRef.current = true;
      setEventCompleted(true);
      persistLifecycle(next, nextHistory, true, duration, true);
      return;
    }

    const dialSpin = dialSpinRef.current;
    const numberSpin = numberSpinRef.current;
    const colourSpin = colourSpinRef.current;
    // The settled colour ring lands one whole number of turns later; setting
    // that exact angle avoids any visible snap at the landing frame.
    const settledColourRotation = colourSpin
      ? colourSpin.startRotation + colourSpin.totalSweep
      : settledMotion(next).colourRotation;

    setMotion({
      dialAngle: dialSpin ? dialSpin.startAngle : 0,
      // Read the starting frames from the motions themselves so the result is
      // never leaked a frame early.
      percentage: dialSpin
        ? sampleDialSpin(0, dialSpin, next.percentage).percentage
        : next.percentage,
      numberAngle: numberSpin ? numberSpin.startAngle : 0,
      number: numberSpin
        ? sampleNumberSpin(0, numberSpin, next.luckyNumber).number
        : next.luckyNumber,
      colourRotation: colourSpin ? colourSpin.startRotation : 0,
    });
    setIsRevealing(true);
    setIsRevealed(false);
    setNumberSettled(false);
    setColourSettled(false);
    setStageActive(false);
    auroraRef.current?.setPhase('awaken');
    schedule(() => auroraRef.current?.setPhase('gather'), 320);

    // One frame loop drives all three motions, and it stops itself as soon as
    // the last one settles. Nothing keeps rendering after the reveal.
    revealStartRef.current = performance.now();
    const step = () => {
      if (!isMountedRef.current) return;
      const elapsed = performance.now() - revealStartRef.current;
      const dialSample = dialSpinRef.current
        ? sampleDialSpin(elapsed, dialSpinRef.current, finalPercentageRef.current)
        : null;
      const numberSample = numberSpinRef.current
        ? sampleNumberSpin(elapsed, numberSpinRef.current, next.luckyNumber)
        : null;
      const colourSample = colourSpinRef.current
        ? sampleColourSpin(elapsed, colourSpinRef.current, next.colour.id)
        : null;

      setMotion((current) => ({
        dialAngle: dialSample ? dialSample.angle : current.dialAngle,
        percentage: dialSample ? dialSample.percentage : current.percentage,
        numberAngle: numberSample ? numberSample.angle : current.numberAngle,
        number: numberSample ? numberSample.number : current.number,
        colourRotation: colourSample ? colourSample.rotation : current.colourRotation,
      }));

      if (elapsed >= REVEAL_TIMING.spinMs) {
        rafRef.current = null;
        return;
      }
      rafRef.current = window.requestAnimationFrame(step);
    };
    rafRef.current = window.requestAnimationFrame(step);

    // Settle one: the percentage dial and the tier that it alone decides.
    schedule(() => {
      if (!isMountedRef.current) return;
      setIsRevealing(false);
      setIsRevealed(true);
      setMotion((current) => ({
        ...current,
        dialAngle: percentageToAngle(next.percentage),
        percentage: next.percentage,
      }));
      setIsFlashing(true);
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.label}. ${next.tier.message}`,
      );
      auroraRef.current?.setPhase('impact', next.event.name);

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
    }, REVEAL_TIMING.percentageSettleMs);

    schedule(
      () => setIsFlashing(false),
      REVEAL_TIMING.percentageSettleMs + REVEAL_TIMING.flashMs + 40,
    );

    // Settle two: the Lucky Number pointer stops on its own number.
    schedule(() => {
      if (!isMountedRef.current) return;
      setNumberSettled(true);
      setMotion((current) => ({
        ...current,
        numberAngle: luckyNumberToAngle(next.luckyNumber),
        number: next.luckyNumber,
      }));
    }, REVEAL_TIMING.numberSettleMs);

    // Settle three: the segmented colour ring stops on its colour and the
    // remaining result panels rise in.
    schedule(() => {
      if (!isMountedRef.current) return;
      setColourSettled(true);
      setMotion((current) => ({ ...current, colourRotation: settledColourRotation }));
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.label}. Lucky Number ${next.luckyNumber}. Lucky Colour ${next.colour.name}, ${next.colour.hex}.`,
      );
    }, REVEAL_TIMING.colourSettleMs);

    // Only after all three have settled does the percentage-selected cinematic
    // begin, exactly as before.
    schedule(
      () => setStageActive(true),
      REVEAL_TIMING.colourSettleMs + REVEAL_TIMING.eventDelayMs,
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
    // The animation is over; nothing it started may keep sounding.
    stopEventAudio();
    // Persist only after the event has actually completed, including the last
    // visible golden sparks. A refresh before this point resumes the event.
    persistLifecycle(
      resultRef.current,
      historyRef.current,
      true,
      stageDurationRef.current,
      false,
    );
    // The cinematic is finished, so the GoldenLeaf may now write the Spark.
    setSparkWriting(true);
  }, [persistLifecycle, stopEventAudio]);

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
  const hasDetails = isRevealed && Boolean(result);

  const ringSizeClasses = isCompact ? 'mt-2' : 'mt-3 sm:mt-4';
  const panelClass = 'lucky-panel rounded-2xl';

  /**
   * The countdown lives beneath Home, not inside the result panels, and only
   * after the quill has finished writing.
   */
  const countdownBlock = (
    <div className="lucky-countdown lucky-countdown--dock" data-testid="lucky-meter-countdown">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300/80">
        Next Resonance In
      </p>
      <div
        className="lucky-countdown__value text-lg tabular-nums sm:text-xl"
        aria-label="Time until daily reset"
      >
        {resetCountdown}
      </div>
    </div>
  );

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

      {/* Golden maple leaves: a far layer behind the scene and, on capable
          profiles, a near layer in front of the meter and its panels. */}
      {!reducedMotion && <LuckyMeterOrnaments reducedMotion={reducedMotion} />}

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
        <div className="lucky-home-dock fixed right-3 top-3 z-50 flex flex-col items-end gap-2 sm:right-5 sm:top-5">
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
          {showCountdown && countdownBlock}
        </div>
      )}

      <div
        className={`relative z-20 flex w-full flex-1 flex-col items-center ${
          isCompact
            ? 'justify-center px-2 pb-3 pt-6'
            : 'justify-start px-4 pb-5 pt-32 sm:justify-center sm:px-6 sm:pb-8 sm:pt-28'
        }`}
      >
        <div className={`flex w-full flex-col items-center ${isCompact ? '' : 'max-w-4xl'}`}>
          {totalVisits !== null && !isCompact && (
            <div className="mb-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 shadow-lg backdrop-blur-sm animate-fade-in text-slate-300 text-[11px] sm:text-xs tracking-widest uppercase">
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

          {/* The Little Spark finale is the first result on the page: after the
              cinematic, the GoldenLeaf writes it here and it stays visible. */}
          {hasDetails && result && (
            <section
              data-testid="lucky-spark-finale"
              data-state={sparkComplete ? 'written' : sparkWriting ? 'writing' : 'waiting'}
              className={`lucky-spark-finale relative w-full ${
                isCompact ? 'mb-2 mt-1' : 'mb-3 mt-1 max-w-2xl sm:mb-4'
              }`}
              aria-live="polite"
            >
              <div className="lucky-spark-finale__header">
                <span aria-hidden="true" className="lucky-spark-finale__rule" />
                <h2 className="lucky-spark-finale__label">Little Spark</h2>
                <span aria-hidden="true" className="lucky-spark-finale__rule" />
              </div>
              {/* Announced once, when the quill has finished, so assistive tech
                  hears the Spark at the same moment sighted visitors read it. */}
              {sparkComplete && <span className="sr-only">{result.spark.message}</span>}
              {sparkWriting || sparkComplete ? (
                <p
                  aria-hidden="true"
                  data-testid="lucky-spark-message"
                  className={`lucky-spark-finale__text ${
                    isCompact ? 'text-[13px]' : 'text-[15px] sm:text-lg'
                  }`}
                >
                  <span aria-hidden="true" className="lucky-spark-finale__mark">
                    “
                  </span>
                  {sparkChars.slice(0, sparkCharCount).join('')}
                  {sparkWriting && (
                    <span className="lucky-spark-quill" data-testid="lucky-spark-quill">
                      <GoldenLeaf className="lucky-spark-quill__leaf" />
                    </span>
                  )}
                  <span aria-hidden="true" className="lucky-spark-finale__mark">
                    ”
                  </span>
                </p>
              ) : (
                <p className="lucky-spark-finale__waiting" aria-hidden="true">
                  <span className="lucky-spark-finale__ink" />
                  The Spark is gathering
                </p>
              )}
            </section>
          )}

          <LuckyMeterRing
            phase={ringPhase}
            compact={isCompact}
            dialAngle={isRevealing || isRevealed ? motion.dialAngle : null}
            numberAngle={isRevealing || isRevealed ? motion.numberAngle : null}
            number={isRevealing || isRevealed ? motion.number : null}
            numberSettled={numberSettled}
            colourRotation={isRevealing || isRevealed ? motion.colourRotation : null}
            colourId={result?.colour.id ?? null}
            colourSettled={colourSettled}
            className={ringSizeClasses}
          >
            {isRevealing ? (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Today&apos;s Daily Resonance</h1>
                <p className="mb-2 text-[clamp(11px,1.4vh,13px)] uppercase tracking-[0.16em] text-amber-200/70">
                  Reading today&apos;s resonance
                </p>
                <div
                  data-testid="lucky-meter-value"
                  data-value={motion.percentage}
                  className="text-gold-gradient text-[clamp(1.9rem,7vh,4.25rem)] font-bold leading-none tabular-nums"
                >
                  {motion.percentage}
                  <span className="ml-0.5 align-top text-[0.42em]">%</span>
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-400 sm:text-[12px]">
                  The sky is listening
                </p>
              </div>
            ) : isRevealed && result ? (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Today&apos;s Daily Resonance</h1>
                <p className="mb-1 text-[clamp(11px,1.4vh,13px)] uppercase tracking-[0.16em] text-amber-200/65">
                  Daily Resonance
                </p>
                <div
                  data-testid="lucky-meter-value"
                  data-value={motion.percentage}
                  className={`text-gold-gradient font-bold leading-none tabular-nums ${
                    isCompact ? 'text-4xl' : 'text-[clamp(2rem,7vh,4.25rem)]'
                  } ${isFlashing ? 'animate-lucky-flash' : ''}`}
                >
                  {motion.percentage}
                  <span className="ml-0.5 align-top text-[0.42em]">%</span>
                </div>
                <div className="lucky-tier-plate mt-1.5">
                  <span aria-hidden="true" className="lucky-tier-plate__rule" />
                  <p className="lucky-tier-plate__label whitespace-nowrap">{result.tier.label}</p>
                  <span aria-hidden="true" className="lucky-tier-plate__rule" />
                </div>
                <p className="mt-1 w-full max-w-full text-[clamp(10px,1.15vh,12px)] leading-snug text-slate-200/85">
                  {result.tier.message}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Daily Resonance Ritual</h1>
                <p className="text-[12px] uppercase tracking-[0.2em] text-amber-200/60 sm:text-[13px]">
                  Daily Resonance
                </p>
                <span className="text-gold-gradient mt-1 text-4xl font-light leading-none tracking-[0.18em] sm:text-5xl">
                  —
                </span>
                <p className="mt-2 text-[12px] uppercase tracking-[0.16em] text-slate-400 sm:text-[13px]">
                  Awaiting the reading
                </p>
              </div>
            )}
          </LuckyMeterRing>

          {hasDetails && result && (
            <div className={`w-full ${isCompact ? 'mt-2' : 'mt-2 sm:mt-4'}`}>
              <div
                className={`mx-auto grid w-full grid-cols-2 gap-2 sm:gap-3 ${
                  isCompact ? 'max-w-[280px]' : 'max-w-2xl lg:grid-cols-3'
                } animate-resonance-rise`}
              >
                {numberSettled && (
                  <section
                    className={`${panelClass} col-span-1 p-2.5 sm:p-3`}
                    data-testid="lucky-number-panel"
                  >
                    <h2 className="lucky-panel-label text-[11px] uppercase sm:text-[12px]">
                      {LUCKY_NUMBER_LABEL}
                    </h2>
                    <p
                      className="lucky-number-value mt-1 text-[clamp(1.6rem,4vh,2.4rem)] font-bold leading-none tabular-nums"
                      data-testid="lucky-number-value"
                      data-value={result.luckyNumber}
                    >
                      {result.luckyNumber}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:text-[11px]">
                      1 – 50
                    </p>
                  </section>
                )}

                {colourSettled && (
                  <section
                    className={`${panelClass} col-span-1 p-2.5 sm:p-3`}
                    data-testid="lucky-colour-panel"
                  >
                    <h2 className="lucky-panel-label text-[11px] uppercase sm:text-[12px]">
                      {LUCKY_COLOUR_LABEL}
                    </h2>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`h-7 w-7 shrink-0 rounded-full border shadow-inner sm:h-8 sm:w-8 ${
                          isLightColour ? 'border-slate-500/70' : 'border-white/25'
                        }`}
                        style={{ backgroundColor: result.colour.hex }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-tight text-white sm:text-base">
                          {result.colour.name}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 sm:text-[12px]">
                          {result.colour.hex}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {colourSettled && (
                  <section
                    className={`${panelClass} col-span-2 p-2.5 sm:p-3 lg:col-span-1`}
                    data-testid="lucky-event-panel"
                  >
                    <h2 className="lucky-panel-label text-[11px] uppercase sm:text-[12px]">
                      Today&apos;s Event
                    </h2>
                    <p className="mt-0.5 text-[13px] font-semibold leading-tight text-white sm:text-base">
                      {result.event.name}
                    </p>
                    {stageActive && (
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-amber-200/80">
                        <span className="h-1 w-1 animate-pulse rounded-full bg-amber-300" />
                        Now playing
                      </p>
                    )}
                  </section>
                )}
              </div>

              {colourSettled && !isCompact && (
                <p className="mt-2 text-center text-[12px] leading-relaxed text-slate-400">
                  {ENTERTAINMENT_DISCLAIMER}
                </p>
              )}

              {colourSettled && (
                <div className="mt-2.5 flex w-full flex-col items-center">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="gold-3d-btn lucky-share-btn w-full rounded-full px-6 py-2.5 font-bold transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:w-auto"
                  >
                    <span className="gold-cta-emoji" aria-hidden="true">
                      ✦
                    </span>
                    {shareLabel}
                  </button>

                  {/* The widget has no Home dock, so its countdown stays inline
                      and appears on the same completed-Spark condition. */}
                  {isCompact && sparkComplete && (
                    <div className="mt-2">{countdownBlock}</div>
                  )}
                  {!isCompact && showCountdown && (
                    <p className="mt-2 hidden text-center text-[11px] text-slate-500 sm:block">
                      A new reading appears after local midnight.
                    </p>
                  )}
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

