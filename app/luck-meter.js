'use client';

import React, { useState, useEffect } from 'react';

// Swapped so 1492 is the still background dial and 1491 is the rotating needle
const DIAL_IMAGE = '/1492_trimmed.png';
const NEEDLE_IMAGE = '/1491_trimmed.png';

export default function LuckMeter() {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [luckPercentage, setLuckPercentage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    const handleComplete = () => {
      loadedCount++;
      if (loadedCount === 2) setImagesLoaded(true);
    };

    const dialImg = new Image();
    const needleImg = new Image();
    dialImg.onload = handleComplete;
    dialImg.onerror = handleComplete;
    needleImg.onload = handleComplete;
    needleImg.onerror = handleComplete;
    dialImg.src = DIAL_IMAGE;
    needleImg.src = NEEDLE_IMAGE;
  }, []);

  const spinMeter = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setHasSpun(true);
    
    const randomLuck = Math.floor(Math.random() * 101);
    const targetAngle = (randomLuck / 100) * 180 - 90;
    const nextRotation = rotation + 1080 + (targetAngle - (rotation % 360));

    setRotation(nextRotation);

    setTimeout(() => {
      setLuckPercentage(randomLuck);
      setIsSpinning(false);
    }, 2500);
  };

  // Dynamic Lighting / Glow Logic based on luck output
  let glowColor = 'rgba(255, 255, 255, 0.5)';
  // Base intensity before spinning
  let glowIntensity = '60px';
  let animation = isSpinning ? 'pulse 1.2s infinite ease-in-out' : 'none';
  let luckMessage = '';

  if (!isSpinning && luckPercentage !== null) {
    animation = 'none';
    if (luckPercentage >= 80) {
      glowColor = 'rgba(0, 255, 128, 1)'; // Max opacity for aurora effect
      glowIntensity = '120px'; // Massive glow spread
      luckMessage = "Outstanding! The universe is totally on your side today.";
    } else if (luckPercentage >= 50) {
      glowColor = 'rgba(255, 215, 0, 0.9)'; 
      glowIntensity = '90px'; 
      luckMessage = "Solid energy! A perfectly balanced day ahead.";
    } else {
      glowColor = 'rgba(255, 80, 80, 0.8)'; 
      glowIntensity = '70px'; 
      luckMessage = "Hey, the only way is up! You make your own luck anyway.";
    }
  }

  if (!imagesLoaded) return <div style={{ padding: '20px', textAlign: 'center', color: '#ffffff' }}>Loading Meter...</div>;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '10px', width: '100%',
      margin: '0 auto', color: '#ffffff', fontFamily: 'sans-serif'
    }}>
      <style>{`
        /* Enhanced pulse animation for spinning state */
        @keyframes pulse {
          0% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 100px rgba(255, 215, 0, 1); }
          100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.5); }
        }
        
        /* Rapid glitter effect for the center while generating */
        @keyframes glitter {
          0% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
          100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
        }
      `}</style>

      {/* Meter Container (Sized cleanly for mobile screens) */}
      <div style={{
        position: 'relative',
        width: '85%', 
        maxWidth: '360px',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '10px auto 25px auto',
        borderRadius: '50%',
        animation: animation,
        transition: 'box-shadow 0.8s ease-in-out' // Smoother transition for the glow
      }}>
        
        {/* Dynamic Backlight Glow Effect (The "Aurora") */}
        <div style={{
          position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%',
          borderRadius: '50%', 
          boxShadow: `0 0 ${glowIntensity} ${glowIntensity} ${glowColor}`, 
          zIndex: 0, 
          transition: 'all 0.8s ease-in-out'
        }} />

        {/* Base Dial Graphic */}
        <img 
          src={DIAL_IMAGE} 
          alt="Dial Base" 
          style={{ position: 'relative', width: '100%', zIndex: 1, display: 'block' }} 
        />
        
        {/* Active Glittering Center Effect (Only visible when spinning) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '30%', 
          height: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,215,0,0.6) 30%, rgba(255,255,255,0) 70%)',
          zIndex: 2,
          animation: isSpinning ? 'glitter 0.5s infinite ease-in-out' : 'none',
          opacity: isSpinning ? 1 : 0, // Hides it entirely when not generating
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: 'none' 
        }} />

        {/* Rotating Needle Layer (Scaled down by 50% and centered) */}
        <img 
          src={NEEDLE_IMAGE} 
          alt="Needle" 
          style={{
            position: 'absolute', 
            top: '25%', // Pushes it down to center
            left: '25%', // Pushes it right to center
            width: '50%', // Halves the width
            height: '50%', // Halves the height
            objectFit: 'contain',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 2.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            transformOrigin: 'center center', 
            zIndex: 3, 
            display: 'block'
          }} 
        />
      </div>

      {/* Results and Messaging Area */}
      <div style={{ minHeight: '70px', textAlign: 'center', padding: '0 15px' }}>
        {luckPercentage !== null && !isSpinning && (
          <>
            <p style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#FFD700' }}>
              Your Luck: {luckPercentage}%
            </p>
            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', opacity: 0.95 }}>{luckMessage}</p>
          </>
        )}
        {isSpinning && <p style={{ fontSize: '1.3rem', opacity: 0.85, color: '#FFD700' }}>Generating luck...</p>}
      </div>

      {/* Spin Action Button */}
      <button
        onClick={spinMeter}
        disabled={isSpinning || hasSpun}
        style={{
          padding: '14px 36px', fontSize: '1.2rem', fontWeight: 'bold', color: '#000',
          backgroundColor: (isSpinning || hasSpun) ? '#555' : '#FFD700',
          border: 'none', borderRadius: '30px', cursor: (isSpinning || hasSpun) ? 'not-allowed' : 'pointer',
          marginTop: '15px', opacity: (isSpinning || hasSpun) ? 0.7 : 1,
          boxShadow: (isSpinning || hasSpun) ? 'none' : '0 4px 15px rgba(255, 215, 0, 0.4)'
        }}
      >
        {isSpinning ? 'Generating...' : (hasSpun ? 'Luck Tested' : 'Test Your Luck')}
      </button>
    </div>
  );
}
