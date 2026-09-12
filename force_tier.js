const fs = require('fs');
let content = fs.readFileSync('./components/LuckyGenerator.tsx', 'utf8');

// Force tier 2 temporarily for testing (if not already forced)
if (!content.includes('function getTier(score: number): Tier { return { id: 2, name: \'METEOR SHOWER RESONANCE\' };')) {
  content = content.replace(
    'function getTier(score: number): Tier {',
    'function getTier(score: number): Tier { return { id: 2, name: \'METEOR SHOWER RESONANCE\' };'
  );
  fs.writeFileSync('./components/LuckyGenerator.tsx', content, 'utf8');
}
