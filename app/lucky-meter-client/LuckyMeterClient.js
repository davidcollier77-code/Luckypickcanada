"use client";

import DailyResonance from "../../components/DailyResonance";

export default function LuckyMeterClient() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <DailyResonance />
      <div className="max-w-2xl text-center px-6 py-12 text-white/80 z-10 mt-8">
        <h2 className="text-xl font-bold mb-4 text-amber-400">Discover Your Canadian Daily Luck</h2>
        <p className="text-sm md:text-base leading-relaxed">
          The Lucky Meter is a playful digital tool designed to measure your daily resonance. Check back every day to see how your luck levels shift and use it as a fun way to find your lucky numbers or just get a spark of encouragement for your day across Canada.
        </p>
      </div>
    </div>
  );
}
