'use client';

import { useEffect, useState } from 'react';

const DAILY_FORTUNE_STORAGE_KEY = 'lucky_meter_daily_fortune';
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

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function readTodayFortune() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DAILY_FORTUNE_STORAGE_KEY));
    return saved?.date === todayKey() && typeof saved.quote === 'string' ? saved.quote : '';
  } catch {
    return '';
  }
}

export default function LuckyMeter({ onFortuneChange }) {
  const [fortune, setFortune] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    setFortune(readTodayFortune());
  }, []);

  useEffect(() => {
    onFortuneChange?.(fortune);
  }, [fortune, onFortuneChange]);

  function revealFortune() {
    if (fortune || isRevealing) return;

    setIsRevealing(true);
    window.setTimeout(() => {
      const quote = luckyQuotes[Math.floor(Math.random() * luckyQuotes.length)];
      window.localStorage.setItem(DAILY_FORTUNE_STORAGE_KEY, JSON.stringify({ date: todayKey(), quote }));
      setFortune(quote);
      setIsRevealing(false);
    }, 900);
  }

  return (
    <section id="lucky-meter" className="w-full" aria-labelledby="lucky-meter-heading">
      <style>{`
        @keyframes lucky-meter-reveal { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.12); } }
      `}</style>
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-[2rem] border border-[#ffe48d]/30 bg-[#0a192d]/70 px-5 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-sm sm:px-10 sm:py-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">Daily Lucky Meter</p>
          <h2 id="lucky-meter-heading" className="mt-3 font-serif text-3xl text-[#ffd700] sm:text-4xl">Your moment of possibility</h2>
          <img src="/copilot_image_1785515250260.jpeg" width="420" height="420" alt="Lucky Meter" className="mx-auto mt-3 w-full max-w-[340px]" style={isRevealing ? { animation: 'lucky-meter-reveal .9s ease-in-out infinite' } : undefined} />
          <button type="button" onClick={revealFortune} disabled={Boolean(fortune) || isRevealing} className="mt-3 min-h-[54px] rounded-full border border-[#ffe48d] bg-[linear-gradient(135deg,#4c2904,#c77a0e_21%,#f3c246_52%,#733e05)] px-8 py-3 text-sm font-black uppercase tracking-[.08em] text-[#1f1000] shadow-[0_0_30px_rgba(248,184,35,.45)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-default disabled:opacity-65">
            {isRevealing ? 'Revealing...' : fortune ? 'Today’s fortune revealed' : 'Reveal today’s fortune'}
          </button>
          <p className="mt-5 text-sm text-cyan-50/75" aria-live="polite">{fortune ? 'Return tomorrow for another message.' : 'One fortune is waiting for you today.'}</p>
        </div>
      </div>
    </section>
  );
}
