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
        @keyframes lucky-meter-halo { 0%,100% { opacity:.52; transform:scale(.9); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes lucky-meter-artwork { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-8px) scale(1.015); } }
        @keyframes lucky-meter-reveal { 0%,100% { filter:drop-shadow(0 0 12px rgba(250,204,21,.3)); } 50% { filter:drop-shadow(0 0 38px rgba(250,204,21,.9)); } }
      `}</style>
      <div className="relative mx-auto flex max-w-xl flex-col items-center overflow-hidden rounded-[2rem] border border-[#ffe48d]/30 bg-[#0a192d]/70 px-5 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-sm sm:px-10 sm:py-14">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_30%_65%,rgba(139,92,246,.22),transparent_34%),radial-gradient(circle_at_65%_48%,rgba(250,204,21,.2),transparent_38%)]" />
        <div aria-hidden="true" className="absolute top-16 h-72 w-72 rounded-full bg-[#f3c246]/25 blur-3xl" style={{ animation: 'lucky-meter-halo 3.5s ease-in-out infinite' }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">Daily Lucky Meter</p>
          <h2 id="lucky-meter-heading" className="mt-3 font-serif text-3xl text-[#ffd700] sm:text-4xl">Your moment of possibility</h2>
          <img src="/lucky-meter.svg" width="420" height="420" alt="Lucky Meter gauge" className="mx-auto mt-3 w-full max-w-[340px]" style={{ animation: `${isRevealing ? 'lucky-meter-reveal .9s ease-in-out infinite' : 'lucky-meter-artwork 4s ease-in-out infinite'}` }} />
          <button type="button" onClick={revealFortune} disabled={Boolean(fortune) || isRevealing} className="mt-3 min-h-[54px] rounded-full border border-[#ffe48d] bg-[linear-gradient(135deg,#4c2904,#c77a0e_21%,#f3c246_52%,#733e05)] px-8 py-3 text-sm font-black uppercase tracking-[.08em] text-[#1f1000] shadow-[0_0_30px_rgba(248,184,35,.45)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-default disabled:opacity-65">
            {isRevealing ? 'Revealing...' : fortune ? 'Today’s fortune revealed' : 'Reveal today’s fortune'}
          </button>
          <p className="mt-5 text-sm text-cyan-50/75" aria-live="polite">{fortune ? 'Return tomorrow for another message.' : 'One fortune is waiting for you today.'}</p>
        </div>
      </div>
    </section>
  );
}
