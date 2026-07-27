import React from 'react';
import Link from 'next/link';
// Line 4: Imports the renamed module directly
import LuckyCardReveal from './LuckyCardReveal';

// --- Style Constants ---
const PRIMARY_GOLD = "text-amber-400";
const SECONDARY_GOLD = "text-amber-300";
const CARD_BG = "bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg";
const BUTTON_STYLE = "inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md";

// --- Quote Data & Helper ---
const luckyQuotes = [
  "Your positive energy creates your own luck every day.",
  "Small acts of kindness bring immense fortune.",
  "Luck is what happens when preparation meets opportunity.",
  "Happiness is not by chance, but by choice.",
  "Every daily step forward brings you closer to your goals.",
  "Positivity is a magnet for good fortune."
];

function getLuckyQuoteOfTheDay() {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  return luckyQuotes[dayOfYear % luckyQuotes.length];
}

// --- SEO Metadata ---
export const metadata = {
  title: 'LuckyPickCanada - Lucky Meter & Personalized Picks',
  description:
    "Discover your luck with LuckyPickCanada's Lucky Meter & personalized picks. Share your stories and explore luck across Canada.",
};

export default function HomePage() {
  const dailyQuote = getLuckyQuoteOfTheDay();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-12 max-w-6xl mx-auto">
      
      {/* 1. Header Section */}
      <header className="text-center space-y-3 py-6 border-b border-slate-800/60">
        <img 
          src="/official-logo.png" 
          alt="Official Lucky Pick Canada Logo" 
          className="mx-auto h-16 w-auto mb-2"
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

      {/* 2. Lucky Meter Section */}
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

      {/* 4. Lucky Journey & Personalized Picks Section */}
      <section className={`${CARD_BG} space-y-6`}>
        <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
          Start your lucky journey
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className={`text-xl font-semibold ${PRIMARY_GOLD}`}>
              Personalized Lucky Pick
            </h2>
            <p className="text-slate-300 text-sm">
              Get custom numbers generated specifically for your daily routine.
            </p>
            <a 
              href="#personalized" 
              className={`inline-block mt-2 text-sm font-semibold ${PRIMARY_GOLD} hover:underline`}
            >
              Get Your Personalized Lucky Pick - $1 CAD &rarr;
            </a>
          </div>

          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className={`text-xl font-semibold ${PRIMARY_GOLD}`}>
              Gift a lucky pick
            </h2>
            <p className="text-slate-300 text-sm">
              Share positive vibes with friends and family across the country.
            </p>
          </div>

          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className={`text-xl font-semibold ${PRIMARY_GOLD}`}>
              Tip jar
            </h2>
            <p className="text-slate-300 text-sm">
              Support the LuckyPick Canada project and keep the luck spreading.
            </p>
          </div>

          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className={`text-xl font-semibold ${PRIMARY_GOLD}`}>
              6 Pick &amp; 7 Pick
            </h2>
            <p className="text-slate-300 text-sm">
              Select your favorite combinations and explore regional stats.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Lucky Stories & Canada Map Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${CARD_BG} space-y-4`}>
          <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
            Share your stories of luck and happiness
          </h2>
          <h3 className="text-lg font-semibold text-slate-200">
            Recent lucky stories
          </h3>
          <p className="text-slate-400 text-sm">
            Read inspiring moments from participants from coast to coast.
          </p>
          <Link 
            href="/lucky-map-of-canada" 
            className={`inline-block text-sm font-semibold ${PRIMARY_GOLD} hover:underline`}
          >
            View All Lucky Stories on the Lucky Story Map &rarr;
          </Link>
        </div>

        <div className={`${CARD_BG} space-y-4`}>
          <h2 className={`text-2xl font-bold ${SECONDARY_GOLD}`}>
            Lucky Picks by Province
          </h2>
          <h3 className="text-lg font-semibold text-slate-200">
            Recent purchase provinces: 2
          </h3>
          <p className="text-slate-400 text-sm">
            Explore interactive regional insights on our Canada Story Map.
          </p>
          <Link 
            href="/lucky-map-of-canada" 
            className="inline-block px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all"
          >
            Lucky Map of Canada
          </Link>
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
              alt="Lucky Pick Canada Community Facebook group cover" 
              className="rounded-xl border border-slate-700 max-w-full h-auto mx-auto shadow-md"
            />
          </a>
        </div>
      </section>

    </main>
  );
}
