'use client';

import React, { useState, useEffect } from 'react';

export default function LuckyMeter() {
  const [rotation, setRotation] = useState(0);
  const [percentage, setPercentage] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Preload both PNG assets immediately when component mounts
  useEffect(() => {
    const baseImg = new Image();
    baseImg.src = '/1785063390164.png';
    const handImg = new Image();
    handImg.src = '/1785063404048.png';
  }, []);

  const spinMeter = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    // Pick a lucky score between 1 and 100
    const newScore = Math.floor(Math.random() * 100) + 1;

    // Map 0-100% to needle sweep angle (-120 deg to +120 deg)
    const targetAngle = -120 + (newScore / 100) * 240;

    // Calculate forward spin momentum so needle always rotates continuously forward
    const currentNormalized = ((rotation % 360) + 360) % 360;
    const targetNormalized = ((targetAngle % 360) + 360) % 360;
    let delta = targetNormalized - currentNormalized;
    if (delta <= 0) delta += 360;

    // Add 3 full rotations (1080 deg) for visual momentum
    const totalRotation = rotation + 1080 + delta;

    setRotation(totalRotation);

    // Display score readout when spinning animation completes (2.5 seconds)
    setTimeout(() => {
      setPercentage(newScore);
      setIsSpinning(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#0A1420] text-[#F5E6C8] rounded-2xl border border-[#2A3F52] max-w-sm mx-auto shadow-2xl select-none">
      {/* Header Branding */}
      <h2 className="text-xl font-extrabold tracking-wide uppercase mb-0.5 text-[#5EEAD4]">
        Daily Luck Meter
      </h2>
      <p className="text-[#7FA8B8] text-[11px] font-semibold tracking-wider uppercase mb-5">
        LUCKY PICK CANADA.CA
      </p>

      {/* Meter Visual Container */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-5">
        {/* Base Layer: Dial */}
        <img
          src="/1785063390164.png"
          alt="Lucky Meter Base Dial"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md"
        />

        {/* Top Layer: Single Spinning Needle */}
        <img
          src="/1785063404048.png"
          alt="Lucky Meter Needle Hand"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: isSpinning
              ? 'transform 2.5s cubic-bezier(0.15, 0.85, 0.35, 1.2)'
              : 'none',
          }}
        />
      </div>

      {/* Score Output Readout */}
      <div className="h-12 flex flex-col items-center justify-center mb-4 text-center">
        {percentage !== null ? (
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black tracking-tight text-[#5EEAD4] animate-pulse">
              {percentage}%
            </span>
            <span className="text-xs text-[#BFE3E0] font-medium">
              {percentage >= 80
                ? '🔥 High Energy Today!'
                : percentage >= 50
                ? '✨ Solid Daily Vibe!'
                : '☘️ Steady & Balanced'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-[#7FA8B8] tracking-wide">
            Tap spin to reveal today's reading
          </span>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={spinMeter}
        disabled={isSpinning}
        className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm tracking-wider uppercase transition-all duration-200 shadow-lg ${
          isSpinning
            ? 'bg-[#1E2D3B] text-[#526D82] cursor-not-allowed border border-[#2A3F52]'
            : 'bg-[#5EEAD4] text-[#0A1420] hover:bg-[#43C6B1] active:scale-95 shadow-[#5EEAD4]/20'
        }`}
      >
        {isSpinning ? 'Reading Energy...' : 'SPIN THE METER'}
      </button>
    </div>
  );
}
