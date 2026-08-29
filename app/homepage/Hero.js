'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const heroLinks = [
  { href: '/lucky-meter', label: 'Lucky Meter' },
  { href: '/reveal', label: "Today's Lucky Moment" },
  { href: '#community-map', label: 'Community Map' },
  { href: '#crystal-ball', label: 'Crystal Ball' },
  { href: 'https://www.facebook.com/groups/1060808069624999/', label: 'Facebook Group', external: true },
];

export default function Hero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let stars = [];

    const initStars = (width, height) => {
      const numStars = Math.floor((width * height) / 1000); // High density
      const newStars = [];
      for (let i = 0; i < numStars; i++) {
        newStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.8 + 0.2, // 0.2 to 1.0 (so 1-2px diameter)
          alpha: Math.random() * 0.7 + 0.2, // 0.2 to 0.9
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1
        });
      }
      return newStars;
    };

    const resizeCanvas = () => {
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      canvas.width = newWidth;
      canvas.height = newHeight;

      if (stars.length === 0) {
        stars = initStars(newWidth, newHeight);
      } else {
        // Recalculate star positions proportionally
        stars.forEach(star => {
          star.x = (star.x / oldWidth) * newWidth;
          star.y = (star.y / oldHeight) * newHeight;
        });

        // If window got significantly larger, we might need more stars, but proportional repositioning is usually enough for a resize.
        // For a perfect implementation, we would add/remove stars based on the new area.
        const targetNumStars = Math.floor((newWidth * newHeight) / 1000);
        if (targetNumStars > stars.length) {
            const addedStarsCount = targetNumStars - stars.length;
            for(let i=0; i < addedStarsCount; i++){
                stars.push({
                  x: Math.random() * newWidth,
                  y: Math.random() * newHeight,
                  radius: Math.random() * 0.8 + 0.2,
                  alpha: Math.random() * 0.7 + 0.2,
                  twinkleSpeed: Math.random() * 0.02 + 0.005,
                  twinkleDir: Math.random() > 0.5 ? 1 : -1
                });
            }
        } else if (targetNumStars < stars.length) {
             stars = stars.slice(0, targetNumStars);
        }
      }
    };

    // Set initial size and initialize stars
    canvas.width = window.innerWidth || 1024; // Fallback for safety
    canvas.height = window.innerHeight || 768;
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    let animationFrameId;

    const drawStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        ctx.globalAlpha = star.alpha;

        // PERFORMANCE OPTIMIZATION (Bolt ⚡):
        // Replaced expensive path/arc rendering with fillRect for tiny 1-2px stars.
        // Bypassing trigonometric curve calculations for thousands of particles
        // keeps main thread execution time low and maintains a smooth 60fps.
        ctx.fillRect(star.x - star.radius, star.y - star.radius, star.radius * 2, star.radius * 2);

        star.alpha += star.twinkleSpeed * star.twinkleDir;

        if (star.alpha <= 0.2) {
          star.alpha = 0.2;
          star.twinkleDir = 1;
        } else if (star.alpha >= 0.9) {
          star.alpha = 0.9;
          star.twinkleDir = -1;
        }
      }
      animationFrameId = requestAnimationFrame(drawStars);
    };

    drawStars();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <header className="relative min-h-screen w-full flex flex-col items-center justify-between px-4 py-6 md:py-10 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950">

      {/* Layer 1 (Background): Full-bleed absolute container */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#020609]">
        {/* Starfield Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Aurora Layer 1 */}
        <div className="absolute top-0 left-[-10%] right-[-10%] h-[40%] bg-gradient-to-b from-transparent via-[#18b978]/20 to-transparent blur-3xl rounded-full animate-aurora-1 mix-blend-screen" />

        {/* Aurora Layer 2 */}
        <div className="absolute top-[10%] left-[-20%] right-[10%] h-[35%] bg-gradient-to-b from-transparent via-[#57e5d0]/15 to-transparent blur-3xl rounded-full animate-aurora-2 mix-blend-screen" />

        {/* Aurora Layer 3 */}
        <div className="absolute top-[-5%] left-[10%] right-[-20%] h-[45%] bg-gradient-to-b from-transparent via-[#69b8ff]/10 to-transparent blur-3xl rounded-full animate-aurora-3 mix-blend-screen" />
      </div>

      {/* Layer 2 (UI Overlay): Relative container for all interactive elements */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-between">

        {/* Top Nav: Glassmorphism pill */}
        <nav className="w-full max-w-3xl mx-auto relative z-20 pointer-events-auto" aria-label="Primary navigation">
          <div className="backdrop-blur-xl bg-white/5 border border-white/20 md:border-amber-400/20 rounded-full px-4 py-3 flex items-center justify-around gap-2 md:gap-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {heroLinks.map(({ href, label, external }) => (
              <a
                key={href}
                href={href}
                className="pointer-events-auto text-[11px] sm:text-xs md:text-sm font-medium text-amber-50 hover:text-amber-200 transition-colors py-1 px-2 rounded-full hover:bg-white/5"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Center Content: Logo and Typography */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-10">

          {/* Logo with spark portal and drop shadow */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 mb-8 flex items-center justify-center">
            {/* Spark Portal Glow - Radial */}
            <div className="absolute inset-[-20%] bg-radial-gradient from-amber-500/30 to-transparent blur-2xl rounded-full mix-blend-screen animate-pulse-glow" style={{ backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' }}></div>

            {/* Spark Portal Glow - Spinning Conic */}
            <div className="absolute inset-[-10%] bg-conic-gradient from-amber-300/0 via-amber-400/20 to-amber-300/0 blur-xl rounded-full animate-spin-slow mix-blend-screen" style={{ backgroundImage: 'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.3) 180deg, transparent 360deg)' }}></div>

            <Image
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada Logo"
              width={224}
              height={224}
              className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10"
              priority
            />
          </div>

          {/* Top Subhead */}
          <p className="text-[#FFF0AC] text-[10px] sm:text-xs md:text-sm tracking-[0.25em] font-semibold uppercase max-w-lg mb-4 leading-relaxed px-2 drop-shadow-md">
            A LITTLE CANADIAN MAGIC MADE FOR TODAY — DISCOVER YOUR LUCK & SHARE THE MAGIC.
          </p>

          {/* Main Heading (3D Gold Typography) */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.0] my-2 text-gold-gradient drop-shadow-3d">
            Your daily<br />
            lucky<br />
            moment.
          </h1>

          {/* Bottom Subhead */}
          <p className="text-white text-sm md:text-base font-sans font-medium tracking-wide mt-6 mb-8 drop-shadow-md">
            A Canadian digital entertainment
          </p>
        </div>

        {/* CTA Button */}
        <div className="relative group mt-4">
          {/* Pulsing Outer Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-600 rounded-full blur-xl opacity-60 animate-pulse-glow"></div>

          <a
            href="/reveal"
            className="cta-glow relative z-10 inline-flex items-center justify-center px-10 py-4 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 text-slate-950 font-black text-sm md:text-base tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.8)] transition-transform hover:scale-105 duration-300 active:scale-95"
          >
            REVEAL TODAY'S LUCK &gt;
          </a>
        </div>

      </div>
    </header>
  );
}
