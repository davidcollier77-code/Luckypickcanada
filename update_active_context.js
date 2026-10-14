const fs = require('fs');

function updateActiveContext() {
  let content = fs.readFileSync('memory-bank/activeContext.md', 'utf8');

  content = content.replace(
    /- \*\*Implementation Status\*\*: Completed implementation. All spec kit tasks are done. Verification tests \(\`pnpm run build\`\, \`\.\/jules-verify\.sh\`\, and \`playwright test\`\) are green\. The build size remains well below the 495MB limit \(\`\.next\` is 320MB, \`public\` is 22MB\)\./,
    "- **Implementation Status**: Completed AVIF implementation part 2 (Lucky Map, Lucky Meter, Crystal Ball). Verification tests (`pnpm run build`, `./jules-verify.sh`, and `playwright test`) are green. The build size remains well below the 495MB limit (`.next` is 353MB, `public` is 24MB)."
  );

  content = content.replace(
    /- \*\*Next Steps\*\*:\n  - Format the final PR summary per \`AGENTS.md\` and file the Pull Request./,
    "- **Next Steps**: Await further requirements or enhancements."
  );

  fs.writeFileSync('memory-bank/activeContext.md', content);
}

updateActiveContext();
console.log('activeContext.md updated');
