import React from 'react';
import Link from 'next/link';
// Line 4: Corrected import to match the renamed file ./LuckyCardReveal.js
import LuckyCardReveal from './LuckyCardReveal';

// SEO Optimized Metadata
export const metadata = {
  title: 'LuckyPickCanada - Lucky Meter & Personalized Picks',
  description:
    "Discover your luck with LuckyPickCanada's Lucky Meter & personalized picks. Share your stories and explore luck across Canada.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-12 max-w-6xl mx-auto">
      
      {/* 1. Header Section */}
      <header className="text-center space-y-3 py-6 border-b border-slate-800/60">
        <img 
          src="/official-logo.png" 
          alt="Official Lucky Pick Canada Logo" 
          className="mx-auto h-16 w-auto mb-2"
        />
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-amber-400">
          Your Luck, Personalized!
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Discover your luck with LuckyPickCanada's Lucky Meter, personalized picks, and share your stories across Canada.
        </p>
      </header>

      {/* 2. Lucky Meter Section */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-amber-300">
          Start your luck meter
        </h2>
        <p className="text-slate-300 text-sm">
          Test your daily energy and see where your luck stands today!
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#lucky-meter"
            className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md"
          >
            Try the FREE Lucky Meter
          </a>
        </div>
      </section>

      {/* 3. Card Reveal Section (Replaces Lucky Blackjack Challenge) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-amber-300">
          Card Reveal
        </h2>
        {/* Render the imported LuckyCardReveal component */}
        <LuckyCardReveal />
      </section>

      {/* 4. Lucky Journey & Personalized Picks Section */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-amber-300">
          Start your lucky journey
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className="text-xl font-semibold text-amber-400">
              Personalized Lucky Pick
            </h2>
            <p className="text-slate-300 text-sm">
              Get custom numbers generated specifically for your daily routine.
            </p>
            <a 
              href="#personalized" 
              className="inline-block mt-2 text-sm font-semibold text-amber-400 hover:underline"
            >
              Get Your Personalized Lucky Pick - $1 CAD &rarr;
            </a>
          </div>

          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className="text-xl font-semibold text-amber-400">
              Gift a lucky pick
            </h2>
            <p className="text-slate-300 text-sm">
              Share positive vibes with friends and family across the country.
            </p>
          </div>

          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className="text-xl font-semibold text-amber-400">
              Tip jar
            </h2>
            <p className="text-slate-300 text-sm">
              Support the LuckyPick Canada project and keep the luck spreading.
            </p>
          </div>

          <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-4 rounded-xl">
            <h2 className="text-xl font-semibold text-amber-400">
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
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-amber-300">
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
            className="inline-block text-sm font-semibold text-amber-400 hover:underline"
          >
            View All Lucky Stories on the Lucky Story Map &rarr;
          </Link>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-amber-300">
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

      {/* 6. Feedback & Community Section */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg text-center space-y-6">
        <h2 className="text-2xl font-bold text-amber-300">
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
