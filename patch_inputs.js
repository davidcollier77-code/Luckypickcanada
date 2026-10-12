const fs = require('fs');
let content = fs.readFileSync('app/lucky-map-of-canada/lucky-map-of-canada.js', 'utf8');

// The label container needs to flex and relative properties if the character counter is to be inside it but to the right? Wait it is currently just beneath it. Let's make the form layout more polished.
// Let's refine the spacing in the modal

content = content.replace(
  /<form action="\/api\/lucky-stories" method="post" style={{ display: 'grid', gap: '1.25rem' }}>/,
  `<form action="/api/lucky-stories" method="post" style={{ display: 'grid', gap: '1rem' }}>`
);

content = content.replace(
  /<label style={{ color: "#f8fafc", fontWeight: 700 }}>Tell us your story.../,
  `<label style={{ color: "#f8fafc", fontWeight: 700 }}>Tell us your story...`
);
fs.writeFileSync('app/lucky-map-of-canada/lucky-map-of-canada.js', content);
