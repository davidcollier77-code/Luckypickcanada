'use client';

import React, { useState, useEffect } from 'react';

export default function LuckyMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [displayNumber, setDisplayNumber] = useState('0');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [comment, setComment] = useState("");

  // Determine colors based on luck tier
  const getLuckColor = (val) => {
    if (val === 0 && !hasGenerated) return 'rgba(255, 255, 255, 0.1)'; // Idle state
    if (val < 40) return '#ffaa00'; // Amber
    if (val < 75) return '#00e5ff'; // Cyan
    return '#00ff80'; // Emerald
  };

  // Determine personalized message
  const getComment = (val) => {
    if (val < 40) return "Keep smiling! Every day has potential. ✨";
    if (val < 75) return "A solid wave of good fortune coming your way.";
    return "Maximum Canadian Luck! You're unstoppable! 🇨🇦🍀";
  };

  const activeColor = getLuckColor(luckLevel);

  // Handle the rapid flashing animation
  useEffect(() => {
    let interval;
    if (isAnimating) {
      interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 90 + 10).toString());
      }, 70);
    } else if (hasGenerated) {
      setDisplayNumber(`${luckLevel}%`);
    }
    return () => clearInterval(interval);
  }, [isAnimating, luckLevel, hasGenerated]);

  const handleTestLuck = () => {
    if (isAnimating || hasGenerated) return;

    setIsAnimating(true);
    setComment("Generating energy...");
    
    const finalLuck = Math.floor(Math.random() * 90) + 10;

    setTimeout(() => {
      setLuckLevel(finalLuck);
      setComment(getComment(finalLuck));
      setIsAnimating(false);
      setHasGenerated(true); // Locks the button from being pressed again
    }, 2500); 
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', width: '100%', padding: '20px',
    }}>
      {/* Keyframe Animations */}
      <style>{`
        @keyframes spinInner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes breatheOuter {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
      `}</style>

      {/* Main Container */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '340px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: '20px'
      }}>
        
        {/* OUTER AURORA (Surrounds the outside of the machine) */}
        <div style={{
          position: 'absolute',
          top: '-10%', left: '-10%', right: '-10%', bottom: '-10%',
          background: `radial-gradient(circle, ${activeColor} 0%, transparent 60%)`,
          filter: 'blur(30px)',
          zIndex: 0,
          animation: hasGenerated ? 'breatheOuter 4s ease-in-out infinite' : 'none',
          transition: 'background 1s ease',
          opacity: isAnimating ? 0.8 : (hasGenerated ? 0.6 : 0)
        }} />

        {/* MACHINE GRAPHIC */}
        <img 
          src="/1785101753301.png" 
          alt="Lucky Machine" 
          style={{ width: '100%', height: 'auto', display: 'block', zIndex: 1, position: 'relative' }}
        />

        {/* INNER PORTAL (The Glass Window) */}
        <div style={{
          position: 'absolute',
          top: '21.5%', left: '26.5%', width: '47%', height: '47%',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', zIndex: 2
        }}>
          
          {/* INNER SPINNING VORTEX (Behind the number) */}
          <div style={{
            position: 'absolute',
            width: '150%', height: '150%',
            background: hasGenerated || isAnimating ? `conic-gradient(from 0deg, transparent, ${activeColor}, transparent)` : 'transparent',
            animation: 'spinInner 1.5s linear infinite',
            opacity: 0.7,
            transition: 'background 0.5s ease',
          }} />

          {/* LUCK PERCENTAGE TEXT */}
          <div style={{
            position: 'relative', zIndex: 3,
            color: '#ffffff',
            fontSize: '2.5rem', fontWeight: '900',
            fontFamily: 'monospace, sans-serif',
            textShadow: `0 0 15px ${activeColor}, 0 0 30px #000`,
            transition: 'text-shadow 0.5s ease',
          }}>
            {displayNumber}
          </div>
        </div>
      </div>

      {/* LUCKY COMMENT DISPLAY */}
      <div style={{
        marginTop: '30px', minHeight: '60px', width: '100%', maxWidth: '340px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '15px', borderRadius: '12px',
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${hasGenerated ? activeColor : 'rgba(255,255,255,0.1)'}`,
        color: '#fff', fontSize: '1.1rem', textAlign: 'center',
        fontWeight: 'bold', transition: 'all 0.5s ease',
        boxShadow: hasGenerated ? `0 0 15px rgba(${activeColor}, 0.2)` : 'none'
      }}>
        {comment || "Ready to find out your lucky score?"}
      </div>

      {/* ACTION BUTTON */}
      <button 
        onClick={handleTestLuck}
        disabled={isAnimating || hasGenerated}
        style={{
          marginTop: '25px', padding: '15px 40px', borderRadius: '30px',
          border: 'none',
          background: (isAnimating || hasGenerated) 
            ? '#444444' // Grayed out state when pressed/finished
            : 'linear-gradient(135deg, #d4af37, #f3e5ab)', // Vibrant gold state initially
          color: (isAnimating || hasGenerated) ? '#888' : '#000',
          fontSize: '1.1rem', fontWeight: '900',
          cursor: (isAnimating || hasGenerated) ? 'not-allowed' : 'pointer',
          boxShadow: (isAnimating || hasGenerated) ? 'none' : '0 4px 15px rgba(212, 175, 55, 0.4)',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase'
        }}
      >
        {isAnimating ? 'GENERATING...' : (hasGenerated ? 'LUCK GENERATED' : 'GET YOUR LUCKY PICK')}
      </button>
    </div>
  );
}
