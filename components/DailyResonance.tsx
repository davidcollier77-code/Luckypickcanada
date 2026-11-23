'use client';

import Aurora, { AuroraHandle } from './Aurora';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import IntentPrefetchLink from './IntentPrefetchLink';

import ResonanceButton from './ResonanceButton';
import CosmicEventStage from './CosmicEventStage';
import LuckyMeterArrivalLeaves from './LuckyMeterArrivalLeaves';
import LuckyMeterMessage, { TierMessageState } from './LuckyMeterMessage';
import LuckyMeterSkyWriting from './LuckyMeterSkyWriting';
import LuckyMeterStage from './LuckyMeterStage';
import { playButtonClick } from '../app/lib/audio';
import { beginActiveExperience } from '../app/lib/resource-readiness';
import { useCreativeExperience } from '../app/lib/use-creative-experience';
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
  ARRIVAL_TOTAL_MS,
  CELEBRATION_MS,
  NUMBER_PAUSE_END_MS,
  PERCENTAGE_END_MS,
  PERCENTAGE_START_MS,
  POUR_END_MS,
  REVEAL_COMPLETE_MS,
  STORYBOARD_TIMING,
  WHEEL_END_MS,
  getDockMs,
  getMessageTypingMs,
} from '../app/lib/lucky-meter/storyboard';
import {
  buildColourSpin,
  colourPointerRotation,
  sampleColourSpin,
  sampleGenerationPercentage,
} from '../app/lib/lucky-meter/reveal';
import {
  getPaletteForSeasonKey,
  getSeasonForDateKey,
} from '../app/lib/lucky-meter/sparks-and-seasonal-colours';
import { shareDailyResult } from '../app/lib/lucky-meter/share';
import {
  ENTERTAINMENT_DISCLAIMER,
  LUCKY_NUMBER_LABEL,
  LUCKY_NUMBER_MAX,
  LUCKY_NUMBER_MIN,
} from '../app/lib/lucky-meter/config';
import {
  getCueLayers,
  isEventCue,
  SUSTAINED_EVENT_SOUNDS,
} from '../app/lib/lucky-meter/event-audio';
import {
  getLuckyMeterAudio,
  prepareLuckyMeterAudio,
  releaseLuckyMeterAudio,
} from '../app/lib/lucky-meter/audio';

interface ColourRecord {
  id: string;
  name: string;
  hex: string;
  light: boolean;
  texture?: { finish?: string; grain?: number; sheen?: number; highlight?: number };
}

interface DailyResult {
  dateKey: string;
  percentage: number;
  tier: { id: string; label: string; message: string };
  event: { id: string; name: string };
  luckyNumber: number;
  season?: string;
  colour: ColourRecord;
  spark: { id: string; message: string };
}

interface DailyResonanceProps {
  isCompact?: boolean;
}

type ShareStatus = 'idle' | 'copied' | 'failed';
type Stage = 'idle' | 'anticipating' | 'generating' | 'landed' | 'pouring' | 'revealed';
type VesselPhase = 'idle' | 'filling' | 'holding' | 'transferring' | 'settled';

/** The result lands as its own readable beat before the pour phase begins. */
const LANDED_BEAT_MS = 450;

interface RevealMotion {
  wheelAngle: number;
  percentage: number;
  numberReveal: number;
  /** How empty the selected chamber is; every other chamber stays full. */
  chamberDrain: number;
  /** How full the receiving vessel is. It rises during the pour and stays full. */
  vesselFill: number;
  /** The falling stream: only present while colour is arriving. */
  pour: number;
  /** The golden beam that carries the number to its display. */
  beam: number;
  /** The central decorative leaf's exit from the well. */
  leafExit: number;
}

function initialMotion(): RevealMotion {
  return {
    wheelAngle: 0,
    percentage: 0,
    numberReveal: 0,
    chamberDrain: 0,
    vesselFill: 0,
    pour: 0,
    beam: 0,
    leafExit: 0,
  };
}

