import React from 'react';

interface ResonanceButtonProps {
  onClick: () => void;
}

export default function ResonanceButton({ onClick }: ResonanceButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-full bg-slate-800 text-sky-300 border border-sky-900 animate-glow-breathe hover:animate-none hover:bg-slate-700 transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/80"
    >
      Reveal My Resonance
    </button>
  );
}
