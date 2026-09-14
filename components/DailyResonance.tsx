'use client';
import Aurora, { AuroraHandle } from "./Aurora";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Howl, Howler } from 'howler';
import gsap from 'gsap';

import ResonanceButton from './ResonanceButton';


const LUCKY_QUOTES = [
  "Deep as the Great Lakes and bright as the winter snow, your resonance is strong.",
  "Like an Inukshuk guiding the way, good fortune is pointing directly at you.",
  "The northern lights dance in your favor today; trust the journey ahead.",
  "As steadfast as the Rocky Mountains, your patience will bring reward.",
  "A fresh breeze from the Pacific brings clarity and new opportunities.",
  "Energy flows like the mighty St. Lawrence—steady, powerful, and unstoppable.",
  "Golden fields under wide prairie skies remind you that abundance is near.",
  "Like maple sap rising in spring, your potential is ready to sweeten the day."
];

interface DailyResonanceProps {
  isCompact?: boolean;
}

export default function DailyResonance({ isCompact = false }: DailyResonanceProps) {

  const soundsRef = useRef<Record<string, Howl | null>>({
    buildup: null,
    impactMeteor: null,
    impactLightning: null,
    impactFireworks: null,
    crackle: null
  });

  useEffect(() => {
    soundsRef.current = {
      buildup: new Howl({ src: ['/freesound_community-starship-rail-gun-charge-35904.mp3'], volume: 0.8 }),
      impactMeteor: new Howl({ src: ['/dragon-studio-whoosh-cinematic-376875.mp3'], volume: 1.0 }),
      impactLightning: new Howl({ src: ['/yodguard-lightning-magic-3-378649.mp3'], volume: 1.0 }),
      impactFireworks: new Howl({ src: ['/freesound_community-fireworks-1-94483.mp3'], volume: 1.0 }),
      crackle: new Howl({ src: ['/freesound_community-shaking-coins-105774.mp3'], volume: 0.3, loop: true })
    };
    return () => {
       Howler.unload();
       if (timelineRef.current) {
         timelineRef.current.kill();
         timelineRef.current = null;
         isAnimatingRef.current = false;
         setIsLoading(false);
         setIsRevealing(false);
       }
    };
  }, []);

  const [percentage, setPercentage] = useState(0);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [quote, setQuote] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [tier, setTier] = useState<string>("");
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const auroraRef = useRef<AuroraHandle>(null);
  const requestRef = useRef<number>(0);
  const sequenceRef = useRef<number>(0);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const isAnimatingRef = useRef(false);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgRequestRef = useRef<number>(0);
  useEffect(() => { if (auroraRef.current && !isRevealing && !isRevealed) auroraRef.current.setPhase('idle'); }, [isRevealing, isRevealed]);
  const starsRef = useRef<Array<{x: number, y: number, radius: number, alpha: number, speed: number}>>([]);


  // Check for daily lockout on mount
  useEffect(() => {
    const lastDate = localStorage.getItem('lucky_lastDate');
    const today = new Date().toLocaleDateString();

    if (lastDate === today) {
      const lastPct = localStorage.getItem('lucky_lastPct');
      const lastQuoteIdx = localStorage.getItem('lucky_lastQuote');

      if (lastPct && lastQuoteIdx) {
        setIsLockedOut(true);
        setPercentage(parseInt(lastPct, 10));
        setDisplayPercentage(parseInt(lastPct, 10));
        const quoteIdx = parseInt(lastQuoteIdx, 10);
        setQuote(LUCKY_QUOTES[quoteIdx] || LUCKY_QUOTES[0]);

        const pct = parseInt(lastPct, 10);
        if (pct <= 33) setTier('Meteor Shower');
        else if (pct <= 66) setTier('Cosmic Lightning');
        else setTier('Fireworks');

        setIsRevealed(true);
      }
    }
  }, []);

  // Timer logic for countdown until midnight local time
  useEffect(() => {
    if (!isLockedOut && !isRevealed) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Midnight tonight

      const diff = midnight.getTime() - now.getTime();

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    calculateTimeRemaining(); // initial call
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, isRevealed]);

  const handleReveal = async () => {
    // Prevent concurrent sequences
    if (isAnimatingRef.current) return;
    if (isRevealed) return;
    if (isLoading) return;
    if (isRevealing) return;

    isAnimatingRef.current = true;
    setIsLoading(true);
    setIsRevealing(true);

    // Clear previous audio nodes
    // Increment visit counter on explicit user action (spinning the meter)
    fetch('/api/visits', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.visits === 'number') {
          setTotalVisits(data.visits);
        }
      })
      .catch((err) => console.error("Failed to update visits:", err));


    // Cancel any previous GSAP timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Instant pre-roll visual feedback
    setDisplayPercentage(0);

    // Collision Prevention Logic
    const lastPct = localStorage.getItem('lucky_lastPct');
    const lastQuote = localStorage.getItem('lucky_lastQuote');
    let newPct, newQuoteIdx;

    do {
      newPct = Math.floor(Math.random() * 101);
    } while (newPct.toString() === lastPct);

    do {
      newQuoteIdx = Math.floor(Math.random() * LUCKY_QUOTES.length);
    } while (newQuoteIdx.toString() === lastQuote);

    // We set the date to localStorage here to lockout immediately
    const today = new Date().toLocaleDateString();
    localStorage.setItem('lucky_lastDate', today);
    localStorage.setItem('lucky_lastPct', newPct.toString());
    localStorage.setItem('lucky_lastQuote', newQuoteIdx.toString());

    // Store but do not reveal yet
    setPercentage(newPct);

    // Determine 3 Tiers
    let currentTier = '';
    if (newPct <= 33) currentTier = 'Meteor Shower';
    else if (newPct <= 66) currentTier = 'Cosmic Lightning';
    else currentTier = 'Fireworks';

    setIsLoading(false);

    // Setup timeline
    let tierAudioKey = 'impactMeteor';
    if (currentTier === 'Cosmic Lightning') tierAudioKey = 'impactLightning';
    if (currentTier === 'Fireworks') tierAudioKey = 'impactFireworks';

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      }
    });
    timelineRef.current = tl;

    // Build the GSAP sequence

    // 0. Play buildup sound at start
    tl.call(() => {
      if (auroraRef.current) auroraRef.current.setPhase('awaken');
      if (soundsRef.current.buildup) {
        soundsRef.current.buildup.play();
      }
    });

    // 1. Gather (Tension Phase, 4.8s)
    tl.call(() => { if (auroraRef.current) auroraRef.current.setPhase('gather'); }, undefined, 1.0);
    const proxy = { val: 0, jitterMag: 40 };
    tl.to(proxy, {
      val: newPct,
      duration: 4.8,
      ease: "power3.inOut",
      onUpdate: () => {
        let jitter = Math.floor((Math.random() - 0.5) * proxy.jitterMag);
        let currentVal = Math.floor(proxy.val + jitter);
        currentVal = Math.max(0, Math.min(100, currentVal));
        setDisplayPercentage(currentVal);
      }
    }, 0);
    // Decay jitter over the same period
    tl.to(proxy, {
      jitterMag: 0,
      duration: 4.8,
      ease: "power2.in"
    }, 0);

    // 2. High-speed tension roll (very short, converging tightly - 0.7s)
    tl.to(proxy, {
      duration: 0.7,
      onUpdate: () => {
        let jitter = Math.floor((Math.random() - 0.5) * 3);
        let currentVal = Math.max(0, Math.min(100, newPct + jitter));
        setDisplayPercentage(currentVal);
      }
    }, 4.8);

    // 3. Impact Frame (at 5.5s)
    tl.call(() => {
      if (auroraRef.current) auroraRef.current.setPhase('impact', currentTier);
      setTimeout(() => {
        if (auroraRef.current) auroraRef.current.setPhase('settled', currentTier);
      }, 800);

      setDisplayPercentage(newPct);

      // Stop buildup
      if (soundsRef.current.buildup) {
        soundsRef.current.buildup.fade(0.8, 0, 500);
        setTimeout(() => { if (soundsRef.current.buildup) soundsRef.current.buildup.stop(); }, 500);
      }

      // Play impact sound
      if (soundsRef.current[tierAudioKey]) {
        soundsRef.current[tierAudioKey].play();
      }

      // Start canvas animation
      animateCanvas(currentTier, 0);

      // Update state for UI transition
      setTier(currentTier);
      setQuote(LUCKY_QUOTES[newQuoteIdx]);
      setIsRevealed(true);
      setIsRevealing(false);
    }, undefined, 5.5);

    // Optional 4. Final lingering buffer
    tl.to({}, { duration: 1.0 });
  };

  const handleShare = async () => {
    const shareText = `My Daily Resonance is ${percentage}%! '${quote}' Discover your daily fortune at luckypickcanada.ca (For entertainment purposes only).`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'My Daily Resonance',
          text: shareText,
          url: 'https://luckypickcanada.ca/lucky-meter'
        });
        return;
      } catch (err) {
        console.log('Share dismissed or failed', err);
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('copied');
        window.setTimeout(() => setShareStatus('idle'), 2200);
      } catch(e) {}
    }
  };

  // Canvas Animation Logic
  const animateCanvas = useCallback((forcedTier?: string, animationStartTimeMs?: number) => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    const activeTier = typeof forcedTier === 'string' ? forcedTier : tier;
    const canvas = canvasRef.current;
    if (!canvas || !activeTier) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    let particles: any[] = [];
    let rockets: any[] = [];
    const fallbackStartTime = typeof animationStartTimeMs === 'number' ? performance.now() - animationStartTimeMs : performance.now();
    let fadeOutTriggered = false;
    const isMobile = window.innerWidth < 768;

    // Scripted Fireworks Logic
    const scriptPhase1Done = { current: false };
    const scriptPhase2Done = { current: false };
    const scriptPhase3Done = { current: false };
    const scriptPhase4Done = { current: false };

    const colors = ['#ff5050', '#5a8cff', '#6eff96', '#c86eff', '#ffcd5a', '#ffffff', '#ff9cee'];

    const spawnBurst = (x: number, y: number, color1: string, color2: string, sizeMultiplier: number) => {
      const burstCount = Math.floor(Math.random() * 2) + 1;
      for (let b = 0; b < burstCount; b++) {
        const bx = x + (Math.random() - 0.5) * 50 * sizeMultiplier;
        const by = y + (Math.random() - 0.5) * 50 * sizeMultiplier;
        const pCount = Math.floor(60 * sizeMultiplier);
        for (let i = 0; i < pCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const velocity = (Math.random() * 8 + 3) * sizeMultiplier;
          particles.push({
            x: bx,
            y: by,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            opacity: 1,
            color: Math.random() > 0.3 ? color1 : color2,
            history: []
          });
        }
      }
    };

    const spawnRocket = (startX: number, startY: number, targetX: number, targetY: number, sizeMultiplier: number, speedMultiplier: number) => {
       const dx = targetX - startX;
       const dy = targetY - startY;
       const distance = Math.sqrt(dx * dx + dy * dy);
       const speed = 12 * speedMultiplier;

       rockets.push({
          x: startX,
          y: startY,
          targetX,
          targetY,
          vx: (dx / distance) * speed,
          vy: (dy / distance) * speed,
          color1: colors[Math.floor(Math.random() * colors.length)],
          color2: colors[Math.floor(Math.random() * colors.length)],
          sizeMultiplier,
          history: []
       });
    };

    const loop = () => {
      const elapsedMs = performance.now() - fallbackStartTime;
      const canSpawn = elapsedMs < 4500;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isReducedMotion) {
         if (canSpawn || particles.length > 0) {
            // Simplified glowing aura for reduced motion
            const alpha = Math.min(1, Math.max(0, canSpawn ? elapsedMs / 1000 : 1 - (elapsedMs - 4500) / 1000));
            if (alpha > 0) {
              const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/4, 0, canvas.width/2, canvas.height/4, Math.max(canvas.width, canvas.height)/2);
              const color = activeTier === 'Fireworks' ? '255, 205, 90' : (activeTier === 'Cosmic Lightning' ? '200, 150, 255' : '100, 200, 255');
              grad.addColorStop(0, `rgba(${color}, ${alpha * 0.4})`);
              grad.addColorStop(1, `rgba(${color}, 0)`);
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              particles = [1]; // keep alive
            } else {
              particles = [];
            }
         }
      } else {

      // Tier 1: 0-33% Lower Luck (Restrained)
      if (activeTier === 'Meteor Shower' && canSpawn) {
         if (elapsedMs > 500 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            spawnRocket(canvas.width / 2, canvas.height, canvas.width / 2, canvas.height * 0.3, 0.7, 1);
         }
         if (elapsedMs > 2000 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            spawnRocket(canvas.width / 2 - 50, canvas.height, canvas.width / 2 - 100, canvas.height * 0.4, 0.6, 1);
            spawnRocket(canvas.width / 2 + 50, canvas.height, canvas.width / 2 + 100, canvas.height * 0.35, 0.6, 1);
         }
      }

      // Tier 2: 34-66% Medium Luck (Broader)
      else if (activeTier === 'Cosmic Lightning' && canSpawn) {
         if (elapsedMs > 200 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            const w = canvas.width;
            const h = canvas.height;
            spawnRocket(w * 0.3, h, w * 0.3, h * 0.3, 0.9, 1);
            spawnRocket(w * 0.7, h, w * 0.7, h * 0.35, 0.9, 1);
         }
         if (elapsedMs > 1500 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            const w = canvas.width;
            const h = canvas.height;
            spawnRocket(w * 0.1, h, w * 0.2, h * 0.25, 0.8, 1);
            spawnRocket(w * 0.5, h, w * 0.5, h * 0.2, 1.0, 1.2);
            spawnRocket(w * 0.9, h, w * 0.8, h * 0.3, 0.8, 1);
         }
         if (elapsedMs > 3000 && !scriptPhase3Done.current) {
            scriptPhase3Done.current = true;
            const w = canvas.width;
            const h = canvas.height;
            spawnRocket(w * 0.4, h, w * 0.35, h * 0.4, 0.7, 1);
            spawnRocket(w * 0.6, h, w * 0.65, h * 0.35, 0.7, 1);
         }
      }

      // Tier 3: 67-100% High Luck (Spectacular)
      else if (activeTier === 'Fireworks' && canSpawn) {
         if (elapsedMs > 100 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            const w = canvas.width;
            const h = canvas.height;
            // Sweeping from sides
            spawnRocket(0, h * 0.8, w * 0.3, h * 0.2, 1.1, 1.2);
            spawnRocket(w, h * 0.8, w * 0.7, h * 0.2, 1.1, 1.2);
         }
         if (elapsedMs > 1200 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            const w = canvas.width;
            const h = canvas.height;
            // Center barrage
            spawnRocket(w * 0.4, h, w * 0.4, h * 0.25, 1.0, 1.1);
            spawnRocket(w * 0.5, h, w * 0.5, h * 0.15, 1.3, 1.3);
            spawnRocket(w * 0.6, h, w * 0.6, h * 0.25, 1.0, 1.1);
         }
         if (elapsedMs > 2500 && !scriptPhase3Done.current) {
            scriptPhase3Done.current = true;
            const w = canvas.width;
            const h = canvas.height;
            // Cross fire
            spawnRocket(w * 0.1, h * 0.6, w * 0.6, h * 0.1, 0.9, 1.2);
            spawnRocket(w * 0.9, h * 0.6, w * 0.4, h * 0.1, 0.9, 1.2);
         }
         if (elapsedMs > 3800 && !scriptPhase4Done.current) {
             scriptPhase4Done.current = true;
             const w = canvas.width;
             const h = canvas.height;
             // Grand Finale
             spawnRocket(w * 0.3, h, w * 0.3, h * 0.2, 1.2, 1.1);
             spawnRocket(w * 0.5, h, w * 0.5, h * 0.1, 1.5, 1.4);
             spawnRocket(w * 0.7, h, w * 0.7, h * 0.2, 1.2, 1.1);
             spawnRocket(w * 0.2, h, w * 0.2, h * 0.3, 1.0, 1.1);
             spawnRocket(w * 0.8, h, w * 0.8, h * 0.3, 1.0, 1.1);
         }
      }

      ctx.globalCompositeOperation = 'lighter';

      // Draw and update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
         const r = rockets[i];
         r.history.push({x: r.x, y: r.y});
         if (r.history.length > 5) r.history.shift();

         r.x += r.vx;
         r.y += r.vy;

         // Trail
         if (r.history.length > 1) {
             ctx.beginPath();
             ctx.moveTo(r.history[0].x, r.history[0].y);
             for(let j=1; j < r.history.length; j++){
                ctx.lineTo(r.history[j].x, r.history[j].y);
             }
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 2;
             ctx.stroke();
         }

         // Head
         ctx.fillStyle = '#fff';
         ctx.fillRect(r.x - 2, r.y - 2, 4, 4);

         // Explode if reached target
         if (r.vy < 0 && r.y <= r.targetY) {
            spawnBurst(r.x, r.y, r.color1, r.color2, r.sizeMultiplier);
            if (activeTier === 'Fireworks' && !soundsRef.current.crackle?.playing()) {
               soundsRef.current.crackle?.play();
            }
            rockets.splice(i, 1);
         } else if (r.vy > 0 && r.y >= r.targetY) {
            spawnBurst(r.x, r.y, r.color1, r.color2, r.sizeMultiplier);
            rockets.splice(i, 1);
         }
      }

      // Draw and update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 5) p.history.shift();

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.opacity -= 0.012;

        if (p.history.length > 1) {
           ctx.beginPath();
           ctx.moveTo(p.history[0].x, p.history[0].y);
           for(let j=1; j < p.history.length; j++){
              ctx.lineTo(p.history[j].x, p.history[j].y);
           }
           ctx.strokeStyle = p.color;
           ctx.lineWidth = 2;
           ctx.globalAlpha = Math.max(0, p.opacity * 0.5);
           ctx.stroke();
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect((p.x | 0) - 1.5, (p.y | 0) - 1.5, 3, 3);
        ctx.globalAlpha = 1.0;

        if (p.opacity <= 0) particles.splice(i, 1);
      }
      ctx.globalCompositeOperation = 'source-over';
      } // End !isReducedMotion

      if (!canSpawn) {
        // Stop audio smoothly
        if (!fadeOutTriggered) {
          fadeOutTriggered = true;
          if (soundsRef.current.crackle) {
            soundsRef.current.crackle.fade(0.3, 0, 1000);
            setTimeout(() => {
              if (soundsRef.current.crackle) soundsRef.current.crackle.stop();
            }, 1000);
          }
        }

        // Only stop the render loop when all particles are actually gone
        if (particles.length === 0) {
          return;
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tier]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    // Only trigger canvas animation on mount/state-load if not currently in a reveal sequence
    if (isRevealed && !isAnimatingRef.current) animateCanvas();
  }, [isRevealed, animateCanvas]);

  // Background Starfield Animation
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;

    // PERFORMANCE OPTIMIZATION (Bolt ⚡):
    // Moved star initialization outside of the render/resize cycle to prevent
    // recreating the array and objects on every mount. We only initialize if empty.
    if (!starsRef.current || starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 150 }, () => ({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
      }));
    }
    const stars = starsRef.current;

    const drawBg = () => {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.fillStyle = '#ffffff';
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.2) star.speed *= -1;

        // PERFORMANCE OPTIMIZATION (Bolt ⚡):
        // Replaced expensive path/arc rendering with fillRect for tiny particles.
        // Bypassing trigonometric curve calculations for particles
        // keeps main thread execution time low and maintains a smooth 60fps.
        // Also removed string interpolation for dynamic transparency,
        // relying on globalAlpha instead to reduce garbage collection pressure.
        bgCtx.globalAlpha = star.alpha;
        bgCtx.fillRect(star.x - star.radius, star.y - star.radius, star.radius * 2, star.radius * 2);
      });
      bgCtx.globalAlpha = 1.0;
      bgRequestRef.current = requestAnimationFrame(drawBg);
    };

    drawBg();

    const handleResize = () => {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      // Reposition stars for new canvas dimensions
      stars.forEach(star => {
        if (star.x > bgCanvas.width) star.x = Math.random() * bgCanvas.width;
        if (star.y > bgCanvas.height) star.y = Math.random() * bgCanvas.height;
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (bgRequestRef.current) cancelAnimationFrame(bgRequestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`relative w-full flex-1 ${
      isCompact ? 'min-h-[200px]' : 'min-h-[500px]'
    } flex flex-col items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <Aurora ref={auroraRef} />
      <canvas ref={bgCanvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {!isCompact && (
        <div className="absolute top-4 left-4 z-20">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90">
            <span aria-hidden>←</span> Return to Home
          </Link>
        </div>
      )}

      <div className="z-10 flex flex-col items-center max-w-md w-full mx-4 mt-auto">
        {totalVisits !== null && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 shadow-lg backdrop-blur-sm animate-fade-in text-slate-300 text-sm tracking-widest uppercase">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Total Resonance Rituals: <strong className="text-emerald-400 font-bold ml-1">{totalVisits.toLocaleString()}</strong></span>
          </div>
        )}
        <div className={`bg-transparent backdrop-blur-md p-6 rounded-2xl shadow-[0_0_40px_rgba(100,100,255,0.1)] border border-white/5 text-center w-full flex flex-col items-center justify-center ${
          isCompact ? 'min-h-[200px]' : 'mt-[35vh]'
        }`}>
          {!isRevealed && !isRevealing ? (
          <div className="flex flex-col items-center justify-center flex-1 w-full py-8">
            <h2 className="text-sm tracking-widest text-slate-400 uppercase mb-4">Daily Resonance Ritual</h2>
            <h1 className="text-3xl font-light text-white mb-8">AWAKEN TODAY'S RESONANCE</h1>
            <ResonanceButton onClick={handleReveal} />
          </div>
        ) : isRevealing ? (
           <div className="animate-fade-in flex flex-col items-center justify-center min-h-[16rem]">
              <div className="animate-plasma-glow my-6 flex items-center justify-center min-w-[200px] mix-blend-screen relative">
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"></div>
                <div className="text-7xl font-bold text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] animate-flicker relative z-10" style={{ textShadow: "0 0 40px rgba(100, 255, 255, 0.8), 0 0 80px rgba(50, 200, 255, 0.6)" }}>
                  {displayPercentage}%
                </div>
              </div>
           </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center flex-1 pt-6 pb-2">
            <h2 className="text-sm tracking-widest text-cyan-400 uppercase mb-2">{tier} Resonance</h2>
            <div className={`plasma-glow-settled my-2 flex items-center justify-center min-w-[200px] mix-blend-screen relative`}>
              <div className="absolute inset-0 bg-cyan-500/10 blur-2xl rounded-full"></div>
              <div className="text-7xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)] relative z-10" style={{ textShadow: "0 0 30px rgba(100, 255, 255, 0.6), 0 0 60px rgba(50, 150, 255, 0.4)" }}>
                {displayPercentage}%
              </div>
            </div>
            <p className="text-slate-300 italic mb-4 min-h-[4rem]">"{quote}"</p>

            <div className="flex flex-col items-center mt-auto w-full pt-4">
              <button
                onClick={handleShare}
                className="border border-cyan-500/50 text-cyan-300 px-6 py-2 rounded-full hover:bg-cyan-500/10 transition-colors duration-200 mb-6"
              >
                {shareStatus === 'copied' ? 'Copied ✓' : 'Share My Resonance'}
              </button>

              <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">Next Resonance In</p>
              <div className="text-3xl font-mono text-cyan-300 tracking-wider shadow-cyan-500/20 drop-shadow-md">
                {timeRemaining}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
