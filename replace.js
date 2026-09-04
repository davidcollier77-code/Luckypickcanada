const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf-8');

// Replace standard imports
code = code.replace(
  `import ResonanceButton from './ResonanceButton';`,
  `import ResonanceButton from './ResonanceButton';\nimport { ZZFX, zzfx } from 'zzfx';`
);

// We need to build the sound sequences using ZZFX.
// In the setup section, we can replace the audioBuffers logic.
const zzfxSetupCode = `
// Premium ZZFX Sound Configurations
const SOUNDS = {
  buildupHum: [0.6, 0, 65, 2.0, 4.0, 3.0, 2, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Deep rising hum
  tensionTick: [0.2, 0.05, 800, 0.01, 0.02, 0.05, 1, 1.5, -20, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Sharp electronic tick
  tensionTickHigh: [0.25, 0.05, 1200, 0.01, 0.02, 0.05, 1, 1.5, -20, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Faster tick

  impactMeteor: [1.8, 0.2, 150, 0.05, 0.1, 2.5, 4, 1.5, -20, 0, 0, 0, 0, 1.5, 0, 0, 0.1, 1, 0.2, 0, 0], // Heavy whoosh/thud
  impactLightning: [1.5, 0.1, 800, 0.01, 0.1, 2.0, 3, 2, -100, 0, 500, 0.02, 0, 2, 0, 0, 0.05, 1, 0.1, 0.2, 0], // Sharp zap
  impactFireworks: [1.5, 0.2, 400, 0.01, 0.05, 1.5, 4, 1, -50, 0, 0, 0, 0.05, 1, 0, 0, 0, 1, 0.1, 0, 0], // Crackle pop

  fireworksCrackle: [0.5, 0.5, 800, 0.1, 0.5, 1.5, 4, 1, 0, 0, 0, 0, 0.02, 1, 0, 0, 0, 1, 0.2, 0, 0], // Secondary pop

  sparkle: [0.15, 0.05, 1500, 0.05, 0.1, 1.0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 1, 0.1, 0, 0], // Magic chime
  payoff: [0.6, 0.05, 880, 0.1, 0.5, 4.0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 1, 0.2, 0.1, 0] // Majestic chord
};

// We will pre-generate buffers to ensure perfect synchronization
const audioBuffers: Record<string, AudioBuffer | null> = {
  buildupHum: null,
  tensionTick: null,
  tensionTickHigh: null,
  impactMeteor: null,
  impactLightning: null,
  impactFireworks: null,
  fireworksCrackle: null,
  sparkle: null,
  payoff: null
};

// Generate buffers securely
const preloadAllAudio = async (ctx: AudioContext) => {
  // We use ZZFX's buildSamples but need to convert it to an AudioBuffer for exact scheduling
  const buildToBuffer = (params: number[]) => {
     const samples = ZZFX.buildSamples(...params);
     const buffer = ctx.createBuffer(1, samples.length, ZZFX.sampleRate);
     buffer.getChannelData(0).set(samples);
     return buffer;
  };

  if (!audioBuffers.buildupHum) audioBuffers.buildupHum = buildToBuffer(SOUNDS.buildupHum);
  if (!audioBuffers.tensionTick) audioBuffers.tensionTick = buildToBuffer(SOUNDS.tensionTick);
  if (!audioBuffers.tensionTickHigh) audioBuffers.tensionTickHigh = buildToBuffer(SOUNDS.tensionTickHigh);
  if (!audioBuffers.impactMeteor) audioBuffers.impactMeteor = buildToBuffer(SOUNDS.impactMeteor);
  if (!audioBuffers.impactLightning) audioBuffers.impactLightning = buildToBuffer(SOUNDS.impactLightning);
  if (!audioBuffers.impactFireworks) audioBuffers.impactFireworks = buildToBuffer(SOUNDS.impactFireworks);
  if (!audioBuffers.fireworksCrackle) audioBuffers.fireworksCrackle = buildToBuffer(SOUNDS.fireworksCrackle);
  if (!audioBuffers.sparkle) audioBuffers.sparkle = buildToBuffer(SOUNDS.sparkle);
  if (!audioBuffers.payoff) audioBuffers.payoff = buildToBuffer(SOUNDS.payoff);
};
`;

code = code.replace(
  /\/\/ Audio Buffers Cache[\s\S]*?const playBuffer =/m,
  zzfxSetupCode + '\nconst playBuffer ='
);

fs.writeFileSync('components/DailyResonance.tsx', code);
console.log("Replaced audio buffer setup!");
