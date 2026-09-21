'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { LUCKY_CARDS, selectWeightedLuckyCard, selectRandomQuote } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import MidnightCountdown from '../components/midnight-countdown';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Adjusted schedules for a smooth, gathering energy reveal
const REVEAL_SCHEDULES = {
  standard: { duration: 4.0, flipAt: 3.2 },
  premium: { duration: 5.0, flipAt: 4.0 },
  flagship: { duration: 6.0, flipAt: 4.8 }
};

export default function LuckyCardReveal() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [previousQuote, setPreviousQuote] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const [scope, animate] = useAnimate();
  const activeTimeoutsRef = useRef([]);
  const animationControlsRef = useRef(null);
  const cardRef = useRef(null);
  const cardFrontRef = useRef(null);
  const cardFlipRef = useRef(null);

  const bgCanvasRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const rafStartTimeRef = useRef(0);
  const activeTierRef = useRef('standard');
  const isRevealedRef = useRef(false);
  const activeCardRef = useRef(null);
  const cardMetricsRef = useRef({ cx: 140, cy: 202.5, w: 280, h: 405 });
  const fallbackTimerRef = useRef(null);

  // Particle systems state for the render loop
  const particlesRef = useRef([]);
  const orbsRef = useRef([]);
  const hasBurstRef = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.revealDate === localDateKey()) {
          const card = LUCKY_CARDS.find(c => c.id === parsed.cardId);
          if (card) {
            setSelectedCard({ ...card, quote: parsed.quote || card.quote });
            setIsRevealed(true);
          }
        } else {
          setPreviousCardId(parsed.cardId);
          setPreviousQuote(parsed.quote);
        }
      }
    } catch (e) {}
    setIsReady(true);
  }, []);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (animationControlsRef.current) animationControlsRef.current.stop();
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    activeTimeoutsRef.current.forEach(clearTimeout);
    activeTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return stopAll;
  }, [stopAll]);

  const executeRevealState = useCallback(() => {
    if (isRevealedRef.current) return;
    isRevealedRef.current = true;
    setIsRevealed(true);

    if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
    }

    if (activeCardRef.current && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cardId: activeCardRef.current.id,
          quote: activeCardRef.current.quote,
          revealDate: localDateKey()
        }));
      } catch (e) {}
    }

    if (cardFrontRef.current) {
        cardFrontRef.current.style.maskImage = 'none';
        cardFrontRef.current.style.webkitMaskImage = 'none';
    }
  }, []);

  // --- NEW CINEMATIC RENDER LOOP ---
  const renderCanvas = (timestamp) => {
    if (!bgCanvasRef.current || shouldReduceMotion) return;
    if (!rafStartTimeRef.current) rafStartTimeRef.current = timestamp;

    let elapsed = (timestamp - rafStartTimeRef.current) / 1000;

    const ctx = bgCanvasRef.current.getContext('2d');
    const w = bgCanvasRef.current.width;
    const h = bgCanvasRef.current.height;

    const { cx, cy, w: cardW, h: cardH } = cardMetricsRef.current;
    const tier = activeTierRef.current;

    ctx.clearRect(0, 0, w, h);

    const fgCtx = fgCanvasRef.current ? fgCanvasRef.current.getContext('2d') : null;
    if (fgCtx) {
      fgCtx.clearRect(0, 0, w, h);
    }

    const schedule = REVEAL_SCHEDULES[tier] || REVEAL_SCHEDULES.standard;
    const { flipAt, duration } = schedule;
    const maxLifetime = duration + 2.0;

    const tierColors = {
      standard: ['14, 165, 233', '217, 70, 239'], // Blue, Pink
      premium: ['14, 165, 233', '217, 70, 239', '59, 130, 246'],
      flagship: ['14, 165, 233', '217, 70, 239', '234, 179, 8'] // Blue, Pink, Gold
    };
    const colors = tierColors[tier];

    // 1. Ambient Background Glow (Smooth, Breathing)
    if (elapsed > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const breathe = Math.sin(elapsed * 2) * 0.1 + 0.9;
      const intensity = Math.min(1, elapsed / 2) * (elapsed > flipAt ? Math.max(0, 1 - (elapsed - flipAt)) : 1);

      const bgGrad = ctx.createRadialGradient(cx, cy, cardW * 0.5, cx, cy, Math.max(w, h) * 0.8 * breathe);
      bgGrad.addColorStop(0, `rgba(${colors[0]}, ${0.15 * intensity})`);
      bgGrad.addColorStop(0.5, `rgba(${colors[1] || colors[0]}, ${0.05 * intensity})`);
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 2. Manage Orbs (Volumetric Energy Fields)
    if (elapsed < flipAt) {
      if (Math.random() < 0.1 * (elapsed + 1)) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = cardW * 1.5 + Math.random() * cardW;
        orbsRef.current.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 20, // Move slowly towards center
          vy: -Math.sin(angle) * 20,
          radius: 50 + Math.random() * 150,
          color: color,
          life: 0,
          maxLife: 1.5 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // 3. Manage Particles (Ethereal Dust)
    if (elapsed < flipAt) {
       // Gathering dust
       for(let i=0; i < 3; i++) {
         const angle = Math.random() * Math.PI * 2;
         const dist = cardW + Math.random() * cardW * 2;
         particlesRef.current.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist + (Math.random() * 200 - 100),
            vx: -Math.cos(angle) * (10 + Math.random() * 40),
            vy: -Math.sin(angle) * (10 + Math.random() * 40) - 20, // Slight upward drift
            size: 1 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0,
            maxLife: 2 + Math.random() * 1,
            type: 'gather'
         });
       }
    }

    // Burst at flip
    if (elapsed >= flipAt && !hasBurstRef.current) {
       hasBurstRef.current = true;
       for(let i=0; i < 150; i++) {
         const angle = Math.random() * Math.PI * 2;
         const speed = 100 + Math.random() * 400;
         particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0,
            maxLife: 1.0 + Math.random() * 1.5,
            type: 'burst'
         });
       }
       // Add a massive flash orb
       orbsRef.current.push({
          x: cx, y: cy, vx: 0, vy: 0,
          radius: cardW * 3,
          color: '255, 255, 255',
          life: 0, maxLife: 1.0,
          phase: 0,
          isFlash: true
       });
    }

    // Draw Orbs
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = orbsRef.current.length - 1; i >= 0; i--) {
      let orb = orbsRef.current[i];
      orb.life += 1/60; // Approx delta time
      orb.x += orb.vx * (1/60);
      orb.y += orb.vy * (1/60);

      let progress = orb.life / orb.maxLife;
      if (progress >= 1) {
        orbsRef.current.splice(i, 1);
        continue;
      }

      let opacity = orb.isFlash ? Math.pow(1 - progress, 2) : Math.sin(progress * Math.PI) * 0.3;
      let currentRadius = orb.isFlash ? orb.radius * (1 + progress) : orb.radius * (0.8 + 0.2 * Math.sin(orb.phase + elapsed * 3));

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, currentRadius);
      grad.addColorStop(0, `rgba(${orb.color}, ${opacity})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();

    // Draw Particles (in FG to overlay card slightly, or BG)
    const targetCtx = elapsed > flipAt && fgCtx ? fgCtx : ctx;
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      let p = particlesRef.current[i];
      p.life += 1/60;

      if (p.type === 'burst') {
          p.vx *= 0.92; // Drag
          p.vy *= 0.92;
          p.vy += 2; // Gravity
      } else {
          // Swirl effect for gathering
          const angleToCenter = Math.atan2(cy - p.y, cx - p.x);
          p.vx += Math.cos(angleToCenter) * 2;
          p.vy += Math.sin(angleToCenter) * 2;
          p.vx *= 0.95;
          p.vy *= 0.95;
      }

      p.x += p.vx * (1/60);
      p.y += p.vy * (1/60);

      let progress = p.life / p.maxLife;
      if (progress >= 1) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      let opacity = p.type === 'burst' ? (1 - progress) : Math.sin(progress * Math.PI);

      targetCtx.beginPath();
      targetCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      targetCtx.fillStyle = `rgba(${p.color}, ${opacity * 0.8})`;
      targetCtx.fill();
    }
    targetCtx.restore();


    if (elapsed >= flipAt + 0.5) {
        executeRevealState();
    }

    if (elapsed < maxLifetime) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    } else {
      setIsGenerating(false);
    }
  };

  const triggerCardDraw = () => {
    stopAll();

    const card = selectWeightedLuckyCard(previousCardId);
    activeTierRef.current = card.tier;
    activeCardRef.current = card;
    card.quote = selectRandomQuote(previousQuote);
    isRevealedRef.current = false;

    setSelectedCard(card);
    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);

    const schedule = REVEAL_SCHEDULES[card.tier] || REVEAL_SCHEDULES.standard;

    requestAnimationFrame(() => {
      if (bgCanvasRef.current) {
        bgCanvasRef.current.width = window.innerWidth;
        bgCanvasRef.current.height = window.innerHeight;
      }
      if (fgCanvasRef.current) {
        fgCanvasRef.current.width = window.innerWidth;
        fgCanvasRef.current.height = window.innerHeight;
      }

      if (!shouldReduceMotion) {
        particlesRef.current = [];
        orbsRef.current = [];
        hasBurstRef.current = false;
        rafRef.current = requestAnimationFrame(renderCanvas);
      }
    });
    rafStartTimeRef.current = 0;

    if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
            cardMetricsRef.current = {
                cx: rect.left + rect.width / 2,
                cy: rect.top + rect.height / 2,
                w: rect.width,
                h: rect.height
            };
        }
    }

    // --- NEW FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];

    // Cinematic Float & Charge
    const floatDuration = schedule.flipAt;

    // Smooth initial lift
    sequence.push([cardRef.current, { y: 30, scale: 0.95, rotateZ: 0, opacity: 0, filter: "brightness(0)" }, { duration: 0 }]);
    sequence.push([cardFlipRef.current, { rotateY: 0 }, { duration: 0 }]);
    sequence.push([cardRef.current, { opacity: 1, filter: "brightness(0.5)", y: -10, scale: 1.0 }, { at: 0.1, duration: 2.0, ease: 'easeOut' }]);

    // Slow hovering levitation while charging
    sequence.push([
        cardRef.current,
        { y: [-10, -25, -10], filter: ["brightness(0.5)", "brightness(2.5)", "brightness(1)"] },
        { at: 1.0, duration: floatDuration - 1.0, ease: "easeInOut" }
    ]);

    // The Reveal Flip
    sequence.push([cardRef.current, { y: 0, scale: 1.0, rotateZ: 0, opacity: 1, filter: "brightness(1)" }, { at: schedule.flipAt.toString(), duration: 1.2, ease: "circOut" }]);
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: schedule.flipAt.toString(), duration: 1.2, ease: "circOut" }]);

    if (!shouldReduceMotion) {
      animationControlsRef.current = animate(sequence, { autoplay: true });
      animationControlsRef.current.then(() => {
        executeRevealState();
      });
    } else {
      if (cardRef.current) {
        cardRef.current.style.opacity = '1';
        cardRef.current.style.filter = 'brightness(1)';
      }
      if (cardFlipRef.current) {
        cardFlipRef.current.style.transform = 'rotateY(180deg)';
      }
      executeRevealState();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center px-4 py-4 space-y-6 select-none relative z-10">
      
      {isGenerating && (
        <canvas
          ref={bgCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-[-10]"
          style={{ mixBlendMode: 'screen' }}
        />
      )}
      {isGenerating && (
        <canvas
          ref={fgCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-[30]"
        />
      )}

      <div className="w-full flex flex-col items-center text-center space-y-2">
        {isReady && isRevealed && selectedCard && (
          <div className="text-lg font-bold text-gray-300">
            Resets in: <MidnightCountdown fallback="--h --m --s"/>
          </div>
        )}

        {isReady && !isRevealed && !selectedCard && (
          <button
            type="button"
            onClick={triggerCardDraw}
            disabled={isGenerating}
            className="mt-2 px-6 py-2.5 rounded-full font-bold text-base shadow-lg transition-all bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95"
          >
            {isGenerating ? 'Revealing...' : "Reveal Today's Luck"}
          </button>
        )}
      </div>

      <div
        ref={scope}
        className="w-full flex justify-center pt-16 pb-4 flex-shrink-0 relative"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          ref={cardRef}
          className="card-container relative z-20 w-[280px] h-[405px] cursor-pointer mx-auto flex-shrink-0 [WebkitTapHighlightColor:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded-2xl"
        >
          <div className="relative w-full h-full">
            <div
              ref={cardFlipRef}
              className="w-full h-full relative"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl border-none">
                  <Image alt="Card Back Face" className="object-cover rounded-2xl" fill priority quality={100} src="/IMG_20260728_220305_112042.png"/>
                </div>
              </div>

              <div
                ref={cardFrontRef}
                className={`absolute inset-0 rounded-2xl transition-shadow duration-700 ${isRevealed && selectedCard ? `tier-glow-${selectedCard.tier}` : ''}`}
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl border-none">
                  {selectedCard && selectedCard.image && !imageError ? (
                    <Image alt={selectedCard.title || 'Revealed Card'} className="object-cover rounded-2xl" fill onError={() => setImageError(true)} priority quality={100} src={selectedCard.image} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center p-4 text-amber-200">
                      Lucky Pick 🍁 Canada.ca
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {isReady && isRevealed && selectedCard && (
        <div className="w-full flex flex-col items-center space-y-4 pt-2 animate-fade-in">
          <div className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-center">
            <p className="text-base italic text-gray-800 font-serif leading-relaxed">
              "{selectedCard.quote || 'Your lucky moment awaits.'}"
            </p>
          </div>
          <div className="w-full flex justify-center pb-4">
            <LuckyCardShare card={selectedCard}/>
          </div>
        </div>
      )}
    </div>
  );
}
