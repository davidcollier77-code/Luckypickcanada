import React, { ReactNode } from 'react';

interface CosmicBackgroundProps {
  isRevealed?: boolean;
  progress?: number;
  children: ReactNode;
}

const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ isRevealed, progress, children }) => {
  const isTriggered = isRevealed || progress === 100;

  // Generate meteors statically to avoid unnecessary re-renders or dynamic arrays inside the component.
  // Using an array of 20 meteors for moderate density.
  const meteors = Array.from({ length: 20 });

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden bg-transparent transition-all duration-1000 ${
        !isTriggered ? 'animate-breathing-pulse' : ''
      }`}
    >
      {isTriggered && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {meteors.map((_, i) => {
            // Using a pseudo-random approach for position and delay based on index
            // so we avoid hydration mismatches if used with SSR
            const left = `${(i * 13) % 100}%`;
            const top = `${(i * 17) % 100}%`;
            const delay = `${(i * 0.3) % 3}s`;
            const duration = `${1 + ((i * 0.1) % 2)}s`;

            return (
              <div
                key={i}
                className="absolute w-[2px] h-[50px] bg-white opacity-0 animate-meteor-shower"
                style={{
                  left,
                  top,
                  animationDelay: delay,
                  animationDuration: duration,
                  boxShadow: '0 0 10px 2px rgba(167, 243, 208, 0.5), 0 0 20px 2px rgba(253, 230, 138, 0.3)', // Cyan and pale gold glow
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))',
                  borderRadius: '10px'
                }}
              />
            );
          })}
        </div>
      )}

      {/* Container for children elements */}
      <div className="relative z-10 w-full h-full flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default CosmicBackground;
