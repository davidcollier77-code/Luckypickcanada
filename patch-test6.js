const fs = require('fs');
let content = fs.readFileSync('__tests__/gemini-reviewer-context.test.ts', 'utf-8');

// The test expects '### Overall Gemini review status\n🔴 …' to contain '### Fix all findings'
// But we changed "### Fix all findings" to "### Automated Fixes"
content = content.replace(
  'expect(formatted).toContain("### Fix all findings");',
  'expect(formatted).toContain("### Automated Fixes");'
);

fs.writeFileSync('__tests__/gemini-reviewer-context.test.ts', content);
console.log('Test context patched.');
