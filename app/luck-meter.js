'use client';

import React, { useState, useEffect } from 'react';

// Standard asset paths
const DIAL_IMAGE = '/1492_trimmed.png';
const NEEDLE_IMAGE = '/1491_trimmed.png';

export default function LuckMeter() {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [luckPercentage, setLuckPercentage] = useState(null);
  const [rotation, setRotation] = useState(-90);
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
    
    setRotation(targetAngle);

    setTimeout(() => {
      setLuckPercentage(randomLuck);
      setIsSpinning(false);
    }, 3000);
  };

  // Determine static result color
  let finalGlowColor = 'transparent';
  if (!isSpinning && luckPercentage !== null) {
    if (luckPercentage >= 80) finalGlowColor = 'rgba(0, 255, 128, 1)';
    else if (luckPercentage >= 50) finalGlowColor = 'rgba(255, 215, 0, 0.9)';
    else finalGlowColor = 'rgba(255, 80, 80, 0.8)';
  }

  if (!imagesLoaded) return <div style={{ padding: '20px', textAlign: 'center', color: '#ffffff' }}>Loading Meter...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '0 auto', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes sweep { 0% { transform: rotate(-80deg); } 100% { transform: rotate(80deg); } }
        @keyframes twinkle { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); } }
        @keyframes colorCycle {
          0% { box-shadow: 0 0 80px 20px rgba(0, 255, 128, 0.6); }
          33% { box-shadow: 0 0 80px 20px rgba(255, 215, 0, 0.6); }
          66% { box-shadow: 0 0 80px 20px rgba(255, 80, 80, 0.6); }
          100% { box-shadow: 0 0 80px 20px rgba(0, 255, 128, 0.6); }
        }
      `}</style>

      <div style={{ position: 'relative', width: '85%', maxWidth: '360px', aspectRatio: '1 / 1', margin: '10px auto 25px auto' }}>
        
        {/* Dynamic Aurora: Cycles colors while spinning, locks to final color when finished */}
        <div style={{
          position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%', borderRadius: '50%',
          boxShadow: isSpinning ? 'none' : `0 0 100px 30px ${finalGlowColor}`,
          animation: isSpinning ? 'colorCycle 2s infinite ease-in-out' : 'none',
          zIndex: 0, transition: 'box-shadow 0.5s ease-in-out'
        }} />

        <img src={DIAL_IMAGE} alt="Dial Base" style={{ position: 'relative', width: '100%', zIndex: 1, display: 'block' }} />
        
        {/* Center Twinkle Effect */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: '12%', height: '12%', borderRadius: '50%',
          background: '#ffffff', zIndex: 2, animation: 'twinkle 1.5s infinite ease-in-out', pointerEvents: 'none' 
        }} />

        {/* Needle */}
        <img src={NEEDLE_IMAGE} alt="Needle" style={{
          position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', objectFit: 'contain',
          animation: isSpinning ? 'sweep 1.2s infinite alternate ease-in-out' : 'none',
          transform: isSpinning ? 'none' : `rotate(${rotation}deg)`,
          transition: isSpinning ? 'none' : 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          transformOrigin: 'center center', zIndex: 3, display: 'block'
        }} />
      </div>

      <div style={{ minHeight: '70px', textAlign: 'center', padding: '0 15px' }}>
        {luckPercentage !== null && !isSpinning && (
          <>
            <p style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#FFD700' }}>Your Luck: {luckPercentage}%</p>
          </>
        )}
        {isSpinning && <p style={{ fontSize: '1.3rem', opacity: 0.85, color: '#FFD700' }}>Scanning for your luck...</p>}
      </div>

      <button onClick={spinMeter} disabled={isSpinning || hasSpun} style={{
        padding: '14px 36px', fontSize: '1.2rem', fontWeight: 'bold', color: '#000',
        backgroundColor: (isSpinning || hasSpun) ? '#555' : '#FFD700', border: 'none', borderRadius: '30px', cursor: (isSpinning || hasSpun) ? 'not-allowed' : 'pointer'
      }}>
        {isSpinning ? 'Scanning...' : (hasSpun ? 'Luck Found' : 'Get Your Lucky Pick')}
      </button>
    </div>
  );
}
