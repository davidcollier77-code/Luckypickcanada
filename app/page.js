'use client';

import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import Link from 'next/link';
import LuckyCardReveal from './lucky-card-reveal';

// --- Style Constants ---
const PRIMARY_GOLD = "text-amber-400";
const SECONDARY_GOLD = "text-amber-300";
const CARD_BG = "bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg";
const BUTTON_STYLE = "inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md";

export default function HomePage() {
  // --- New State for Stories ---
  const [recentStories, setRecentStories] = useState([]);

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch('/api/lucky-stories');
        const data = await response.json();
        if (data.recentStories) {
          setRecentStories(data.recentStories);
        }
      } catch (e) {
        console.error("Failed to load stories:", e);
      }
    }
    fetchStories();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-12 max-w-6xl mx-auto">
      
      {/* 1. Header Section */}
      <header className="text-center space-y-3 py-6 border-b border-slate-800/60">
        <img 
          src="/BackgroundEraser_20260724_163638777.png" 
          alt="Official Lucky Pick Canada Logo" 
          className="mx-auto mb-2"
          style={{ maxWidth: '180px', height: 'auto', width: '100%' }}
        />
        <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${PRIMARY_GOLD}`}>
          Your Luck, Personalized!
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Discover your luck with LuckyPickCanada's Lucky Meter, personalized picks, and share your stories across Canada.
        </p>
      </header>

      {/* 2. Lucky Meter Section */}
      <section className={`${CARD_BG} space-y-4`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>Start your luck meter</h2>
        <p className="text-slate-300 text-sm">Test your daily energy and see where your luck stands today!</p>
        <div className="flex flex-wrap gap-3">
          <a href="#lucky-meter" className={BUTTON_STYLE}>Try the FREE Lucky Meter</a>
        </div>
      </section>

      {/* 3. Card Reveal Section */}
      <section className="space-y-4">
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>Card Reveal</h2>
        <LuckyCardReveal />
      </section>

      {/* 4. Lucky Journey & Personalized Picks Section */}
      <section className={`${CARD_BG} space-y-6`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>Start your lucky journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className={`text-xl font-semibold ${PRIMARY_GOLD}`}>Personalized Lucky Pick</h2>
            <p className="text-slate-300 text-sm">Get custom numbers generated specifically for your daily routine.</p>
          </div>
          {/* ... keeping your other grid items here ... */}
        </div>
      </section>

      {/* 5. Lucky Stories & Canada Map Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${CARD_BG} space-y-4`}>
          <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>Share your stories</h2>
          <h3 className="text-lg font-semibold text-slate-200">Recent lucky stories</h3>
          
          {/* Mapping the stories dynamically */}
          <div className="space-y-4">
            {recentStories.length > 0 ? (
              recentStories.map((story) => (
                <div key={story.id} className="border-b border-slate-800 pb-2">
                  <p className="text-amber-200 font-bold">{story.display_name}</p>
                  <p className="text-slate-400 text-sm italic">{story.story}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No stories yet. Be the first to share!</p>
            )}
          </div>

          <Link href="/lucky-map-of-canada" className={`inline-block text-sm font-semibold ${PRIMARY_GOLD} hover:underline`}>
            View All Lucky Stories &rarr;
          </Link>
        </div>

        <div className={`${CARD_BG} space-y-4`}>
          <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>Lucky Picks by Province</h2>
          <Link href="/lucky-map-of-canada" className="inline-block px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all">
            Lucky Map of Canada
          </Link>
        </div>
      </section>

      {/* 6. Community Footer */}
      <section className={`${CARD_BG} text-center space-y-6`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>Help make Lucky Pick Canada better</h2>
      </section>
    </main>
  );
}
