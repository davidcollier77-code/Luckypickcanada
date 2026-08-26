import re

with open("components/DailyResonance.tsx", "r") as f:
    content = f.read()

# Clean up the previous botched attempt by grabbing exactly what is there and replacing it properly
target = r"""        \) : isRevealing \? \(
           <div className="animate-fade-in flex flex-col items-center justify-center min-h-\[16rem\]">
              <div className="text-7xl font-bold text-white my-6 drop-shadow-\[0_0_15px_rgba\(255,255,255,0.3\)\]">
                \{displayPercentage\}%
              </div>
              </div>
           </div>
        \) : \(
          <div className="animate-fade-in flex flex-col items-center min-h-\[16rem\]">
            <h2 className="text-sm tracking-widest text-cyan-400 uppercase mb-2">\{tier\} Resonance</h2>
            <div className="text-7xl font-bold text-white my-6 drop-shadow-\[0_0_15px_rgba\(255,255,255,0.3\)\]">
              \{displayPercentage\}%
            </div>
            <p className="text-slate-300 italic mb-8 min-h-\[4rem\]">"\{quote\}"</p>"""


replacement = r"""        ) : isRevealing ? (
           <div className="animate-fade-in flex flex-col items-center justify-center min-h-[16rem]">
              <div className="animate-plasma-glow my-6 flex items-center justify-center min-w-[200px]">
                <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {displayPercentage}%
                </div>
              </div>
           </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center min-h-[16rem]">
            <h2 className="text-sm tracking-widest text-cyan-400 uppercase mb-2">{tier} Resonance</h2>
            <div className="transition-all duration-1000 my-6 flex items-center justify-center min-w-[200px] border-2 border-transparent bg-transparent rounded-2xl p-6">
              <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {displayPercentage}%
              </div>
            </div>
            <p className="text-slate-300 italic mb-8 min-h-[4rem]">"{quote}"</p>"""

content = re.sub(target, replacement, content)

with open("components/DailyResonance.tsx", "w") as f:
    f.write(content)
