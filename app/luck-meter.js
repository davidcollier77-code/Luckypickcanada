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

    // Random luck generation logic
    const finalLuck = Math.floor(Math.random() * 101);
    
    // Animate rotation: 2 full spins + percentage position
    const rotation = 720 + (finalLuck * 1.8); 
    setNeedleAngle(rotation);

    setTimeout(() => {
      setTargetLuck(finalLuck);
      setIsSpinning(false);
    }, 3000); // Matches CSS transition duration
  };

  return (
    <div className="luck-generator-container">
      <style jsx>{`
        .luck-generator-container {
          background: radial-gradient(circle at center, #1a0b2e, #050505);
          color: #fff;
          padding: 2rem;
          border-radius: 20px;
          border: 2px solid #c5a059;
          text-align: center;
          font-family: sans-serif;
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .dial-wrapper {
          position: relative;
          width: 280px;
          height: 280px;
          border: 8px solid #c5a059;
          border-radius: 50%;
          background: conic-gradient(#1a4d2e 0%, #1a4d2e 20%, #c5a059 20%, #c5a059 40%, #5e17eb 40%, #5e17eb 100%);
          margin-bottom: 2rem;
          box-shadow: 0 0 20px rgba(197, 160, 89, 0.5);
        }
        .needle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 120px;
          background: #ffcc00;
          transform-origin: bottom center;
          transition: transform 3s cubic-bezier(0.2, 0.8, 0.3, 1);
          border-radius: 2px;
        }
        .generate-btn {
          background: #c5a059;
          color: #000;
          padding: 1rem 2rem;
          font-weight: bold;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-size: 1.2rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }
        .lucky-aura-reveal {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #c5a059;
          border-radius: 15px;
          animation: glow 2s infinite alternate;
        }
        @keyframes glow {
          from { box-shadow: 0 0 5px #c5a059; }
          to { box-shadow: 0 0 20px #c5a059; }
        }
        .percentage { font-size: 2.5rem; color: #ffcc00; display: block; }
      `}</style>

      <h1 style={{ margin: '0 0 1rem 0' }}>LUCK GENERATOR</h1>
      
      <div className="dial-wrapper">
        <div className="needle" style={{ transform: `rotate(${needleAngle}deg)` }} />
      </div>

      <button className="generate-btn" onClick={startMeter} disabled={isSpinning}>
        {isSpinning ? 'SPINNING...' : 'GENERATE LUCK'}
      </button>

      {/* Lucky Aura Reveal: Triggers only after spin */}
      {!isSpinning && targetLuck !== null && (
        <div className="lucky-aura-reveal">
          <span className="percentage">{targetLuck}%</span>
          <p>YOUR LUCK LEVEL</p>
          <small>{targetLuck > 75 ? "LEGENDARY LUCK!" : "AMAZING LUCK!"}</small>
        </div>
      )}
    </div>
  );
}
