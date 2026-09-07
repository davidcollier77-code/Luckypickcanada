const fs = require('fs');

const stagingManifestPath = '.context7-staging/manifest.json';
let stagingManifest = { collected: {} };
if (fs.existsSync(stagingManifestPath)) {
    const data = fs.readFileSync(stagingManifestPath, 'utf-8');
    if (data.trim() !== "") {
        stagingManifest = JSON.parse(data);
    }
}

// Since some libraries throw Access Denied, they can't be fetched via CLI with the current API key / filter settings.
// We record them as failed.
const failedIds = [
    "/goldfire/howler.js",
    "/opennextjs/docs",
    "/neondatabase/neon",
    "/coreyhaines31/marketingskills"
];

for (const id of failedIds) {
    if (!stagingManifest.collected[id]) {
        stagingManifest.collected[id] = {
            status: "FAILED",
            reason: "Access denied: Non-verified libraries are restricted for this teamspace.",
            timestamp: new Date().toISOString()
        }
    }
}

fs.writeFileSync(stagingManifestPath, JSON.stringify(stagingManifest, null, 2));

console.log("Staging manifest updated with failed items.");
