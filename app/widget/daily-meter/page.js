"use client";

import LuckyGenerator from "../../../components/LuckyGenerator";

export default function DailyMeterWidget() {
  return (
    <div className="relative w-[300px] h-[250px] overflow-hidden rounded-xl bg-transparent text-white">
      <div className="relative flex h-full w-full items-center justify-center px-3 py-2 transform scale-[0.6] origin-center">
        <LuckyGenerator />
      </div>
    </div>
  );
}
