const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf-8');

// The issue is ZZFX initializes AudioContext globally in ZzFX.js. Next.js SSR runs into "AudioContext is not defined" because there's no window/AudioContext on the server.
// Let's dynamically import ZZFX only on the client side, or mock it on the server.
// Actually, since zzfx is in node_modules and does `audioContext: new AudioContext` at the top level, importing it directly crashes SSR.

// To fix this, we can remove the static import and use a dynamic import in useEffect, OR require it inside a client-side function.
// Let's replace the import with a dynamic import inside initAudio or preloadAllAudio.
code = code.replace(`import { ZZFX, zzfx } from 'zzfx';`, '');

// Add a ref to store ZZFX locally once imported
const zzfxRefCode = `
  const zzfxRef = useRef<any>(null);
  const getZZFX = async () => {
    if (zzfxRef.current) return zzfxRef.current;
    if (typeof window !== 'undefined') {
       // Only import on client to avoid SSR crash
       const mod = await import('zzfx');
       zzfxRef.current = mod.ZZFX;
       return mod.ZZFX;
    }
    return null;
  };
`;

code = code.replace(`export default function DailyResonance() {`, `export default function DailyResonance() {\n` + zzfxRefCode);

// Fix preloadAllAudio to use dynamic ZZFX
const preloadOld = `const preloadAllAudio = async (ctx: AudioContext) => {
  // We use ZZFX's buildSamples but need to convert it to an AudioBuffer for exact scheduling
  const buildToBuffer = (params: number[]) => {
     const samples = ZZFX.buildSamples(...params);
     const buffer = ctx.createBuffer(1, samples.length, ZZFX.sampleRate);
     buffer.getChannelData(0).set(samples);
     return buffer;
  };`;

const preloadNew = `const preloadAllAudio = async (ctx: AudioContext, ZZFX: any) => {
  // We use ZZFX's buildSamples but need to convert it to an AudioBuffer for exact scheduling
  const buildToBuffer = (params: number[]) => {
     const samples = ZZFX.buildSamples(...params);
     const buffer = ctx.createBuffer(1, samples.length, ZZFX.sampleRate);
     buffer.getChannelData(0).set(samples);
     return buffer;
  };`;

code = code.replace(preloadOld, preloadNew);

const handleRevealOld = `    try {
      await preloadAllAudio(ctx);
    } finally {`;
const handleRevealNew = `    try {
      const ZZFX = await getZZFX();
      if (!ZZFX) throw new Error("ZZFX failed to load");
      await preloadAllAudio(ctx, ZZFX);
    } finally {`;

code = code.replace(handleRevealOld, handleRevealNew);

fs.writeFileSync('components/DailyResonance.tsx', code);
console.log("Fixed SSR issue with ZZFX import.");
