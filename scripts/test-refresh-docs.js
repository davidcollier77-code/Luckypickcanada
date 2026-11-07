// Test suite for refresh-docs.js logic

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// Test the network-facing helpers by mocking https before loading the updater.
const https = require('https');
const EventEmitter = require('events');

console.log('Running test suite for refresh-docs.js...');

let mockResponses = {};
let requestedUrls = [];
let requestedOptions = [];

https.get = function (urlOrOptions, optionsOrCallback, callback) {
  let url = typeof urlOrOptions === 'string' ? urlOrOptions : null;
  let options = typeof optionsOrCallback === 'object' ? optionsOrCallback : (typeof urlOrOptions === 'object' ? urlOrOptions : {});
  let cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;

  if (!url && options.hostname && options.path) {
    url = `https://${options.hostname}${options.path}`;
  }

  requestedUrls.push(url);
  requestedOptions.push(options);

  const res = new EventEmitter();
  res.resume = () => {};
  res.destroy = function (err) { if (err) req.emit('error', err); };
  const req = new EventEmitter();

  /* DevSkim: ignore DS172411 */ setTimeout(() => {
    const mockRes = mockResponses[url];
    if (!mockRes) {
      res.statusCode = 404;
      cb(res);
      res.emit('end');
      return req;
    }

    res.statusCode = mockRes.statusCode || 200;
    res.headers = mockRes.headers || {};

    if (mockRes.timeout) {
      /* DevSkim: ignore DS172411 */ setTimeout(() => req.emit('timeout'), 5);
      return;
    }

    if (cb) cb(res);

    if (mockRes.tooLarge) {
      res.emit('data', Buffer.alloc(11 * 1024 * 1024).toString());
      return;
    }

    if (mockRes.data) {
      res.emit('data', mockRes.data);
    }
    res.emit('end');
  }, 10);

  const originalOn = req.on.bind(req);
  req.on = (event, handler) => {
    originalOn(event, handler);
    if (event === 'error' && mockResponses[url] && mockResponses[url].error) {
      /* DevSkim: ignore DS172411 */ setTimeout(() => handler(new Error(mockResponses[url].error)), 10);
    }
    return req;
  };
  req.destroy = function (err) { if (err) this.emit('error', err); };
  return req;
};

const refreshDocs = require('./refresh-docs.js');
const {
  validateDocumentContent,
  collectRoutedLibraries,
  reconcileManifestIndexes,
  removeStaleSnapshots,
  repairDocumentationLinks,
  auditLibraryConsistency,
  renderRefreshReport,
  createRefreshReport,
  getLibraryFilename,
  configureDocsDirectory,
  fetchDocumentation,
  getUpstreamSha
} = refreshDocs;

const repoRoot = path.join(__dirname, '..');
const realDocsDir = path.join(repoRoot, '.docs');
const tempRoots = [];

function makeTempDocsRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-refresh-unit-'));
  tempRoots.push(root);
  return root;
}

