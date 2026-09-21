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

const TIER_HITS = {
  standard: 3,
  premium: 5,
  flagship: 7
};

// Hit durations in seconds
const HIT_DURATION = 1.6;
const FINAL_HIT_DISSIPATE = 2.5; // Final flip + afterglow

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

  const particlesRef = useRef([]);

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

  // Helpers for lightning drawing
    const drawEnergyRibbon = (ctx, startX, startY, endX, endY, width, color) => {
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Create a smooth bezier curve instead of jagged lines
    // Add some sine wave movement based on time for organic feel
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    const time = Date.now() / 200;
    const offset = Math.sin(time + startX) * (dist * 0.2);

    const cp1X = startX + dx * 0.3 - dy * 0.2 + offset;
    const cp1Y = startY + dy * 0.3 + dx * 0.2 + offset;

    const cp2X = startX + dx * 0.7 + dy * 0.2 - offset;
    const cp2Y = startY + dy * 0.7 - dx * 0.2 - offset;

    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);

    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const drawWrap = (ctx, cx, cy, radius, startAngle, endAngle, width, color) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const renderCanvas = (timestamp) => {
    if (!bgCanvasRef.current || shouldReduceMotion) return;
    if (!rafStartTimeRef.current) rafStartTimeRef.current = timestamp;

    let elapsed = (timestamp - rafStartTimeRef.current) / 1000;

    const bgCtx = bgCanvasRef.current.getContext('2d');
    const fgCtx = fgCanvasRef.current ? fgCanvasRef.current.getContext('2d') : null;
    const w = bgCanvasRef.current.width;
    const h = bgCanvasRef.current.height;

    const { cx, cy, w: cardW, h: cardH } = cardMetricsRef.current;
    const tier = activeTierRef.current;
    const totalHits = TIER_HITS[tier] || 3;
    const finalHitStartTime = (totalHits - 1) * HIT_DURATION;
    const maxLifetime = finalHitStartTime + FINAL_HIT_DISSIPATE;

    bgCtx.clearRect(0, 0, w, h);
    if (fgCtx) fgCtx.clearRect(0, 0, w, h);

    const targetCtx = fgCtx || bgCtx;
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';

    const colors = {
      blue: '14, 165, 233',
      pink: '217, 70, 239',
      standard: '217, 119, 6', // Bronze/Copper
      premium: '59, 130, 246',
      flagship: '234, 179, 8'
    };

    let activeHitIndex = Math.floor(elapsed / HIT_DURATION);
    let hitLocalTime = elapsed % HIT_DURATION;

    // Force final hit state if we are past its start time
    if (elapsed >= finalHitStartTime) {
      activeHitIndex = totalHits - 1;
      hitLocalTime = elapsed - finalHitStartTime;
    }

    if (activeHitIndex < totalHits) {
      const isFinalHit = activeHitIndex === totalHits - 1;
      const hitColor = isFinalHit ? colors[tier] : (activeHitIndex % 2 === 0 ? colors.blue : colors.pink);

      let intensityMult = 1;
      if (isFinalHit) {
        if (tier === 'premium') intensityMult = 1.5;
        if (tier === 'flagship') intensityMult = 2.5;
      }

      // Beam origin: alternate corners for visual interest
      const originX = (activeHitIndex % 2 === 0) ? 0 : w;
      const originY = (activeHitIndex % 3 === 0) ? 0 : (activeHitIndex % 3 === 1 ? h : h/2);

      // Phase calculation
      const P_ENTER = 0.2;
      const P_WRAP = 0.4;
      const P_HOLD = 1.0;
      const P_SHAKE = 1.2;
      const P_RETRACT = 1.4; // up to 1.6 is idle handoff

      if (!isFinalHit) {
        if (hitLocalTime < P_RETRACT) {
          let alpha = 1;
          let currentTargetX = cx;
          let currentTargetY = cy;
          let showWrap = false;
          let wrapProgress = 0;

          if (hitLocalTime < P_ENTER) {
            // Entering
            const t = hitLocalTime / P_ENTER;
            currentTargetX = originX + (cx - originX) * t;
            currentTargetY = originY + (cy - originY) * t;
          } else if (hitLocalTime < P_WRAP) {
            // Wrapping around
            showWrap = true;
            wrapProgress = (hitLocalTime - P_ENTER) / (P_WRAP - P_ENTER);
          } else if (hitLocalTime < P_HOLD) {
            // Holding
            showWrap = true;
            wrapProgress = 1;
          } else if (hitLocalTime < P_SHAKE) {
            // Shaking / Breaking Grip
            showWrap = true;
            wrapProgress = 1;
            // Add erratic offset to beam target as it breaks
            currentTargetX = cx + (Math.random() - 0.5) * 40;
            currentTargetY = cy + (Math.random() - 0.5) * 40;
            alpha = 1 - ((hitLocalTime - P_HOLD) / (P_SHAKE - P_HOLD)) * 0.5; // Starts fading/losing energy
          } else {
            // Retracting
            const t = (hitLocalTime - P_SHAKE) / (P_RETRACT - P_SHAKE);
            currentTargetX = cx + (originX - cx) * t;
            currentTargetY = cy + (originY - cy) * t;
            alpha = 1 - t;
          }

          if (alpha > 0) {
            const beamWidth = 8 + Math.random() * 4;
            drawEnergyRibbon(targetCtx, originX, originY, currentTargetX, currentTargetY, beamWidth, `rgba(${hitColor}, ${alpha * 0.6})`);
            drawEnergyRibbon(targetCtx, originX, originY, currentTargetX, currentTargetY, beamWidth/2, `rgba(255, 255, 255, ${alpha})`);

            if (showWrap) {
              const radius = cardW * 0.7;
              const angleSize = Math.PI * 1.5 * wrapProgress;
              const startAngle = (hitLocalTime * 5) % (Math.PI * 2);

              drawWrap(targetCtx, cx, cy, radius, startAngle, startAngle + angleSize, 6, `rgba(${hitColor}, ${alpha * 0.8})`);
              drawWrap(targetCtx, cx, cy, radius + 15, -startAngle, -startAngle + angleSize * 0.8, 3, `rgba(${hitColor}, ${alpha * 0.5})`);
            }
          }
        }
      } else {
        // FINAL HIT
        // Strong impact -> Wrap -> Lock -> Flip -> Afterglow
        const F_ENTER = 0.2;
        const F_WRAP = 0.4;
        const F_FLIP_TIME = 0.6;
        const F_AFTERGLOW_START = F_FLIP_TIME + 1.2; // Match framer motion flip duration

        let alpha = 1;

        if (hitLocalTime < F_AFTERGLOW_START) {
           // Still locking / flipping
           let currentTargetX = cx;
           let currentTargetY = cy;
           let showWrap = false;
           let wrapProgress = 1;

           if (hitLocalTime < F_ENTER) {
             const t = hitLocalTime / F_ENTER;
             currentTargetX = originX + (cx - originX) * t;
             currentTargetY = originY + (cy - originY) * t;
           } else if (hitLocalTime < F_WRAP) {
             showWrap = true;
             wrapProgress = (hitLocalTime - F_ENTER) / (F_WRAP - F_ENTER);
           } else {
             showWrap = true;
             wrapProgress = 1;
             // Lock becomes tighter right before flip
             if (hitLocalTime > F_FLIP_TIME - 0.2 && hitLocalTime < F_FLIP_TIME) {
                alpha = 1 + (Math.random() * 0.5); // flash tighter
             }
           }

           const beamWidth = (12 * intensityMult) + Math.random() * 6;
           drawEnergyRibbon(targetCtx, originX, originY, currentTargetX, currentTargetY, beamWidth, `rgba(${hitColor}, ${alpha * 0.7})`);
           drawEnergyRibbon(targetCtx, originX, originY, currentTargetX, currentTargetY, beamWidth/2, `rgba(255, 255, 255, ${alpha})`);

           if (showWrap) {
              const baseRadius = cardW * 0.7;
              const lockTightness = (hitLocalTime > F_FLIP_TIME) ? Math.max(0.4, 1 - (hitLocalTime - F_FLIP_TIME)) : 1;
              const radius = baseRadius * lockTightness;

              const startAngle = (hitLocalTime * 8) % (Math.PI * 2);
              drawWrap(targetCtx, cx, cy, radius, startAngle, startAngle + Math.PI * 2 * wrapProgress, 8 * intensityMult, `rgba(${hitColor}, ${alpha})`);
              drawWrap(targetCtx, cx, cy, radius + 20, -startAngle*1.5, -startAngle*1.5 + Math.PI * 2 * wrapProgress, 4 * intensityMult, `rgba(255, 255, 255, ${alpha * 0.8})`);
           }
        } else {
           // AFTERGLOW / FIZZ
           const afterglowTime = hitLocalTime - F_AFTERGLOW_START;
           const dissipateDuration = FINAL_HIT_DISSIPATE - F_AFTERGLOW_START;
           if (afterglowTime < dissipateDuration) {
             const t = afterglowTime / dissipateDuration;

             // Tier specific multiplier
             let tierMult = 1;
             if (tier === 'premium') tierMult = 1.5;
             if (tier === 'flagship') tierMult = 2.5;

             const fizzAlpha = (1 - t) * 0.6 * tierMult;

             // Draw subtle residual energy around card
             const bgGrad = targetCtx.createRadialGradient(cx, cy, cardW * 0.4, cx, cy, cardW * (1.5 + (0.5 * tierMult)) * (1+t));
             bgGrad.addColorStop(0, `rgba(${hitColor}, ${Math.min(0.8, fizzAlpha)})`);
             bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
             targetCtx.fillStyle = bgGrad;
             // optimize overdraw by restricting to bounding box around card
             const maxR = cardW * (1.5 + (0.5 * tierMult)) * (1+t);
             targetCtx.fillRect(Math.max(0, cx - maxR), Math.max(0, cy - maxR), maxR * 2, maxR * 2);

             // Occasional fizzy arcs
             if (Math.random() > t) {
                const numArcs = Math.ceil(tierMult);
                for(let i=0; i<numArcs; i++) {
                   const r = cardW * 0.7 * (1 + Math.random()* (0.2 * tierMult));
                   const a = Math.random() * Math.PI * 2;
                   drawWrap(targetCtx, cx, cy, r, a, a + Math.random()*Math.PI, 2 * tierMult, `rgba(${hitColor}, ${fizzAlpha * Math.random()})`);
                }
             }
           }
        }
      }
    }

    targetCtx.restore();

    // Trigger executeRevealState exactly at the end of the lock/flip moment
    if (elapsed >= finalHitStartTime + 0.6 + 1.2 && !isRevealedRef.current) {
        executeRevealState();
    }

    if (elapsed < maxLifetime) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    } else {
      fallbackTimerRef.current = setTimeout(() => {
        setIsGenerating(false);
      }, 100);
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
    const totalHits = TIER_HITS[card.tier] || 3;
    const finalHitStartTime = (totalHits - 1) * HIT_DURATION;

    // Initial prep
    sequence.push([cardRef.current, { y: 0, scale: 1.0, rotateZ: 0, opacity: 1, filter: "brightness(0.7)" }, { duration: 0 }]);
    sequence.push([cardFlipRef.current, { rotateY: 0 }, { duration: 0 }]);

    let currentTime = 0;

    // Non-final hits choreography
    for (let i = 0; i < totalHits - 1; i++) {
        // Timeline for this hit
        const hitStart = i * HIT_DURATION;
        const P_ENTER = 0.2;
        const P_WRAP = 0.4;
        const P_HOLD = 1.0;
        const P_SHAKE = 1.2;

        // Card reaction on EVERY IMPACT (wrap/hit moment)
        sequence.push([
            cardRef.current,
            { filter: "brightness(1.5)", scale: 0.98, x: [-5, 5, -3, 3, 0], rotateZ: [-1, 1, -0.5, 0.5, 0] },
            { at: hitStart + P_WRAP, duration: 0.2, ease: "easeInOut" }
        ]);

        // Hold
        sequence.push([cardRef.current, { filter: "brightness(1.2)" }, { at: hitStart + P_WRAP + 0.2, duration: P_HOLD - (P_WRAP + 0.2) }]);

        // SHAKE to break grip!
        const shakeStart = hitStart + P_HOLD;
        const shakeDuration = P_SHAKE - P_HOLD; // 0.2s
        sequence.push([
            cardRef.current,
            { x: [-10, 10, -10, 10, -5, 5, 0], rotateZ: [-2, 2, -2, 2, -1, 1, 0], filter: "brightness(1)" },
            { at: shakeStart, duration: shakeDuration, ease: "easeInOut" }
        ]);

        // Relax after release
        sequence.push([cardRef.current, { scale: 1.0, filter: "brightness(0.7)" }, { at: hitStart + P_SHAKE, duration: 0.2 }]);
    }

    // FINAL HIT
    const F_ENTER = 0.2;
    const F_WRAP = 0.4;
    const F_FLIP_TIME = 0.6; // exact lock and start of flip

    // Final Impact - massive shake
    sequence.push([
      cardRef.current,
      { filter: "brightness(2.5)", scale: 0.95, x: [-15, 15, -10, 10, -5, 5, 0], rotateZ: [-3, 3, -2, 2, -1, 1, 0] },
      { at: finalHitStartTime + F_WRAP, duration: 0.2 }
    ]);

    // The Reveal Flip
    const flipAbsTime = finalHitStartTime + F_FLIP_TIME;
    sequence.push([cardRef.current, { y: 0, scale: 1.0, rotateZ: 0, filter: "brightness(1)" }, { at: flipAbsTime, duration: 1.2, ease: "circOut" }]);
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: flipAbsTime, duration: 1.2, ease: "circOut" }]);

    if (!shouldReduceMotion) {
      animationControlsRef.current = animate(sequence, { autoplay: true });
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
