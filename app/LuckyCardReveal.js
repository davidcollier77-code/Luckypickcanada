'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface CardItem {
  id: number;
  label: string;
  quote: string;
  category: string;
  isFlipped: boolean;
}

const INITIAL_CARDS: CardItem[] = [
  { 
    id: 1, 
    label: 'Card 1', 
    quote: 'Great things never came from comfort zones.', 
    category: 'Daily Inspiration', 
    isFlipped: false 
  },
  { 
    id: 2, 
    label: 'Card 2', 
    quote: 'The best way to predict the future is to create it.', 
    category: 'Motivation', 
    isFlipped: false 
  },
  { 
    id: 3, 
    label: 'Card 3', 
    quote: 'Every moment is a fresh beginning.', 
    category: 'Positivity', 
    isFlipped: false 
  },
];

export default function LuckyCardReveal() {
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);
  const [revealedCount, setRevealedCount] = useState<number>(0);

  const handleCardClick = (id: number) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === id && !card.isFlipped) {
          setRevealedCount((count) => count + 1);
          return { ...card, isFlipped: true };
        }
        return card;
      })
    );
  };

  const handleReset = () => {
    setCards(INITIAL_CARDS.map((card) => ({ ...card, isFlipped: false })));
    setRevealedCount(0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Feature</span>
          </div>
          <h2 className="text-2xl font-bold text-amber-300">Lucky Card Reveal</h2>
        </div>
        <div className="text-xs text-slate-400">
          Revealed: <span className="text-amber-400 font-semibold">{revealedCount}</span> / {cards.length}
        </div>
      </div>

      <p className="text-slate-400 text-sm">
        Tap any card below to flip it over and reveal your message for today!
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`group relative h-60 w-full cursor-pointer rounded-2xl border transition-all duration-500 [perspective:1000px] ${
              card.isFlipped
                ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'border-slate-800 hover:border-amber-500/40 bg-slate-950/60'
            }`}
          >
            <div
              className={`relative h-full w-full rounded-2xl transition-all duration-700 [transform-style:preserve-3d] ${
                card.isFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              {/* Card Front */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-5 flex flex-col items-center justify-center border border-amber-500/20 [backface-visibility:hidden]">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                </div>
                <span className="text-base font-bold text-slate-200">{card.label}</span>
                <span className="text-xs text-amber-400/80 mt-2">Tap to Reveal</span>
              </div>

              {/* Card Back */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 flex flex-col items-center justify-between border border-amber-500/40 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {card.category}
                </span>
                <p className="text-slate-100 font-medium italic text-sm leading-relaxed px-1">
                  "{card.quote}"
                </p>
                <span className="text-[10px] text-slate-500">luckypickcanada.ca</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reset Controls */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-all shadow-md active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Cards
        </button>
      </div>

    </div>
  );
}
