'use client';

import { useState } from 'react';

export default function LuckMeter({ onLuckCalculated }) {
  const [score, setScore] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [tier, setTier] = useState('');
  const [needleAngle, setNeedleAngle] = useState(-90);
  const [animationKey, setAnimationKey] = useState(0);

  const startMeter = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setHasSpun(true);
    setScore(null);

    const targetLuck = Math.floor(Math.random() * 101);

    let currentTier = 'low';

    if (targetLuck >= 75) {
      currentTier = 'high';
    } else if (targetLuck >= 40) {
      currentTier = 'medium';
    }

    const finalAngle = (targetLuck / 100) * 180 - 90;

    setAnimationKey(prev => prev + 1);

    setTimeout(() => {
      setNeedleAngle(finalAngle);
      setScore(targetLuck);
      setTier(currentTier);
      setIsSpinning(false);

      if (onLuckCalculated) {
        onLuckCalculated(targetLuck);
      }
    }, 3500);
  };

  return (
    <div
      className="relative mx-auto my-6 flex max-w-sm flex-col items-center justify-center overflow-hidden rounded-3xl p-6"
      style={{
        background:
          'radial-gradient(circle at center, #172033 0%, #020617 80%)',
        border: '2px solid #d4af37',
        boxShadow:
          '0 0 35px rgba(212,175,55,.35), inset 0 0 25px rgba(0,0,0,.9)',
      }}
    >

      <style>{`
        @keyframes luxuryNeedleSpin {
          0% {
            transform: rotate(-90deg);
          }
          35% {
            transform: rotate(360deg);
          }
          70% {
            transform: rotate(900deg);
          }
          100% {
            transform: rotate(var(--final-angle));
          }
        }

        @keyframes meterGlow {
          0%,100% {
            opacity:.65;
          }
          50% {
            opacity:1;
          }
        }
      `}</style>


      <div className="mb-5 text-center">
        <div className="text-[10px] uppercase tracking-[0.35em] text-yellow-400">
          LuckyPickCanada
        </div>

        <h2 className="text-2xl font-black uppercase tracking-wide text-yellow-200">
          Lucky Meter
        </h2>
      </div>


      <div
        className="relative flex h-48 w-80 items-end justify-center rounded-t-full p-3"
        style={{
          background:
            'linear-gradient(180deg,#f7d774,#b8860b,#4b2e05)',
          boxShadow:
            '0 15px 30px rgba(0,0,0,.8), inset 0 3px 8px rgba(255,255,255,.5)',
        }}
      >

        <div
          className="relative flex h-full w-full items-end justify-center overflow-hidden rounded-t-full"
          style={{
            background:
              'radial-gradient(circle at 50% 100%, #243b55,#020617 75%)',
            border:
              '3px solid rgba(255,215,100,.45)',
          }}
        >

          <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full">

            <defs>
              <linearGradient id="luckArc">
                <stop offset="0%" stopColor="#38bdf8"/>
                <stop offset="45%" stopColor="#facc15"/>
                <stop offset="100%" stopColor="#ef4444"/>
              </linearGradient>
            </defs>


            <path
              d="M20 110 A80 80 0 0 1 180 110"
              fill="none"
              stroke="url(#luckArc)"
              strokeWidth="10"
              strokeLinecap="round"
            />


            <text x="20" y="95" fill="#facc15" fontSize="10">
              0%
            </text>

            <text
              x="100"
              y="45"
              fill="#fff7c2"
              fontSize="12"
              textAnchor="middle"
            >
              50%
            </text>

            <text
              x="180"
              y="95"
              fill="#ef4444"
              fontSize="10"
              textAnchor="end"
            >
              100%
            </text>

          </svg>



          <div
            key={animationKey}
            className="absolute bottom-2 z-20 h-32 w-3 origin-bottom"
            style={{
              '--final-angle': `${needleAngle}deg`,
              animation: isSpinning
                ? 'luxuryNeedleSpin 3.5s cubic-bezier(.15,.85,.35,1) forwards'
                : 'none',
              transform: `rotate(${needleAngle}deg)`,
            }}
          >

            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  'linear-gradient(to top,#7c2d12,#facc15,#fff7c2)',
                boxShadow:
                  '0 0 15px #facc15',
                animation: isSpinning
                  ? 'meterGlow 1s infinite'
                  : 'none',
              }}
            />

          </div>



          <div
            className="absolute bottom-[-12px] z-30 flex h-11 w-11 items-center justify-center rounded-full"
            style={{
              background:
                'radial-gradient(circle,#fff7c2,#d4af37,#7c5700)',
              boxShadow:
                '0 5px 15px black',
            }}
          >

            <div className="h-4 w-4 rounded-full bg-black border border-yellow-300" />

          </div>

        </div>

      </div>



      <div className="mt-6 min-h-[70px] text-center">

        {score !== null ? (

          <>
            <div className="text-xs uppercase tracking-widest text-yellow-400">
              Your Luck Score
            </div>

            <div
              className="text-5xl font-black text-yellow-200"
              style={{
                textShadow:
                  '0 0 20px rgba(250,204,21,.8)',
              }}
            >
              {score}%
            </div>

            <p className="text-sm italic text-yellow-100">
              {tier === 'high' &&
                '✨ Exceptional luck energy!'}
              {tier === 'medium' &&
                '🍀 Strong lucky momentum!'}
              {tier === 'low' &&
                '🌟 Every day brings new chances!'}
            </p>

          </>

        ) : (

          <p className="mt-4 text-xs uppercase tracking-wider text-yellow-100/70">
            {isSpinning
              ? 'Revealing your luck...'
              : 'Discover your lucky score'}
          </p>

        )}

      </div>



      <button
        onClick={startMeter}
        disabled={isSpinning || hasSpun}
        className="mt-4 rounded-full px-10 py-3 text-xs font-black uppercase tracking-widest"
        style={{
          background: hasSpun
            ? '#1e293b'
            : 'linear-gradient(135deg,#fff7c2,#d4af37,#8b5e00)',
          color: hasSpun ? '#64748b' : '#111827',
          boxShadow: hasSpun
            ? 'none'
            : '0 0 25px rgba(212,175,55,.5)',
        }}
      >
        {isSpinning
          ? 'Spinning...'
          : hasSpun
          ? 'Luck Revealed'
          : 'Spin Your Luck'}
      </button>


    </div>
  );
}
