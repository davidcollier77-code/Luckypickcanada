import React, { useEffect, useState } from 'react';

const RITUAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const RITUAL_STORAGE_KEY = 'lucky_meter_daily_ritual';

const luckyQuotes = [
  'Like an aurora over the North, your brightest moment can arrive when you least expect it.',
  'From coast to coast, every small hopeful step carries its own kind of Canadian magic.',
  'Let today unfold like a fresh trail after snowfall: open, bright, and full of possibility.',
  'A warm hello can travel farther than a Trans-Canada highway and open an unexpected door.',
  'Steady as a lighthouse on the Atlantic, trust the good direction you are taking.',
  'There is room for a little more joy in every season, even on the chilliest Canadian morning.',
  'Your next lucky turn can begin with the courage to try one small new thing.',
  'Like a maple leaf catching the light, your strengths are worth noticing today.',
  'Good things grow patiently, from prairie fields to the plans you tend with care.',
  'Carry your optimism forward; it is a warm companion on any journey across Canada.',
];

function getTierForScore(score) {
  if (score >= 67) return 'lm-tier-3';
  if (score >= 34) return 'lm-tier-2';
  return 'lm-tier-1';
}

function formatRemainingTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function getDifferentRandomIndex(length, previousIndex) {
  if (length <= 1) return 0;
  if (previousIndex < 0 || previousIndex >= length) return Math.floor(Math.random() * length);

  const nextIndex = Math.floor(Math.random() * (length - 1));
  return nextIndex >= previousIndex ? nextIndex + 1 : nextIndex;
}

function getDifferentEnergyLevel(previousEnergyLevel) {
  if (previousEnergyLevel < 0 || previousEnergyLevel > 100) return Math.floor(Math.random() * 101);

  const nextEnergyLevel = Math.floor(Math.random() * 100);
  return nextEnergyLevel >= previousEnergyLevel ? nextEnergyLevel + 1 : nextEnergyLevel;
}

function readSavedRitual() {
  try {
    const savedValue = window.localStorage.getItem(RITUAL_STORAGE_KEY);
    if (!savedValue) return null;

    const ritual = JSON.parse(savedValue);
    if (
      typeof ritual?.completedAt !== 'number'
      || typeof ritual?.energyLevel !== 'number'
      || ritual.energyLevel < 0
      || ritual.energyLevel > 100
      || typeof ritual?.quoteIndex !== 'number'
      || ritual.quoteIndex < 0
      || ritual.quoteIndex >= luckyQuotes.length
    ) {
      return null;
    }

    return ritual;
  } catch {
    return null;
  }
}

