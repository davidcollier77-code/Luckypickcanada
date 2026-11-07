// Isolated end-to-end test for scripts/refresh-docs.js.
//
// Copies the real .docs library into a temporary directory, adds a removed
// document and two deliberately broken sources, then runs the complete updater
// against the copy with a mocked HTTPS transport. The real .docs tree is hashed
// before and after to prove it was not modified.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const realDocs = path.join(repoRoot, '.docs');
const scriptPath = path.join(repoRoot, 'scripts', 'refresh-docs.js');
const mockPath = path.join(repoRoot, 'scripts', 'test-support', 'mock-refresh-https.js');

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function primaryPath(docsDir, manifest, library) {
  const filename = library.replace(/[^A-Za-z0-9_-]/g, '_') + '.md';
  for (const group of Object.keys(manifest.groups)) {
    if (!manifest.groups[group].includes(library)) continue;
    return path.join(docsDir, group, filename);
  }
  return null;
}

function findRegularSnapshot(docsDir, manifest, library) {
  const filename = library.replace(/[^A-Za-z0-9_-]/g, '_') + '.md';
  for (const group of Object.keys(manifest.groups)) {
    const candidate = path.join(docsDir, group, filename);
    if (!fs.existsSync(candidate)) continue;
    const stat = fs.lstatSync(candidate);
    if (stat.isFile()) return candidate;
  }
  return null;
}

