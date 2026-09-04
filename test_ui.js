const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf-8');

// The pulse effect was mentioned but in the react state comment I said it's too slow.
// We can attach a CSS class that does a quick scale up/down each time we update the display number.
// Or we can just let the rapid number changing serve as the visual pulse. The user specifically asked for "The pulse strikes should have corresponding visual and audio events... stronger energy pulses".
// To do this, I can add a state variable for `pulse` that toggles or sets a timestamp, and use it to add a class to the number.
// Since the number is updating rapidly, we can instead rely on a CSS animation for the text during the reveal phase.

const oldNumberUI = `           <div className="animate-fade-in flex flex-col items-center justify-center min-h-[16rem]">
              <div className="animate-plasma-glow my-6 flex items-center justify-center min-w-[200px]">
                <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {displayPercentage}%
                </div>
              </div>
           </div>`;

const newNumberUI = `           <div className="animate-fade-in flex flex-col items-center justify-center min-h-[16rem]">
              <div className="animate-plasma-glow my-6 flex items-center justify-center min-w-[200px]">
                <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-flicker">
                  {displayPercentage}%
                </div>
              </div>
           </div>`;

code = code.replace(oldNumberUI, newNumberUI);

fs.writeFileSync('components/DailyResonance.tsx', code);
console.log("Added animate-flicker to the reveal numbers");
