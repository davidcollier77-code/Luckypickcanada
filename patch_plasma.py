import re

with open("components/DailyResonance.tsx", "r") as f:
    content = f.read()

# Replace the first instance (isRevealing state)
target1 = r"""           <div className="animate-fade-in flex flex-col items-center justify-center min-h-\[16rem\]">
              <div className="text-7xl font-bold text-white my-6 drop-shadow-\[0_0_15px_rgba\(255,255,255,0.3\)\]">"""

replacement1 = r"""           <div className="animate-fade-in flex flex-col items-center justify-center min-h-[16rem]">
              <div className="animate-plasma-glow my-6 flex items-center justify-center min-w-[200px]">
                <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">"""

content = content.replace(target1, replacement1)

# Now fix the closing div for the first instance
# It looks like:
#                {displayPercentage}%
#              </div>
#           </div>

# We need to add one more closing div.
target_close1 = r"""                {displayPercentage}%
              </div>
           </div>"""
replacement_close1 = r"""                {displayPercentage}%
              </div>
              </div>
           </div>"""

content = content.replace(target_close1, replacement_close1)


# Replace the second instance (final revealed state)
target2 = r"""          <div className="animate-fade-in flex flex-col items-center min-h-\[16rem\]">
            <h2 className="text-sm tracking-widest text-cyan-400 uppercase mb-2">\{tier\} Resonance</h2>
            <div className="text-7xl font-bold text-white my-6 drop-shadow-\[0_0_15px_rgba\(255,255,255,0.3\)\]">"""

replacement2 = r"""          <div className="animate-fade-in flex flex-col items-center min-h-[16rem]">
            <h2 className="text-sm tracking-widest text-cyan-400 uppercase mb-2">{tier} Resonance</h2>
            <div className="transition-all duration-1000 my-6 flex items-center justify-center min-w-[200px] border-2 border-transparent bg-transparent rounded-2xl p-6">
              <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">"""

content = content.replace(target2, replacement2)

# Fix closing div for the second instance
target_close2 = r"""              {displayPercentage}%
            </div>
            <p className="text-slate-300 italic mb-8 min-h-\[4rem\]">"\{quote\}"</p>"""

replacement_close2 = r"""              {displayPercentage}%
              </div>
            </div>
            <p className="text-slate-300 italic mb-8 min-h-[4rem]">"{quote}"</p>"""

content = content.replace(target_close2, replacement_close2)

with open("components/DailyResonance.tsx", "w") as f:
    f.write(content)
