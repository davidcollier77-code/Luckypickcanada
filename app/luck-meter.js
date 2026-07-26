'use client';

import React, { useState, useEffect } from 'react';

export default function LuckyMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [displayNumber, setDisplayNumber] = useState('0');
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper to determine color based on luck percentage
  const getLuckColor = (val) => {
    if (val < 40) return { primary: '#ffaa00', secondary: '#ff4500', name: 'Amber Glow' };
    if (val < 75) return { primary: '#00e5ff', secondary: '#0077ff', name: 'Cyan Aura' };
    return { primary: '#00ff80', secondary: '#059669', name: 'Emerald Aurora' };
  };

  const currentColor = getLuckColor(luckLevel);

  // Rapidly cycle random numbers during animation
  useEffect(() => {
    let interval;
    if (isAnimating) {
      interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 90 + 10).toString());
      }, 70); // Cycle every 70ms
    } else {
      setDisplayNumber(`${luckLevel}%`);
    }
    return () => clearInterval(interval);
  }, [isAnimating, luckLevel]);

  const handleTestLuck = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const finalLuck = Math.floor(Math.random() * 90) + 10;

    setTimeout(() => {
      setLuckLevel(finalLuck);
      setIsAnimating(false);
    }, 2200); // 2.2 seconds of slot-machine style cycling
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
      {/* Animations */}
      <style>{`
        @keyframes spinVortex {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.95; }
        }
      `}</style>

      {/* Main Machine Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '340px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Machine Base Graphic */}
        <img 
          src="/1785101753301.png" 
          alt="Lucky Machine" 
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />

        {/* Glass Portal Overlay */}
        <div style={{
          position: 'absolute',
          top: '21.5%',
          left: '26.5%',
          width: '47%',
          height: '47%',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: `inset 0 0 ${isAnimating ? '30px' : '15px'} ${currentColor.primary}`,
          transition: 'box-shadow 0.6s ease',
        }}>
          
          {/* Swirling Color Conic Stream */}
          <div style={{
            position: 'absolute',
            width: '150%',
            height: '150%',
            background: `conic-gradient(from 0deg, transparent, ${currentColor.primary}, transparent, ${currentColor.secondary}, transparent)`,
            animation: isAnimating ? 'spinVortex 0.6s linear infinite' : 'spinVortex 7s linear infinite',
            borderRadius: '40%',
            filter: 'blur(8px)',
            transition: 'background 0.6s ease',
          }} />

          {/* Core Glow Layer */}
          <div style={{
            position: 'absolute',
            width: '85%',
            height: '85%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${currentColor.primary} 0%, rgba(0,0,0,0) 75%)`,
            animation: isAnimating ? 'pulseGlow 0.25s infinite' : 'pulseGlow 2.5s infinite',
            transition: 'background 0.6s ease',
          }} />

          {/* Rapid Flashing Percentage Display */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            color: '#ffffff',
            fontSize: isAnimating ? '2.2rem' : '2.4rem',
            fontWeight: '900',
            fontFamily: 'monospace, sans-serif',
            letterSpacing: '1px',
            textShadow: `0 0 12px ${currentColor.primary}, 0 0 24px #000`,
            transition: 'color 0.4s ease',
          }}>
            {displayNumber}
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <button 
        onClick={handleTestLuck}
        disabled={isAnimating}
        style={{
          marginTop: '25px',
          padding: '12px 35px',
          borderRadius: '25px',
          border: `1px solid ${currentColor.primary}`,
          background: isAnimating 
            ? '#111' 
            : `linear-gradient(135deg, ${currentColor.primary}, ${currentColor.secondary})`,
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 'bold',
          letterSpacing: '1px',
          cursor: isAnimating ? 'not-allowed' : 'pointer',
          boxShadow: `0 4px 20px ${currentColor.primary}55`,
          transition: 'all 0.4s ease',
        }}
      >
        {isAnimating ? 'CHARGING...' : 'GENERATE LUCK'}
      </button>
    </div>
  );
}
