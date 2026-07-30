import React, { useEffect, useState } from 'react';

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

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimeUntilLocalMidnight(now = new Date()) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

function readSavedRitual() {
  try {
    const savedValue = window.localStorage.getItem(RITUAL_STORAGE_KEY);
    if (!savedValue) return null;

    const ritual = JSON.parse(savedValue);
    if (
      typeof ritual?.completedAt !== 'number'
      || (typeof ritual?.calibrationDate !== 'undefined'
        && (typeof ritual.calibrationDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ritual.calibrationDate)))
      || typeof ritual?.energyLevel !== 'number'
      || ritual.energyLevel < 0
      || ritual.energyLevel > 100
      || typeof ritual?.quoteIndex !== 'number'
      || ritual.quoteIndex < 0
      || ritual.quoteIndex >= luckyQuotes.length
    ) {
      return null;
    }

    return {
      ...ritual,
      calibrationDate: ritual.calibrationDate ?? getLocalDateKey(new Date(ritual.completedAt)),
    };
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
      const isCompletedToday = lastRitual.calibrationDate === getLocalDateKey();
      setRemainingTime(isCompletedToday ? getTimeUntilLocalMidnight() : 0);
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
      const completedAt = Date.now();
      const nextRitual = {
        completedAt,
        calibrationDate: getLocalDateKey(new Date(completedAt)),
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
          0%, 100% { transform: translate3d(-9%, -7%, 0) rotate(0deg) scale(0.96); opacity: 0.62; }
          50% { transform: translate3d(10%, 8%, 0) rotate(48deg) scale(1.3); opacity: 1; }
        }
        @keyframes lucky-meter-vortex-breathe {
          0%, 100% { transform: scale(0.78) rotate(0deg); opacity: 0.42; }
          50% { transform: scale(1.24) rotate(-24deg); opacity: 0.96; }
        }
        @keyframes lucky-meter-vortex-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.36), 0 0 42px rgba(139, 92, 246, 0.18); }
          50% { box-shadow: 0 0 38px rgba(34, 211, 238, 0.78), 0 0 76px rgba(139, 92, 246, 0.54), 0 0 108px rgba(250, 204, 21, 0.28); }
        }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1a]/50 to-transparent pointer-events-none" />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -inset-1/3 rounded-full blur-3xl saturate-150 contrast-125 bg-[radial-gradient(circle_at_35%_35%,rgba(34,211,238,0.46),transparent_27%),radial-gradient(circle_at_65%_60%,rgba(139,92,246,0.44),transparent_30%),radial-gradient(circle_at_50%_50%,rgba(250,204,21,0.3),transparent_38%)]" style={{ animation: 'lucky-meter-vortex-drift 4s cubic-bezier(0.45, 0, 0.55, 1) infinite' }} />
        <div className="absolute inset-[16%] rounded-full blur-2xl saturate-150 contrast-125 bg-[radial-gradient(circle,rgba(125,211,252,0.46),rgba(14,116,144,0.14)_42%,transparent_70%)]" style={{ animation: 'lucky-meter-vortex-breathe 4s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto text-center px-4">
        <h2 className="text-sm tracking-widest uppercase text-cyan-400 font-semibold mb-2">Daily Calibration</h2>
        <h3 className="text-3xl font-serif text-gold-400 text-[#ffd700] mb-8">Find Your Luck</h3>

        <div className={`relative w-64 h-64 rounded-full flex items-center justify-center mb-8 border-2 transition-all duration-700 ease-in-out ${isCalibrating ? 'border-cyan-300' : ''} ${!isCalibrating && activeTier === 'lm-tier-1' ? 'border-gray-400' : ''} ${!isCalibrating && activeTier === 'lm-tier-2' ? 'border-cyan-300' : ''} ${!isCalibrating && activeTier === 'lm-tier-3' ? 'border-[#ffe48d]' : ''}`} style={{ animation: 'lucky-meter-vortex-pulse 4s ease-in-out infinite' }}>
          <div className="absolute inset-2 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute inset-5 rounded-full bg-[radial-gradient(circle,rgba(186,230,253,0.18),rgba(8,47,73,0.24)_55%,transparent_72%)]" style={{ animation: 'lucky-meter-vortex-breathe 4s ease-in-out infinite' }} />
          <div className="relative text-center">
            <span className="block text-5xl font-bold text-white mb-2">{isCalibrating ? '...' : `${energyLevel}%`}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Energy Level</span>
          </div>
        </div>

        <button type="button" onClick={handleCalibration} disabled={!isReady || isCalibrating || isLocked} className="min-h-[54px] px-8 py-3 border border-[#ffe48d] rounded-[7px] bg-[linear-gradient(135deg,#4c2904,#c77a0e_21%,#f3c246_52%,#733e05)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_0_0_3px_rgba(120,67,5,0.65),0_0_26px_rgba(248,184,35,0.56),0_15px_28px_rgba(0,0,0,0.5)] text-[#1f1000] font-black text-sm tracking-[0.07em] uppercase transition-[transform,filter,opacity] duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:-translate-y-0.5 focus-visible:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:brightness-100">
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
