"use client";
import React from "react";

type CosmicBackgroundProps = {
  isRevealed: boolean;
  progress: number | string;
  children: React.ReactNode;
};

export default function CosmicBackground({
  isRevealed,
  progress,
  children,
}: CosmicBackgroundProps) {
  const numericProgress = Number(progress);

  const meteors = React.useMemo(
    () =>
      Array.from({ length: 20 }).map((_, index) => {
        const delay = Math.random() * 2;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const scale = 0.6 + Math.random() * 0.7;

        return {
          id: index,
          style: {
            top: `${top}vh`,
            left: `${left}vw`,
            transform: `scale(${scale}) rotate(215deg)`,
            animationDelay: `${delay}s`,
          } as React.CSSProperties,
        };
      }),
    []
  );

  const shouldShowMeteors = isRevealed || numericProgress === 100;

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${
        !isRevealed && numericProgress !== 100 ? "animate-breathe" : ""
      }`}
      aria-label="Daily Resonance Ritual interactive dashboard"
    >
      {shouldShowMeteors && (
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          {meteors.map((meteor) => (
            <div
              key={meteor.id}
              className="absolute h-[2px] w-[140px] animate-meteor"
              style={meteor.style}
            >
              <div className="h-[2px] w-[18px] rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
              <div
                className="h-[2px] w-[140px]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.7) 40%, rgba(0,255,255,0.9) 100%)",
                  filter: "blur(0.5px)",
                }}
              />
            </div>
          ))}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
