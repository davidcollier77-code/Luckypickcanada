const fs = require('fs');
let content = fs.readFileSync('__tests__/daily-resonance-lifecycle.test.jsx', 'utf8');

content = content.replace(
  /await act\(async \(\) => \{\n      fireEvent.click\(button\);\n      await waitFor\(\(\) => \{\n        expect\(screen.queryByText\("Reveal My Resonance"\)\).not.toBeNull\(\);\n      \}\);\n    \}\);/g,
  `fireEvent.click(button);\n    await waitFor(() => {\n      expect(screen.queryByText("Reveal My Resonance")).not.toBeNull();\n    });`
);

fs.writeFileSync('__tests__/daily-resonance-lifecycle.test.jsx', content);