async function run() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-refresh-e2e-'));
  const docsDir = path.join(tmpRoot, 'docs');
  fs.cpSync(realDocs, docsDir, { recursive: true, verbatimSymlinks: true });

  const realManifestPath = path.join(realDocs, 'manifest.json');
  const realManifestHash = hashFile(realManifestPath);
  const realSampleLib = '/vercel/next.js';
  const realManifest = JSON.parse(fs.readFileSync(realManifestPath, 'utf8'));
  const realSampleSnapshot = primaryPath(realDocs, realManifest, realSampleLib);
  const realSampleHash = hashFile(realSampleSnapshot);

  const manifestPath = path.join(docsDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const originalLastUpdated = manifest.lastUpdated;

  const emptyLib = '/numpy/numpy';
  const garbledLib = '/goldfire/howler.js';
  const htmlErrorLib = '/websites/mdn_web_audio';
  const failingLib = '/debian/debian-reference';
  const retiredLib = '/example/retired-doc';
  const failingNewLib = '/example/failing-new-doc';
  const linkLib = '/google/eng-practices';

  // A deliberately removed document: no group routing, but a stale manifest
  // index entry, upstream SHA and snapshot remain.
  manifest.sources[retiredLib] = { type: 'url', url: 'https://example.com/retired-doc.md' };
  manifest.inventory.push(retiredLib);
  manifest.githubShas[retiredLib] = 'retired-sha';
  const retiredSnapshot = path.join(docsDir, 'audio', '_example_retired-doc.md');
  fs.writeFileSync(retiredSnapshot, '# Retired document\n\nThis document was deliberately removed.\n');

  // A routed document with a broken source URL and no local copy.
  manifest.groups.testing.push(failingNewLib);
  manifest.sources[failingNewLib] = { type: 'url', url: 'https://example.com/failing-new-doc.md' };
  manifest.inventory.push(failingNewLib);

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  // Broken internal symlink for a routed document in a secondary group.
  const brokenLink = path.join(docsDir, 'audio', '_google_eng-practices.md');
  assert.ok(fs.lstatSync(brokenLink).isSymbolicLink(), 'fixture expects an existing documentation symlink');
  fs.unlinkSync(brokenLink);
  fs.symlinkSync('does-not-exist.md', brokenLink);

  // Duplicate regular copy in another group, which should become a symlink.
  const duplicateLink = path.join(docsDir, 'seo', '_google_eng-practices.md');
  assert.ok(fs.lstatSync(duplicateLink).isSymbolicLink(), 'fixture expects an existing documentation symlink');
  fs.unlinkSync(duplicateLink);
  fs.writeFileSync(duplicateLink, fs.readFileSync(primaryPath(docsDir, manifest, linkLib)));

  const routes = {};
  for (const [library, source] of Object.entries(manifest.sources)) {
    const snapshot = findRegularSnapshot(docsDir, manifest, library);
    if (snapshot) {
      routes[source.url] = { status: 200, body: fs.readFileSync(snapshot, 'utf8') };
    }
  }
  routes[manifest.sources[emptyLib].url] = { status: 200, body: '' };
  routes[manifest.sources[garbledLib].url] = {
    status: 200,
    body: 'zxqvbnmkjhgfdsapoiuytrewq'.repeat(20) + '\u0000'
  };
  routes[manifest.sources[htmlErrorLib].url] = {
    status: 200,
    body: '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body>The page you requested could not be found.</body></html>'
  };
  routes[manifest.sources[failingLib].url] = { status: 404, statusMessage: 'Not Found' };
  routes[manifest.sources[retiredLib].url] = { status: 200, body: '# Should never be fetched\n' };
  routes[manifest.sources[failingNewLib].url] = { status: 500, statusMessage: 'Internal Server Error' };

  const configPath = path.join(tmpRoot, 'mock-config.json');
  const requestsPath = path.join(tmpRoot, 'requests.log');
  const reportPath = path.join(tmpRoot, 'report.md');
  fs.writeFileSync(configPath, JSON.stringify(routes, null, 2) + '\n');
  fs.writeFileSync(requestsPath, '');

  const preservedBefore = {};
  for (const library of [emptyLib, garbledLib, htmlErrorLib, failingLib]) {
    const filePath = primaryPath(docsDir, manifest, library);
    preservedBefore[library] = fs.readFileSync(filePath);
  }

  const result = spawnSync(process.execPath, [scriptPath, '--docs-dir', docsDir, '--report', reportPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_OPTIONS: `--require=${mockPath}`,
      DOCS_REFRESH_MOCK_CONFIG: configPath,
      DOCS_REFRESH_MOCK_REQUESTS: requestsPath,
      DOCS_REFRESH_RETRY_DELAY_MS: '0'
    },
    encoding: 'utf8',
    timeout: 180000
  });

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  assert.strictEqual(result.status, 1, `updater should report failures (exit 1)\n${output}`);

  const requests = fs.readFileSync(requestsPath, 'utf8').trim().split('\n').filter(Boolean);
  const report = fs.readFileSync(reportPath, 'utf8');
  if (process.env.DEBUG_REFRESH_E2E) {
    console.error('--- updater output ---\n' + output);
    console.error('--- report ---\n' + report);
  }
  const updatedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const routed = new Set(Object.values(updatedManifest.groups).flat());

  // The real library is untouched.
  assert.strictEqual(hashFile(realManifestPath), realManifestHash, 'real manifest must not change');
  assert.strictEqual(hashFile(realSampleSnapshot), realSampleHash, 'real snapshot must not change');

  // Deliberate removals are permanent: never downloaded, indexed or on disk.
  assert.ok(!requests.includes(manifest.sources[retiredLib].url), 'removed document source must not be fetched');
  assert.ok(!fs.existsSync(retiredSnapshot), 'removed document snapshot must be deleted');
  assert.ok(!(retiredLib in updatedManifest.sources), 'removed document source must be pruned');
  assert.ok(!updatedManifest.inventory.includes(retiredLib), 'removed document inventory entry must be pruned');
  assert.ok(!(retiredLib in updatedManifest.githubShas), 'removed document SHA pin must be pruned');
  assert.ok(!routed.has(retiredLib), 'removed document must not be routed');

  // Broken source URL with no existing copy: nothing written, URL and error reported.
  assert.ok(!fs.existsSync(primaryPath(docsDir, manifest, failingNewLib)), 'failed new document must not be written');
  assert.ok(report.includes(manifest.sources[failingNewLib].url), 'report must include the broken URL');
  assert.ok(report.includes('HTTP 500'), 'report must include the download error');
  assert.strictEqual(
    requests.filter((url) => url === manifest.sources[failingNewLib].url).length,
    2,
    'the existing first-attempt plus retry behaviour must be preserved'
  );

  // Existing good documents are preserved when a download is invalid.
  for (const library of [emptyLib, garbledLib, htmlErrorLib, failingLib]) {
    const filePath = primaryPath(docsDir, manifest, library);
    assert.ok(
      fs.readFileSync(filePath).equals(preservedBefore[library]),
      `existing document must be preserved: ${library}`
    );
  }
  assert.strictEqual(
    requests.filter((url) => url === manifest.sources[failingLib].url).length,
    2,
    'download failures are retried once'
  );

  // The report explains each rejection and failure.
  for (const library of [emptyLib, garbledLib, htmlErrorLib, failingLib]) {
    assert.ok(report.includes(manifest.sources[library].url), `report must include ${library} URL`);
  }
  assert.ok(report.includes('download is empty'), 'report must include the empty-download reason');
  assert.ok(report.includes('binary data'), 'report must include the binary-download reason');
  assert.ok(report.includes('HTTP error page'), 'report must include the error-page reason');
  assert.ok(report.includes('existing document preserved'), 'report must state that existing copies were preserved');
  assert.ok(report.includes('Source URLs were not changed automatically'), 'report must not imply automatic URL replacement');

  // Broken and duplicate internal links are repaired.
  const repairedAudioLink = path.join(docsDir, 'audio', '_google_eng-practices.md');
  const repairedSeoLink = path.join(docsDir, 'seo', '_google_eng-practices.md');
  const expectedTarget = fs.realpathSync(primaryPath(docsDir, manifest, linkLib));
  assert.ok(fs.lstatSync(repairedAudioLink).isSymbolicLink(), 'broken link should be replaced with a symlink');
  assert.strictEqual(fs.realpathSync(repairedAudioLink), expectedTarget, 'broken link should resolve to the primary copy');
  assert.ok(fs.lstatSync(repairedSeoLink).isSymbolicLink(), 'duplicate copy should become a symlink');
  assert.strictEqual(fs.realpathSync(repairedSeoLink), expectedTarget, 'duplicate link should resolve to the primary copy');
  assert.ok(report.includes('repaired broken documentation symlink'), 'report must record the link repair');
  assert.ok(report.includes('replaced duplicate documentation copy with a symlink'), 'report must record the duplicate collapse');

  // Manifest and snapshot structure stay consistent.
  assert.deepStrictEqual(
    [...new Set(updatedManifest.inventory)].sort(),
    [...routed].sort(),
    'inventory must match the routed library set'
  );
  assert.deepStrictEqual(
    Object.keys(updatedManifest.sources).sort(),
    [...routed].sort(),
    'every routed library must keep exactly one source entry'
  );
  assert.ok(
    Object.keys(updatedManifest.githubShas).every((library) => routed.has(library)),
    'SHA pins must only reference routed libraries'
  );
  for (const [group, libraries] of Object.entries(updatedManifest.groups)) {
    for (const library of libraries) {
      if (library === failingNewLib) continue; // intentionally has no snapshot after its failed download
      const docPath = path.join(docsDir, group, library.replace(/[^A-Za-z0-9_-]/g, '_') + '.md');
      assert.ok(fs.existsSync(docPath), `routed snapshot must exist: ${group}/${library}`);
      assert.ok(fs.realpathSync(docPath).startsWith(docsDir + path.sep), `snapshot must stay inside .docs: ${group}/${library}`);
    }
  }
  assert.ok(
    report.includes('missing snapshot at .docs/testing/_example_failing-new-doc.md'),
    'report must list the missing snapshot for the document that failed to download'
  );
  assert.strictEqual(updatedManifest.lastUpdated, originalLastUpdated, 'a reconciliation-only run must not change lastUpdated');

  fs.rmSync(tmpRoot, { recursive: true, force: true });
  return output;
}

run().then(() => {
  console.log('✅ Isolated end-to-end documentation updater workflow passed');
}).catch((error) => {
  console.error('❌ Isolated end-to-end documentation updater workflow failed');
  console.error(error);
  process.exitCode = 1;
});
