'use client';

import Link from 'next/link';
import LuckyCardReveal from '../lucky-card-reveal';
import CollectionBinder from '../collection-binder';

export default function RevealClient() {
  return (
    <div className="lucky-site-shell homepage-experience flex flex-col pt-32 pb-12">
      <div className="aurora-container">
        <div className="aurora-layer aurora-layer-1"></div>
        <div className="aurora-layer aurora-layer-2"></div>
        <div className="aurora-layer aurora-layer-3"></div>
        <div className="aurora-layer aurora-layer-4"></div>
      </div>
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto mb-8 px-6 py-6 mt-8 relative z-20 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <h1 id="cards-heading" className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' }}>Today’s Lucky Card</h1>
          <span className="text-lg md:text-xl text-white/95 font-medium leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)' }}>A new Lucky Card awaits your collection.</span>
        </div>

        <LuckyCardReveal />
        <CollectionBinder />

        <div className="mt-12 flex justify-center w-full max-w-sm px-4">
          <Link
            href="/"
            className="w-full text-center px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition-all duration-300 shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
