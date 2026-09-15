const fs = require('fs');

const filePath = 'components/DailyResonance.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldLightningScript = `      else if (activeTier === 'Cosmic Lightning' && canSpawn) {
         if (elapsedMs > 300 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            spawnLightning(w * 0.2, 0, 1.0);
         }
         if (elapsedMs > 1200 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            spawnLightning(w * 0.7, 0, 1.2);
         }
         if (elapsedMs > 2400 && !scriptPhase3Done.current) {
            scriptPhase3Done.current = true;
            spawnLightning(w * 0.4, -50, 0.8);
         }
         if (elapsedMs > 3500 && !scriptPhase4Done.current) {
            scriptPhase4Done.current = true;
            spawnLightning(w * 0.85, 0, 1.5); // Big final strike
         }
      }`;

const newLightningScript = `      else if (activeTier === 'Cosmic Lightning' && canSpawn) {
         if (elapsedMs > 300 && !scriptPhase1Done.current) {
            scriptPhase1Done.current = true;
            // Anticipation - distant or secondary strike
            spawnLightning(w * 0.2, -50, 0.8, false);
         }
         if (elapsedMs > 1200 && !scriptPhase2Done.current) {
            scriptPhase2Done.current = true;
            // First strong strike
            spawnLightning(w * 0.65, -50, 1.2, true);
         }
         if (elapsedMs > 2400 && !scriptPhase3Done.current) {
            scriptPhase3Done.current = true;
            // Secondary flicker
            spawnLightning(w * 0.4, -50, 0.7, false);
         }
         if (elapsedMs > 3500 && !scriptPhase4Done.current) {
            scriptPhase4Done.current = true;
            // Big final cinematic strike
            spawnLightning(w * 0.85, -50, 1.5, true);

            // Add a sympathetic branch that spawns almost instantly after the main strike
            setTimeout(() => {
               if (isAnimatingRef.current) {
                  spawnLightning(w * 0.7, -50, 0.9, false);
               }
            }, 100);
         }
      }`;

content = content.replace(oldLightningScript, newLightningScript);
fs.writeFileSync(filePath, content);
console.log("Updated lightning script phase.");
