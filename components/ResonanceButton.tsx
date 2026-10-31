import React from 'react';

interface ResonanceButtonProps {
  onClick: () => void;
}

export default function ResonanceButton({ onClick }: ResonanceButtonProps) {
  return (
    <button
      onClick={onClick}
      className="gold-3d-btn px-6 py-3 rounded-full font-bold transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
    >
      <span className="gold-cta-emoji" aria-hidden="true">✨</span>Reveal My Resonance
    </button>
  );
}
