const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf-8');

// The canvas animation uses hardcoded audio names, we need to fix them.
code = code.replace(
    /audioBuffers\['Meteor Shower'\]/g,
    `audioBuffers.impactMeteor` // Wait, in the canvas it plays audio on spawn
);
code = code.replace(
    /audioBuffers\['Cosmic Lightning'\]/g,
    `audioBuffers.impactLightning`
);
code = code.replace(
    /audioBuffers\['Fireworks'\]/g,
    `audioBuffers.fireworksCrackle` // Use crackle for the multiple explosions
);

// We should also add sparkles
const sparkleOld = `const node = playBuffer(activeAudioCtx, audioBuffers.fireworksCrackle, 0.2, activeAudioCtx.currentTime);`;
const sparkleNew = `
            const node = playBuffer(activeAudioCtx, audioBuffers.fireworksCrackle, 0.2, activeAudioCtx.currentTime);
            const sparkleNode = playBuffer(activeAudioCtx, audioBuffers.sparkle, 0.4, activeAudioCtx.currentTime + 0.1);
            if (sparkleNode) activeAudioNodesRef.current.push(sparkleNode);
`;
code = code.replace(sparkleOld, sparkleNew);

fs.writeFileSync('components/DailyResonance.tsx', code);
console.log("Updated animateCanvas audio keys!");
