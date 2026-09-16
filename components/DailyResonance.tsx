'use client';
import Aurora, { AuroraHandle } from "./Aurora";
import TwinklingStars from "./TwinklingStars";


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
    uiClick: null,
    impactMeteor: null,
    impactLightning: null,
    impactFireworks: null,
    fireworkBurst: null,
    fireworkBurstAlt: null,
    crackle: null,
    willowCrackle: null
  });

  useEffect(() => {
    soundsRef.current = {
      buildup: new Howl({ src: ['/freesound_community-starship-rail-gun-charge-35904.mp3'], volume: 0.8 }),
      uiClick: new Howl({ src: ['/sounds/ui-click.mp3'], volume: 0.8 }),
      impactMeteor: new Howl({ src: ['/sounds/mixkit-cinematic-whoosh.mp3'], volume: 1.0 }),
      impactLightning: new Howl({ src: ['/sounds/mixkit-cinematic-impact.mp3'], volume: 1.0 }),
      impactFireworks: new Howl({ src: ['/freesound_community-fireworks-1-94483.mp3'], volume: 1.0 }),
      fireworkBurst: new Howl({ src: ['/freesound_community-fireworks-1-94483.mp3'] }),
      fireworkBurstAlt: new Howl({ src: ['/sounds/mixkit-magical-impact.mp3'] }),
      crackle: new Howl({ src: ['/sounds/mixkit-magic-sparkles.mp3'], volume: 0.3, loop: true }),
      willowCrackle: new Howl({ src: ['/sounds/mixkit-firework-crackle.mp3'], volume: 1.0 })
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
  useEffect(() => { if (auroraRef.current && !isRevealing && !isRevealed) auroraRef.current.setPhase('idle'); }, [isRevealing, isRevealed]);


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
        if (pct <= 35) setTier('Meteor Shower');
        else if (pct <= 74) setTier('Cosmic Lightning');
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

    if (soundsRef.current.uiClick) soundsRef.current.uiClick.play();

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
    if (newPct <= 35) currentTier = 'Meteor Shower';
    else if (newPct <= 74) currentTier = 'Cosmic Lightning';
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
        // Delay the cinematic buildup slightly so the click sound breathes
        setTimeout(() => {
          if (soundsRef.current.buildup && isAnimatingRef.current) {
            soundsRef.current.buildup.play();
          }
        }, 150);
      }
    });

    // 1. Gather (Tension Phase, 1.5s)
    tl.call(() => { if (auroraRef.current) auroraRef.current.setPhase('gather'); }, undefined, 1.5);
    const proxy = { val: 0, jitterMag: 40 };

    const updatePercentage = () => {
      let jitter = Math.floor((Math.random() - 0.5) * proxy.jitterMag);
      let currentVal = Math.floor(proxy.val + jitter);
      currentVal = Math.max(0, Math.min(100, currentVal));
      setDisplayPercentage(currentVal);
    };

    // Phase 1: 0 -> 100 (1.5s to 3.0s)
    tl.to(proxy, {
      val: 100,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: updatePercentage
    }, 1.5);

    // Phase 2: 100 -> 0 (3.0s to 4.5s)
    tl.to(proxy, {
      val: 0,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: updatePercentage
    }, 3.0);

    // Decay initial large jitter by 4.5s
    tl.to(proxy, {
      jitterMag: 3,
      duration: 3.0,
      ease: "power2.in"
    }, 1.5);

    // Phase 3: 0 -> finalPct (4.5s to 7.5s)
    // Decelerate naturally into the actual result
    tl.to(proxy, {
      val: newPct,
      duration: 3.0,
      ease: "power3.out",
      onUpdate: updatePercentage
    }, 4.5);

    // Settle jitter fully
    tl.to(proxy, {
      jitterMag: 0,
      duration: 1.0,
      ease: "power2.in"
    }, 6.5);

    // 3. Impact Frame (at 7.5s)
    tl.call(() => {
      if (auroraRef.current) auroraRef.current.setPhase('impact', currentTier);
      setTimeout(() => {
        if (auroraRef.current) auroraRef.current.setPhase('settled', currentTier);
      }, 1000);

      setDisplayPercentage(newPct);

      // Stop buildup
      if (soundsRef.current.buildup) {
        soundsRef.current.buildup.fade(0.8, 0, 500);
        setTimeout(() => { if (soundsRef.current.buildup) soundsRef.current.buildup.stop(); }, 500);
      }

      // Impact sounds are now triggered per-event in the canvas render loop

      // Start canvas animation
      animateCanvas(currentTier, 0);

      // Update state for UI transition
      setTier(currentTier);
      setQuote(LUCKY_QUOTES[newQuoteIdx]);
      setIsRevealed(true);
      setIsRevealing(false);
    }, undefined, 7.5);

    // 4. Final lingering buffer to ensure ~12s total cinematic duration
    // Canvas animation is built to span this remaining 5.5s beautifully.
    tl.to({}, { duration: 5.5 });
  };

  const handleShare = async () => {
    if (soundsRef.current.uiClick) soundsRef.current.uiClick.play();
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
    let lightningStrikes: any[] = [];
    let meteors: any[] = [];
    const fallbackStartTime = typeof animationStartTimeMs === 'number' ? performance.now() - animationStartTimeMs : performance.now();
    let fadeOutTriggered = false;
    const isMobile = window.innerWidth < 768;
    const w = canvas.width;
    const h = canvas.height;

    // Scripted Logic Flags
    const scriptPhase1Done = { current: false };
    const scriptPhase2Done = { current: false };
    const scriptPhase3Done = { current: false };
    const scriptPhase4Done = { current: false };
    const scriptPhase5Done = { current: false };

    // Firework Colors
    const colors = ['#ff5050', '#5a8cff', '#6eff96', '#c86eff', '#ffcd5a', '#ffffff', '#ff9cee'];

    // --- EFFECT SPAWNERS ---

    const spawnMeteor = (startX: number, startY: number, angle: number, speed: number, length: number, thickness: number, color: string) => {
        meteors.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            length: length,
            thickness: thickness,
            color: color,
            opacity: 0, // fade in
            state: 'in', // 'in', 'steady', 'out'
            life: 0,
            maxLife: 60 + Math.random() * 40,
            gravity: 0.05 + Math.random() * 0.05, // unique gravity curve
            drag: 0.99 // slight air resistance
        });
    };

    const spawnLightning = (x: number, y: number, scale: number, isPrimary = false) => {
        const segments: any[] = [];
        const maxGenerations = isMobile ? 6 : (isPrimary ? 8 : 7);

        const buildJaggedBranch = (startX: number, startY: number, endX: number, endY: number, roughness: number, generation: number, branchProb: number) => {
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx * dx + dy * dy);

            // If we've reached the generation limit or the segment is very short,
            // push the segment so the bolt remains a continuous connected path.
            if (generation >= maxGenerations || length < (isMobile ? 12 : 8)) {
                segments.push({ startX, startY, endX, endY, generation, isPrimaryBranch: generation === 0 });
                return;
            }

            // Controlled irregularity: variance perpendicular to the segment
            const normalX = -dy / length;
            const normalY = dx / length;

            // Bias downwards to ensure it seeks ground
            const varianceAmt = (Math.random() - 0.5) * roughness * scale;
            const midX = (startX + endX) / 2 + normalX * varianceAmt;
            const midY = (startY + endY) / 2 + normalY * varianceAmt + (roughness * 0.15 * scale);

            buildJaggedBranch(startX, startY, midX, midY, roughness * 0.55, generation + 1, branchProb);
            buildJaggedBranch(midX, midY, endX, endY, roughness * 0.55, generation + 1, branchProb);

            // Natural branching: sparse, deliberate branches rather than noise
            if (Math.random() < branchProb) {
                const branchAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.6);
                const branchLength = length * (0.4 + Math.random() * 0.4);
                const bEndX = midX + Math.cos(branchAngle) * branchLength;
                const bEndY = midY + Math.sin(branchAngle) * branchLength;

                // Secondary branches have drastically reduced branching probability
                buildJaggedBranch(midX, midY, bEndX, bEndY, roughness * 0.7, generation + 1, branchProb * 0.2);
            }
        };

        const targetX = x + (Math.random() - 0.5) * (isMobile ? 250 : 500) * scale;
        // Deep strikes that reach into the composition
        const targetY = y + (isMobile ? 400 : 700) * scale + Math.random() * (isMobile ? 200 : 300) * scale;

        buildJaggedBranch(x, y, targetX, targetY, isMobile ? 120 : 180, 0, isPrimary ? 0.35 : 0.15);

        lightningStrikes.push({
            segments,
            life: 1.0,
            isPrimary,
            scale
        });
    };

    const spawnBurst = (x: number, y: number, type: string, color1: string, color2: string, sizeMultiplier: number) => {
        if (type === 'willow') {
            const pCount = Math.floor(250 * sizeMultiplier);
            for (let i = 0; i < pCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = (Math.random() * 8 + 1) * sizeMultiplier;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    opacity: 1.8, // Start very high for long life
                    color: '#ffffff',
                    history: [],
                    type: 'willow',
                    gravityMultiplier: 1.05, // Refined cinematic float
                    friction: 0.96 // Smoother deceleration
                });
            }
        } else if (type === 'layered_ring') {
            const rings = [
                { count: Math.floor(80 * sizeMultiplier), speed: 6, color: color1 },
                { count: Math.floor(50 * sizeMultiplier), speed: 3.5, color: color2 }
            ];
            rings.forEach(ring => {
                for (let i = 0; i < ring.count; i++) {
                    const angle = (i / ring.count) * Math.PI * 2;
                    const velocity = ring.speed * sizeMultiplier + (Math.random() * 0.4);
                    particles.push({
                        x, y,
                        vx: Math.cos(angle) * velocity,
                        vy: Math.sin(angle) * velocity,
                        opacity: 1.2,
                        color: ring.color,
                        history: [],
                        type: 'normal',
                        gravityMultiplier: 0.4,
                        friction: 0.94
                    });
                }
            });
        } else if (type === 'palm') {
            const branches = 7;
            for (let b = 0; b < branches; b++) {
                const angle = (b / branches) * Math.PI * 2 + (Math.random() * 0.2);
                for (let i = 0; i < 25; i++) {
                    const velocity = (i * 0.35 + 2) * sizeMultiplier;
                    particles.push({
                        x, y,
                        vx: Math.cos(angle) * velocity + (Math.random()-0.5)*0.5,
                        vy: Math.sin(angle) * velocity + (Math.random()-0.5)*0.5,
                        opacity: 1.3,
                        color: '#ffcd5a', // Golden palm
                        history: [],
                        type: 'normal',
                        gravityMultiplier: 0.8,
                        friction: 0.96
                    });
                }
            }
        } else if (type === 'strobe') {
             const pCount = Math.floor(120 * sizeMultiplier);
             for (let i = 0; i < pCount; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const velocity = (Math.random() * 9 + 2) * sizeMultiplier;
                 particles.push({
                     x, y,
                     vx: Math.cos(angle) * velocity,
                     vy: Math.sin(angle) * velocity,
                     opacity: 1.1,
                     color: color1,
                     history: [],
                     type: 'strobe',
                     gravityMultiplier: 0.5,
                     friction: 0.92,
                     strobePhase: Math.random() * Math.PI * 2
                 });
             }
        } else {
            // Peony / default (dense spherical)
            const pCount = Math.floor(150 * sizeMultiplier);
            for (let i = 0; i < pCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                // Tighter clustering for peony
                const r = Math.random();
                const velocity = (r * r * 8 + 2) * sizeMultiplier;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    opacity: 1.0,
                    color: Math.random() > 0.4 ? color1 : color2,
                    history: [],
                    type: 'normal',
                    gravityMultiplier: 0.6,
                    friction: 0.93
                });
            }
        }
    };

    const spawnRocket = (startX: number, startY: number, targetX: number, targetY: number, sizeMultiplier: number, speedMultiplier: number, type: string = 'chrysanthemum') => {
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
          type,
          history: []
       });
    };

    // Organic Willow Interaction Vector Field
    // Text is roughly centered, we can approximate the center.
    const centerX = canvas.width / 2;
    const centerY = canvas.height * (isMobile ? 0.45 : 0.5);

    const loop = () => {
      const elapsedMs = performance.now() - fallbackStartTime;
      const canSpawn = elapsedMs < 4500;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isReducedMotion) {
         if (canSpawn || particles.length > 0 || lightningStrikes.length > 0) {
            const alpha = Math.min(1, Math.max(0, canSpawn ? elapsedMs / 1000 : 1 - (elapsedMs - 4500) / 1000));
            if (alpha > 0) {
              const radius = Math.max(canvas.width, canvas.height)/2;
              const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/4, 0, canvas.width/2, canvas.height/4, radius);
              const color = activeTier === 'Fireworks' ? '255, 205, 90' : (activeTier === 'Cosmic Lightning' ? '200, 150, 255' : '100, 200, 255');
              grad.addColorStop(0, `rgba(${color}, ${alpha * 0.4})`);
              grad.addColorStop(1, `rgba(${color}, 0)`);
              ctx.fillStyle = grad;
              ctx.fillRect((canvas.width/2) - radius, (canvas.height/4) - radius, radius * 2, radius * 2);
              particles = [1]; // keep alive
            } else {
              particles = [];
            }
         }
      } else {

      // --- TIER SCRIPTING ---

      if (activeTier === 'Meteor Shower' && canSpawn) {
         if (elapsedMs > 200 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            spawnMeteor(w * 0.8, -50, Math.PI * 0.7, 15, 120, 2, '#a0e8ff');
            if (soundsRef.current.impactMeteor) {
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(1.2, id);
               soundsRef.current.impactMeteor.volume(0.6, id);
            }
         }
         if (elapsedMs > 800 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            spawnMeteor(w * 0.4, -50, Math.PI * 0.65, 20, 80, 1.5, '#ffffff');
            if (soundsRef.current.impactMeteor) {
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(1.5, id);
               soundsRef.current.impactMeteor.volume(0.6, id);
            }
         }
         if (elapsedMs > 1600 && !scriptPhase3Done.current) {
            scriptPhase3Done.current = true;
            spawnMeteor(w + 50, h * 0.1, Math.PI * 0.8, 12, 150, 2.5, '#6eff96');
            if (soundsRef.current.impactMeteor) {
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(0.9, id);
               soundsRef.current.impactMeteor.volume(0.7, id);
            }
         }
         if (elapsedMs > 2200 && !scriptPhase4Done.current) {
            scriptPhase4Done.current = true;
            spawnMeteor(w * 0.6, -50, Math.PI * 0.75, 18, 100, 1.8, '#a0e8ff');
            if (soundsRef.current.impactMeteor) {
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(1.3, id);
               soundsRef.current.impactMeteor.volume(0.7, id);
            }
         }
         if (elapsedMs > 3200 && !scriptPhase5Done.current) {
            scriptPhase5Done.current = true;
            spawnMeteor(w * 0.9, h * 0.2, Math.PI * 0.7, 25, 200, 3, '#ffcd5a'); // final brightest
            if (soundsRef.current.impactMeteor) {
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(0.7, id);
               soundsRef.current.impactMeteor.volume(1, id);
            } // deeper and louder for the finale
         }
      }

      else if (activeTier === 'Cosmic Lightning' && canSpawn) {
         if (elapsedMs > 300 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            // Anticipation - distant or secondary strike
            spawnLightning(w * 0.2, -50, 0.8, false);
            if (soundsRef.current.impactLightning) {
               const id = soundsRef.current.impactLightning.play();
               soundsRef.current.impactLightning.rate(1.3, id);
               soundsRef.current.impactLightning.volume(0.5, id);
            }
         }
         if (elapsedMs > 1200 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            // First strong strike
            spawnLightning(w * 0.65, -50, 1.2, true);
            if (soundsRef.current.impactLightning) {
               const id = soundsRef.current.impactLightning.play();
               soundsRef.current.impactLightning.rate(1, id);
               soundsRef.current.impactLightning.volume(0.8, id);
            }
         }
         if (elapsedMs > 2400 && !scriptPhase3Done.current) {
            scriptPhase3Done.current = true;
            // Secondary flicker
            spawnLightning(w * 0.4, -50, 0.7, false);
            if (soundsRef.current.impactLightning) {
               const id = soundsRef.current.impactLightning.play();
               soundsRef.current.impactLightning.rate(1.5, id);
               soundsRef.current.impactLightning.volume(0.4, id);
            }
         }
         if (elapsedMs > 3500 && !scriptPhase4Done.current) {
            scriptPhase4Done.current = true;
            // Big final cinematic strike
            spawnLightning(w * 0.85, -50, 1.5, true);
            if (soundsRef.current.impactLightning) {
               const id = soundsRef.current.impactLightning.play();
               soundsRef.current.impactLightning.rate(0.8, id);
               soundsRef.current.impactLightning.volume(1, id);
            }

            // Add a sympathetic branch that spawns almost instantly after the main strike
            const timeoutId = setTimeout(() => {
               if (isAnimatingRef.current) {
                  spawnLightning(w * 0.7, -50, 0.9, false);
                  if (soundsRef.current.impactLightning) {
                     const id = soundsRef.current.impactLightning.play();
                     soundsRef.current.impactLightning.rate(1.6, id);
                     soundsRef.current.impactLightning.volume(0.3, id);
                  }
               }
            }, 100);
            // Track timeouts for cleanup if unmounted
            if (!(canvas as any).timeouts) (canvas as any).timeouts = [];
            (canvas as any).timeouts.push(timeoutId);
         }
      }

      else if (activeTier === 'Fireworks' && canSpawn) {
         if (elapsedMs > 100 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            // Launch from far left, Type: Peony
            spawnRocket(w * 0.1, h, w * 0.25, h * 0.3, 1.0, 1.1, 'peony');
            if (soundsRef.current.impactMeteor) { // Reusing whoosh for launch
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(1.5, id);
               soundsRef.current.impactMeteor.volume(0.4, id);
            }
         }
         if (elapsedMs > 1000 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            // Launch from far right, Type: Layered Ring
            spawnRocket(w * 0.9, h, w * 0.7, h * 0.2, 1.1, 1.2, 'layered_ring');
            if (soundsRef.current.impactMeteor) { // Reusing whoosh for launch
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(1.3, id);
               soundsRef.current.impactMeteor.volume(0.4, id);
            }
         }
         if (elapsedMs > 1900 && !scriptPhase3Done.current) {
            scriptPhase3Done.current = true;
            // Mid left, high altitude, Type: Palm
            spawnRocket(w * 0.3, h, w * 0.4, h * 0.15, 1.0, 1.3, 'palm');
            if (soundsRef.current.impactMeteor) { // Reusing whoosh for launch
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(1.1, id);
               soundsRef.current.impactMeteor.volume(0.5, id);
            }
         }
         if (elapsedMs > 2800 && !scriptPhase4Done.current) {
             scriptPhase4Done.current = true;
             // Mid right, Type: Strobe
             spawnRocket(w * 0.75, h, w * 0.6, h * 0.25, 1.0, 1.0, 'strobe');
             if (soundsRef.current.impactMeteor) { // Reusing whoosh for launch
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(1.4, id);
               soundsRef.current.impactMeteor.volume(0.4, id);
            }
         }
         if (elapsedMs > 3800 && !scriptPhase5Done.current) {
             scriptPhase5Done.current = true;
             // The White Willow Climax
             // Center launch, very high
             spawnRocket(w * 0.5, h, w * 0.5, h * 0.1, 2.5, 1.5, 'willow');
             if (soundsRef.current.impactMeteor) { // Reusing whoosh for launch
               const id = soundsRef.current.impactMeteor.play();
               soundsRef.current.impactMeteor.rate(0.8, id);
               soundsRef.current.impactMeteor.volume(0.7, id);
            } // Deeper, louder launch
         }
      }

      ctx.globalCompositeOperation = 'lighter';

      // --- UPDATE & DRAW METEORS ---
      for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.vx *= m.drag;
          m.vy += m.gravity;
          m.x += m.vx;
          m.y += m.vy;
          m.life++;

          if (m.state === 'in') {
              m.opacity += 0.05;
              if (m.opacity >= 1) m.state = 'steady';
          } else if (m.state === 'steady') {
              if (m.life > m.maxLife * 0.6) m.state = 'out';
          } else if (m.state === 'out') {
              m.opacity -= 0.02;
              // Fragmentation effect when breaking up
              if (Math.random() > 0.7 && m.opacity > 0.1) {
                  particles.push({
                      x: m.x + (Math.random() - 0.5) * 10,
                      y: m.y + (Math.random() - 0.5) * 10,
                      vx: m.vx * 0.8 + (Math.random() - 0.5) * 2,
                      vy: m.vy * 0.8 + (Math.random() - 0.5) * 2,
                      opacity: m.opacity,
                      color: m.color,
                      history: [],
                      type: 'fragment',
                      gravityMultiplier: 0.8,
                      friction: 0.98
                  });
              }
          }

          if (m.opacity <= 0 || m.x < -200 || m.y > h + 200) {
              meteors.splice(i, 1);
              continue;
          }

          const trailEndX = m.x - Math.cos(Math.atan2(m.vy, m.vx)) * m.length;
          const trailEndY = m.y - Math.sin(Math.atan2(m.vy, m.vx)) * m.length;

          const grad = ctx.createLinearGradient(m.x, m.y, trailEndX, trailEndY);

          // Hex to rgba helper for gradient
          let r = 255, g = 255, b = 255;
          if (m.color.startsWith('#')) {
              r = parseInt(m.color.slice(1,3), 16);
              g = parseInt(m.color.slice(3,5), 16);
              b = parseInt(m.color.slice(5,7), 16);
          }

          // Intense atmospheric entry gradient (white -> hot color -> red/dark)
          grad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
          grad.addColorStop(0.1, `rgba(${r},${g},${b}, ${m.opacity * 0.9})`);
          grad.addColorStop(0.4, `rgba(${Math.floor(r*0.8)},${Math.floor(g*0.4)},${Math.floor(b*0.2)}, ${m.opacity * 0.5})`);
          grad.addColorStop(1, `rgba(255,50,0, 0)`);

          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(trailEndX, trailEndY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = m.thickness * (1 + Math.random() * 0.5); // Flickering thickness
          ctx.stroke();

          // Intense Heated core glow
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.thickness * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${m.opacity})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(m.x, m.y, m.thickness * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${m.opacity * 0.4})`;
          ctx.fill();
      }

      // --- UPDATE & DRAW LIGHTNING ---
      let maxLightningOpacity = 0;
      for (let i = lightningStrikes.length - 1; i >= 0; i--) {
          const l = lightningStrikes[i];
          l.life -= 0.025; // Snappy cinematic decay
          if (l.life <= 0) {
              lightningStrikes.splice(i, 1);
              continue;
          }

          // Chaotic cinematic flicker based on life phase
          let flicker = 1;
          if (l.life < 0.8 && l.life > 0.3) {
             flicker = Math.random() > 0.5 ? 0.4 : 1;
          } else if (l.life <= 0.3) {
             flicker = Math.random() > 0.7 ? 0 : 0.8;
          }
          const opacity = l.life * flicker;

          if (l.isPrimary) {
             maxLightningOpacity = Math.max(maxLightningOpacity, opacity);
          } else if (maxLightningOpacity === 0) {
             // Secondary strikes still give a tiny bit of environmental flash
             maxLightningOpacity = Math.max(maxLightningOpacity, opacity * 0.3);
          }

          if (opacity > 0) {
              const baseWidth = l.isPrimary ? (isMobile ? 1.5 : 2.5) : (isMobile ? 1.0 : 1.5);

              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              // Multi-pass lighting

              // 1. Broad atmospheric glow (skipped on mobile for performance or kept minimal)
              if (!isMobile || l.isPrimary) {
                  ctx.shadowColor = 'rgba(160, 190, 255, 1)';
                  ctx.shadowBlur = (isMobile ? 15 : 30) * opacity;
                  ctx.strokeStyle = `rgba(100, 150, 255, ${opacity * 0.4})`;
                  ctx.lineWidth = baseWidth * 6;
                  ctx.beginPath();
                  for (const seg of l.segments) {
                      ctx.moveTo(seg.startX, seg.startY);
                      ctx.lineTo(seg.endX, seg.endY);
                  }
                  ctx.stroke();
              }

              // 2. Medium luminous body
              ctx.shadowColor = 'rgba(200, 220, 255, 1)';
              ctx.shadowBlur = (isMobile ? 10 : 20) * opacity;
              ctx.strokeStyle = `rgba(180, 210, 255, ${opacity * 0.8})`;
              ctx.lineWidth = baseWidth * 2.5;
              ctx.beginPath();
              for (const seg of l.segments) {
                  ctx.moveTo(seg.startX, seg.startY);
                  ctx.lineTo(seg.endX, seg.endY);
              }
              ctx.stroke();

              // 3. Crisp white-hot core
              ctx.shadowBlur = (isMobile ? 2 : 5) * opacity;
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
              ctx.lineWidth = baseWidth;
              ctx.beginPath();
              for (const seg of l.segments) {
                  ctx.moveTo(seg.startX, seg.startY);
                  ctx.lineTo(seg.endX, seg.endY);
              }
              ctx.stroke();
          }
      }

      if (maxLightningOpacity > 0) {
          // Cinematic environmental flash/bloom
          const flashRadius = isMobile ? h * 0.7 : h;
          const grad = ctx.createRadialGradient(w/2, h/3, 0, w/2, h/3, flashRadius);
          grad.addColorStop(0, `rgba(200, 220, 255, ${maxLightningOpacity * (isMobile ? 0.2 : 0.25)})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          // Bounded fill to prevent massive GPU overdraw
          ctx.fillRect((w/2) - flashRadius, (h/3) - flashRadius, flashRadius * 2, flashRadius * 2);
      }


      // --- UPDATE & DRAW ROCKETS ---
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
            spawnBurst(r.x, r.y, r.type, r.color1, r.color2, r.sizeMultiplier);
            if (activeTier === 'Fireworks') {
               if (r.type === 'willow') {
                 if (soundsRef.current.willowCrackle) {
                   const id = soundsRef.current.willowCrackle.play();
                   soundsRef.current.willowCrackle.volume(1.0, id);
                 }
               } else {
                 const soundObj = r.type === 'strobe' ? soundsRef.current.fireworkBurstAlt : soundsRef.current.fireworkBurst;
                 if (soundObj) {
                   const id = soundObj.play();
                   soundObj.rate(0.8 + Math.random() * 0.4, id);
                   soundObj.volume(0.4 + Math.random() * 0.3, id);
                 }
               }
            }
            rockets.splice(i, 1);
         } else if (r.vy > 0 && r.y >= r.targetY) {
            spawnBurst(r.x, r.y, r.type, r.color1, r.color2, r.sizeMultiplier);
            if (activeTier === 'Fireworks') {
               if (r.type === 'willow') {
                 if (soundsRef.current.willowCrackle) {
                   const id = soundsRef.current.willowCrackle.play();
                   soundsRef.current.willowCrackle.volume(1.0, id);
                 }
               } else {
                 const soundObj = r.type === 'strobe' ? soundsRef.current.fireworkBurstAlt : soundsRef.current.fireworkBurst;
                 if (soundObj) {
                   const id = soundObj.play();
                   soundObj.rate(0.8 + Math.random() * 0.4, id);
                   soundObj.volume(0.4 + Math.random() * 0.3, id);
                 }
               }
            }
            rockets.splice(i, 1);
         }
      }

      // --- UPDATE & DRAW PARTICLES ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > (p.type === 'willow' ? 12 : 5)) p.history.shift();

        // Willow crackle volume based on willow particle opacity
        if (p.type === 'willow' && p.opacity > 0 && soundsRef.current.willowCrackle?.playing() && i % 10 === 0) {
            // Map highest opacity to volume to ensure we hear it all the way down
            soundsRef.current.willowCrackle.volume(Math.min(1.0, p.opacity));
        }

        // Willow organic interaction with text area
        if (p.type === 'willow') {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            // Use an elliptical distance to better match the text box shape
            // Squish the y distance to make the horizontal bounds wider
            const distSq = (dx * dx) + (dy * dy * 2.5);
            const effectRadius = isMobile ? 140 : 220;
            const effectRadiusSq = effectRadius * effectRadius;

            if (distSq < effectRadiusSq) {
                // Inside the interaction sphere
                const dist = Math.sqrt(distSq);
                // Non-linear force based on distance
                const forceMag = Math.pow(1 - dist / effectRadius, 2) * 0.4;

                // Add varied particle-specific noise (using history length or position as simple seed)
                const noise = ((p.x * 0.1 + p.y * 0.1) % 1) - 0.5;

                // True tangent vector is (-dy, dx) or (dy, -dx)
                // We want them to curve around, typically outwards and downwards
                // dx > 0 means right of center, dy > 0 means below center
                const tangentX = -dy * Math.sign(dx || 1);
                const tangentY = dx * Math.sign(dx || 1);
                const tangentLen = Math.sqrt(tangentX*tangentX + tangentY*tangentY) || 1;

                // Push outwards radially (soft bounce/deflect)
                p.vx += (dx / dist) * forceMag * (1 + noise * 0.5);
                p.vy += (dy / dist) * forceMag * 0.5; // less direct Y push

                // Apply Tangential flow (curve around)
                p.vx += (tangentX / tangentLen) * forceMag * 0.8;
                p.vy += (tangentY / tangentLen) * forceMag * 0.8;

                // Additional drag/scattering inside the field
                p.vx *= 0.92;
                p.vy *= 0.92;
            }
        }

        p.vx *= p.friction || 0.95;
        p.vy *= p.friction || 0.95;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06 * (p.gravityMultiplier || 1.0);

        if (p.type === 'willow') {
            p.opacity -= 0.005; // Live even longer
        } else {
            p.opacity -= 0.012;
        }

        let renderOpacity = p.opacity;
        if (p.type === 'strobe') {
             p.strobePhase += 0.4;
             renderOpacity = p.opacity * (Math.sin(p.strobePhase) > 0 ? 1 : 0);
        }

        if (p.history.length > 1) {
           ctx.beginPath();
           ctx.moveTo(p.history[0].x, p.history[0].y);
           for(let j=1; j < p.history.length; j++){
              ctx.lineTo(p.history[j].x, p.history[j].y);
           }
           ctx.strokeStyle = p.color;
           ctx.lineWidth = p.type === 'willow' ? 1.5 : 2;
           ctx.globalAlpha = Math.max(0, renderOpacity * 0.5);
           ctx.stroke();
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, renderOpacity);
        ctx.fillRect((p.x | 0) - 1.5, (p.y | 0) - 1.5, 3, 3);
        ctx.globalAlpha = 1.0;

        if (p.opacity <= 0) particles.splice(i, 1);
      }
      ctx.globalCompositeOperation = 'source-over';
      } // End !isReducedMotion

      if (!canSpawn) {
        // Only stop when all particles have truly dissipated visually
        if (particles.length === 0 && meteors.length === 0 && lightningStrikes.length === 0 && rockets.length === 0) {
          // Let sounds naturally tail off. They handle their own cleanup.
          return;
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };


    loop();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if ((canvas as any).timeouts) {
        (canvas as any).timeouts.forEach((id: any) => clearTimeout(id));
        (canvas as any).timeouts = [];
      }
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

  return (
    <div className={`relative w-full flex-1 ${
      isCompact ? 'min-h-[200px]' : 'min-h-[500px]'
    } flex flex-col items-center justify-center overflow-hidden z-0`}>
      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <Aurora ref={auroraRef} />
      <img src="/images/lucky-meter-night-sky.webp" className="absolute inset-0 w-full h-full object-cover -z-20 pointer-events-none" alt="" style={{ objectPosition: "center 40%" }} />
      <TwinklingStars />
      <div className="absolute inset-0 bg-slate-950/40 -z-10 pointer-events-none" />
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
        <div className={`text-center w-full flex flex-col items-center justify-center ${
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
