const fs = require('fs');

let content = fs.readFileSync('./app/lucky-card-reveal.js', 'utf-8');

// The instructions say:
// "For every pulse/strike, add a short, subtle explosion-like magical impact sound at the exact moment the strike hits the card."
// We added the triangle oscillator which is good, but let's make it a bit punchier.
// Also we need to check if the audio is accurately synchronized. It plays at `strikeTime`.
// We should make the visual strike have a stronger impact flash.

const searchPattern = `      // Add to accumulated energy
      if (timeSinceStrike > 0) {
        totalEnergyAbsorbed += Math.min(timeSinceStrike * 2, 1);
      }`;

const replacement = `      // Add to accumulated energy
      if (timeSinceStrike > 0) {
        totalEnergyAbsorbed += Math.min(timeSinceStrike * 2, 1);

        // Massive flash at the exact moment of impact (fade out over 0.5s)
        if (timeSinceStrike < 0.5) {
          const flashIntensity = 1 - (timeSinceStrike / 0.5);
          const thisFlashMax = isFinal ? 0.9 : 0.4 + (idx * 0.1);
          if (flashIntensity * thisFlashMax > maxFlashOpacity) {
             maxFlashOpacity = flashIntensity * thisFlashMax;
             flashRgb = tier === 'standard' ? '200, 255, 252' : (tier === 'premium' ? '77, 238, 234' : '249, 241, 208');
             flashGlowColor = tier === 'standard' ? '77, 238, 234' : (tier === 'premium' ? '176, 38, 255' : '176, 38, 255');
             isFinalFlash = isFinal;
          }
        }
      }`;

const newContent = content.replace(searchPattern, replacement);

if (newContent === content) {
  console.error('ERROR: Pattern not found in source file. Build script failed.');
  process.exit(1);
}

fs.writeFileSync('./app/lucky-card-reveal.js', newContent);
