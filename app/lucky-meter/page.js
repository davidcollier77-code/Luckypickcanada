"use client";

import { useState } from "react";
import DailyLuckyMeter from "../components/DailyLuckyMeter";
import AuroraBackground from "../components/AuroraBackground";

export default function LuckyMeterPage() {
  const [meterState, setMeterState] = useState("idle");

  return (
    <main className="relative min-h-screen w-full bg-transparent text-white flex flex-col items-center p-4">
      <AuroraBackground isResonating={meterState === "resonating"} />
      <DailyLuckyMeter onStateChange={setMeterState} />
    </main>
  );
}
