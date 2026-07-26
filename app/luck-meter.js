'use client';

import React, { useState, useEffect } from 'react';

// Swapped so 1492 is the still background dial and 1491 is the rotating needle
const DIAL_IMAGE = '/1492_trimmed.png';
const NEEDLE_IMAGE = '/1491_trimmed.png';

export default function LuckMeter() {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [luckPercentage, setLuckPercentage] = useState<number | null>(null);
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
    // Calculates rotation angle based on luck percentage (-90deg to +90deg)
    const targetAngle = (randomLuck / 100) * 180 - 90;
    const nextRotation = rotation + 1080 + (targetAngle - (rotation % 360));

    setRotation(nextRotation);

    setTimeout(() => {
      setLuckPercentage(randomLuck);
      setIsSpinning(false);
    }, 2500);
  };

  // Dynamic Lighting / Glow Logic based on luck output
  let glowColor = 'rgba(255, 255, 255, 0.3)';
  let glowIntensity = '30px';
  let animation = isSpinning ? 'pulse 1.2s infinite ease-in-out' : 'none';
  let luckMessage = '';

  if (!isSpinning && luckPercentage !== null) {
    animation = 'none';
    if (luckPercentage >= 80) {
      glowColor = 'rgba(0, 255, 128, 0.8)';
      glowIntensity = '60px';
      luckMessage = "Outstanding! The universe is totally on your side today.";
    } else if (luckPercentage >= 50) {
      glowColor = 'rgba(255, 215, 0, 0.7)';
      glowIntensity = '45px';
      luckMessage = "Solid energy! A perfectly balanced day ahead.";
    } else {
      glowColor = 'rgba(255, 80, 80, 0.6)';
      glowIntensity = '30px';
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
        @keyframes pulse {
          0% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); }
          50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.8); }
          100% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); }
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
        transition: 'box-shadow 0.5s ease-in-out'
      }}>
        
        {/* Dynamic Backlight Glow Effect */}
        <div style={{
          position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%',
          borderRadius: '50%', boxShadow: `0 0 ${glowIntensity} ${glowColor}`,
          zIndex: 0, transition: 'all 0.5s ease-in-out'
        }} />

        {/* Base Dial Graphic */}
        <img 
          src={DIAL_IMAGE} 
          alt="Dial Base" 
          style={{ position: 'relative', width: '100%', zIndex: 1, display: 'block' }} 
        />
        
        {/* Rotating Needle Layer */}
        <img 
          src={NEEDLE_IMAGE} 
          alt="Needle" 
          style={{
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%',
            height: '100%',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 2.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            transformOrigin: 'center center', 
            zIndex: 2,
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
