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
      try {
        // Try to load the audio file, with a silent base64 fallback if unavailable
        const audioSrc = '/sounds/lucky-click.mp3';
        // Fallback: minimal silent audio data-URI (50ms of silence)
        const fallbackAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        
        const clickAudio = new Audio(audioSrc);
        clickAudio.play().catch((error) => {
          console.error("Audio playback blocked or failed:", error);
          // Gracefully handle missing audio by using fallback
          new Audio(fallbackAudio).play().catch(() => {});
        });
      } catch (error) {
        console.error("Audio initialization failed:", error);
      }
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
