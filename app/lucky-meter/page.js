"use client";

import { DailyLuckyMeter } from "../components/DailyLuckyMeter";

export default function LuckyMeterPage() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <video
          className="h-full w-full object-cover opacity-70 filter contrast-110 brightness-95"
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
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-black" />
      </div>

      <div className="absolute inset-0 -z-5 bg-gradient-to-b from-black/70 via-black/40 to-black/80 backdrop-blur-[2px]" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <DailyLuckyMeter/>
      </div>
    </main>
  );
}
