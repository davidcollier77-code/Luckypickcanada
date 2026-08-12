'use client';

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
        <div className="absolute inset-0 bg-slate-950"></div>

        {/* Northern Lights (Aurora Borealis) Glow Effects */}
        <div className="absolute -top-10 -left-20 w-[35rem] h-[35rem] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute -top-10 -right-20 w-[35rem] h-[35rem] bg-teal-400/20 rounded-full blur-[130px] mix-blend-screen"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-amber-500/10 rounded-full blur-[150px]"></div>

        {/* Dynamic Starfield Pattern Overlay */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px]"></div>
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
        <div className="relative w-60 h-60 md:w-72 md:h-72 my-2 flex items-center justify-center">
          {/* Outer Glowing Ring Pulse */}
          <div className="absolute inset-0 rounded-full border border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse-glow"></div>
          <div className="absolute -inset-3 rounded-full border border-amber-300/20 filter blur-[1px]"></div>

          {/* Spark/Particle Rotating Ring Representation */}
          <div className="absolute inset-1 rounded-full border-2 border-dashed border-amber-400/70 opacity-80 animate-spin-slow"></div>

          {/* Inner Circular Emblem Container */}
          <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-slate-950 border-2 border-amber-400 shadow-[inset_0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center overflow-hidden">
            <img
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada emblem showing maple leaf and clover design"
              width="184"
              height="184"
              className="object-contain relative z-10"
            />
          </div>
        </div>

        {/* TOP SUBHEADLINE */}
        <p className="text-amber-200/90 text-[11px] sm:text-xs md:text-sm tracking-[0.25em] font-semibold uppercase max-w-lg mt-3 mb-2 leading-relaxed px-2">
          A Little Canadian Magic Made For Today — Discover Your Luck &amp; Share The Magic.
        </p>

        {/* MAIN HEADLINE (3D Gold Typography) */}
        <h1 id="hero-title" className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] my-2 text-gold-gradient">
          Your daily<br />
          lucky<br />
          moment.
        </h1>

        {/* BOTTOM SUBHEADLINE */}
        <p className="text-slate-300/90 text-sm md:text-base font-light tracking-wide mt-2 mb-8">
          A Canadian digital entertainment platform
        </p>

        {/* CALL TO ACTION BUTTON */}
        <a
          href="/lucky-meter"
          className="cta-glow group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-bold text-sm md:text-base tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.8)] transition-transform hover:scale-105 duration-300 active:scale-95"
        >
          <span>Reveal Today's Luck</span>
          {/* Chevron Right Arrow */}
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </a>

      </main>
    </header>
  );
}
