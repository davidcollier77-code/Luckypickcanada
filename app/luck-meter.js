'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LuckyMeter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reading, setReading] = useState(null);
  const [usageCount, setUsageCount] = useState(1284);

  // 12-Hour Reset Logic
  useEffect(() => {
    const lastReset = localStorage.getItem('lastReset');
    const now = new Date().getTime();
    if (!lastReset || now - parseInt(lastReset) > 12 * 60 * 60 * 1000) {
      setReading(null);
      localStorage.setItem('lastReset', now.toString());
    } else {
      setReading(56);
    }
  }, []);

  const handleInteract = () => {
    if (isGenerating || reading !== null) return;
    setIsGenerating(true);
    setUsageCount(prev => prev + 1);

    setTimeout(() => {
      setReading(56);
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <div className="lucky-meter-component flex flex-col items-center justify-center w-full min-h-[400px] bg-black">
      <div className="relative w-72 h-72 flex items-center justify-center overflow-hidden rounded-full border border-white/10 shadow-2xl">
        <img
          src="/gauge-base-1600w.png"
          srcSet="/gauge-base-400w.png 400w, /gauge-base-800w.png 800w, /gauge-base-1600w.png 1600w"
          sizes="(max-width: 600px) 400px, 800px"
          alt="Lucky Meter"
          className={`w-full h-full object-cover transition-transform duration-1000 ${
            isGenerating ? 'rotate-[360deg] scale-110' : 'rotate-0'
          }`}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <AnimatePresence mode="wait">
            {!isGenerating && reading === null && (
              <motion.button
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleInteract}
                className="text-white text-sm font-light tracking-widest uppercase border border-white/30 px-6 py-2 rounded-full hover:bg-white/10 transition-all"
              >
                Generate Luck
              </motion.button>
            )}

            {isGenerating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white/50 text-xs font-mono tracking-wider animate-pulse"
              >
                SYNTHESIZING...
              </motion.div>
            )}

            {reading !== null && (
              <motion.div
                key="reading"
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-white tracking-tighter">{reading}%</div>
                <p className="text-[10px] text-teal-200/80 max-w-[140px] mt-1 leading-tight">
                  The tide is exactly halfway in, and it is still rising.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 text-white/40 text-xs font-mono tracking-widest">
        COMMUNITY READINGS: {usageCount.toLocaleString()}
      </div>
    </div>
  );
}
