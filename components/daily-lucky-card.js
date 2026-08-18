import React from 'react';
import Image from 'next/image';

export default function DailyLuckyCard({ cardData, timeRemaining, quote }) {
  return (
    <section className="w-full max-w-sm mx-auto px-4 py-6 flex flex-col items-center text-center space-y-4">
      {/* Section Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-300/80 font-medium">
          A Daily Moment of Possibility
        </span>
        <h2 className="text-2xl font-serif font-bold text-amber-100 mt-1">
          Today's Lucky Moment
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-snug">
          Open one collectible card each day for a calm spark of encouragement. Can you collect all 10?
        </p>
      </div>

      {/* Timer */}
      <div className="text-xs tracking-wide text-slate-400">
        Resets in: <span className="text-slate-200 font-mono">{timeRemaining || '19h 14m 10s'}</span>
      </div>

      {/* Card Component / 3D Flip Wrapper */}
      <div className="flip-card-wrapper z-10 w-full max-w-[280px] aspect-[5/7] mx-auto relative">
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          <Image
            src={cardData?.imageSrc || "/images/cards/coast-to-coast.png"}
            alt={cardData?.title || "Daily Collectible Card"}
            fill
            className="object-contain"
            style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'high-quality' }}
            priority
            sizes="(max-width: 640px) 260px, 280px"
          />
        </div>
      </div>

      {/* Bottom Quote Box */}
      <div className="w-full max-w-[320px] rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4 text-center">
        <blockquote className="font-serif italic text-sm text-slate-100 leading-relaxed">
          "{quote?.text || 'From sea to sea, every journey holds a story of unexpected fortune waiting to unfold.'}"
        </blockquote>
      </div>
    </section>
  );
}
