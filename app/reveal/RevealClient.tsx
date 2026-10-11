'use client';

import LuckyCardReveal from '../lucky-card-reveal';

export default function RevealClient() {
  return (
    <div className="flex flex-col pt-8 pb-4 md:pt-32 md:pb-12">

      <div className="flex-1 w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-6 mt-4 md:mb-12 md:mt-10 relative z-20 px-4">
          <h1 id="cards-heading" className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70 mb-4 tracking-tighter drop-shadow-2xl" style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>Today’s Lucky Card</h1>
          <span className="text-lg md:text-2xl text-white/80 font-medium leading-relaxed tracking-wide" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.9)' }}>A new Lucky Card awaits your collection.</span>
        </div>

        <LuckyCardReveal />
      </div>
    </div>
  );
}
