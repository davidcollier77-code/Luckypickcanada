'use client';

import React, { useState } from 'react';
import './luck-meter.css';

export default function LuckyMeter() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [percentage, setPercentage] = useState(null);

  const startCalculation = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setPercentage(null); // Reset for the new calculation

    // Simulated 3-second 'calculation' spin
    setTimeout(() => {
      const result = Math.floor(Math.random() * 100) + 1;
      setPercentage(result);
      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div className="meter-wrapper">
      {/* The Visual Meter remains the same */}
      <div className={`gauge-display ${isSpinning ? 'is-spinning' : ''}`}>
        {/* Placeholder for your existing gauge logic */}
        <div className="needle-visual" />
      </div>

      {/* RECLAIMED SPACE: The Hero Percentage Display */}
      <div className="hero-percentage-zone">
        {isSpinning ? (
          <div className="calculating-text">Calculating...</div>
        ) : percentage !== null ? (
          <div className="final-reveal">
            <span className="percentage-big">{percentage}%</span>
            <span className="label-text">Daily Luck Score</span>
          </div>
        ) : (
          <button className="cta-button" onClick={startCalculation}>
            GENERATE DAILY LUCK
          </button>
        )}
      </div>
    </div>
  );
}