function restoreDocsDirectory() {
  configureDocsDirectory(realDocsDir);
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    requestedUrls = [];
    requestedOptions = [];
    mockResponses = {};
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ ${name}`);
      console.error(e);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // Document integrity validation
  // ---------------------------------------------------------------------------

  await test('validateDocumentContent accepts Markdown, plain text and HTML documentation', () => {
    assert.ok(validateDocumentContent('# Title\n\nA readable documentation paragraph with details.\n').ok);
    assert.ok(validateDocumentContent('Plain text documentation\n\nSecond paragraph with words.\n').ok);
    assert.ok(validateDocumentContent('<!DOCTYPE html><html><head><title>Web Platform</title></head><body><h1>Web Platform</h1><p>Read the documentation for web platform APIs and browser support.</p></body></html>').ok);
  });

  await test('validateDocumentContent rejects empty and whitespace-only downloads', () => {
    assert.strictEqual(validateDocumentContent('').ok, false);
    assert.strictEqual(validateDocumentContent('   \n\t \n').ok, false);
    assert.match(validateDocumentContent('').reason, /empty/);
  });

  await test('validateDocumentContent rejects binary and garbled downloads', () => {
    assert.match(validateDocumentContent('normal words then \u0000 binary').reason, /binary data/);
    assert.match(validateDocumentContent('text with \uFFFD undecodable text').reason, /undecodable/);
    assert.match(validateDocumentContent('zxqvbnmkjhgfdsapoiuytrewq'.repeat(20)).reason, /random characters/);
    assert.match(validateDocumentContent('@@@###$$$%%%^^^&&&***!!!???').reason, /random characters/);
  });

  await test('validateDocumentContent rejects HTTP error and challenge pages served as 200', () => {
    assert.match(
      validateDocumentContent('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body>missing</body></html>').reason,
      /error page/
    );
    assert.match(validateDocumentContent('404: Not Found\n').reason, /not-found page/);
    assert.match(
      validateDocumentContent('<html><body>Just a moment... Verify you are human</body></html>').reason,
      /challenge/
    );
    assert.match(validateDocumentContent('{"message":"Not Found"}').reason, /JSON error/);
  });

  await test('validateDocumentContent rejects downloads that are too short to be documentation', () => {
    assert.match(validateDocumentContent('Hi there').reason, /too short/);
  });

  await test('every snapshot in the current library passes integrity validation', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(realDocsDir, 'manifest.json'), 'utf8'));
    const seen = new Set();
    let validated = 0;
    for (const [group, libraries] of Object.entries(manifest.groups)) {
      for (const library of libraries) {
        if (seen.has(library)) continue;
        seen.add(library);
        const snapshot = path.join(realDocsDir, group, getLibraryFilename(library));
        assert.ok(fs.existsSync(snapshot), `missing snapshot ${group}/${library}`);
        const validation = validateDocumentContent(fs.readFileSync(snapshot, 'utf8'));
        assert.ok(validation.ok, `${library} failed validation: ${validation.reason}`);
        validated++;
      }
    }
    assert.strictEqual(validated, seen.size);
    assert.ok(validated > 0);
  });

  await test('every routed documentation link resolves to its canonical snapshot inside .docs', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(realDocsDir, 'manifest.json'), 'utf8'));
    const primaryGroup = new Map();
    for (const [group, libraries] of Object.entries(manifest.groups)) {
      for (const library of libraries) {
        if (!primaryGroup.has(library)) primaryGroup.set(library, group);
      }
    }
    let checked = 0;
    for (const [library, group] of primaryGroup) {
      const filename = getLibraryFilename(library);
      const canonical = fs.realpathSync(path.join(realDocsDir, group, filename));
      assert.ok(canonical.startsWith(fs.realpathSync(realDocsDir) + path.sep), `canonical snapshot escapes .docs: ${library}`);
      for (const [otherGroup, libraries] of Object.entries(manifest.groups)) {
        if (otherGroup === group || !libraries.includes(library)) continue;
        const linkPath = path.join(realDocsDir, otherGroup, filename);
        assert.strictEqual(fs.realpathSync(linkPath), canonical, `link ${otherGroup}/${library} does not resolve to the canonical snapshot`);
        checked++;
      }
    }
    assert.ok(checked > 0);
  });

  // ---------------------------------------------------------------------------
  // Manifest-driven permanent removal and reconciliation
  // ---------------------------------------------------------------------------

  await test('collectRoutedLibraries deduplicates libraries and preserves group order', () => {
    const libraryToGroups = collectRoutedLibraries({
      creation: ['/a/lib', '/b/lib'],
      audio: ['/b/lib', '/a/lib'],
      seo: ['/a/lib']
    });
    assert.deepStrictEqual(libraryToGroups.get('/a/lib'), ['creation', 'audio', 'seo']);
    assert.deepStrictEqual(libraryToGroups.get('/b/lib'), ['creation', 'audio']);
    assert.strictEqual(libraryToGroups.size, 2);
  });

  await test('reconcileManifestIndexes prunes every index for a removed document', () => {
    const manifest = {
      groups: { creation: ['/keep/doc'] },
      sources: {
        '/keep/doc': { type: 'url', url: 'https://example.com/keep' },
        '/removed/doc': { type: 'url', url: 'https://example.com/removed' }
      },
      inventory: ['/keep/doc', '/removed/doc', '/keep/doc'],
      githubShas: { '/keep/doc': 'keep-sha', '/removed/doc': 'removed-sha' }
    };
    const removed = reconcileManifestIndexes(manifest, new Set(['/keep/doc']));
    assert.deepStrictEqual(manifest.inventory, ['/keep/doc']);
    assert.deepStrictEqual(Object.keys(manifest.sources), ['/keep/doc']);
    assert.deepStrictEqual(Object.keys(manifest.githubShas), ['/keep/doc']);
    assert.ok(removed.some((entry) => entry.library === '/removed/doc' && entry.section === 'sources'));
    assert.ok(removed.some((entry) => entry.library === '/removed/doc' && entry.section === 'inventory'));
    assert.ok(removed.some((entry) => entry.library === '/removed/doc' && entry.section === 'githubShas'));
    assert.ok(removed.some((entry) => entry.library === '/keep/doc' && entry.reason === 'duplicate inventory entry'));
  });

  await test('removeStaleSnapshots deletes only removed documents and unassigned symlinks', () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    fs.mkdirSync(path.join(root, 'creation'));
    fs.mkdirSync(path.join(root, 'audio'));
    fs.writeFileSync(path.join(root, 'creation', '_removed_doc.md'), 'removed');
    fs.writeFileSync(path.join(root, 'creation', '_keep_doc.md'), 'keep');
    fs.symlinkSync('../creation/_keep_doc.md', path.join(root, 'audio', '_keep_doc.md'));
    fs.symlinkSync('../creation/_removed_doc.md', path.join(root, 'audio', '_removed_doc.md'));
    fs.symlinkSync('missing-target.md', path.join(root, 'audio', '_dangling.md'));

    const removed = removeStaleSnapshots(
      { creation: ['/keep/doc'], audio: ['/keep/doc'] },
      new Set(['/removed/doc'])
    );

    assert.ok(!fs.existsSync(path.join(root, 'creation', '_removed_doc.md')));
    assert.ok(!fs.existsSync(path.join(root, 'audio', '_removed_doc.md')));
    assert.ok(!fs.existsSync(path.join(root, 'audio', '_dangling.md')));
    assert.ok(fs.existsSync(path.join(root, 'creation', '_keep_doc.md')));
    assert.ok(fs.existsSync(path.join(root, 'audio', '_keep_doc.md')));
    assert.strictEqual(removed.length, 3);
    restoreDocsDirectory();
  });

  // ---------------------------------------------------------------------------
  // Internal link repair
  // ---------------------------------------------------------------------------

  await test('repairDocumentationLinks fixes broken links, collapses duplicates and reports unsafe cases', () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    for (const group of ['creation', 'audio', 'seo', 'deep']) {
      fs.mkdirSync(path.join(root, group));
    }
    fs.writeFileSync(path.join(root, 'creation', '_lib_a.md'), 'Library A documentation content.\n');
    fs.writeFileSync(path.join(root, 'creation', '_lib_b.md'), 'Library B documentation content.\n');
    fs.symlinkSync('missing.md', path.join(root, 'audio', '_lib_a.md'));
    fs.symlinkSync('../creation/_lib_b.md', path.join(root, 'audio', '_lib_b.md'));
    fs.writeFileSync(path.join(root, 'seo', '_lib_a.md'), 'Library A documentation content.\n');

    const result = repairDocumentationLinks({
      creation: ['/lib/a', '/lib/b'],
      audio: ['/lib/a', '/lib/b'],
      seo: ['/lib/a'],
      deep: ['/lib/c']
    });

    const primaryA = fs.realpathSync(path.join(root, 'creation', '_lib_a.md'));
    const primaryB = fs.realpathSync(path.join(root, 'creation', '_lib_b.md'));
    assert.ok(fs.lstatSync(path.join(root, 'audio', '_lib_a.md')).isSymbolicLink());
    assert.strictEqual(fs.realpathSync(path.join(root, 'audio', '_lib_a.md')), primaryA);
    assert.strictEqual(fs.realpathSync(path.join(root, 'audio', '_lib_b.md')), primaryB);
    assert.ok(fs.lstatSync(path.join(root, 'seo', '_lib_a.md')).isSymbolicLink());
    assert.strictEqual(fs.realpathSync(path.join(root, 'seo', '_lib_a.md')), primaryA);
    assert.ok(result.repaired.some((entry) => entry.action === 'repaired broken documentation symlink'));
    assert.ok(result.repaired.some((entry) => entry.action === 'replaced duplicate documentation copy with a symlink'));
    assert.ok(result.problems.some((entry) => entry.library === '/lib/c' && /primary snapshot is missing/.test(entry.issue)));
    restoreDocsDirectory();
  });

  await test('repairDocumentationLinks never overwrites a differing duplicate copy', () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    fs.mkdirSync(path.join(root, 'creation'));
    fs.mkdirSync(path.join(root, 'audio'));
    fs.writeFileSync(path.join(root, 'creation', '_lib_doc.md'), 'Primary documentation content with enough words.\n');
    fs.writeFileSync(path.join(root, 'audio', '_lib_doc.md'), 'Different documentation content that must not be lost.\n');

    const result = repairDocumentationLinks({ creation: ['/lib/doc'], audio: ['/lib/doc'] });

    assert.strictEqual(
      fs.readFileSync(path.join(root, 'audio', '_lib_doc.md'), 'utf8'),
      'Different documentation content that must not be lost.\n'
    );
    assert.ok(result.problems.some((entry) => /differs from the primary snapshot/.test(entry.issue)));
    restoreDocsDirectory();
  });

  await test('auditLibraryConsistency reports missing sources and unassigned snapshots without changing them', () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    fs.mkdirSync(path.join(root, 'creation'));
    fs.mkdirSync(path.join(root, 'audio'));
    fs.writeFileSync(
      path.join(root, 'creation', '_routed_doc.md'),
      'Routed documentation content with enough readable words.\n'
    );
    fs.writeFileSync(path.join(root, 'audio', '_orphan.md'), 'Unmanaged but readable documentation content here.\n');

    const issues = auditLibraryConsistency({ creation: ['/routed/doc'] }, {});
    assert.ok(issues.some((entry) => entry.library === '/routed/doc' && /no source configuration/.test(entry.issue)));
    assert.ok(issues.some((entry) => /missing snapshot at .docs\/creation/.test(entry.issue)) === false);
    assert.ok(issues.some((entry) => /unmanaged snapshot at .docs\/audio\/_orphan.md/.test(entry.issue)));
    assert.ok(fs.existsSync(path.join(root, 'audio', '_orphan.md')));
    restoreDocsDirectory();
  });

  // ---------------------------------------------------------------------------
  // PR-ready report
  // ---------------------------------------------------------------------------

  await test('renderRefreshReport includes affected documents, URLs, errors and preservation status', () => {
    const report = createRefreshReport();
    report.downloadFailures.push({
      library: '/debian/debian-reference',
      url: 'https://www.debian.org/doc/manuals/debian-reference/debian-reference.en.txt',
      attempts: 2,
      error: 'HTTP 404: Not Found'
    });
    report.validationRejections.push({
      library: '/numpy/numpy',
      url: 'https://numpy.org/doc/stable/reference/arrays.ndarray.html',
      reason: 'download is empty',
      preserved: true
    });
    report.removedLibraries.push({
      library: '/removed/doc',
      section: 'sources',
      reason: 'document is no longer routed to a group'
    });
    report.removedSnapshots.push({
      group: 'audio',
      filename: '_removed_doc.md',
      reason: 'document removed from the library manifest'
    });
    report.repairedLinks.push({
      path: '.docs/audio/_lib.md',
      action: 'repaired broken documentation symlink',
      detail: 'links to .docs/creation/_lib.md'
    });
    report.errors.push('Failed to fetch /debian/debian-reference after 2 attempts');

    const markdown = renderRefreshReport(report);
    assert.match(markdown, /https:\/\/www\.debian\.org\/doc\/manuals\/debian-reference\/debian-reference\.en\.txt/);
    assert.match(markdown, /HTTP 404: Not Found/);
    assert.match(markdown, /download is empty/);
    assert.match(markdown, /Preserved/);
    assert.match(markdown, /\/removed\/doc/);
    assert.match(markdown, /repaired broken documentation symlink/);
    assert.match(markdown, /Source URLs were not changed automatically/);
    assert.match(markdown, /\*\*Result:\*\* FAILED/);

    const escaped = renderRefreshReport({
      ...createRefreshReport(),
      downloadFailures: [
        { library: 'a\\b|c', url: 'https://example.com/a|b', attempts: 1, error: 'boom' }
      ]
    });
    assert.ok(escaped.includes('a\\\\b\\|c'), 'table cells must escape backslashes and pipes');
    assert.ok(escaped.includes('https://example.com/a\\|b'), 'URLs must escape pipes');
  });

  // ---------------------------------------------------------------------------
  // Existing network, redirect and retry contracts
  // ---------------------------------------------------------------------------

  await test('getUpstreamSha: unchanged source on main', async () => {
    mockResponses['https://api.github.com/repos/owner/repo/commits/main'] = {
      statusCode: 200,
      data: JSON.stringify({ sha: '123main' })
    };
    const sha = await getUpstreamSha('/owner/repo', { type: 'url', url: 'https://raw.githubusercontent.com/owner/repo/main/README.md' });
    assert.strictEqual(sha, '123main');
    assert.ok(requestedUrls.includes('https://api.github.com/repos/owner/repo/commits/main'));
  });

  await test('getUpstreamSha: source on master', async () => {
    mockResponses['https://api.github.com/repos/owner/repo/commits/master'] = {
      statusCode: 200,
      data: JSON.stringify({ sha: '456master' })
    };
    const sha = await getUpstreamSha('/owner/repo', { type: 'url', url: 'https://raw.githubusercontent.com/owner/repo/master/docs/README.md' });
    assert.strictEqual(sha, '456master');
  });

  await test('getUpstreamSha: source on canary', async () => {
    mockResponses['https://api.github.com/repos/vercel/next.js/commits/canary'] = {
      statusCode: 200,
      data: JSON.stringify({ sha: '789canary' })
    };
    const sha = await getUpstreamSha('/vercel/next.js', { type: 'url', url: 'https://raw.githubusercontent.com/vercel/next.js/canary/docs/index.md' });
    assert.strictEqual(sha, '789canary');
  });

  await test('getUpstreamSha: Cloudflare turnstile production', async () => {
    mockResponses['https://api.github.com/repos/cloudflare/cloudflare-docs/commits/production'] = {
      statusCode: 200,
      data: JSON.stringify({ sha: 'cfproduction' })
    };
    const sha = await getUpstreamSha('/cloudflare/cloudflare-docs/turnstile', { type: 'url', url: 'https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/turnstile/index.mdx' });
    assert.strictEqual(sha, 'cfproduction');
  });

  await test('getUpstreamSha: non-GitHub source returns null', async () => {
    const sha = await getUpstreamSha('/some/lib', { type: 'url', url: 'https://neon.com/docs/llms.txt' });
    assert.strictEqual(sha, null);
  });

  await test('fetchDocumentation: Relative redirect', async () => {
    mockResponses['https://example.com/docs'] = { statusCode: 301, headers: { location: '/new-docs' } };
    mockResponses['https://example.com/new-docs'] = { statusCode: 200, data: 'new content' };
    const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
    assert.strictEqual(data, 'new content');
    assert.strictEqual(requestedUrls.length, 2);
  });

  await test('fetchDocumentation: Absolute redirect', async () => {
    mockResponses['https://example.com/docs'] = { statusCode: 302, headers: { location: 'https://other.com/docs' } };
    mockResponses['https://other.com/docs'] = { statusCode: 200, data: 'other content' };
    const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
    assert.strictEqual(data, 'other content');
  });

  await test('fetchDocumentation: Redirect to 404', async () => {
    mockResponses['https://example.com/docs'] = { statusCode: 301, headers: { location: 'https://example.com/404' } };
    mockResponses['https://example.com/404'] = { statusCode: 404 };
    await assert.rejects(
      () => fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' }),
      /HTTP 404/
    );
  });

  await test('fetchDocumentation: Ordinary non-200', async () => {
    mockResponses['https://example.com/docs'] = { statusCode: 403 };
    await assert.rejects(
      () => fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' }),
      /HTTP 403/
    );
  });

  await test('fetchDocumentation: invalid source config', async () => {
    await assert.rejects(() => fetchDocumentation('/some/lib', null), /Invalid or missing/);
  });

  await test('fetchDocumentation: redirect loop', async () => {
    mockResponses['https://example.com/loop1'] = { statusCode: 302, headers: { location: 'https://example.com/loop2' } };
    mockResponses['https://example.com/loop2'] = { statusCode: 302, headers: { location: 'https://example.com/loop1' } };
    await assert.rejects(
      () => fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/loop1' }),
      /Too many redirects/
    );
    assert.strictEqual(requestedUrls.length, 5);
  });

  await test('fetchDocumentation: sanitize sealed_token values', async () => {
    mockResponses['https://example.com/docs'] = {
      statusCode: 200,
      data: 'URL1: sealed_token=abc123&other=param\nURL2: sealed_token=xyz789something\n'
    };
    const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
    assert.ok(!data.includes('abc123') && !data.includes('xyz789something'));
    assert.strictEqual((data.match(/sealed_token=REDACTED/g) || []).length, 2);
  });

  await test('fetchDocumentation: 15-second timeout', async () => {
    mockResponses['https://timeout.example.com'] = { timeout: true };
    await assert.rejects(
      () => fetchDocumentation('/test/timeout', { type: 'url', url: 'https://timeout.example.com' }),
      /Request Timeout/
    );
    assert.strictEqual(requestedOptions[0].timeout, 15000);
  });

  await test('fetchDocumentation: 10MB response-size limit', async () => {
    mockResponses['https://toolarge.example.com'] = { tooLarge: true };
    await assert.rejects(
      () => fetchDocumentation('/test/toolarge', { type: 'url', url: 'https://toolarge.example.com' }),
      /Response size exceeds 10MB limit/
    );
  });

  await test('retry timing and Atlantic timezone settings are unchanged', () => {
    const source = fs.readFileSync(path.join(__dirname, 'refresh-docs.js'), 'utf8');
    assert.match(source, /const DEFAULT_RETRY_DELAY_MS = 180 \* 1000;/);
    assert.match(source, /setTimeout\(resolve, retryDelayMs\)/);
    assert.match(source, /timeZone: 'America\/Halifax'/);
    assert.match(source, /DOCS_REFRESH_RETRY_DELAY_MS/);
  });

  await test('refresh workflow schedule and Cloudflare scheduler slots are unchanged', () => {
    const workflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'refresh-docs.yml'), 'utf8');
    assert.match(workflow, /cron: '21 2 \* \* 2,5'/);
    assert.match(workflow, /cron: '21 6 \* \* 2,5'/);
    assert.match(workflow, /cron: '21 10 \* \* 2,5'/);
    assert.strictEqual((workflow.match(/timezone: 'America\/Halifax'/g) || []).length, 3);

    const worker = fs.readFileSync(path.join(repoRoot, 'workers', 'updater-scheduler', 'src', 'index.mjs'), 'utf8');
    assert.match(worker, /const ATLANTIC_ZONE = "America\/Halifax";/);
    assert.match(worker, /\["Tue 02:21", \{ workflow: "refresh-docs.yml", slot: "docs-primary" \}\]/);
    assert.match(worker, /\["Fri 06:21", \{ workflow: "refresh-docs.yml", slot: "docs-backup" \}\]/);
    assert.match(worker, /\["Fri 10:21", \{ workflow: "refresh-docs.yml", slot: "docs-recovery" \}\]/);
  });

  // ---------------------------------------------------------------------------
  // Complete isolated workflow
  // ---------------------------------------------------------------------------

  await test('isolated end-to-end updater workflow', () => {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'test-refresh-docs-e2e.js')], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 240000
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    assert.strictEqual(result.status, 0, 'isolated end-to-end workflow must pass');
  });

  for (const root of tempRoots) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  restoreDocsDirectory();

  console.log(`\nTests complete: ${passed} passed, ${failed} failed.`);

  if (failed > 0) process.exit(1);
}

runTests();
