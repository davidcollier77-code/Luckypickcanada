'use client';

import React, { useState, useEffect } from 'react';

export default function LuckyMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [comment, setComment] = useState("Ready to test your luck?");

  // Logic to generate comments based on luck
  const getComment = (luck) => {
    if (luck >= 80) return "Maximum Canadian Luck! You're unstoppable! 🇨🇦🍀";
    if (luck >= 50) return "A solid wave of good fortune coming your way.";
    return "Keep smiling! Every day has potential. ✨";
  };

  // Logic to get colors based on luck
  const getColor = (luck) => {
    if (luck >= 80) return "#00ff80"; // Bright Emerald
    if (luck >= 50) return "#00ccff"; // Electric Blue
    return "#ffaa00"; // Warm Amber
  };

  const handleTestLuck = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setComment("Generating energy...");

    // Animate numbers for 2 seconds
    let interval = setInterval(() => {
        setLuckLevel(Math.floor(Math.random() * 90) + 10);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const finalLuck = Math.floor(Math.random() * 90) + 10;
      setLuckLevel(finalLuck);
      setComment(getComment(finalLuck));
      setIsAnimating(false);
    }, 2000);
  };

  const activeColor = getColor(luckLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px' }}>
      
      {/* Container for the layering effect */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
        
        {/* VORTEX LAYER (Behind the machine) */}
        <div style={{
          position: 'absolute',
          top: '25%', left: '25%', width: '50%', height: '50%',
          borderRadius: '50%',
          background: isAnimating ? `conic-gradient(from 0deg, ${activeColor}, transparent)` : 'transparent',
          filter: 'blur(20px)',
          opacity: isAnimating ? 0.8 : 0,
          animation: 'spin 1s linear infinite',
          transition: 'all 0.5s ease',
          zIndex: 1, // Sits behind the machine
        }}></div>

        {/* MACHINE IMAGE (On top) */}
        <img 
          src="/1785101753301.png" 
          alt="Lucky Meter" 
          style={{ width: '100%', position: 'relative', zIndex: 2 }} 
        />

        {/* PERCENTAGE TEXT (On top of everything) */}
        <div style={{
          position: 'absolute',
          top: '40%', width: '100%', textAlign: 'center',
          fontSize: '2rem', fontWeight: 'bold', color: '#fff',
          zIndex: 3,
          textShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}>
          {luckLevel}%
        </div>
      </div>

      {/* COMMENT BOX */}
      <div style={{ 
        marginTop: '20px', padding: '15px', borderRadius: '10px',
        background: 'rgba(0,0,0,0.3)', border: `1px solid ${activeColor}`,
        color: '#fff', textAlign: 'center', transition: 'border 0.5s'
      }}>
        {comment}
      </div>

      <button 
        onClick={handleTestLuck} disabled={isAnimating}
        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
      >
        {isAnimating ? 'Generating...' : 'Generate Luck'}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
