'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import FortuneCookie from '../../components/fortune-cookie';
import LuckyMeter from '../../components/luck-meter';

export default function LuckyMeterPage() {
  const [fortune, setFortune] = useState('');
  const handleFortuneChange = useCallback((nextFortune) => setFortune(nextFortune), []);

  return (
    <main className="lucky-site-shell min-h-screen overflow-hidden bg-[#07121b] text-white">
      <nav className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8" aria-label="Primary navigation">
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.08em] text-[#fff8dd] no-underline">
          <img src="/BackgroundEraser_20260724_163638777.png" alt="" width="44" height="44" />
          Lucky Pick Canada
        </Link>
        <Link href="/" className="text-xs font-bold uppercase tracking-[0.12em] text-[#ffe483] no-underline hover:text-white">Back home</Link>
      </nav>

      <div className="relative isolate">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_12%,rgba(255,209,84,0.2),transparent_19%),radial-gradient(ellipse_at_14%_54%,rgba(77,190,139,0.23),transparent_32%),radial-gradient(ellipse_at_86%_42%,rgba(117,82,220,0.24),transparent_34%)]" />
        <header className="mx-auto max-w-2xl px-5 pt-10 text-center sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#fbdfa0]">Your daily ritual</p>
          <h1 className="mt-3 font-serif text-4xl font-black text-[#f8cf64] drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:text-5xl">Reveal today’s luck</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-cyan-50/85">Take a quiet moment to calibrate your luck, then receive the fortune selected for today.</p>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-24 pt-8 sm:pt-12">
          <LuckyMeter onFortuneChange={handleFortuneChange} />
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#f3c246]/70 to-transparent" />
          <div className="mt-14 w-full">
            <FortuneCookie fortune={fortune} />
          </div>
        </div>
      </div>
    </main>
  );
}
