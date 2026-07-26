'use client';

import React, { useState, useEffect } from 'react';

// Exact matching filenames from your GitHub /public folder
const DIAL_IMAGE = '/BackgroundEraser_20260726_100033229.png';
const NEEDLE_IMAGE = '/IMG_20260726_103932_591006.png';

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

  // Determine styles for lighting and pulse
  let glowColor = 'transparent';
  let glowIntensity = '0px';
  let animationStyle = isSpinning ? 'pulse 1.5s infinite' : 'none';
  let luckMessage = '';
  
  if (luckPercentage !== null && !isSpinning) {
    if (luckPercentage >= 80) {
      glowColor = 'rgba(0, 255, 128, 0.7)';
      glowIntensity = '60px';
      luckMessage = "Outstanding! The universe is totally on your side today.";
    } else if (luckPercentage >= 50) {
      glowColor = 'rgba(255, 215, 0, 0.6)';
      glowIntensity = '40px';
      luckMessage = "Solid energy! A perfectly balanced day ahead.";
    } else {
      glowColor = 'rgba(255, 100, 100, 0.5)';
      glowIntensity = '25px';
      luckMessage = "Hey, the only way is up! You make your own luck anyway.";
    }
  }

  if (!imagesLoaded) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#ffffff' }}>Loading...</div>;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px', width: '100%',
      maxWidth: '500px', margin: '0 auto', color: '#ffffff', fontFamily: 'sans-serif'
    }}>
      {/* Animation Styles */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.8); }
          100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
        }
      `}</style>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Lucky Meter
      </h2>

      {/* Meter Display Frame - Expanded to 85% width */}
      <div style={{
        position: 'relative',
        width: '85%', 
        maxWidth: '450px',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px',
        borderRadius: '50%',
        animation: animationStyle, // Triggers pulse when spinning
        transition: 'box-shadow 0.3s ease-in-out'
      }}>
        
        {/* Static Aura (shows only when finished spinning) */}
        {!isSpinning && (
          <div style={{
            position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%',
            borderRadius: '50%', boxShadow: `0 0 ${glowIntensity} ${glowColor}`,
            zIndex: 0
          }} />
        )}

        <img src={DIAL_IMAGE} alt="Dial" style={{ position: 'relative', width: '100%', zIndex: 1 }} />
        <img src={NEEDLE_IMAGE} alt="Needle" style={{
          position: 'absolute', width: '100%',
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 2.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          transformOrigin: 'center center', zIndex: 2
        }} />
      </div>

      <div style={{ height: '80px', textAlign: 'center' }}>
        {luckPercentage !== null && !isSpinning && (
          <>
            <p style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>Your Luck: {luckPercentage}%</p>
            <p style={{ fontSize: '1rem', fontStyle: 'italic', opacity: 0.9 }}>{luckMessage}</p>
          </>
        )}
        {isSpinning && <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Generating luck...</p>}
      </div>

      <button
        onClick={spinMeter}
        disabled={isSpinning || hasSpun}
        style={{
          padding: '14px 32px', fontSize: '1.2rem', fontWeight: 'bold', color: '#000',
          backgroundColor: (isSpinning || hasSpun) ? '#666' : '#FFD700',
          border: 'none', borderRadius: '30px', cursor: (isSpinning || hasSpun) ? 'not-allowed' : 'pointer',
          opacity: (isSpinning || hasSpun) ? 0.7 : 1
        }}
      >
        {isSpinning ? 'Generating...' : (hasSpun ? 'Luck Tested' : 'Test Your Luck')}
      </button>
    </div>
  );
}
