'use client';

export default function LuckyMeterButton({ onUpdateLuck }: { onUpdateLuck?: () => void }) {
  const handleLuckyClick = () => {
    // 1. Fire visual updates and state changes immediately
    if (onUpdateLuck) {
      onUpdateLuck();
    }

    // 2. Play audio asynchronously without blocking the UI thread
    // Instantiating a new Audio object per click allows overlapping playback
    if (typeof window !== 'undefined') {
      const clickAudio = new Audio('/sounds/lucky-click.mp3');
      clickAudio.play().catch((error) => {
        console.log("Audio playback blocked or failed:", error);
      });
    }
  };

  return (
    <button
      onClick={handleLuckyClick}
      style={{ touchAction: 'manipulation' }}
      className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      Test Your Luck
    </button>
  );
}
