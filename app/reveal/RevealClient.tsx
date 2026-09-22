'use client';

import Link from 'next/link';
import LuckyCardReveal from '../lucky-card-reveal';

export default function RevealClient() {
  return (
    <div className="flex flex-col pt-8 pb-4 md:pt-32 md:pb-12">

      <div className="flex-1 w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto mb-4 mt-2 md:mb-8 md:mt-8 relative z-20">
          <h1 id="cards-heading" className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' }}>Today’s Lucky Card</h1>
          <span className="text-lg md:text-xl text-white/95 font-medium leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)' }}>A new Lucky Card awaits your collection.</span>
        </div>

        <LuckyCardReveal />
      </div>
    </div>
  );
}
