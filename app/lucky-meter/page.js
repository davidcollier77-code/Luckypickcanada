"use client";

import DailyLuckyMeter from "../components/DailyLuckyMeter";

export default function LuckyMeterPage() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4">
      {/* Background Video */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          className="h-full w-full object-cover opacity-60 filter contrast-110 brightness-95"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="/media/lucky-meter/deep-cosmos-poster.webp"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        >
          <source src="/media/lucky-meter/deep-cosmos-1080p.webm" type="video/webm" />
          <source src="/media/lucky-meter/deep-cosmos-1080p.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
      </div>

      <DailyLuckyMeter/>
    </main>
  );
}
