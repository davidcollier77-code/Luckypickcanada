'use client';

import Link from 'next/link';
import LuckyCardReveal from '../lucky-card-reveal';
import CollectionBinder from '../collection-binder';

export default function RevealClient() {
  return (
    <div className="lucky-site-shell homepage-experience flex flex-col pt-24 pb-12">
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="homepage-section-heading mb-8">
          <p>A daily moment of possibility</p>
          <h1 id="cards-heading">Today’s Lucky Moment</h1>
          <span>Open one collectible card each day for a calm spark of encouragement. Can you collect all 10?</span>
        </div>

        <LuckyCardReveal />
        <CollectionBinder />

        <div className="mt-12 flex justify-center w-full max-w-sm px-4">
          <Link
            href="/"
            className="w-full text-center px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
