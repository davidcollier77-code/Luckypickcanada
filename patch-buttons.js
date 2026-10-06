const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf8');

if (!css.includes('.suggestion-btn-glow')) {
  const glowCss = `
@keyframes suggestionBtnGlow {
  0%, 100% {
    box-shadow: 0 4px 10px rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.5), 0 0 15px rgba(234, 190, 82, 0.4);
  }
  50% {
    box-shadow: 0 4px 10px rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.5), 0 0 25px rgba(234, 190, 82, 0.8);
  }
}

.suggestion-btn-glow {
  animation: suggestionBtnGlow 3s ease-in-out infinite;
}
`;
  css += glowCss;
  fs.writeFileSync('app/globals.css', css);
}

let code = fs.readFileSync('app/homepage/HomePage.js', 'utf8');

const oldBtn1 = 'className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"';
const oldBtn2 = 'className="cta-secondary relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"';
const oldBtnTipJar = 'className="animate-donate-pulse cta-secondary relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"';

const newBtnNormal = 'className="relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"';
const newBtnTipJar = 'className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"';

const oldShimmerSpan = '<span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span>';

const shimmerRegex = /<span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white\/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"><\/span>/g;

// First replace all instances of old button classes
code = code.replace(new RegExp(oldBtn1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBtnNormal);
code = code.replace(new RegExp(oldBtn2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBtnNormal);
code = code.replace(new RegExp(oldBtnTipJar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBtnTipJar);

// Remove shimmer from all buttons first
code = code.replace(shimmerRegex, '');

// Re-add shimmer only to tip jar
const tipJarSearch = `<button type="button" ${newBtnTipJar} onClick={(e) => { playButtonClick(); openTipJar(e); }}>Open the tip jar</button>`;
const tipJarReplace = `<button type="button" ${newBtnTipJar} onClick={(e) => { playButtonClick(); openTipJar(e); }}>Open the tip jar${oldShimmerSpan}</button>`;
code = code.replace(tipJarSearch, tipJarReplace);

// Update Suggestion Box button
const suggestionSearch = '<button id="suggestion-box-submit" type="submit" onClick={playButtonClick} className="cta-glow transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">';
const suggestionReplace = '<button id="suggestion-box-submit" type="submit" onClick={playButtonClick} className="suggestion-btn-glow relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">';
code = code.replace(suggestionSearch, suggestionReplace);

fs.writeFileSync('app/homepage/HomePage.js', code);
