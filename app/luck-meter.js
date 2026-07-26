'use client';

import React, { useState, useEffect } from 'react';

const DIAL_IMAGE = '/1492_trimmed.png';
const NEEDLE_IMAGE = '/1491_trimmed.png';

export default function LuckMeter() {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [luckPercentage, setLuckPercentage] = useState(null);
  const [rotation, setRotation] = useState(-85);
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

  const getCommentary = (luck) => {
    if (luck >= 90) return "Incredible! Your luck is off the charts!";
    if (luck >= 70) return "Wow! You’re on a serious roll today!";
    if (luck >= 40) return "Solid luck! Keep that positive energy.";
    if (luck >= 20) return "A little modest, but luck can change in a heartbeat!";
    return "Time to reset your vibe—better luck next time!";
  };

  const spinMeter = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setHasSpun(true);
    
    const randomLuck = Math.floor(Math.random() * 101);
    const targetAngle = (randomLuck / 100) * 170 - 85;
    
    setRotation(targetAngle);

    setTimeout(() => {
      setLuckPercentage(randomLuck);
      setIsSpinning(false);
    }, 3000);
  };

  let finalGlowColor = 'transparent';
  if (!isSpinning && luckPercentage !== null) {
    if (luckPercentage >= 80) finalGlowColor = 'rgba(0, 255, 128, 1)';
    else if (luckPercentage >= 50) finalGlowColor = 'rgba(255, 215, 0, 0.9)';
    else finalGlowColor = 'rgba(255, 80, 80, 0.8)';
  }

  if (!imagesLoaded) return <div style={{ padding: '20px', textAlign: 'center', color: '#ffffff' }}>Loading Meter...</div>;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      width: '100%', 
      margin: '0 auto', 
      color: '#ffffff', 
      fontFamily: 'sans-serif' 
    }}>
      <style>{`
        @keyframes sweep { 0% { transform: rotate(-80deg); } 100% { transform: rotate(80deg); } }
        @keyframes spark { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes colorCycle {
          0% { box-shadow: 0 0 80px 20px rgba(0, 255, 128, 0.6); }
          33% { box-shadow: 0 0 80px 20px rgba(255, 215, 0, 0.6); }
          66% { box-shadow: 0 0 80px 20px rgba(255, 80, 80, 0.6); }
          100% { box-shadow: 0 0 80px 20px rgba(0, 255, 128, 0.6); }
        }
      `}</style>

      {/* Main Container - The anchor for all absolute elements */}
      <div style={{ position: 'relative', width: '90%', maxWidth: '380px', aspectRatio: '1 / 1', margin: '0 auto' }}>
        
        {/* Glow Effects */}
        <div style={{
          position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%', borderRadius: '50%',
          boxShadow: isSpinning ? 'none' : `0 0 100px 30px ${finalGlowColor}`,
          animation: isSpinning ? 'colorCycle 2s infinite ease-in-out' : 'none',
          zIndex: 0, transition: 'box-shadow 0.5s ease-in-out'
        }} />

        {/* Dial Base */}
        <img src={DIAL_IMAGE} alt="Dial Base" style={{ position: 'relative', width: '100%', zIndex: 1, display: 'block' }} />
        
        {/* Frosted Glass Label Plate - Modern look */}
        <div style={{
          position: 'absolute', top: '92%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '52%', height: '13%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.3)', 
          borderRadius: '20px', 
          zIndex: 5,
          display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.4rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
          🍀
        </div>

        {/* Sparkler Effect */}
        {luckPercentage >= 80 && !isSpinning && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: '60%', height: '60%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            animation: 'spark 1.5s ease-in-out infinite', zIndex: 7, pointerEvents: 'none'
          }} />
        )}

        {/* Needle - Force Centered with Translate */}
        <img src={NEEDLE_IMAGE} alt="Needle" style={{
          position: 'absolute', 
          top: '50%', left: '50%', 
          transform: isSpinning ? 'translate(-50%, -50%)' : `translate(-50%, -50%) rotate(${rotation}deg)`,
          width: '52%', height: '52%', objectFit: 'contain',
          animation: isSpinning ? 'sweep 1.2s infinite alternate ease-in-out' : 'none',
          transition: isSpinning ? 'none' : 'transform 2.5s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 6, display: 'block'
        }} />
      </div>

      <div style={{ minHeight: '100px', textAlign: 'center', padding: '0 15px', marginTop: '10px' }}>
        {luckPercentage !== null && !isSpinning && (
          <>
            <p style={{ fontSize: '1.2rem', fontStyle: 'italic', color: '#FFF', margin: '0 0 10px 0' }}>{getCommentary(luckPercentage)}</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#FFD700' }}>Your Luck: {luckPercentage}%</p>
          </>
        )}
        {isSpinning && <p style={{ fontSize: '1.3rem', opacity: 0.85, color: '#FFD700' }}>Scanning for your luck...</p>}
      </div>

      <button onClick={spinMeter} disabled={isSpinning || hasSpun} style={{
        padding: '14px 36px', fontSize: '1.2rem', fontWeight: 'bold', color: '#000',
        backgroundColor: (isSpinning || hasSpun) ? '#555' : '#FFD700', border: 'none', borderRadius: '30px', cursor: (isSpinning || hasSpun) ? 'not-allowed' : 'pointer'
      }}>
        {isSpinning ? 'Scanning...' : (hasSpun ? 'Luck Found' : 'Generate Your Luck')}
      </button>
    </div>
  );
}
