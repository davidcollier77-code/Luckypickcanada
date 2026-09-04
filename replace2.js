const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf-8');

// The main loop is inside handleReveal
// Let's modify the sequence loop logic to include tick audio pulses
const oldLoop = `    const sequenceLoop = (timestamp: number) => {
      // Calculate elapsed time strictly using the audio clock
      const elapsed = (ctx.currentTime - audioStartTime) * 1000;

      // Update displayed number based on phase
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

const newLoop = `
    let nextTickTime = audioStartTime + 0.5; // Start ticking at 0.5s
    let tickInterval = 0.5;

    const sequenceLoop = (timestamp: number) => {
      // Calculate elapsed time strictly using the audio clock
      const currentTime = ctx.currentTime;
      const elapsed = (currentTime - audioStartTime) * 1000;

      // Pulse Sound Generation Logic (Rhythmic Ticks)
      if (currentTime >= nextTickTime && elapsed < IMPACT_TIME) {
         if (elapsed < TENSION_TIME) {
           // Normal build up tick
           const tickNode = playBuffer(ctx, audioBuffers.tensionTick, 1.0, nextTickTime);
           if (tickNode) activeAudioNodesRef.current.push(tickNode);
           nextTickTime += tickInterval;
           tickInterval = Math.max(0.1, tickInterval - 0.02); // Accelerate gradually
         } else {
           // Tension high speed tick
           const tickNode = playBuffer(ctx, audioBuffers.tensionTickHigh, 1.0, nextTickTime);
           if (tickNode) activeAudioNodesRef.current.push(tickNode);
           tickInterval = 0.05; // Very fast
           nextTickTime += tickInterval;
         }

         // Visual pulse - we can trigger a small scale bump here but React state might be too slow.
         // Let's rely on CSS animations or the random number updates for now.
      }

      // Update displayed number based on phase
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

code = code.replace(oldLoop, newLoop);

// Also need to fix the impact sound keys
const impactOld = `const impactNode = playBuffer(ctx, audioBuffers[currentTier], 1.0, impactTimeSec);`;
const impactNew = `
    let tierAudioKey = 'impactMeteor';
    if (currentTier === 'Cosmic Lightning') tierAudioKey = 'impactLightning';
    if (currentTier === 'Fireworks') tierAudioKey = 'impactFireworks';
    const impactNode = playBuffer(ctx, audioBuffers[tierAudioKey], 1.0, impactTimeSec);
    const payoffNode = playBuffer(ctx, audioBuffers.payoff, 1.0, impactTimeSec); // Add payoff chord
    if (payoffNode) activeAudioNodesRef.current.push(payoffNode);
`;
code = code.replace(impactOld, impactNew);

// Also need to fix the initial build up key
const buildOld = `const buildupNode = playBuffer(ctx, audioBuffers.buildup, 1.0, audioStartTime);`;
const buildNew = `const buildupNode = playBuffer(ctx, audioBuffers.buildupHum, 1.0, audioStartTime);`;
code = code.replace(buildOld, buildNew);

fs.writeFileSync('components/DailyResonance.tsx', code);
console.log("Updated handleReveal!");
