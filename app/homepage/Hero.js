'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const heroLinks = [
  { href: '/lucky-meter', label: 'Lucky Meter' },
  { href: '#cards', label: 'Today’s Lucky Moment' },
  { href: '#community-map', label: 'Community Map' },
  { href: 'https://www.facebook.com/groups/1060808069624999/', label: 'Facebook Group', external: true },
];

export default function Hero() {
  return (
    <header className="relative min-h-screen w-full flex flex-col items-center justify-between px-4 py-6 md:py-10 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950">

      {/* BACKGROUND & AURORA EFFECTS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Deep Sky Dark Overlay */}
        <div className="absolute inset-0 bg-slate-950/90"></div>

        {/* Northern Lights (Aurora Borealis) Glow Effects with Framer Motion */}
        <motion.div
          className="absolute -top-20 -left-20 w-[45rem] h-[45rem] bg-emerald-500/30 rounded-full blur-[140px] mix-blend-screen"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -top-20 right-0 w-[40rem] h-[40rem] bg-teal-400/30 rounded-full blur-[140px] mix-blend-screen"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, -40, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Dynamic Starfield Pattern Overlay */}
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* NAVIGATION BAR (GLASSMORPHISM) */}
      <nav className="relative z-20 w-full max-w-3xl mx-auto" aria-label="Primary navigation">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-amber-400/20 rounded-full px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-around gap-1 md:gap-4 text-center">
          {heroLinks.map(({ href, label, external }) => (
            <a
              key={href}
              href={href}
              className="text-[11px] sm:text-xs md:text-sm font-medium text-amber-100/90 hover:text-amber-300 transition-colors py-1 px-2 rounded-full hover:bg-white/5"
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* MAIN HERO CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-6">

        {/* GLOWING PORTAL EMBLEM */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 my-4 flex items-center justify-center">

          {/* Mesmerizing Spark Ring (Framer Motion) */}
          <motion.div
             className="absolute inset-0 rounded-full border-4 border-dashed border-amber-400/60 shadow-[0_0_60px_rgba(245,158,11,0.8)] mix-blend-screen"
             animate={{ rotate: 360 }}
             transition={{
               duration: 30,
               repeat: Infinity,
               ease: "linear"
             }}
          />
          <motion.div
             className="absolute -inset-4 rounded-full border-2 border-dotted border-amber-300/40 shadow-[0_0_40px_rgba(245,158,11,0.4)] mix-blend-screen"
             animate={{ rotate: -360 }}
             transition={{
               duration: 40,
               repeat: Infinity,
               ease: "linear"
             }}
          />

          {/* Outer Glowing Ring Pulse */}
          <div className="absolute inset-2 rounded-full border border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse-glow"></div>

          {/* Inner Circular Emblem Container */}
          <div className="relative w-48 h-48 md:w-60 md:h-60 rounded-full bg-slate-950 border border-amber-400 shadow-[inset_0_0_40px_rgba(245,158,11,0.8)] flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2),transparent)]"></div>
            <Image
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada emblem showing maple leaf and clover design"
              width={220}
              height={220}
              className="object-contain relative z-10"
              priority
            />
          </div>
        </div>

        {/* TOP SUBHEADLINE */}
        <p className="text-amber-400 text-[10px] sm:text-xs md:text-sm tracking-[0.3em] font-semibold uppercase max-w-lg mt-4 mb-2 leading-relaxed px-2">
          A Little Canadian Magic Made For Today — Discover Your Luck &amp; Share The Magic.
        </p>

        {/* MAIN HEADLINE (3D Gold Typography) */}
        <h1 id="hero-title" className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.0] my-2 text-gold-gradient drop-shadow-3d">
          Your daily<br />
          lucky<br />
          moment.
        </h1>

        {/* BOTTOM SUBHEADLINE */}
        <p className="text-white text-sm md:text-base font-medium tracking-wide mt-4 mb-8">
          A Canadian digital entertainment
        </p>

        {/* CALL TO ACTION BUTTON */}
        <a
          href="/lucky-meter"
          className="cta-glow group relative inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 text-slate-950 font-black text-sm md:text-base tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.8)] hover:shadow-[0_0_50px_rgba(245,158,11,1)] transition-transform hover:scale-105 duration-300 active:scale-95"
        >
          <span>Reveal Today's Luck</span>
          {/* Chevron Right Arrow */}
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </a>

      </main>
    </header>
  );
}
