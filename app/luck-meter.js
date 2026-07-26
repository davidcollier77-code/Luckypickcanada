import React, { useState, useCallback } from 'react';

const AURORA_KEYFRAMES = `
@keyframes lm-aurora-glow {
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(52, 211, 153, 0.65))
            drop-shadow(0 0 14px rgba(34, 211, 238, 0.45))
            hue-rotate(0deg);
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.85))
            drop-shadow(0 0 22px rgba(129, 140, 248, 0.55))
            hue-rotate(35deg);
  }
}
@keyframes lm-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .lm-needle-aurora { animation: none !important; }
  .lm-result { animation: none !important; }
  .lm-needle-img { transition-duration: 400ms !important; }
}
`;

const READING_COPY = (pct) => {
  if (pct >= 80) return 'Incredible! Your luck is off the charts today!';
  if (pct >= 50) return 'Positive vibes are coming your way!';
  if (pct >= 25) return 'A quiet kind of luck — good things build slowly.';
  return "Today's about steady ground, not fireworks. Tomorrow's a new reading.";
};

const angleForPercentage = (pct) => pct * 2.7 - 135;

export default function LuckyMeter() {
  const [percentage, setPercentage] = useState(null);
  const [rotation, setRotation] = useState(0); 
  const [isSpinning, setIsSpinning] = useState(false);
  const [shareState, setShareState] = useState('idle');

  const hasResult = percentage !== null && !isSpinning;
  const isHighScore = hasResult && percentage >= 50;

  const handleGenerate = useCallback(() => {
    if (isSpinning || hasResult) return;
    
    const result = Math.floor(Math.random() * 101);
    const targetAngle = angleForPercentage(result);
    
    // 1080 = 3 full spins
    const extraSpins = 1080; 
    setRotation(extraSpins + targetAngle);
    
    setIsSpinning(true);
    setPercentage(result);
    
    // Matches the 2200ms transition time below
    window.setTimeout(() => setIsSpinning(false), 2200);
  }, [isSpinning, hasResult]);

  const handleShare = useCallback(async () => {
    const text = `My Daily Luck Reading from Lucky Pick Canada: ${percentage}% — ${READING_COPY(percentage)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Daily Luck Reading',
          text,
          url: 'https://luckypickcanada.ca',
        });
      } catch {}
      return;
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${text} — https://luckypickcanada.ca`);
        setShareState('copied');
        window.setTimeout(() => setShareState('idle'), 2000);
      } catch {}
    }
  }, [percentage]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm mx-auto p-8 rounded-3xl bg-gradient-to-b from-[#0B1929] to-[#0A1420] border border-[#2A3F52] shadow-[0_0_60px_-15px_rgba(34,211,238,0.25)]">
      <style>{AURORA_KEYFRAMES}</style>

      <div className="text-center">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#7FA8B8] font-medium">Lucky Pick Canada</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#F5E6C8] tracking-wide">Daily Luck Reading</h1>
      </div>

      <div className="relative w-72 h-72 select-none">
        <img src="/meter-base.png" alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        <img
          src="/meter-hand.png"
          alt=""
          draggable={false}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none origin-center lm-needle-img ${isHighScore ? 'lm-needle-aurora' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 2200ms cubic-bezier(0.22, 1, 0.36, 1)',
            animation: isHighScore ? 'lm-aurora-glow 2.4s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {!hasResult && (
        <button type="button" onClick={handleGenerate} disabled={isSpinning} className="w-full py-4 rounded-full font-semibold tracking-wide text-[#0B1929] bg-gradient-to-r from-[#5EEAD4] via-[#34D399] to-[#818CF8] shadow-[0_0_30px_-6px_rgba(52,211,153,0.6)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
          {isSpinning ? 'Reading the aurora…' : 'Generate My Daily Vibe'}
        </button>
      )}

      {hasResult && (
        <div className="lm-result w-full text-center p-6 rounded-2xl border border-[#2A3F52] bg-[#0F2030]/70" style={{ animation: 'lm-fade-in 500ms ease-out' }}>
          <p className="text-5xl font-bold text-[#F5E6C8]">{percentage}%</p>
          <p className="mt-3 text-[#BFE3E0] leading-relaxed">{READING_COPY(percentage)}</p>
          <button type="button" onClick={handleShare} className="mt-5 w-full py-3 rounded-full font-medium text-[#DCE7EC] border border-[#3A5568] bg-transparent hover:bg-[#15283A] transition-colors">
            {shareState === 'copied' ? 'Copied to clipboard' : 'Share My Result'}
          </button>
          <p className="mt-4 text-xs text-[#5C7A8A]">Come back tomorrow for a new reading.</p>
        </div>
      )}
    </div>
  );
}
