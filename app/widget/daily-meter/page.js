"use client";

import { useState } from "react";
import DailyLuckyMeter from "../../components/DailyLuckyMeter";
import AuroraBackground from "../../components/AuroraBackground";

export default function DailyMeterWidget() {
  const [meterState, setMeterState] = useState("idle");

  return (
    <div className="relative w-[300px] h-[250px] overflow-hidden rounded-xl bg-transparent text-white">
      <AuroraBackground isResonating={meterState === "resonating"} />

      <div className="relative flex h-full w-full items-center justify-center px-3 py-2 transform scale-[0.6] origin-center">
        <DailyLuckyMeter onStateChange={setMeterState} />
      </div>
    </div>
  );
}
