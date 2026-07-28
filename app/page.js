'use client';

import React from 'react';
import Link from 'next/link';
import LuckyCardReveal from './lucky-card-reveal';

// --- Style Constants ---
const PRIMARY_GOLD = "text-amber-400";
const SECONDARY_GOLD = "text-amber-300";
const CARD_BG = "bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg";
const BUTTON_STYLE = "inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md";

// --- Quote Data ---
const luckyQuotes = [
  "Your positive energy creates your own luck every day.",
  "Small acts of kindness bring immense fortune.",
  "Luck is what happens when preparation meets opportunity.",
  "Happiness is not by chance, but by choice.",
  "Every daily step forward brings you closer to your goals.",
  "Positivity is a magnet for good fortune."
];

export default function HomePage() {
  const dailyQuote = luckyQuotes[0];

  return (
    // Updated to use the shell class from globals.css to restore the intended aesthetic
    <main className="lucky-site-shell">
      
      {/* 1. Header Section */}
      <header className="text-center space-y-3 py-6 border-b border-slate-800/60">
        <img 
          src="/BackgroundEraser_20260724_163638777.png" 
          alt="Official Lucky Pick Canada Logo" 
          className="mx-auto mb-2"
          style={{ maxWidth: '180px', width: '100%' }}
        />
        <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${PRIMARY_GOLD}`}>
          Your Luck, Personalized!
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Discover your luck with LuckyPickCanada's Lucky Meter, personalized picks, and share your stories across Canada.
        </p>
        <p className="text-xs text-amber-300/80 italic mt-2">
          Today's Thought: "{dailyQuote}"
        </p>
      </header>

      {/* 2. Lucky Meter Callout */}
      <section className={`${CARD_BG} space-y-4`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
          Start your luck meter
        </h2>
        <p className="text-slate-300 text-sm">
          Test your daily energy and see where your luck stands today!
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#lucky-meter" className={BUTTON_STYLE}>
            Try the FREE Lucky Meter
          </a>
        </div>
      </section>

      {/* 3. Card Reveal Section */}
      <section className="space-y-4">
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
          Card Reveal
        </h2>
        <LuckyCardReveal />
      </section>

      {/* 3.5 Lucky Meter Section (anchor target) */}
      <section id="lucky-meter" className={`${CARD_BG} space-y-4 scroll-mt-20`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
          Lucky Meter
        </h2>
        <p className="text-slate-300 text-sm">
          Your personalized Lucky Meter is coming soon. Check back to measure today's luck!
        </p>
      </section>

      {/* 4. Lucky Journey Section */}
      <section className={`${CARD_BG} space-y-6`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
          Start your lucky journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Items content here... */}
        </div>
      </section>

      {/* 6. Community Footer */}
      <section className={`${CARD_BG} text-center space-y-6`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
          Help make Lucky Pick Canada better
        </h2>
        <div className="space-y-4 pt-2">
          <h2 className="text-xl font-semibold text-slate-100">
            Join the LuckyPick Canada Community
          </h2>
          <a 
            href="https://www.facebook.com/share" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-[1.02]"
          >
            <img 
              src="/facebook-community-cover.png" 
              alt="Lucky Pick Canada Community" 
              className="rounded-xl border border-slate-700 w-full max-w-sm h-auto mx-auto shadow-md"
            />
          </a>
        </div>
      </section>

    </main>
  );
}
