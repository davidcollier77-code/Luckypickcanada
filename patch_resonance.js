const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf8');

// 1. Change SEQUENCE_DURATION, IMPACT_TIME, TENSION_TIME
code = code.replace(/const SEQUENCE_DURATION = 9000;/, 'const SEQUENCE_DURATION = 4500;');
code = code.replace(/const IMPACT_TIME = 8800;/, 'const IMPACT_TIME = 4200;');
code = code.replace(/const TENSION_TIME = 7500;/, 'const TENSION_TIME = 3500;');

// 2. Change percentage rolling logic in sequenceLoop
const oldPercentageLogic = `      // Update displayed number based on phase
      if (elapsed < TENSION_TIME) {
        // Standard score roll build-up (0.0 - 7.5s)
        setDisplayPercentage(Math.floor(Math.random() * 101));
      } else if (elapsed < IMPACT_TIME) {
        // High-speed tension roll (7.5 - 8.8s)
        setDisplayPercentage(Math.floor(Math.random() * 101));
      } else {
        // Final locked value
        setDisplayPercentage(newPct);
      }`;

const newPercentageLogic = `      // Update displayed number based on phase
      if (elapsed < TENSION_TIME) {
        // Ease out quadratic: fast at first, then slows down, approaching newPct
        // Map elapsed from 0 to TENSION_TIME to a progress 0.0 to 1.0
        let progress = elapsed / TENSION_TIME;
        // Simple easeOutQuad: t * (2 - t)
        let ease = progress * (2 - progress);

        // Let's add a bit of noise (jitter) that decreases as we get closer to the end
        let jitter = Math.floor((Math.random() - 0.5) * 40 * (1 - ease));

        // Interpolate between a random start and newPct
        let currentVal = Math.floor(ease * newPct + jitter);

        // Keep it bounded 0-100
        currentVal = Math.max(0, Math.min(100, currentVal));

        setDisplayPercentage(currentVal);
      } else if (elapsed < IMPACT_TIME) {
        // High-speed tension roll (very short, converging tightly)
        let jitter = Math.floor((Math.random() - 0.5) * 5); // tiny jitter
        let currentVal = Math.max(0, Math.min(100, newPct + jitter));
        setDisplayPercentage(currentVal);
      } else {
        // Final locked value
        setDisplayPercentage(newPct);
      }`;

code = code.replace(oldPercentageLogic, newPercentageLogic);

fs.writeFileSync('components/DailyResonance.tsx', code, 'utf8');
