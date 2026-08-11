'use client';

import { useState } from 'react';

export default function LuckyCardReveal() {
  const [clicked, setClicked] = useState(false);

  const handleManualClick = () => {
    alert("Success! The button is connected.");
    setClicked(true);
  };

  return (
    <div style={{ padding: '20px', border: '5px solid red', margin: '20px' }}>
      <h2>Testing Button Connectivity</h2>
      <button 
        type="button" 
        onClick={handleManualClick}
        style={{ 
          padding: '20px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          fontSize: '18px',
          cursor: 'pointer',
          zIndex: 9999, // Force it to the top
          position: 'relative'
        }}
      >
        {clicked ? "It Worked!" : "Click Me to Test"}
      </button>
      <p style={{ marginTop: '10px' }}>
        If this button does not click, the issue is not your code logic—it is a CSS overlay or layout issue in your main page wrapper.
      </p>
    </div>
  );
}
