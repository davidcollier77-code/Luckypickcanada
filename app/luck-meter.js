'use client';

import { useState } from 'react';

export default function LuckMeter() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetLuck, setTargetLuck] = useState(null);
  const [needleAngle, setNeedleAngle] = useState(0);

  const startMeter = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTargetLuck(null);

    const finalLuck = Math.floor(Math.random() * 101);
    const rotation = 1440 + (finalLuck * 1.8); // 4 full spins for dramatic effect
    setNeedleAngle(rotation);

    setTimeout(() => {
      setTargetLuck(finalLuck);
      setIsSpinning(false);
    }, 4000); 
  };

  return (
    <div className="luck-generator-premium">
      <style jsx>{`
        .luck-generator-premium {
          background: radial-gradient(circle at center, #0f1c3f, #000);
          border: 4px solid #c5a059; /* Metallic gold look */
          border-radius: 50px;
          padding: 3rem;
          text-align: center;
          color: #e0d0a0;
          box-shadow: inset 0 0 50px rgba(0,0,0,0.8), 0 0 30px rgba(197, 160, 89, 0.3);
        }
        .dial {
          width: 250px; height: 250px;
          border-radius: 50%;
          border: 10px solid #5d4a2a;
          margin: 0 auto 2rem;
          position: relative;
          background: conic-gradient(#1a4d2e 0% 25%, #c5a059 25% 50%, #5e17eb 50% 100%);
        }
        .needle {
          position: absolute;
          width: 6px; height: 110px;
          background: linear-gradient(to bottom, #ffd700, #b8860b);
          top: 15px; left: calc(50% - 3px);
          transform-origin: bottom center;
          transition: transform 4s cubic-bezier(0.1, 0.7, 0.3, 1);
        }
        .reveal-aura {
          padding: 2rem;
          background: rgba(0,0,0,0.6);
          border: 2px solid #c5a059;
          border-radius: 20px;
          transition: all 0.5s ease;
          box-shadow: 0 0 ${targetLuck ? targetLuck / 5 : 0}px #ffd700; /* Glow scales with luck */
        }
      `}</style>

      <h2>LUCK GENERATOR</h2>
      <div className="dial">
        <div className="needle" style={{ transform: `rotate(${needleAngle}deg)` }} />
      </div>

      <button className="spin-btn" onClick={startMeter} disabled={isSpinning}>
        {isSpinning ? 'GENERATING...' : 'SPIN FOR LUCK'}
      </button>

      {!isSpinning && targetLuck !== null && (
        <div className="reveal-aura">
          <h3 style={{ fontSize: '2rem', color: '#ffd700' }}>{targetLuck}%</h3>
          <p>YOUR LUCK LEVEL</p>
        </div>
      )}
    </div>
  );
}
