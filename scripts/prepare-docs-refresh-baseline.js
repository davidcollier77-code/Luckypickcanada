// Reuses an open documentation-refresh pull request as the refresh baseline.
//
// The scheduled workflow checks out the default branch and publishes refreshed
// snapshots to the auto/docs-refresh branch. When a refresh pull request is
// still open, comparing a new run against the default branch alone makes that
// run rediscover, re-report and re-push the very changes the open pull request
// already contains. Overlaying the pending .docs tree lets the existing content
// comparison report those documents as unchanged.
//
// Group routing stays authoritative on the default branch: a pending branch can
// never reintroduce a document that was deliberately removed from the manifest.

const fs = require('fs');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Returns the pending snapshot state with the default branch's
 * owner-controlled configuration. `groups`, `sources` and `inventory` belong to
 * the default branch and are never taken from a pending branch, so a refresh
 * cannot reintroduce a document, a source URL or an inventory entry that was
 * deliberately changed or removed on the default branch. Updater-managed state
 * already published to the pending branch (`lastUpdated`, `githubShas`) is kept
 * so the refresh continues from it instead of rediscovering applied changes.
 */
function mergePendingBaselineManifest(pendingManifest, defaultBranchManifest) {
  if (!isPlainObject(pendingManifest)) {
    throw new Error('Invalid pending documentation manifest.');
  }
  if (!isPlainObject(defaultBranchManifest) || !isPlainObject(defaultBranchManifest.groups)) {
    throw new Error('Invalid default-branch documentation manifest.');
  }
  for (const section of ['sources', 'githubShas']) {
    if (pendingManifest[section] !== undefined && !isPlainObject(pendingManifest[section])) {
      throw new Error(`Invalid pending documentation manifest: ${section} must be an object.`);
    }
  }
  if (defaultBranchManifest.sources !== undefined && !isPlainObject(defaultBranchManifest.sources)) {
    throw new Error('Invalid default-branch documentation manifest: sources must be an object.');
  }
  if (defaultBranchManifest.inventory !== undefined && !Array.isArray(defaultBranchManifest.inventory)) {
    throw new Error('Invalid default-branch documentation manifest: inventory must be an array.');
  }
  const merged = {
    ...pendingManifest,
    groups: defaultBranchManifest.groups
  };
  if (defaultBranchManifest.sources !== undefined) merged.sources = defaultBranchManifest.sources;
  if (defaultBranchManifest.inventory !== undefined) merged.inventory = defaultBranchManifest.inventory;
  return merged;
}

function parseArgs(argv) {
  const options = { pendingManifest: null, routingManifest: null };
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i];
    if (argument === '--pending-manifest') {
      options.pendingManifest = argv[++i];
    } else if (argument === '--routing-manifest') {
      options.routingManifest = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!options.pendingManifest || !options.routingManifest) {
    throw new Error('--pending-manifest and --routing-manifest are required.');
  }
  return options;
}

function readManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function writeManifestAtomically(manifestPath, manifest) {
  const tempPath = `${manifestPath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2) + '\n');
    fs.renameSync(tempPath, manifestPath);
  } catch (error) {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Best-effort cleanup: a missing or already-removed temp file must never
      // replace the error that explains why the manifest could not be written.
    }
    throw error;
  }
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  try {
    const pending = readManifest(options.pendingManifest);
    const routing = readManifest(options.routingManifest);
    const merged = mergePendingBaselineManifest(pending, routing);
    writeManifestAtomically(options.pendingManifest, merged);
    const routed = new Set(Object.values(merged.groups).flat());
    console.log(
      `Reused the pending refresh snapshots with the default-branch routing (${Object.keys(merged.groups).length} groups, ${routed.size} documents).`
    );
  } catch (error) {
    console.error(`Could not prepare the documentation refresh baseline: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  mergePendingBaselineManifest
};
