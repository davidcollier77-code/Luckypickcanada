'use client';

import React, { useState, useEffect } from 'react';

// Updated Image Paths from /public directory
const DIAL_IMAGE = '/BackgroundEraser_20260726_100033229_2.png';
const NEEDLE_IMAGE = '/IMG_20260726_103932_591006.png';

export default function LuckyMeter() {
  const [luckPercentage, setLuckPercentage] = useState(50);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images to prevent render flicker
  useEffect(() => {
    const dialImg = new Image();
    const needleImg = new Image();

    let loadedCount = 0;
    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === 2) setImagesLoaded(true);
    };

    dialImg.onload = handleLoad;
    needleImg.onload = handleLoad;

    dialImg.src = DIAL_IMAGE;
    needleImg.src = NEEDLE_IMAGE;
  }, []);

  const calculateRotation = (percentage) => {
    // Maps 0-100% scale across the dial arc (-110deg to +110deg)
    const minAngle = -110;
    const maxAngle = 110;
    return minAngle + (percentage / 100) * (maxAngle - minAngle);
  };

  const spinMeter = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    const newLuck = Math.floor(Math.random() * 101); // 0 to 100
    const targetDegrees = calculateRotation(newLuck);

    // Adds 3 full momentum spins (1080deg) before landing on result
    const totalRotation = 1080 + targetDegrees;

    setRotationDegrees(totalRotation);

    setTimeout(() => {
      setLuckPercentage(newLuck);
      setIsSpinning(false);
    }, 3000);
  };

  if (!imagesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-amber-400 font-semibold animate-pulse">
          Loading Lucky Meter...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      {/* Outer Dial & Needle Layer Container */}
      <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
        
        {/* Base Dial (Bottom Layer) */}
        <img
          src={DIAL_IMAGE}
          alt="Lucky Pick Canada Base Gauge"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
        />

        {/* Needle Hand (Top Layer) */}
        <img
          src={NEEDLE_IMAGE}
          alt="Lucky Meter Needle"
          className="absolute w-[60%] h-[60%] object-contain pointer-events-none origin-center"
          style={{
            transform: `rotate(${rotationDegrees}deg)`,
            transition: isSpinning
              ? 'transform 3s cubic-bezier(0.15, 0.85, 0.35, 1.2)'
              : 'none',
          }}
        />
      </div>

      {/* Control Panel & Readout */}
      <div className="flex flex-col items-center space-y-3">
        <div className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-wider">
          {isSpinning ? 'Testing Your Luck...' : `Today's Luck: ${luckPercentage}%`}
        </div>

        <button
          onClick={spinMeter}
          disabled={isSpinning}
          className={`px-8 py-3 rounded-full font-bold text-lg text-slate-950 uppercase tracking-widest shadow-lg transition-all transform active:scale-95 ${
            isSpinning
              ? 'bg-amber-600/50 cursor-not-allowed opacity-60'
              : 'bg-amber-400 hover:bg-amber-300 hover:shadow-amber-400/30'
          }`}
        >
          {isSpinning ? 'Spinning...' : 'Check Your Luck'}
        </button>
      </div>
    </div>
  );
}