export default function LuckyMeter() {
  const [activeTier, setActiveTier] = useState('lm-tier-1');
  const [energyLevel, setEnergyLevel] = useState(50);
  const [dailyQuote, setDailyQuote] = useState('');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [lastRitual, setLastRitual] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedRitual = readSavedRitual();
    if (savedRitual) {
      setLastRitual(savedRitual);
      setEnergyLevel(savedRitual.energyLevel);
      setDailyQuote(luckyQuotes[savedRitual.quoteIndex]);
      setActiveTier(getTierForScore(savedRitual.energyLevel));
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!lastRitual) {
      setRemainingTime(0);
      return undefined;
    }

    const updateRemainingTime = () => {
      const nextRemainingTime = Math.max(0, lastRitual.completedAt + RITUAL_COOLDOWN_MS - Date.now());
      setRemainingTime(nextRemainingTime);
    };

    updateRemainingTime();
    const timer = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(timer);
  }, [lastRitual]);

  const isLocked = remainingTime > 0;

  const handleCalibration = () => {
    if (isCalibrating || isLocked) return;

    setIsCalibrating(true);

    window.setTimeout(() => {
      const previousEnergyLevel = lastRitual?.energyLevel ?? -1;
      const previousQuoteIndex = lastRitual?.quoteIndex ?? -1;
      const nextEnergyLevel = getDifferentEnergyLevel(previousEnergyLevel);
      const nextQuoteIndex = getDifferentRandomIndex(luckyQuotes.length, previousQuoteIndex);
      const nextRitual = {
        completedAt: Date.now(),
        energyLevel: nextEnergyLevel,
        quoteIndex: nextQuoteIndex,
      };

      window.localStorage.setItem(RITUAL_STORAGE_KEY, JSON.stringify(nextRitual));
      setLastRitual(nextRitual);
      setEnergyLevel(nextEnergyLevel);
      setDailyQuote(luckyQuotes[nextQuoteIndex]);
      setActiveTier(getTierForScore(nextEnergyLevel));
      setIsCalibrating(false);
    }, 2000);
  };

  return (
    <section id="lucky-meter" className="w-full py-16 flex flex-col items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes lucky-meter-vortex-drift {
          0%, 100% { transform: translate3d(-5%, -3%, 0) rotate(0deg) scale(1); opacity: 0.55; }
          50% { transform: translate3d(6%, 4%, 0) rotate(18deg) scale(1.16); opacity: 0.9; }
        }
        @keyframes lucky-meter-vortex-breathe {
          0%, 100% { transform: scale(0.88); opacity: 0.35; }
          50% { transform: scale(1.12); opacity: 0.76; }
        }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1a]/50 to-transparent pointer-events-none" />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-1/3 rounded-full blur-3xl bg-[radial-gradient(circle_at_35%_35%,rgba(34,211,238,0.28),transparent_27%),radial-gradient(circle_at_65%_60%,rgba(139,92,246,0.26),transparent_30%),radial-gradient(circle_at_50%_50%,rgba(250,204,21,0.16),transparent_38%)]" style={{ animation: 'lucky-meter-vortex-drift 14s ease-in-out infinite alternate' }} />
        <div className="absolute inset-[20%] rounded-full blur-2xl bg-[radial-gradient(circle,rgba(125,211,252,0.24),rgba(14,116,144,0.06)_42%,transparent_70%)]" style={{ animation: 'lucky-meter-vortex-breathe 7s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto text-center px-4">
        <h2 className="text-sm tracking-widest uppercase text-cyan-400 font-semibold mb-2">Daily Calibration</h2>
        <h3 className="text-3xl font-serif text-gold-400 text-[#ffd700] mb-8">Find Your Luck</h3>

        <div className={`relative w-64 h-64 rounded-full flex items-center justify-center mb-8 border-2 transition-all duration-700 ease-in-out ${isCalibrating ? 'animate-pulse border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]' : ''} ${!isCalibrating && activeTier === 'lm-tier-1' ? 'border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.3)]' : ''} ${!isCalibrating && activeTier === 'lm-tier-2' ? 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]' : ''} ${!isCalibrating && activeTier === 'lm-tier-3' ? 'border-[#ffd700] shadow-[0_0_40px_rgba(255,215,0,0.6)]' : ''}`}>
          <div className="absolute inset-2 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute inset-5 rounded-full bg-[radial-gradient(circle,rgba(186,230,253,0.18),rgba(8,47,73,0.24)_55%,transparent_72%)]" style={{ animation: 'lucky-meter-vortex-breathe 5s ease-in-out infinite' }} />
          <div className="relative text-center">
            <span className="block text-5xl font-bold text-white mb-2">{isCalibrating ? '...' : `${energyLevel}%`}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Energy Level</span>
          </div>
        </div>

        <button type="button" onClick={handleCalibration} disabled={!isReady || isCalibrating || isLocked} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
          {isCalibrating ? 'Calibrating...' : 'Generate Luck'}
        </button>

        {dailyQuote && <p className="mt-6 text-sm text-cyan-100 italic">“{dailyQuote}”</p>}

        <p className="mt-6 text-sm text-gray-400" aria-live="polite">
          {isLocked ? <>Next ritual available in: <span className="text-white font-mono">{formatRemainingTime(remainingTime)}</span></> : 'Your daily ritual is ready.'}
        </p>
      </div>
    </section>
  );
}
