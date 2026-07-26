'use client';

import React, { useState } from 'react';

export default function LuckyMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Math for the gauge arc
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  
  const handleTestLuck = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    // Random luck between 10 and 100
    const randomLuck = Math.floor(Math.random() * 90) + 10;
    
    setTimeout(() => {
      setLuckLevel(randomLuck);
      setIsAnimating(false);
    }, 1500);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '20px',
    }}>
      <div style={{
        position: 'relative',
        width: '240px',
        height: '240px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      }}>
        {/* SVG Gauge */}
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Arc */}
          <circle 
            cx="100" cy="100" r={radius} 
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="15" 
          />
          {/* Progress Arc */}
          <circle 
            cx="100" cy="100" r={radius} 
            fill="none" 
            stroke={isAnimating ? "#fff" : "#00ff80"} 
            strokeWidth="15"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (isAnimating ? 100 : luckLevel) / 100 * circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s' }}
          />
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          color: '#fff',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {isAnimating ? '...' : `${luckLevel}%`}
        </div>
      </div>

      <button 
        onClick={handleTestLuck}
        disabled={isAnimating}
        style={{
          marginTop: '30px',
          padding: '12px 30px',
          borderRadius: '25px',
          border: 'none',
          background: isAnimating ? '#666' : 'linear-gradient(135deg, #00ff80, #0080ff)',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s'
        }}
      >
        {isAnimating ? 'Scanning...' : 'Test Your Luck'}
      </button>
    </div>
  );
}
