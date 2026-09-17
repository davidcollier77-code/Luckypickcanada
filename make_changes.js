const fs = require('fs');

// 1. DailyResonance.tsx
let contentDaily = fs.readFileSync('components/DailyResonance.tsx', 'utf8');
contentDaily = contentDaily.replace(
  `      impactMeteor: new Howl({ src: ['/sounds/mixkit-meteor.mp3'], volume: 1.0 }),`,
  `      impactMeteor: new Howl({ src: ['/dragon-studio-whoosh-cinematic-376875.mp3'], volume: 1.0 }),`
);
fs.writeFileSync('components/DailyResonance.tsx', contentDaily);

// 2. LuckyGenerator.tsx
let contentGen = fs.readFileSync('components/LuckyGenerator.tsx', 'utf8');
contentGen = contentGen.replace(
  `const METEOR_SOUNDS = ['/sounds/mixkit-cinematic-whoosh.mp3'];`,
  `const METEOR_SOUNDS = ['/dragon-studio-whoosh-cinematic-376875.mp3'];`
);

const spawnMeteorStart = "function spawnMeteor(isHero: boolean, xOverride?: number, speedOverride?: number, lenOverride?: number, widthOverride?: number, yOverride?: number) {";
const spawnMeteorReplace = spawnMeteorStart + `
      if (s.impactTriggered) {
        playAudioBuffer('meteor', isHero ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.2, isHero ? 0.8 + Math.random() * 0.4 : 1.2 + Math.random() * 0.6);
      }
`;
contentGen = contentGen.replace(spawnMeteorStart, spawnMeteorReplace);

contentGen = contentGen.replace(
  `              playAudioBuffer('meteor');
              // First Pass`,
  `              // First Pass`
);
contentGen = contentGen.replace(
  `              s.scheduledEvents.push({ time: tReveal + 300, action: () => {
                playAudioBuffer('meteor', 0.8, 1.2);
                spawnMeteor(true, width * 0.6, 2500, 250, 6, -100);`,
  `              s.scheduledEvents.push({ time: tReveal + 300, action: () => {
                spawnMeteor(true, width * 0.6, 2500, 250, 6, -100);`
);
contentGen = contentGen.replace(
  `              s.scheduledEvents.push({ time: tReveal + 700, action: () => {
                playAudioBuffer('meteor', 1.0, 0.9);
                spawnMeteor(true, width * 0.4, 3000, 400, 12, -300);`,
  `              s.scheduledEvents.push({ time: tReveal + 700, action: () => {
                spawnMeteor(true, width * 0.4, 3000, 400, 12, -300);`
);

contentGen = contentGen.replace(
  `if (tier.id === 2 && Math.random() > 0.3) { spawnMeteor(false); if(Math.random() > 0.5) spawnMeteor(false); }`,
  `if (tier.id === 2 && Math.random() > 0.3) { spawnMeteor(false); if(Math.random() > 0.5) { spawnMeteor(false); } }`
);


const spawnBoltStart = "function spawnBolt(isHero: boolean) {";
const spawnBoltReplace = spawnBoltStart + `
      if (s.impactTriggered) {
        playAudioBuffer('lightning', isHero ? 0.8 + Math.random() * 0.2 : 0.4 + Math.random() * 0.3, isHero ? 0.9 + Math.random() * 0.2 : 1.2 + Math.random() * 0.4);
      }
`;
contentGen = contentGen.replace(spawnBoltStart, spawnBoltReplace);

contentGen = contentGen.replace(
  `            else if (tier.id === 3) {
              playAudioBuffer('lightning');
              // Initial Strike`,
  `            else if (tier.id === 3) {
              // Initial Strike`
);
contentGen = contentGen.replace(
  `              s.scheduledEvents.push({ time: tReveal + 200, action: () => {
                 playAudioBuffer('lightning', 0.6, 1.3);
                 spawnBolt(true);`,
  `              s.scheduledEvents.push({ time: tReveal + 200, action: () => {
                 spawnBolt(true);`
);
contentGen = contentGen.replace(
  `              s.scheduledEvents.push({ time: tReveal + 600, action: () => {
                 playAudioBuffer('lightning', 1.0, 0.8);
                 spawnBolt(true);`,
  `              s.scheduledEvents.push({ time: tReveal + 600, action: () => {
                 spawnBolt(true);`
);

const spawnRocketStart = "function spawnRocket(isHero: boolean, targetXOverride?: number, targetYOverride?: number) {";
const spawnRocketReplace = spawnRocketStart + `
      if (s.impactTriggered) {
        playAudioBuffer('fireworkLaunch', isHero ? 0.6 : 0.3 + Math.random() * 0.2, isHero ? 1.0 : 1.2 + Math.random() * 0.4);
      }
`;
contentGen = contentGen.replace(spawnRocketStart, spawnRocketReplace);

contentGen = contentGen.replace(
  `            else if (tier.id === 4) {
              playAudioBuffer('fireworkFinale', 0.8, 1.0);
              setTimeout(() => { playAudioBuffer('crackle', 0.6, 1.0) }, 200);
              // Initial Hero Launch`,
  `            else if (tier.id === 4) {
              // Initial Hero Launch`
);

contentGen = contentGen.replace(
  `        playAudioBuffer('firework', isHero ? 0.8 : 0.4 + Math.random() * 0.3, 0.8 + Math.random() * 0.4);`,
  `        playAudioBuffer(isHero && Math.random() > 0.5 ? 'fireworkFinale' : 'firework', isHero ? 0.8 : 0.4 + Math.random() * 0.3, 0.8 + Math.random() * 0.4);
        if (isHero && Math.random() > 0.3) {
           setTimeout(() => { playAudioBuffer('crackle', 0.4 + Math.random() * 0.3, 0.9 + Math.random() * 0.2); }, 100 + Math.random() * 200);
        }`
);

contentGen = contentGen.replace(
  `const FIREWORKS_SOUNDS = ['/freesound_community-fireworks-1-94483.mp3'];`,
  `const FIREWORKS_SOUNDS = ['/freesound_community-fireworks-1-94483.mp3'];\nconst FIREWORK_LAUNCH_SOUND = '/sounds/mixkit-firework-whistle.mp3';`
);

contentGen = contentGen.replace(
  `      loadAudio(FIREWORKS_SOUNDS[0], 'firework'),`,
  `      loadAudio(FIREWORKS_SOUNDS[0], 'firework'),\n      loadAudio(FIREWORK_LAUNCH_SOUND, 'fireworkLaunch'),`
);

fs.writeFileSync('components/LuckyGenerator.tsx', contentGen);
