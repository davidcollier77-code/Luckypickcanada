'use client';

import React, { useState, useEffect } from 'react';
import './lucky-meter.css';

export default function LuckyMeter() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [rotation, setRotation] = useState(-90); // Start at left (-90deg)

  const spinMeter = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);

    // Generate a random result between 1 and 100
    const result = Math.floor(Math.random() * 100) + 1;
    
    // Calculate rotation: -90 is 0%, 90 is 100%
    const finalRotation = -90 + (result * 1.8); 
    
    // Add extra spins (3 full rotations = 1080 degrees) for the visual effect
    const spinTarget = finalRotation + 1080;
    
    setRotation(spinTarget);

    // Wait for the CSS spin animation to finish (3 seconds)
    setTimeout(() => {
      setPercentage(result);
      // Reset rotation to the true resting position without the extra 1080deg
      setRotation(finalRotation); 
      setIsSpinning(false);
      setShowResult(true);
    }, 3000);
  };

  // Calculate the SVG dash array for the glowing arc (circumference is ~283)
  const circleCircumference = 2 * Math.PI * 45;
  const strokeDashoffset = circleCircumference - (percentage / 100) * (circleCircumference / 2);

  return (
    <div className="meter-container">
      <h2 className="meter-title">Your Daily Luck</h2>
      
      <div className={`meter-visual ${isSpinning ? 'pulse-glow' : ''}`}>
        
        {/* The glowing arc background */}
        <svg className="meter-svg" viewBox="0 0 100 50">
          <path 
            className="meter-track"
            d="M 5,50 A 45,45 0 0,1 95,50" 
          />
          <path 
            className="meter-fill"
            d="M 5,50 A 45,45 0 0,1 95,50" 
            style={{
              strokeDasharray: circleCircumference,
              strokeDashoffset: showResult ? strokeDashoffset : circleCircumference,
              transition: 'stroke-dashoffset 1s ease-out'
            }}
          />
        </svg>

        {/* The mechanical needle */}
        <div className="needle-base">
          <div 
            className="needle" 
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 3s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'none'
            }} 
          >
            <div className="needle-sheen"></div>
          </div>
        </div>

      </div>

      <div className="meter-action-area">
        {!showResult && !isSpinning ? (
          <button className="spin-btn" onClick={spinMeter}>Calculate Luck</button>
        ) : (
          <button className="spin-btn disabled" disabled>
            {isSpinning ? 'Calculating...' : 'Come Back Tomorrow'}
          </button>
        )}
      </div>

      {/* The big typographic reveal instead of the card */}
      {showResult && (
        <div className="result-display text-flare">
          <span className="result-number">{percentage}%</span>
          <p className="result-subtext">Lucky Match</p>
        </div>
      )}
    </div>
  );
}
