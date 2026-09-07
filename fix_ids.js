const fs = require('fs');

const docsManifest = JSON.parse(fs.readFileSync('.docs/manifest.json', 'utf-8'));
const documents = docsManifest.documents;

let mappings = {
    "jules.google/docs": "/websites/jules_google",
    "developers.google.com/jules/api": "/websites/developers_google_jules_api",
    "/goldfire/howler.js": "/websites/howler_js", // just guessing for now, we should probably resolve it
    "/opennextjs/docs": "/opennextjs/docs",
    "/neondatabase/neon": "/neondatabase/neon",
    "/stripe/stripe-js": "/stripe/stripe-js",
    "/coreyhaines31/marketingskills": "/coreyhaines31/marketingskills"
};

// We saw the authoritative source for these in the manifest:
const authoritativeSources = {};
for (const doc of documents) {
    authoritativeSources[doc.rawIdentifier] = doc.authoritativeSource;
}
console.log(authoritativeSources["jules.google/docs"]);
console.log(authoritativeSources["developers.google.com/jules/api"]);
console.log(authoritativeSources["/goldfire/howler.js"]);
console.log(authoritativeSources["/opennextjs/docs"]);
console.log(authoritativeSources["/neondatabase/neon"]);
console.log(authoritativeSources["/stripe/stripe-js"]);
console.log(authoritativeSources["/coreyhaines31/marketingskills"]);
