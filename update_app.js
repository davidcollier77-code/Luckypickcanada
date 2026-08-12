const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

content = content.replace(
  /className="mb-6 flex flex-col items-center"/g,
  'className="mb-6 flex flex-col items-center w-full relative z-10 pointer-events-auto"'
);

content = content.replace(
  /\{timeLeft && \(\n\s*<div className="text-center font-bold text-gray-700 mb-4 text-lg">\n\s*Next card available in: \{timeLeft\}\n\s*<\/div>\n\s*\)\}/,
  `{isReady && timeLeft && (
          <div className="text-center font-bold text-[rgba(255,245,218,0.76)] mb-4 text-sm tracking-wide">
            Resets in: {timeLeft}
          </div>
        )}`
);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
