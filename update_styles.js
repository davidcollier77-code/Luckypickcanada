const fs = require('fs');

let content = fs.readFileSync('app/components/DailyLuckyMeter.tsx', 'utf8');

// Update machine-frame styles
content = content.replace(
  /\.machine-frame \{[\s\S]*?transition: transform 0\.25s cubic-bezier\(0\.16, 1, 0\.3, 1\);\n  \}/,
  `.machine-frame {
    position: relative;
    z-index: 10;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    /* Realistic brushed gold bezel: deep antique bronze, warm bullion, pale champagne */
    background: conic-gradient(from 0deg,
      #4a3b1a 0deg,
      #8c7335 45deg,
      #d4af37 90deg,
      #f8e287 135deg,
      #8c7335 180deg,
      #4a3b1a 225deg,
      #d4af37 270deg,
      #f8e287 315deg,
      #4a3b1a 360deg
    );
    box-shadow:
      0 20px 45px rgba(0, 0, 0, 0.75),
      0 0 0 1px rgba(255, 223, 128, 0.4),
      inset 0 4px 10px rgba(255, 255, 255, 0.3),
      inset 0 -6px 12px rgba(40, 30, 10, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }`
);

// Update intense vibration tint removal
content = content.replace(
  /\.machine-frame\.vibrating-intense \{ animation: machineVibrateIntense 0\.04s infinite ease-in-out alternate; filter: brightness\(1\.2\); \}/,
  `.machine-frame.vibrating-intense { animation: machineVibrateIntense 0.04s infinite ease-in-out alternate; }`
);

// Update rivet details
content = content.replace(
  /\.rivet \{[\s\S]*?transform: translate\(-50%, -50%\);\n  \}/,
  `.rivet {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    /* Polished, machined brass stud */
    background: radial-gradient(circle at 35% 35%, #fff2cc 0%, #b38600 40%, #4d3900 90%);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.8),
      inset 0 1px 1px rgba(255, 255, 255, 0.8),
      inset 0 -1px 2px rgba(0, 0, 0, 0.6);
    transform: translate(-50%, -50%);
  }`
);

// Update recessed well bezel track
content = content.replace(
  /\.recessed-well \{[\s\S]*?justify-content: center;\n  \}/,
  `.recessed-well {
    position: relative;
    width: 270px;
    height: 270px;
    border-radius: 50%;
    background: #030712;
    /* Inner dark shadow track to seat the core */
    box-shadow:
      0 0 0 4px #1a150c,
      inset 0 10px 20px rgba(0, 0, 0, 0.9),
      inset 0 0 30px rgba(0, 0, 0, 0.95),
      0 1px 1px rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }`
);

// Update led baseline styles and animations
content = content.replace(
  /\.led-indicator \{[\s\S]*?@keyframes ledSpin \{[\s\S]*?\}\n/m,
  `.led-indicator {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    /* Soft dim baseline 25% opacity with primary color */
    background: var(--pri-color);
    opacity: 0.25;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
    transition: background 0.3s, box-shadow 0.3s, opacity 0.3s;
  }

  .led-indicator.idle-orbital, .led-indicator.spinning-chase {
    /* Continuous chaser animation */
    animation: chaserRing 10s infinite linear;
  }

  @keyframes chaserRing {
    0%, 90%, 100% { opacity: 0.25; background: var(--pri-color); box-shadow: none; }
    5% {
      opacity: 1;
      background: #ffffff;
      box-shadow: 0 0 8px #ffffff, 0 0 16px var(--sec-color), 0 0 24px var(--pri-color);
    }
  }

  .led-indicator.active {
    background: #ffffff;
    opacity: 1;
    box-shadow: 0 0 10px #ffffff, 0 0 20px var(--sec-color), 0 0 30px var(--pri-color), inset 0 0 4px var(--sec-color);
    animation: none;
  }\n`
);

// Move flash overlay
content = content.replace(
  /\{\/\* Flash Overlay \*\/\}\s*<div className=\{\`flash-overlay \$\{isRevealing \? 'trigger-flash' : ''\}\`\} \/>\s*\{\/\* Bezel Structural Rivets \*\/\}/m,
  `{/* Bezel Structural Rivets */}`
);

content = content.replace(
  /\{\/\* 20-LED Ring Array \*\/\}/m,
  `{/* Flash Overlay inside well to isolate color */}
          <div className={\`flash-overlay \${isRevealing ? 'trigger-flash' : ''}\`} />
          {/* 20-LED Ring Array */}`
);

// Fix LED chaser staggering logic
content = content.replace(
  /const spinDuration = 0\.9;\s*const ambientDuration = 8;\s*const staggerDelay = isChase\s*\?\s*`\$\{\(i \* spinDuration \/ LED_COUNT\)\.toFixed\(3\)\}s`\s*:\s*isLit \? '0s' : `\$\{\(i \* ambientDuration \/ LED_COUNT\)\.toFixed\(3\)\}s`;/,
  `const duration = 10;
              const staggerDelay = isLit ? '0s' : \`-\${(duration - (i * duration / LED_COUNT)).toFixed(3)}s\`;`
);


fs.writeFileSync('app/components/DailyLuckyMeter.tsx', content);
