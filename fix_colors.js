const fs = require('fs');

let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const oldTierColors = `    const tierColors = {
      standard: ['167, 243, 208', '52, 211, 153', '16, 185, 129'], // Emerald
      premium: ['191, 219, 254', '96, 165, 250', '59, 130, 246', '37, 99, 235', '29, 78, 216'], // Blue
      flagship: ['253, 230, 138', '252, 211, 77', '251, 191, 36', '245, 158, 11', '217, 119, 6', '180, 83, 9', '255, 255, 255'] // Gold to White
    };`;

const newTierColors = `    const tierColors = {
      standard: ['14, 165, 233', '217, 70, 239', '180, 83, 9'], // Blue -> Magenta -> Bronze
      premium: ['14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '156, 163, 175'], // Alternating -> Platinum
      flagship: ['14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '234, 179, 8'] // Alternating -> Gold
    };`;

content = content.replace(oldTierColors, newTierColors);
fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');
