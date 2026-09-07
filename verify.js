const fs = require('fs');
const { execSync } = require('child_process');

const docsManifest = JSON.parse(fs.readFileSync('.docs/manifest.json', 'utf-8'));
const documents = docsManifest.documents;
const stagingManifestPath = '.context7-staging/manifest.json';
const stagingManifest = JSON.parse(fs.readFileSync(stagingManifestPath, 'utf-8'));

let toFetch = [];
for (const doc of documents) {
    if (doc.state === "INVALID_PLACEHOLDER" || doc.state === "MISSING") {
        if (!toFetch.includes(doc.rawIdentifier)) {
            toFetch.push(doc.rawIdentifier);
        }
    }
}

let successCount = 0;
let failedCount = 0;

for (const id of toFetch) {
    if (stagingManifest.collected[id]) {
        if (stagingManifest.collected[id].status === "SUCCESS") {
            successCount++;
        } else {
            failedCount++;
        }
    } else {
        console.error("Missing from staging manifest:", id);
    }
}

console.log(`Success: ${successCount}`);
console.log(`Failed: ${failedCount}`);

const MAX_BYTES = 495 * 1024 * 1024;
const docsSize = parseInt(execSync('du -sb .docs', { encoding: 'utf-8' }).split('\t')[0]);
const stagingSize = parseInt(execSync('du -sb .context7-staging', { encoding: 'utf-8' }).split('\t')[0]);

console.log(`Docs size: ${docsSize}`);
console.log(`Staging size: ${stagingSize}`);
console.log(`Total size: ${docsSize + stagingSize}`);
console.log(`Limit: ${MAX_BYTES}`);
