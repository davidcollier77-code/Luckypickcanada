const fs = require('fs');
const { execSync } = require('child_process');

const MAX_BYTES = 495 * 1024 * 1024; // 495 MB

const docsManifest = JSON.parse(fs.readFileSync('.docs/manifest.json', 'utf-8'));
const documents = docsManifest.documents;

const stagingManifestPath = '.context7-staging/manifest.json';
const stagingLibraryPath = '.context7-staging/library.jsonl';

let stagingManifest = { collected: {} };
if (fs.existsSync(stagingManifestPath)) {
    try {
        const data = fs.readFileSync(stagingManifestPath, 'utf-8');
        if (data.trim() !== "") {
           stagingManifest = JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading staging manifest, initializing new one.");
    }
}

const getDocsDirSize = () => {
    try {
        const output = execSync('du -sb .docs', { encoding: 'utf-8' });
        return parseInt(output.split('\t')[0]);
    } catch (e) {
        return 0;
    }
}

const getStagingSize = () => {
    try {
        const output = execSync('du -sb .context7-staging', { encoding: 'utf-8' });
        return parseInt(output.split('\t')[0]);
    } catch (e) {
        return 0;
    }
}

let initialDocsSize = getDocsDirSize();
let currentStagingSize = getStagingSize();
let totalSize = initialDocsSize + currentStagingSize;

const specificTargets = [
    "/goldfire/howler.js",
    "/opennextjs/docs",
    "/neondatabase/neon",
    "/coreyhaines31/marketingskills"
];

let toFetchMap = {};
for (const doc of documents) {
    if (doc.state === "INVALID_PLACEHOLDER" || doc.state === "MISSING") {
        if (specificTargets.includes(doc.rawIdentifier)) {
            toFetchMap[doc.rawIdentifier] = doc;
        }
    }
}

let toFetch = Object.values(toFetchMap);

console.log(`Found ${toFetch.length} unique items to retry.`);

let successCount = 0;
let skippedCount = 0;
let failedCount = 0;
let quotaHit = false;
let limitHit = false;

for (const doc of toFetch) {
    const rawId = doc.rawIdentifier;
    let fetchId = doc.authoritativeSource;

    // We already collected them previously, but they were marked as FAILED.
    // If they were SUCCESS we wouldn't retry, but we want to retry anyway since they failed.
    if (stagingManifest.collected[rawId] && stagingManifest.collected[rawId].status === "SUCCESS") {
        console.log(`Already collected: ${rawId}, skipping.`);
        skippedCount++;
        continue;
    }

    console.log(`Fetching: ${fetchId} (for ${rawId})`);

    let result;
    try {
        const cmd = `npx --yes ctx7 docs "${fetchId}" "full documentation"`;
        const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        result = output;
    } catch (error) {
        const errStr = error.stderr || error.stdout || String(error);
        console.error(`Failed to fetch ${fetchId}: \n${errStr.substring(0, 300)}...`);

        if (errStr.includes("quota") || errStr.includes("Quota") || errStr.includes("429")) {
            console.log("Context7 quota encountered. Stopping.");
            quotaHit = true;
            break;
        }

        // Update manifest with failure
        stagingManifest.collected[rawId] = {
            status: "FAILED",
            reason: errStr.substring(0, 200),
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(stagingManifestPath, JSON.stringify(stagingManifest, null, 2));

        failedCount++;
        continue;
    }

    if (!result || result.trim() === "") {
        console.error(`Empty result for ${rawId}`);
        stagingManifest.collected[rawId] = {
            status: "FAILED",
            reason: "Empty result",
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(stagingManifestPath, JSON.stringify(stagingManifest, null, 2));
        failedCount++;
        continue;
    }

    const entryStr = JSON.stringify({
        id: rawId,
        content: result,
        timestamp: new Date().toISOString()
    }) + "\n";

    const candidateSize = Buffer.byteLength(entryStr, 'utf8');

    if (initialDocsSize + currentStagingSize + candidateSize > MAX_BYTES) {
        console.log(`\n495 MB limit would be exceeded. Stopping cleanly.`);
        console.log(`Current Staging Size: ${currentStagingSize} bytes`);
        console.log(`Candidate Size: ${candidateSize} bytes`);
        console.log(`Remaining Capacity: ${MAX_BYTES - initialDocsSize - currentStagingSize} bytes`);
        limitHit = true;
        break;
    }

    fs.appendFileSync(stagingLibraryPath, entryStr);
    currentStagingSize += candidateSize;

    stagingManifest.collected[rawId] = {
        size: candidateSize,
        timestamp: new Date().toISOString(),
        status: "SUCCESS"
    };

    fs.writeFileSync(stagingManifestPath, JSON.stringify(stagingManifest, null, 2));

    successCount++;
}

console.log("\n--- REPORT ---");
console.log(`Total successfully collected this run: ${successCount}`);
console.log(`Already present/skipped: ${skippedCount}`);
console.log(`Pending/failed: ${failedCount}`);
console.log(`Current staging size: ${currentStagingSize} bytes (${(currentStagingSize / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Current .docs size: ${initialDocsSize} bytes (${(initialDocsSize / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Safe threshold: ${MAX_BYTES} bytes (${(MAX_BYTES / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`495 MB guard exercised: ${limitHit}`);
console.log(`Quota hit: ${quotaHit}`);
