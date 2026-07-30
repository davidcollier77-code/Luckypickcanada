import React, { useState } from 'react';

export default function LuckyMeter() {
  const [activeTier, setActiveTier] = useState('lm-tier-1');
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setActiveTier('lm-tier-3');
      setIsCalibrating(false);
    }, 2000);
  };

  return (
    <section id="lucky-meter" className="w-full py-16 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1a]/50 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto text-center px-4">
        <h2 className="text-sm tracking-widest uppercase text-cyan-400 font-semibold mb-2">
          Daily Calibration
        </h2>
        <h3 className="text-3xl font-serif text-gold-400 text-[#ffd700] mb-8">
          Check Your Meter
        </h3>

        <div className={`
          relative w-64 h-64 rounded-full flex items-center justify-center mb-8 border-2 transition-all duration-700 ease-in-out
          ${isCalibrating ? 'animate-pulse border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]' : ''}
          ${!isCalibrating && activeTier === 'lm-tier-1' ? 'border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.3)]' : ''}
          ${!isCalibrating && activeTier === 'lm-tier-2' ? 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]' : ''}
          ${!isCalibrating && activeTier === 'lm-tier-3' ? 'border-[#ffd700] shadow-[0_0_40px_rgba(255,215,0,0.6)]' : ''}
        `}>
          <div className="absolute inset-2 rounded-full border border-white/10" />
          
          <div className="text-center">
            <span className="block text-5xl font-bold text-white mb-2">
              {isCalibrating ? '...' : activeTier === 'lm-tier-3' ? '99%' : activeTier === 'lm-tier-2' ? '75%' : '50%'}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Energy Level
            </span>
          </div>
        </div>

        <button 
          onClick={handleCalibration}
          disabled={isCalibrating}
          className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalibrating ? 'Calibrating...' : 'Calibrate Today\'s Meter'}
        </button>

        <p className="mt-6 text-sm text-gray-400">
          Next calibration available in <span className="text-white font-mono">14:22:05</span>
        </p>
      </div>
    </section>
  );
}
