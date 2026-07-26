import React, { useState, useEffect } from 'react';

// Exact matching filenames from your GitHub /public folder
const DIAL_IMAGE = '/BackgroundEraser_20260726_100033229.png';
const NEEDLE_IMAGE = '/IMG_20260726_103932_591006.png';

export default function LuckMeter() {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [luckPercentage, setLuckPercentage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // Safe preloading: handles both load and error events so UI never freezes
  useEffect(() => {
    let loadedCount = 0;
    const handleComplete = () => {
      loadedCount++;
      if (loadedCount === 2) {
        setImagesLoaded(true);
      }
    };

    const dialImg = new Image();
    const needleImg = new Image();

    // Trigger completion on success OR error to prevent infinite loading freeze
    dialImg.onload = handleComplete;
    dialImg.onerror = handleComplete;
    needleImg.onload = handleComplete;
    needleImg.onerror = handleComplete;

    dialImg.src = DIAL_IMAGE;
    needleImg.src = NEEDLE_IMAGE;
  }, []);

  const spinMeter = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    
    // Generate score between 0% and 100%
    const randomLuck = Math.floor(Math.random() * 101);
    
    // Map 0-100% to -90deg (0%) through +90deg (100%)
    const targetAngle = (randomLuck / 100) * 180 - 90;
    
    // Add 3 full extra rotations (1080 deg) for dramatic spin effect
    const nextRotation = rotation + 1080 + (targetAngle - (rotation % 360));

    setRotation(nextRotation);

    // Reveal score once the 2.5s needle spin completes
    setTimeout(() => {
      setLuckPercentage(randomLuck);
      setIsSpinning(false);
    }, 2500);
  };

  if (!imagesLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#ffffff' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Loading Lucky Meter...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Lucky Meter
      </h2>

      {/* Meter Display Frame */}
      <div style={{
        position: 'relative',
        width: '280px',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        {/* Base Meter Dial */}
        <img
          src={DIAL_IMAGE}
          alt="Lucky Meter Dial"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />

        {/* Single Rotating Needle */}
        <img
          src={NEEDLE_IMAGE}
          alt="Lucky Meter Needle"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 2.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            transformOrigin: 'center center'
          }}
        />
      </div>

      {/* Score Readout */}
      <div style={{ height: '40px', marginBottom: '15px', textAlign: 'center' }}>
        {luckPercentage !== null && !isSpinning && (
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
            Your Luck: <span style={{ color: '#FFD700' }}>{luckPercentage}%</span>
          </p>
        )}
        {isSpinning && (
          <p style={{ fontSize: '1.1rem', opacity: 0.8, margin: 0 }}>Testing your luck...</p>
        )}
      </div>

      {/* Trigger Button */}
      <button
        onClick={spinMeter}
        disabled={isSpinning}
        style={{
          padding: '12px 28px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#000000',
          backgroundColor: isSpinning ? '#888888' : '#FFD700',
          border: 'none',
          borderRadius: '25px',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.2s ease, transform 0.1s ease'
        }}
      >
        {isSpinning ? 'Testing...' : 'Test Your Luck'}
      </button>
    </div>
  );
}
