"use client";

import { DailyLuckyMeter } from "../../components/DailyLuckyMeter";

export default function DailyMeterWidget() {
  return (
    <div className="relative w-[300px] h-[250px] overflow-hidden rounded-xl bg-black text-white">
      <div className="absolute inset-0 -z-10">
        <video
          className="h-full w-full object-cover opacity-70 filter contrast-110 brightness-95"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="/media/lucky-meter/deep-cosmos-widget-poster.webp"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        >
          <source src="/media/lucky-meter/deep-cosmos-widget.webm" type="video/webm" />
          <source src="/media/lucky-meter/deep-cosmos-widget.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      </div>

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,255,0.35),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(255,215,106,0.35),transparent_55%)]" />

      <div className="relative flex h-full w-full items-center justify-center px-3 py-2">
        <DailyLuckyMeter compact/>
      </div>
    </div>
  );
}
