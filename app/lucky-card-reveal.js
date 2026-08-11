'use client';

import React, { useState } from 'react';

// --- Card Data ---
const CARDS = [
  { id: 1, title: "Abundance", value: "🌟 777", description: "Positive energy and good fortune are flowing your way today." },
  { id: 2, title: "Serendipity", value: "🍀 Lucky Clover", description: "An unexpected pleasant surprise or encounter awaits you." },
  { id: 3, title: "Harmony", value: "✨ High Vibe", description: "Your calm focus and positive mindset attract great results." },
  { id: 4, title: "Opportunity", value: "🚀 Open Door", description: "Keep your eyes open for an exciting fresh idea today." }
];

export default function LuckyCardReveal() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const triggerCardDraw = (card) => {
    if (isFlipping) return;
    setIsFlipping(true);
    
    setTimeout(() => {
      setSelectedCard(card);
      setIsFlipping(false);
    }, 300);
  };

  const handleReset = () => {
    setSelectedCard(null);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg text-center space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-amber-400">Daily Lucky Card Reveal</h3>
        <p className="text-slate-300 text-sm">
          Select a card below to reveal your daily message of inspiration and good fortune!
        </p>
      </div>

      {!selectedCard ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md mx-auto">
          {CARDS.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => triggerCardDraw(card)}
              disabled={isFlipping}
              className={`aspect-[2/3] bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-500/40 hover:border-amber-400 rounded-xl p-3 flex flex-col items-center justify-center text-amber-300 font-bold transition-all transform hover:-translate-y-1 active:scale-95 shadow-md ${
                isFlipping ? 'animate-pulse opacity-60' : ''
              }`}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <span className="text-3xl mb-1">🍁</span>
              <span className="text-xs font-semibold text-slate-300">Card {index + 1}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-5 animate-in fade-in zoom-in duration-300">
          <div className="bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border-2 border-amber-400 rounded-xl p-6 shadow-xl space-y-3">
            <div className="text-4xl">{selectedCard.value.split(" ")[0]}</div>
            <h4 className="text-lg font-bold text-amber-300">{selectedCard.title}</h4>
            <p className="text-sm text-slate-200 italic">{selectedCard.description}</p>
            <div className="text-xs font-mono text-amber-400/80 pt-3 border-t border-slate-800/80">
              {selectedCard.value}
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-sm font-semibold border border-amber-500/30 transition-all shadow-sm"
            style={{ position: 'relative', zIndex: 1 }}
          >
            Pick Another Card 🔄
          </button>
        </div>
      )}
    </div>
  );