function clampUnit(value: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

/**
 * Milliseconds allowed for the complete twelve-stage flow plus a generous margin.
 * The hold is released when the celebration actually completes; this only keeps
 * queued background work from starving if a stage never reports completion.
 */
const REVEAL_PROTECTION_SLACK_MS = 20_000;

/**
 * The Daily Resonance Lucky Meter.
 *
 * One complete reading is generated per local day and persisted to Local
 * Storage only. The colour wheel and the percentage count stop on the same
 * frame; the selected segment then opens, pours its colour into the Lucky
 * Colour result area and reveals the independent Lucky Number behind it. The
 * tier message is written above the meter, held and faded before the matching
 * existing celebration. Only after the Little Spark has been written does the
 * upper-right dock show Home and the countdown together.
 *
 * The percentage, Lucky Number, Lucky Colour and Little Spark are independent
 * draws. The wheel only displays the colour that was already chosen; it never
 * selects or changes a value.
 *
 * @param props - Component display options.
 * @param props.isCompact - Reduces layout spacing and hides the Home dock; defaults to false.
 */
export default function DailyResonance({ isCompact = false }: DailyResonanceProps) {
  const [result, setResult] = useState<DailyResult | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [vesselPhase, setVesselPhase] = useState<VesselPhase>('idle');
  const [motion, setMotion] = useState<RevealMotion>(initialMotion);
  const [isFlashing, setIsFlashing] = useState(false);
  const [numberFlashing, setNumberFlashing] = useState(false);
  const [numberSettled, setNumberSettled] = useState(false);
  const [colourSettled, setColourSettled] = useState(false);
  const [stageActive, setStageActive] = useState(false);
  const [stageDuration, setStageDuration] = useState(0);
  const [eventCompleted, setEventCompleted] = useState(false);
  const [messageState, setMessageState] = useState<TierMessageState>('hidden');
  const [messageSettled, setMessageSettled] = useState(false);
  const [sparkWriting, setSparkWriting] = useState(false);
  const [sparkComplete, setSparkComplete] = useState(false);
  const [dockReady, setDockReady] = useState(false);
  const [leavesCleared, setLeavesCleared] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [announcement, setAnnouncement] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [history, setHistory] = useState(emptyMeterHistory);

  // The Lucky Meter declares its renderer and sound set once in the visual
  // registry; the readiness hub prepares those resources automatically. The
  // activation path below still owns playback and the toolkit does not draw.
  useCreativeExperience('lucky-meter');
  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  const { ready, dateKey, formatted: resetCountdown } = useDailyResetCountdown();

  /** The quiet beat between the last leaf leaving and Start arriving. */
  const handleArrivalCleared = useCallback(() => {
    if (startRevealTimerRef.current !== null) return;
    startRevealTimerRef.current = window.setTimeout(() => {
      startRevealTimerRef.current = null;
      if (isMountedRef.current) setLeavesCleared(true);
    }, STORYBOARD_TIMING.startDelayMs);
  }, []);

  // A static fallback: if the arrival canvas cannot run at all, Start still
  // appears after the same total beat instead of being hidden forever.
  useEffect(() => {
    if (result || leavesCleared) return undefined;
    const timer = window.setTimeout(() => {
      if (isMountedRef.current) setLeavesCleared(true);
    }, ARRIVAL_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, [result, leavesCleared]);

  useEffect(
    () => () => {
      if (startRevealTimerRef.current !== null) {
        window.clearTimeout(startRevealTimerRef.current);
        startRevealTimerRef.current = null;
      }
    },
    [],
  );

  const auroraRef = useRef<AuroraHandle>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const shareTimerRef = useRef<number | null>(null);
  const wheelSpinRef = useRef<ReturnType<typeof buildColourSpin> | null>(null);
  const revealStartRef = useRef(0);
  const isMountedRef = useRef(true);
  const visitsAbortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<DailyResult | null>(null);
  const historyRef = useRef(emptyMeterHistory());
  const stageDurationRef = useRef(0);
  const eventCompletedRef = useRef(false);
  const messageCompletedRef = useRef(false);
  const sparkCompletedRef = useRef(false);
  const beginSequenceRef = useRef<
    | ((
        next: DailyResult,
        nextHistory: ReturnType<typeof emptyMeterHistory>,
        duration: number,
        options: { fresh: boolean },
      ) => void)
    | null
  >(null);
  const thunderRef = useRef({ count: 0, lastAt: 0, finalePlayed: false });
  const eventSoundInstancesRef = useRef<Record<string, Array<{ id: number; volume: number }>>>({});
  const audioStopTimersRef = useRef<number[]>([]);
  const revealProtectionRef = useRef<(() => void) | null>(null);
  const startRevealTimerRef = useRef<number | null>(null);
  const revealSafetyTimerRef = useRef<number | null>(null);

  const releaseRevealWindow = useCallback(() => {
    if (revealSafetyTimerRef.current !== null) {
      window.clearTimeout(revealSafetyTimerRef.current);
      revealSafetyTimerRef.current = null;
    }
    const release = revealProtectionRef.current;
    revealProtectionRef.current = null;
    release?.();
  }, []);

  const protectRevealWindow = useCallback(
    (safetyMs: number) => {
      if (typeof window === 'undefined' || revealProtectionRef.current) return;
      revealProtectionRef.current = beginActiveExperience('lucky-meter-reveal');
      revealSafetyTimerRef.current = window.setTimeout(
        releaseRevealWindow,
        Math.max(1000, safetyMs) + REVEAL_PROTECTION_SLACK_MS,
      );
    },
    [releaseRevealWindow],
  );

  const palette = useMemo(() => {
    if (result?.season) {
      const stored = getPaletteForSeasonKey(result.season);
      if (stored.length > 0) return stored as ColourRecord[];
    }
    if (result) {
      return (getSeasonForDateKey(result.dateKey)?.colours ?? []) as ColourRecord[];
    }
    // Before Start the wheel still shows the current season's twelve chambers,
    // so READY is the same object the reveal will use. This reads the local
    // date only; it never selects a colour.
    if (dateKey) {
      return (getSeasonForDateKey(dateKey)?.colours ?? []) as ColourRecord[];
    }
    return [];
  }, [result, dateKey]);

  const ringPhase =
    stage === 'generating' || stage === 'anticipating'
      ? 'spin'
      : stage === 'landed'
        ? 'landed'
        : stage === 'pouring'
          ? 'pouring'
          : stage === 'revealed'
            ? 'revealed'
            : 'idle';

  const isRevealed = stage === 'revealed';
  const hasDetails = stage === 'pouring' || stage === 'revealed';
  // Home sits in its usual top-right position from the moment the page opens,
  // including the server-rendered first paint: it is not gated behind a
  // hydration flag. Starting the reveal hides it at once; it returns together
  // with the countdown only after the Spark and the final hold are complete.
  // The countdown is never present at the beginning.
  const showHome = !isCompact && (dockReady || !result);
  const showCountdown = !isCompact && dockReady && !stageActive;

  const clearSequence = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timer = window.setTimeout(callback, Math.max(0, delayMs));
    timersRef.current.push(timer);
    return timer;
  }, []);

  /**
   * Fades out any cue that could outlive its action and then stops it. Called
   * when the cinematic finishes, when the day rolls over and on unmount.
   */
  const stopEventAudio = useCallback((fadeMs = 320) => {
    const sounds = getLuckyMeterAudio();
    if (!sounds) return;
    const activeInstances = eventSoundInstancesRef.current;
    SUSTAINED_EVENT_SOUNDS.forEach((key) => {
      const sound = sounds[key];
      const instances = activeInstances[key] ?? [];
      if (!sound || instances.length === 0) return;

      instances.forEach(({ id, volume }) => {
        let shouldScheduleStop = false;
        try {
          if (typeof sound.fade === 'function') {
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

  const playEventCue = useCallback((cue: string) => {
    if (!isMountedRef.current || !isEventCue(cue)) return;
    const sounds = getLuckyMeterAudio();
    if (!sounds) return;
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
    // while the spacing guard prevents any two thunder cues from stacking.
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

    getCueLayers(cue).forEach((layer) => play(layer.sound, layer.rate, layer.volume));
  }, []);

  const persistLifecycle = useCallback(
    (
      nextResult: DailyResult | null,
      nextHistory: ReturnType<typeof emptyMeterHistory>,
      flags: {
        eventCompleted?: boolean;
        messageCompleted?: boolean;
        sparkCompleted?: boolean;
        revealCompleted?: boolean;
      },
      duration: number,
    ) => {
      if (!nextResult) return;
      saveMeterState({
        result: nextResult,
        history: nextHistory,
        eventCompleted: flags.eventCompleted === true,
        messageCompleted: flags.messageCompleted === true,
        sparkCompleted: flags.sparkCompleted === true,
        revealCompleted: flags.revealCompleted === true,
        stageDurationMs: duration,
      });
    },
    [],
  );

  const markSparkComplete = useCallback(() => {
    sparkCompletedRef.current = true;
    setSparkComplete(true);
    setSparkWriting(false);
    const next = resultRef.current;
    persistLifecycle(
      next,
      historyRef.current,
      {
        revealCompleted: true,
        messageCompleted: true,
        eventCompleted: true,
        sparkCompleted: true,
      },
      stageDurationRef.current,
    );
    schedule(() => {
      if (isMountedRef.current) {
        setDockReady(true);
        playEventCue('dock-arrive');
      }
    }, STORYBOARD_TIMING.dockDelayMs);
  }, [persistLifecycle, playEventCue, schedule]);

  /** Starts the tier celebration after the message has settled. */
  const startCelebration = useCallback(
    (next: DailyResult, duration: number) => {
      if (!isMountedRef.current) return;
      messageCompletedRef.current = true;
      // The exact tier line stays visible at full opacity through the
      // celebration and the finished state. It is never hidden or faded again.
      setMessageState('holding');
      setMessageSettled(true);
      setStageActive(true);
      eventCompletedRef.current = false;
      setEventCompleted(false);
      persistLifecycle(
        next,
        historyRef.current,
        {
          revealCompleted: true,
          messageCompleted: true,
          eventCompleted: false,
          sparkCompleted: false,
        },
        duration,
      );
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.message} Lucky Number ${next.luckyNumber}. Lucky Colour ${next.colour.name}, ${next.colour.hex}.`,
      );
      auroraRef.current?.setPhase('gather');
    },
    [persistLifecycle],
  );

  /**
   * Writes the exact tier message above the meter, holds it long enough to read
   * and settles it visibly. The 800 ms settle replaces the old fade: the line
   * stays at full opacity from here on. Used by a fresh run and by a refresh
   * that landed after the reveal but before the message finished.
   */
  const beginMessagePhase = useCallback(
    (next: DailyResult, duration: number) => {
      const typingMs = getMessageTypingMs(next.tier.message);
      const writingStart = STORYBOARD_TIMING.messageDelayMs;
      const holdStart = writingStart + typingMs;
      const settleStart = holdStart + STORYBOARD_TIMING.messageHoldMs;
      const doneAt = settleStart + STORYBOARD_TIMING.messageSettleMs;

      schedule(() => {
        if (!isMountedRef.current) return;
        setMessageState('writing');
        setMessageSettled(false);
        playEventCue('message-write');
      }, writingStart);
      schedule(() => {
        if (isMountedRef.current) setMessageState('holding');
      }, holdStart);
      schedule(() => {
        if (isMountedRef.current) setMessageSettled(true);
      }, settleStart);
      schedule(
        () => startCelebration(next, duration),
        doneAt + STORYBOARD_TIMING.eventDelayMs,
      );
    },
    [playEventCue, schedule, startCelebration],
  );

  /**
   * Runs the reveal on one clock: the leaf exit, the wheel's own five-turn
   * 4,400 ms spin, the independent 9,400 ms percentage generation, the 2,000 ms
   * pour, the 1,500 ms number pause and the 1,500 ms golden-beam transfer.
   *
   * The wheel stops at 6,300 ms on the already-selected colour while the
   * percentage keeps its five-beat movement until 11,300 ms. The selected
   * chamber drains; every other chamber stays full and the receiving vessel
   * stays full after the pour. The stored values are only ever displayed.
   */
  const beginSequence = useCallback(
    (
      next: DailyResult,
      _nextHistory: ReturnType<typeof emptyMeterHistory>,
      duration: number,
      options: { fresh: boolean },
    ) => {
      const activePalette =
        getPaletteForSeasonKey(next.season || '').length > 0
          ? getPaletteForSeasonKey(next.season || '')
          : getSeasonForDateKey(next.dateKey)?.colours || [];
      const spin = buildColourSpin(next.colour.id, Math.random, activePalette);
      wheelSpinRef.current = spin;

      setStage('anticipating');
      setVesselPhase('idle');
      setMotion({
        wheelAngle: spin.startRotation,
        percentage: 0,
        numberReveal: 0,
        chamberDrain: 0,
        vesselFill: 0,
        pour: 0,
        beam: 0,
        leafExit: 0,
      });
      setNumberSettled(false);
      setColourSettled(false);
      setStageActive(false);
      setMessageState('hidden');
      setMessageSettled(false);
      setEventCompleted(false);
      eventCompletedRef.current = false;
      messageCompletedRef.current = false;
      sparkCompletedRef.current = false;
      setSparkComplete(false);
      setDockReady(false);
      auroraRef.current?.setPhase('awaken');
      schedule(() => auroraRef.current?.setPhase('gather'), 320);

      if (!options.fresh) {
        setAnnouncement('Preparing today’s resonance.');
      }

      const startedAt = performance.now();
      revealStartRef.current = startedAt;
      let finished = false;

      const finish = () => {
        if (finished || !isMountedRef.current) return;
        finished = true;
        if (rafRef.current !== null) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setMotion({
          wheelAngle: spin.endRotation,
          percentage: next.percentage,
          numberReveal: 1,
          chamberDrain: 1,
          vesselFill: 1,
          pour: 0,
          beam: 0,
          leafExit: 1,
        });
        setStage('revealed');
        setVesselPhase('settled');
        setNumberSettled(true);
        setNumberFlashing(!reducedMotion);
        setColourSettled(true);
        playEventCue('number-reveal');
        if (!reducedMotion) {
          schedule(
            () => {
              if (isMountedRef.current) setNumberFlashing(false);
            },
            STORYBOARD_TIMING.numberFlashMs * STORYBOARD_TIMING.numberFlashCount + 80,
          );
        }
        persistLifecycle(
          next,
          historyRef.current,
          {
            revealCompleted: true,
            messageCompleted: false,
            eventCompleted: false,
            sparkCompleted: false,
          },
          duration,
        );
        setAnnouncement(
          `Today's resonance is ${next.percentage} percent. ${next.tier.label}. Lucky Number ${next.luckyNumber}. Lucky Colour ${next.colour.name}, ${next.colour.hex}.`,
        );
        beginMessagePhase(next, duration);
      };

      // Stage hand-offs and audio cues are timers, so a throttled frame clock
      // can never skip a cue. The frame loop only samples the live values.
      schedule(() => {
        if (!isMountedRef.current) return;
        setStage('generating');
        playEventCue('wheel-start');
      }, PERCENTAGE_START_MS);
      schedule(() => {
        if (!isMountedRef.current) return;
        setIsFlashing(true);
        playEventCue('wheel-stop');
        schedule(() => setIsFlashing(false), STORYBOARD_TIMING.flashMs + 40);
      }, WHEEL_END_MS);
      schedule(() => {
        if (!isMountedRef.current) return;
        // The stored result appears on the exact frame its own window closes,
        // even if a throttled frame clock has not sampled the last value.
        setMotion((previous) => ({
          ...previous,
          wheelAngle: spin.endRotation,
          percentage: next.percentage,
        }));
        setStage('landed');
        setVesselPhase('filling');
        playEventCue('colour-pour');
        setAnnouncement(`Today's resonance is ${next.percentage} percent. ${next.tier.label}.`);
        auroraRef.current?.setPhase('impact', next.event.name);
      }, PERCENTAGE_END_MS);
      schedule(() => {
        if (isMountedRef.current) setStage('pouring');
      }, PERCENTAGE_END_MS + LANDED_BEAT_MS);
      schedule(() => {
        if (!isMountedRef.current) return;
        // The pour ends full and drains only the selected chamber. A timer owns
        // this hand-off so a paused frame loop can never leave the vessel short.
        setMotion((previous) => ({
          ...previous,
          chamberDrain: 1,
          vesselFill: 1,
          pour: 0,
        }));
        setVesselPhase('holding');
      }, POUR_END_MS);
      schedule(() => {
        if (isMountedRef.current) setVesselPhase('transferring');
      }, NUMBER_PAUSE_END_MS);
      schedule(finish, REVEAL_COMPLETE_MS + 20);

      const step = () => {
        if (!isMountedRef.current) return;
        const elapsedMs = performance.now() - startedAt;

        const leafExit = clampUnit(
          (elapsedMs - STORYBOARD_TIMING.anticipationMs) / STORYBOARD_TIMING.leafExitMs,
        );
        const wheelElapsed = Math.max(
          0,
          Math.min(STORYBOARD_TIMING.wheelMs, elapsedMs - PERCENTAGE_START_MS),
        );
        const wheel = sampleColourSpin(
          wheelElapsed,
          spin,
          next.colour.id,
          STORYBOARD_TIMING.wheelMs,
          activePalette,
        );
        const wheelAngle = elapsedMs >= WHEEL_END_MS ? spin.endRotation : wheel.rotation;
        const percentageElapsed = Math.max(
          0,
          Math.min(STORYBOARD_TIMING.percentageMs, elapsedMs - PERCENTAGE_START_MS),
        );
        const percentage =
          elapsedMs >= PERCENTAGE_END_MS
            ? next.percentage
            : sampleGenerationPercentage(
                percentageElapsed,
                STORYBOARD_TIMING.percentageMs,
                next.percentage,
              );
        const drain = clampUnit(
          (elapsedMs - PERCENTAGE_END_MS) / Math.max(1, STORYBOARD_TIMING.pourMs),
        );
        const pour =
          elapsedMs < PERCENTAGE_END_MS || elapsedMs > POUR_END_MS
            ? 0
            : clampUnit(Math.min(1, drain < 0.14 ? drain / 0.14 : (1 - drain) / 0.14));
        const transfer = clampUnit(
          (elapsedMs - NUMBER_PAUSE_END_MS) / Math.max(1, STORYBOARD_TIMING.transferMs),
        );

        setMotion({
          wheelAngle,
          percentage,
          chamberDrain: drain,
          vesselFill: drain,
          pour,
          beam: elapsedMs >= REVEAL_COMPLETE_MS ? 0 : transfer,
          numberReveal: transfer,
          leafExit,
        });

        if (elapsedMs >= REVEAL_COMPLETE_MS) {
          finish();
          return;
        }
        rafRef.current = window.requestAnimationFrame(step);
      };

      rafRef.current = window.requestAnimationFrame(step);
    },
    [beginMessagePhase, persistLifecycle, playEventCue, reducedMotion, schedule],
  );

  beginSequenceRef.current = beginSequence;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      releaseRevealWindow();
    };
  }, [releaseRevealWindow]);

  // Reduced motion is respected for the wheel, the pour, the message typing,
  // the cinematic and the sky writing; the reading is presented calmly instead.
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

  // Under reduced motion the leaves are a still composition, so Start is not
  // blocked by a breeze that will never arrive.
  useEffect(() => {
    if (reducedMotion) setLeavesCleared(true);
  }, [reducedMotion]);

  // Load today's persisted result. Refresh resumes exactly the stage that never
  // finished: the wheel and pour, the message, the celebration or the Spark.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localKey = getLocalDateKey();
    const loaded = loadMeterState();
    setHistory(loaded.history);
    historyRef.current = loaded.history;

    if (isResultForDate(loaded.result, localKey)) {
      const saved = loaded.result as DailyResult;
      // D12: every celebration is exactly 12,000 ms. A legacy stored duration
      // is deliberately ignored, so a refresh during the celebration restarts
      // the same celebration for its full length without re-timing the saved
      // percentage, Lucky Number, colour or tier.
      const duration = CELEBRATION_MS;
      const eventDone = loaded.eventCompleted === true;
      const messageDone = loaded.messageCompleted === true;

      resultRef.current = saved;
      stageDurationRef.current = duration;
      eventCompletedRef.current = eventDone;
      messageCompletedRef.current = messageDone;
      sparkCompletedRef.current = loaded.sparkCompleted === true;
      thunderRef.current = { count: 0, lastAt: 0, finalePlayed: false };

      setResult(saved);
      setMotion({
        wheelAngle: colourPointerRotation(
          saved.colour.id,
          getPaletteForSeasonKey(saved.season || '').length > 0
            ? getPaletteForSeasonKey(saved.season || '')
            : getSeasonForDateKey(saved.dateKey)?.colours || [],
        ),
        percentage: saved.percentage,
        numberReveal: 1,
        chamberDrain: 1,
        vesselFill: 1,
        pour: 0,
        beam: 0,
        leafExit: 1,
      });
      setNumberSettled(true);
      setColourSettled(true);
      setVesselPhase('settled');
      setStageDuration(duration);
      setEventCompleted(eventDone);
      setShareStatus('idle');
      setAnnouncement(
        `Today's resonance is ${saved.percentage} percent. ${saved.tier.label}. ${saved.tier.message} Lucky Number ${saved.luckyNumber}. Lucky Colour ${saved.colour.name}.`,
      );

      if (loaded.sparkCompleted === true) {
        setSparkComplete(true);
        setDockReady(true);
      }

      // A revealed reading keeps its exact tier line visible for the rest of
      // the day. If the refresh interrupted the writing, the replay path below
      // owns the message so the sentence never flashes complete before it is
      // typed again.
      if (loaded.revealCompleted === true && (messageDone || eventDone)) {
        setMessageState('holding');
        setMessageSettled(true);
      }

      if (prefersReducedMotion()) {
        // Nothing is animated, so the reading and its Spark are complete.
        eventCompletedRef.current = true;
        messageCompletedRef.current = true;
        sparkCompletedRef.current = true;
        setStage('revealed');
        setEventCompleted(true);
        setSparkComplete(true);
        setDockReady(true);
        // Reduced motion still shows the exact sentence, including for a
        // legacy payload that predates the lifecycle flags.
        setMessageState('holding');
        setMessageSettled(true);
        auroraRef.current?.setPhase('settled', saved.event.name);
        saveMeterState({
          result: saved,
          history: loaded.history,
          eventCompleted: true,
          messageCompleted: true,
          revealCompleted: true,
          sparkCompleted: true,
          stageDurationMs: duration,
        });
        return;
      }

      if (!eventDone) {
        if (loaded.revealCompleted !== true) {
          // Refresh during the wheel or the pour: replay both motions on the
          // stored values, then the message and the cinematic. Nothing is drawn.
          protectRevealWindow(getDockMs(saved.tier.message, duration, saved.spark.message));
          beginSequenceRef.current?.(saved, loaded.history, duration, { fresh: false });
        } else if (!messageDone) {
          // The pour completed but the message did not: write it now, then play
          // the celebration instead of skipping either.
          protectRevealWindow(getDockMs(saved.tier.message, duration, saved.spark.message));
          setStage('revealed');
          beginMessagePhase(saved, duration);
        } else {
          // Resume the unfinished cinematic from its first frame. The message
          // has already been written and stays visible through it.
          protectRevealWindow(getDockMs(saved.tier.message, duration, saved.spark.message));
          setStage('revealed');
          setStageActive(true);
          setMessageState('holding');
          setMessageSettled(true);
        }
      } else if (loaded.sparkCompleted !== true) {
        setStage('revealed');
        setSparkWriting(true);
      } else {
        setStage('revealed');
        setDockReady(true);
      }
    }
  }, []);

  // Roll over after local midnight, including in an already-open tab.
  useEffect(() => {
    if (!ready || !dateKey) return;
    if (result && result.dateKey !== dateKey) {
      clearSequence();
      stopEventAudio();
      releaseRevealWindow();
      resultRef.current = null;
      historyRef.current = emptyMeterHistory();
      stageDurationRef.current = 0;
      eventCompletedRef.current = false;
      messageCompletedRef.current = false;
      sparkCompletedRef.current = false;
      thunderRef.current = { count: 0, lastAt: 0, finalePlayed: false };
      setResult(null);
      setStage('idle');
      setMotion(initialMotion());
      setIsFlashing(false);
      setNumberSettled(false);
      setColourSettled(false);
      setStageActive(false);
      setEventCompleted(false);
      setMessageState('hidden');
      setMessageSettled(false);
      setSparkWriting(false);
      setSparkComplete(false);
      setDockReady(false);
      setLeavesCleared(true);
      setShareStatus('idle');
      setAnnouncement('');
      auroraRef.current?.setPhase('idle');
    }
  }, [ready, dateKey, result, clearSequence, stopEventAudio, releaseRevealWindow]);

  // Unload only the Howl instances this experience prepared.
  useEffect(() => {
    return () => {
      clearSequence();
      visitsAbortRef.current?.abort();
      visitsAbortRef.current = null;
      if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);

      audioStopTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      audioStopTimersRef.current = [];
      releaseLuckyMeterAudio();
    };
  }, [clearSequence]);

  /** Loads the shared Lucky Meter sound set on first activation. */
  const ensureRevealAudio = useCallback(async () => {
    if (getLuckyMeterAudio()) return;
    try {
      await prepareLuckyMeterAudio();
    } catch (error) {
      // Audio is optional; a blocked or missing sound must never stop the reveal.
      console.warn('Lucky Meter audio unavailable; continuing without sound.', error);
    }
  }, []);

  /** Reduced motion presents the completed reading and the dock at once. */
  const completeCalmly = useCallback(
    (next: DailyResult, nextHistory: ReturnType<typeof emptyMeterHistory>, duration: number) => {
      const activePalette =
        getPaletteForSeasonKey(next.season || '').length > 0
          ? getPaletteForSeasonKey(next.season || '')
          : getSeasonForDateKey(next.dateKey)?.colours || [];
      setStage('revealed');
      setMotion({
        wheelAngle: colourPointerRotation(next.colour.id, activePalette),
        percentage: next.percentage,
        numberReveal: 1,
        chamberDrain: 1,
        vesselFill: 1,
        pour: 0,
        beam: 0,
        leafExit: 1,
      });
      setNumberSettled(true);
      setNumberFlashing(false);
      setColourSettled(true);
      setVesselPhase('settled');
      // Reduced motion still shows the exact sentence; it appears whole and
      // remains visible for the finished state.
      setMessageState('holding');
      setMessageSettled(true);
      setEventCompleted(true);
      setSparkComplete(true);
      setDockReady(true);
      setLeavesCleared(true);
      eventCompletedRef.current = true;
      messageCompletedRef.current = true;
      sparkCompletedRef.current = true;
      setAnnouncement(
        `Today's resonance is ${next.percentage} percent. ${next.tier.label}. ${next.tier.message} Lucky Number ${next.luckyNumber}. Lucky Colour ${next.colour.name}.`,
      );
      auroraRef.current?.setPhase('settled', next.event.name);
      persistLifecycle(
        next,
        nextHistory,
        {
          revealCompleted: true,
          messageCompleted: true,
          eventCompleted: true,
          sparkCompleted: true,
        },
        duration,
      );
    },
    [persistLifecycle],
  );

  const handleReveal = useCallback(() => {
    if (stage !== 'idle' || result || typeof window === 'undefined') return;

    const localKey = ready && dateKey ? dateKey : getLocalDateKey();
    let next: DailyResult;
    try {
      next = createDailyResult({ dateKey: localKey, history }) as DailyResult;
    } catch (error) {
      console.error('Unable to prepare today’s resonance:', error);
      setAnnouncement('Today’s resonance could not be prepared. Please try again.');
      return;
    }
    const nextHistory = appendResultToHistory(history, next);
    const duration = CELEBRATION_MS;

    resultRef.current = next;
    historyRef.current = nextHistory;
    stageDurationRef.current = duration;
    eventCompletedRef.current = false;
    messageCompletedRef.current = false;
    sparkCompletedRef.current = false;
    thunderRef.current = { count: 0, lastAt: 0, finalePlayed: false };

    setHistory(nextHistory);
    saveMeterState({
      result: next,
      history: nextHistory,
      eventCompleted: false,
      messageCompleted: false,
      revealCompleted: false,
      sparkCompleted: false,
      stageDurationMs: duration,
    });

    setResult(next);
    setShareStatus('idle');
    setEventCompleted(false);
    setSparkWriting(false);
    setSparkComplete(false);
    setDockReady(false);
    setStageDuration(duration);
    clearSequence();
    setAnnouncement('Preparing today’s resonance.');

    void playButtonClick().catch(() => {});
    // Warm the shared set; the storyboard's own cue fires at generation start.
    void ensureRevealAudio();

    // Preserve the existing total-ritual counter.
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
      completeCalmly(next, nextHistory, duration);
      return;
    }

    protectRevealWindow(getDockMs(next.tier.message, duration, next.spark.message));
    beginSequence(next, nextHistory, duration, { fresh: true });
  }, [
    beginSequence,
    clearSequence,
    completeCalmly,
    dateKey,
    ensureRevealAudio,
    history,
    protectRevealWindow,
    ready,
    reducedMotion,
    result,
    stage,
  ]);

  const handleStageComplete = useCallback(() => {
    releaseRevealWindow();
    setStageActive(false);
    setEventCompleted(true);
    eventCompletedRef.current = true;
    messageCompletedRef.current = true;
    stopEventAudio();
    persistLifecycle(
      resultRef.current,
      historyRef.current,
      {
        revealCompleted: true,
        messageCompleted: true,
        eventCompleted: true,
        sparkCompleted: false,
      },
      stageDurationRef.current,
    );
    if (!sparkCompletedRef.current) {
      schedule(() => {
        if (!isMountedRef.current) return;
        setSparkWriting(true);
        playEventCue('spark-write');
      }, STORYBOARD_TIMING.sparkStartDelayMs);
    }
  }, [persistLifecycle, playEventCue, releaseRevealWindow, schedule, stopEventAudio]);

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

  const panelClass = 'lucky-panel rounded-2xl';
  const showSparkWriting = (sparkWriting || sparkComplete) && Boolean(result);

  const countdownBlock = (
    <div className="lucky-countdown lucky-countdown--dock" data-testid="lucky-meter-countdown">
      <p className="text-[12px] uppercase tracking-[0.18em] text-slate-300/80">
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

      {/* The resting scene: a few leaves sit at the edges, then the breeze
          carries them away and Start appears after a quiet beat. */}
      {!result && (
        <LuckyMeterArrivalLeaves onCleared={handleArrivalCleared} />
      )}

      {stageActive && result && (
        <CosmicEventStage
          eventId={result.event.id as 'meteor' | 'lightning' | 'fireworks'}
          durationMs={stageDuration}
          reducedMotion={reducedMotion}
          onCue={playEventCue}
          onComplete={handleStageComplete}
        />
      )}

      <div
        className={`relative z-20 flex w-full flex-1 flex-col items-center ${
          isCompact
            ? 'justify-center px-2 pb-3 pt-6'
            : `justify-start px-4 pb-5 ${
                result ? 'pt-32' : 'pt-24'
              } sm:justify-center sm:px-6 sm:pb-8 sm:pt-24`
        }`}
      >
        <div className={`flex w-full flex-col items-center ${isCompact ? '' : 'max-w-4xl'}`}>
          {totalVisits !== null && !isCompact && (
            <div className="mb-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 shadow-lg backdrop-blur-sm animate-fade-in text-slate-300 text-[12px] tracking-widest uppercase">
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

          {!result && stage === 'idle' && (
            <div className="flex w-full flex-col items-center text-center">
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
              {/* Start is present from the first frame but stays invisible and
                  untabbable until the breeze has cleared and the beat passed. */}
              <div
                data-testid="lucky-meter-start"
                data-ready={leavesCleared ? 'true' : 'false'}
                className={`mt-1 transition-opacity duration-700 ${
                  leavesCleared ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                {/* The button stays in the accessibility tree so it is never a
                    mystery control, but it cannot be clicked or tabbed to until
                    the breeze has cleared and the pause has passed. */}
                <ResonanceButton onClick={handleReveal} tabIndex={leavesCleared ? 0 : -1} />
              </div>
            </div>
          )}

          {/* The exact tier message is written above the meter, held, then
              settles visibly. It never fades: it stays at full opacity through
              the celebration and the finished state. */}
          <div
            className={`flex w-full flex-col items-center justify-end ${
              isCompact ? 'min-h-[3.2rem]' : 'min-h-[5.5rem] sm:min-h-[6.5rem]'
            }`}
          >
            {result && (
              <LuckyMeterMessage
                message={result.tier.message}
                state={messageState}
                settled={messageSettled}
                reducedMotion={reducedMotion}
                isCompact={isCompact}
              />
            )}

            {/* Frame 8: after the celebration, the maple-leaf cursor writes the
                Little Spark in the same reserved space. */}
            {showSparkWriting && result && (
              <LuckyMeterSkyWriting
                message={result.spark.message}
                state={sparkComplete ? 'written' : sparkWriting ? 'writing' : 'waiting'}
                reducedMotion={reducedMotion}
                isCompact={isCompact}
                onComplete={markSparkComplete}
              />
            )}
          </div>

          <LuckyMeterStage
            phase={ringPhase}
            compact={isCompact}
            wheelAngle={motion.wheelAngle}
            colours={palette}
            colourId={result?.colour?.id ?? null}
            colourSettled={colourSettled}
            number={
              hasDetails && (motion.numberReveal > 0 || numberSettled)
                ? result?.luckyNumber ?? null
                : null
            }
            numberSettled={numberSettled}
            numberReveal={motion.numberReveal}
            chamberDrain={motion.chamberDrain}
            // The landed beat is the result's first readable frame and the pour
            // has already begun; only the detail panels wait for "pouring".
            vesselFill={stage === 'landed' || hasDetails ? motion.vesselFill : 0}
            pour={stage === 'landed' || hasDetails ? motion.pour : 0}
            beam={motion.beam}
            leafExit={motion.leafExit}
            vesselPhase={vesselPhase}
            colour={result?.colour ?? null}
            showDetails={hasDetails}
            seasonName={result ? getSeasonForDateKey(result.dateKey)?.name ?? '' : ''}
            reducedMotion={reducedMotion}
            className={isCompact ? 'mt-2' : 'mt-3 sm:mt-4'}
          >
            {stage === 'anticipating' || stage === 'generating' ? (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Today&apos;s Daily Resonance</h1>
                {/* Stage 3: the plaque and its labels step aside, so the
                    percentage that generates from 5 to 100 sits alone in the
                    exact centre of the meter. */}
                <div
                  data-testid="lucky-meter-value"
                  data-value={motion.percentage}
                  data-plaque="hidden"
                  aria-label={`${motion.percentage} percent`}
                  className="text-gold-gradient flex items-center font-bold leading-none tabular-nums"
                  style={{ fontSize: isCompact ? '2.5rem' : 'clamp(2.4rem, 7.2vh, 4.3rem)' }}
                >
                  {motion.percentage}
                  <span className="ml-0.5 align-top text-[0.42em]">%</span>
                </div>
              </div>
            ) : stage === 'landed' || hasDetails ? (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Today&apos;s Daily Resonance</h1>
                <p className="lucky-meter-stage__label mb-1 text-[12px] uppercase tracking-[0.16em] text-amber-200/65">
                  Daily Resonance
                </p>
                <div
                  data-testid="lucky-meter-value"
                  data-value={motion.percentage}
                  className={`text-gold-gradient font-bold leading-none tabular-nums ${
                    isFlashing ? 'animate-lucky-flash' : ''
                  }`}
                  style={{ fontSize: isCompact ? '2.1rem' : 'clamp(2rem, 6.4vh, 3.9rem)' }}
                >
                  {motion.percentage}
                  <span className="ml-0.5 align-top text-[0.42em]">%</span>
                </div>
                <div className="lucky-tier-plate mt-1" data-testid="lucky-meter-plaque">
                  <span aria-hidden="true" className="lucky-tier-plate__rule" />
                  <p className="lucky-tier-plate__label whitespace-nowrap">{result?.tier.label}</p>
                  <span aria-hidden="true" className="lucky-tier-plate__rule" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center" data-testid="lucky-meter-center">
                <h1 className="sr-only">Daily Resonance Ritual</h1>
                <p className="lucky-meter-stage__label text-[12px] uppercase tracking-[0.2em] text-amber-200/60">
                  Daily Resonance
                </p>
                <span className="text-gold-gradient mt-1 text-4xl font-light leading-none tracking-[0.18em] sm:text-5xl">
                  —
                </span>
                <p className="lucky-meter-stage__label mt-1.5 text-[12px] uppercase tracking-[0.16em] text-slate-400">
                  Awaiting the reading
                </p>
              </div>
            )}
          </LuckyMeterStage>

          {hasDetails && result && (
            <div className={`w-full ${isCompact ? 'mt-2' : 'mt-2 sm:mt-3'}`}>
              <div
                className={`mx-auto grid w-full grid-cols-2 gap-2 sm:gap-3 ${
                  isCompact ? 'max-w-[320px]' : 'max-w-2xl'
                } animate-resonance-rise`}
              >
                {numberSettled && (
                  <section
                    className={`${panelClass} col-span-1 p-2.5 sm:p-3`}
                    data-testid="lucky-number-panel"
                  >
                    <h2 className="lucky-panel-label text-[12px] uppercase">
                      {LUCKY_NUMBER_LABEL}
                    </h2>
                    <p
                      className={`lucky-number-value mt-1 text-[clamp(1.6rem,4vh,2.4rem)] font-bold leading-none tabular-nums ${
                        numberFlashing ? 'animate-lucky-number-flash' : ''
                      }`}
                      data-testid="lucky-number-value"
                      data-value={result.luckyNumber}
                      data-flashing={numberFlashing ? 'true' : 'false'}
                    >
                      {result.luckyNumber}
                    </p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-slate-400">
                      1 – 50
                    </p>
                  </section>
                )}

                {colourSettled && (
                  <section
                    className={`${panelClass} col-span-1 p-2.5 sm:p-3`}
                    data-testid="lucky-event-panel"
                  >
                    <h2 className="lucky-panel-label text-[12px] uppercase">
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

              {isRevealed && !isCompact && (
                <p className="mt-2 text-center text-[12px] leading-relaxed text-slate-400">
                  {ENTERTAINMENT_DISCLAIMER}
                </p>
              )}

              {isRevealed && (
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

                  {isCompact && sparkComplete && (
                    <div className="mt-2">{countdownBlock}</div>
                  )}
                  {!isCompact && sparkComplete && (
                    <p className="mt-2 hidden text-center text-[12px] text-slate-500 sm:block">
                      A new reading appears after local midnight.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* The last row of the results panel. Home is here from the first
              paint, hides the moment the reveal starts, and returns with the
              daily countdown only after the Spark and the final hold. The row
              never carries one without the other at the end of the reading. */}
          {showHome && (
            <div
              data-testid="lucky-meter-dock"
              className="lucky-results-dock mt-3 flex w-full flex-col items-center justify-center gap-2 sm:mt-4 sm:flex-row sm:gap-3"
            >
              <IntentPrefetchLink
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
              </IntentPrefetchLink>
              {showCountdown && countdownBlock}
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
