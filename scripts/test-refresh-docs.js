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
  findFilenameCollisions,
  reconcileManifestIndexes,
  removeStaleSnapshots,
  repairDocumentationLinks,
  auditLibraryConsistency,
  cleanupStaleTempFiles,
  runRefresh,
  getCriticalIntegrityIssues,
  hasCriticalFailures,
  renderRefreshReport,
  createRefreshReport,
  getLibraryFilename,
  configureDocsDirectory,
  fetchDocumentation,
  fetchDocumentationResponse,
  normalizeDocumentationResponse,
  convertHtmlToMarkdown,
  isHtmlDocumentContent,
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

  await test('validateDocumentContent accepts Markdown and plain text but rejects raw HTML', () => {
    assert.ok(validateDocumentContent('# Title\n\nA readable documentation paragraph with details.\n').ok);
    assert.ok(validateDocumentContent('Plain text documentation\n\nSecond paragraph with words.\n').ok);
    assert.ok(validateDocumentContent('<p align="center"><img src="logo.svg" alt="Project logo"></p>\\n\\n# Project documentation\\n\\nThis is valid Markdown with a leading HTML block.').ok);
    assert.ok(validateDocumentContent('See <https://example.com/docs> for details about the API and supported usage examples.').ok);
    assert.match(
      validateDocumentContent('<!DOCTYPE html><html><head><title>Web Platform</title></head><body><h1>Web Platform</h1><p>Read the documentation for web platform APIs and browser support.</p></body></html>').reason,
      /raw HTML/
    );
    assert.match(
      validateDocumentContent('<ul><li>First item</li><li>Second item</li></ul>').reason,
      /raw HTML/
    );
    assert.match(
      validateDocumentContent('<custom-doc-element>Unconverted documentation fragment.</custom-doc-element>').reason,
      /raw HTML/
    );
  });

  await test('convertHtmlToMarkdown extracts semantic content and preserves documentation structures', () => {
    const html = '<!doctype html><html><head><title>Reference</title></head><body>' +
      '<nav>Sidebar navigation must be excluded</nav><main><h1>API Guide</h1>' +
      '<p>Use the <a href="/reference">reference guide</a> to configure the API safely.</p>' +
      '<ul><li>First item</li><li>Second item</li></ul>' +
      '<pre><code class="language-js">const answer = 42;\nconsole.log(answer);</code></pre>' +
      '<table><tr><th>Name</th><th>Value</th></tr><tr><td>Timeout</td><td>15000</td></tr></table>' +
      '<div class="cookie-banner">Cookie consent is unrelated to the documentation.</div>' +
      '</main><script>window.shouldNotRun = true;</script></body></html>';
    const markdown = convertHtmlToMarkdown(html, 'https://example.com/docs/page');
    assert.match(markdown, /^# API Guide/m);
    assert.match(markdown, /\[reference guide\]\(https:\/\/example\.com\/reference\)/);
    assert.match(markdown, /- First item/);
    assert.match(markdown, /\`\`\`js[\s\S]*const answer = 42;/);
    assert.match(markdown, /\| Name \| Value \|/);
    assert.doesNotMatch(markdown, /Sidebar navigation|Cookie consent|window\.shouldNotRun|<html/i);
    assert.ok(validateDocumentContent(markdown).ok);
  });

  await test('normalizeDocumentationResponse prefers a same-origin Markdown alternate', async () => {
    const sourceUrl = 'https://example.com/docs/app';
    const markdownUrl = 'https://example.com/docs/app.md';
    const markdown = '# App Router\n\nThis Markdown version contains the official application routing documentation and examples.\n';
    mockResponses[sourceUrl] = {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      data: '<!doctype html><html><head><link rel="alternate" type="text/markdown" href="/docs/app.md"></head>' +
        '<body><main><h1>App Router HTML fallback</h1><p>This page includes enough visible text to be converted if the alternate is unavailable.</p></main></body></html>'
    };
    mockResponses[markdownUrl] = {
      statusCode: 200,
      headers: { 'content-type': 'text/markdown; charset=utf-8' },
      data: markdown
    };

    const response = await fetchDocumentationResponse('/example/docs', { type: 'url', url: sourceUrl });
    const normalized = await normalizeDocumentationResponse(response, sourceUrl);
    assert.strictEqual(normalized, markdown);
    assert.deepStrictEqual(requestedUrls, [sourceUrl, markdownUrl]);
    assert.strictEqual(response.contentType, 'text/html');
  });

  await test('normalizeDocumentationResponse detects HTML with missing or misleading Content-Type', async () => {
    const sourceUrl = 'https://example.com/docs/no-header';
    const mislabeledUrl = 'https://example.com/docs/mislabeled';
    const html = '<!doctype html><html><body><main><h1>Fallback Guide</h1>' +
      '<p>This guide explains the supported API configuration and the important request lifecycle.</p>' +
      '</main></body></html>';
    mockResponses[sourceUrl] = { statusCode: 200, data: html };
    mockResponses[mislabeledUrl] = {
      statusCode: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      data: html
    };

    const first = await fetchDocumentationResponse('/example/docs', { type: 'url', url: sourceUrl });
    const firstMarkdown = await normalizeDocumentationResponse(first, sourceUrl);
    const second = await fetchDocumentationResponse('/example/docs', { type: 'url', url: mislabeledUrl });
    const secondMarkdown = await normalizeDocumentationResponse(second, mislabeledUrl);
    assert.match(firstMarkdown, /^# Fallback Guide/m);
    assert.match(secondMarkdown, /^# Fallback Guide/m);
    assert.ok(validateDocumentContent(firstMarkdown).ok);
    assert.ok(validateDocumentContent(secondMarkdown).ok);
  });

  await test('normalizeDocumentationResponse leaves HTML error and challenge pages for rejection', async () => {
    const errorUrl = 'https://example.com/docs/missing';
    const challengeUrl = 'https://example.com/docs/challenge';
    mockResponses[errorUrl] = {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      data: '<!doctype html><html><head><title>404 Not Found</title></head><body><h1>Not found</h1></body></html>'
    };
    mockResponses[challengeUrl] = {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      data: '<!doctype html><html><body><main><h1>Just a moment...</h1><p>Verify you are human before continuing.</p></main></body></html>'
    };

    for (const url of [errorUrl, challengeUrl]) {
      const response = await fetchDocumentationResponse('/example/docs', { type: 'url', url });
      const normalized = await normalizeDocumentationResponse(response, url);
      assert.ok(isHtmlDocumentContent(normalized), 'error/challenge HTML must not be converted');
      assert.strictEqual(validateDocumentContent(normalized).ok, false);
    }
    assert.strictEqual(requestedUrls.length, 2);
  });

  await test('normalizeDocumentationResponse ignores unsafe and cross-origin Markdown alternates', async () => {
    const sourceUrl = 'https://example.com/docs/unsafe';
    const html = '<!doctype html><html><head>' +
      '<link rel="alternate" type="text/markdown" href="https://outside.example/steal.md">' +
      '<link rel="alternate" type="text/markdown" href="javascript:alert(1)">' +
      '</head><body><main><h1>Safe Fallback</h1>' +
      '<p>The local documentation remains usable without following an unsafe alternate URL.</p></main></body></html>';
    mockResponses[sourceUrl] = {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      data: html
    };
    const response = await fetchDocumentationResponse('/example/docs', { type: 'url', url: sourceUrl });
    const normalized = await normalizeDocumentationResponse(response, sourceUrl);
    assert.match(normalized, /^# Safe Fallback/m);
    assert.deepStrictEqual(requestedUrls, [sourceUrl]);
    assert.ok(validateDocumentContent(normalized).ok);
  });

  await test('unconvertible HTML remains HTML and is rejected before writing', () => {
    const html = '<!doctype html><html><head><title>Empty page</title></head>' +
      '<body><script>document.write("no documentation");</script></body></html>';
    const markdown = convertHtmlToMarkdown(html, 'https://example.com/docs/empty');
    assert.strictEqual(markdown, '');
    assert.match(validateDocumentContent(markdown || html).reason, /raw HTML/);
  });
  
  await test('HTML detection preserves Markdown documents that begin with an HTML block', () => {
    const markdown = '<p align="center"><img src="logo.svg" alt="Project logo"></p>\n\n' +
      '# Project documentation\n\nThis is ordinary Markdown content following the HTML block.';
    assert.strictEqual(isHtmlDocumentContent(markdown), false);
    assert.strictEqual(isHtmlResponse(markdown, 'text/markdown; charset=utf-8'), false);
    assert.strictEqual(
      isHtmlResponse('<!doctype html><html><body>Rendered page</body></html>', 'text/plain'),
      true,
      'a document-level HTML response must still be detected when mislabeled text/plain'
    );
  });

  await test('HTML conversion preserves semantic blocks inside wrapper elements', () => {
    const html = '<!doctype html><html><body><main><header><h1>Wrapped documentation</h1></header>' +
      '<custom-panel><pre><code class="language-js">const value = 1;\n</code></pre></custom-panel>' +
      '<dl><dt>Important term</dt><dd>This definition contains enough descriptive documentation text to remain meaningful.</dd></dl>' +
      '<p>This paragraph provides additional useful documentation content for the semantic conversion test.</p>' +
      '</main></body></html>';
    const markdown = convertHtmlToMarkdown(html, 'https://example.com/docs/wrapped');
    assert.match(markdown, /^# Wrapped documentation$/m);
    const fence = String.fromCharCode(96).repeat(3);
    assert.ok(markdown.includes(fence + 'js\nconst value = 1;\n' + fence));
    assert.match(markdown, /\*\*Important term\*\*/);
    assert.match(markdown, /This definition contains enough descriptive documentation text/);
  });

  await test('HTML table conversion escapes backslashes before pipe characters', () => {
    const html = '<!doctype html><html><body><main>' +
      '<p>This table contains a path value with Markdown-sensitive characters.</p>' +
      '<table><tr><th>Path</th></tr><tr><td>folder\\name|value</td></tr></table>' +
      '</main></body></html>';
    const markdown = convertHtmlToMarkdown(html, 'https://example.com/docs/table');
    assert.ok(markdown.includes('folder\\\\name\\|value'));
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

  await test('every snapshot is valid Markdown or safely identified as legacy HTML', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(realDocsDir, 'manifest.json'), 'utf8'));
    const seen = new Set();
    let validated = 0;
    let legacyHtml = 0;
    let safelyUnconvertible = 0;
    for (const [group, libraries] of Object.entries(manifest.groups)) {
      for (const library of libraries) {
        if (seen.has(library)) continue;
        seen.add(library);
        const snapshot = path.join(realDocsDir, group, getLibraryFilename(library));
        assert.ok(fs.existsSync(snapshot), `missing snapshot ${group}/${library}`);
        const snapshotContent = fs.readFileSync(snapshot, 'utf8');
        const validation = validateDocumentContent(snapshotContent);
        if (isHtmlDocumentContent(snapshotContent)) {
          legacyHtml++;
          assert.strictEqual(validation.ok, false, `${library} legacy HTML must never be accepted as a Markdown snapshot`);
          const source = manifest.sources[library];
          const normalized = source && source.url
            ? convertHtmlToMarkdown(snapshotContent, source.url)
            : '';
          if (normalized) {
            const normalizedValidation = validateDocumentContent(normalized);
            assert.ok(normalizedValidation.ok, `${library} produced non-empty but invalid normalized content: ${normalizedValidation.reason}`);
          } else {
            // Some upstream JavaScript-shell pages contain no statically
            // extractable documentation. The updater must reject them safely.
            assert.strictEqual(validateDocumentContent(normalized).ok, false);
            safelyUnconvertible++;
          }
        } else {
          assert.ok(validation.ok, `${library} failed validation: ${validation.reason}`);
          validated++;
        }
      }
    }
    assert.strictEqual(validated + legacyHtml, seen.size);
    assert.ok(validated > 0);
    assert.ok(legacyHtml > 0);
    assert.ok(safelyUnconvertible > 0);
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
    assert.ok(requestedUrls.some((requestedUrl) => requestedUrl === 'https://api.github.com/repos/owner/repo/commits/main'));
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

  await test('runRefresh re-fetches a legacy HTML snapshot even when its upstream SHA is unchanged', async () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    fs.mkdirSync(path.join(root, 'creation'));
    const library = '/lib/doc';
    const sourceUrl = 'https://raw.githubusercontent.com/lib/doc/main/README.md';
    const apiUrl = 'https://api.github.com/repos/lib/doc/commits/main';
    const existingHtml = '<!doctype html><html><body><main><h1>Old HTML</h1><p>Legacy snapshot content that must be normalized.</p></main></body></html>';
    const replacement = '# Current Documentation\n\nThe current Markdown response contains the supported documentation content and reference examples.\n';
    mockResponses[apiUrl] = { statusCode: 200, data: JSON.stringify({ sha: 'same-sha' }) };
    mockResponses[sourceUrl] = {
      statusCode: 200,
      headers: { 'content-type': 'text/markdown' },
      data: replacement
    };
    fs.writeFileSync(path.join(root, 'creation', '_lib_doc.md'), existingHtml);
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({
      lastUpdated: '2026-11-07T00:00:00-04:00',
      groups: { creation: [library] },
      sources: { [library]: { type: 'url', url: sourceUrl, branch: 'main' } },
      inventory: [library],
      githubShas: { [library]: 'same-sha' }
    }, null, 2));

    const report = createRefreshReport();
    await runRefresh({ docsDir: root, reportPath: null }, report);
    assert.ok(requestedUrls.includes(sourceUrl), 'legacy HTML must bypass the unchanged-SHA skip');
    assert.strictEqual(fs.readFileSync(path.join(root, 'creation', '_lib_doc.md'), 'utf8'), replacement);
    assert.strictEqual(report.updated, 1);
    assert.strictEqual(report.consistencyIssues.length, 0);
    restoreDocsDirectory();
  });

  await test('fetchDocumentation: Relative redirect', async () => {
    mockResponses['https://example.com/docs'] = { statusCode: 301, headers: { location: '/new-docs' } };
    mockResponses['https://example.com/new-docs'] = { statusCode: 200, data: 'new content' };
    const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
    assert.strictEqual(data, 'new content');
    assert.strictEqual(requestedUrls.length, 2);
  });

  await test('fetchDocumentation: Cross-origin redirect is rejected', async () => {
    mockResponses['https://example.com/docs'] = { statusCode: 302, headers: { location: 'https://other.com/docs' } };
    await assert.rejects(
      () => fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' }),
      /Cross-origin redirect refused/
    );
    assert.deepStrictEqual(requestedUrls, ['https://example.com/docs']);
  });

  await test('fetchDocumentation: HTTPS downgrade redirect is rejected', async () => {
    const downgradeUrl = ['http:', '//example.com/docs'].join('');
    mockResponses['https://example.com/docs'] = { statusCode: 302, headers: { location: downgradeUrl } };
    await assert.rejects(
      () => fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' }),
      /must use HTTPS/
    );
    assert.deepStrictEqual(requestedUrls, ['https://example.com/docs']);
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
    mockResponses['https://timeout.example.com/'] = { timeout: true };
    await assert.rejects(
      () => fetchDocumentation('/test/timeout', { type: 'url', url: 'https://timeout.example.com' }),
      /Request Timeout/
    );
    assert.strictEqual(requestedOptions[0].timeout, 15000);
  });

  await test('fetchDocumentation: 10MB response-size limit', async () => {
    mockResponses['https://toolarge.example.com/'] = { tooLarge: true };
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
  // Review repair regressions
  // ---------------------------------------------------------------------------

  await test('critical consistency and link problems fail without download failures', () => {
    const consistencyReport = createRefreshReport();
    consistencyReport.consistencyIssues.push({
      library: '/routed/doc',
      issue: 'missing snapshot at .docs/creation/_routed_doc.md'
    });
    assert.strictEqual(consistencyReport.errors.length, 0);
    assert.strictEqual(consistencyReport.downloadFailures.length, 0);
    assert.strictEqual(hasCriticalFailures(consistencyReport), true);
    assert.strictEqual(getCriticalIntegrityIssues(consistencyReport).length, 1);
    assert.match(renderRefreshReport(consistencyReport), /\*\*Result:\*\* FAILED/);

    const linkReport = createRefreshReport();
    linkReport.linkProblems.push({
      library: '/routed/doc',
      issue: 'duplicate copy at .docs/audio/_routed_doc.md differs from the primary snapshot; left unchanged for review'
    });
    assert.strictEqual(linkReport.errors.length, 0);
    assert.strictEqual(linkReport.downloadFailures.length, 0);
    assert.strictEqual(hasCriticalFailures(linkReport), true);
    assert.match(renderRefreshReport(linkReport), /\*\*Result:\*\* FAILED/);

    const warningReport = createRefreshReport();
    warningReport.consistencyIssues.push({
      library: null,
      issue: 'unmanaged snapshot at .docs/audio/_orphan.md is not assigned to this group; review or remove it',
      severity: 'warning'
    });
    assert.strictEqual(hasCriticalFailures(warningReport), false);
    assert.match(renderRefreshReport(warningReport), /\*\*Result:\*\* SUCCESS/);
    assert.match(renderRefreshReport(warningReport), /Informational \(does not fail the run\)/);
  });

  await test('unresolved link problem without download failures fails and preserves the primary snapshot', async () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    fs.mkdirSync(path.join(root, 'creation'));
    fs.mkdirSync(path.join(root, 'audio'));
    const url = 'https://example.com/lib-doc.md';
    const primaryContent = '# Library\n\nValid documentation content with enough readable words for validation.\n';
    const differingContent = '# Different\n\nThis duplicate content is different and must not replace the valid primary snapshot.\n';
    mockResponses[url] = { statusCode: 200, data: primaryContent };
    fs.writeFileSync(path.join(root, 'creation', '_lib_doc.md'), primaryContent);
    fs.writeFileSync(path.join(root, 'audio', '_lib_doc.md'), differingContent);
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({
      lastUpdated: '2026-11-07T00:00:00-04:00',
      groups: { creation: ['/lib/doc'], audio: ['/lib/doc'] },
      sources: { '/lib/doc': { type: 'url', url } },
      inventory: ['/lib/doc'],
      githubShas: {}
    }, null, 2));

    const report = createRefreshReport();
    await runRefresh({ docsDir: root, reportPath: null }, report);

    assert.strictEqual(report.downloadFailures.length, 0);
    assert.strictEqual(report.errors.length, 0);
    assert.ok(report.linkProblems.some((entry) => /differs from the primary snapshot/.test(entry.issue)));
    assert.strictEqual(hasCriticalFailures(report), true);
    assert.strictEqual(fs.readFileSync(path.join(root, 'creation', '_lib_doc.md'), 'utf8'), primaryContent);
    assert.strictEqual(fs.readFileSync(path.join(root, 'audio', '_lib_doc.md'), 'utf8'), differingContent);
    assert.match(renderRefreshReport(report), /\*\*Result:\*\* FAILED/);
    restoreDocsDirectory();
  });

  await test('removed and routed library filename collisions preserve the routed snapshot', async () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    fs.mkdirSync(path.join(root, 'creation'));
    fs.mkdirSync(path.join(root, 'audio'));
    const routedLibrary = '/lib/doc.name';
    const removedLibrary = '/lib/doc_name';
    const filename = getLibraryFilename(routedLibrary);
    assert.strictEqual(filename, getLibraryFilename(removedLibrary));
    const routedContent = 'Routed documentation content with enough readable words.\n';
    fs.writeFileSync(path.join(root, 'creation', filename), routedContent);
    fs.writeFileSync(path.join(root, 'audio', filename), routedContent);
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({
      lastUpdated: '2026-11-07T00:00:00-04:00',
      groups: { creation: [routedLibrary], audio: [routedLibrary] },
      sources: { [removedLibrary]: { type: 'url', url: 'https://example.com/removed.md' } },
      inventory: [routedLibrary, removedLibrary],
      githubShas: {}
    }, null, 2));

    const collisions = findFilenameCollisions(
      collectRoutedLibraries({ creation: [routedLibrary], audio: [routedLibrary] }),
      [removedLibrary]
    );
    assert.strictEqual(collisions.length, 1);
    assert.deepStrictEqual(collisions[0].routed, [routedLibrary]);
    assert.deepStrictEqual(collisions[0].removed, [removedLibrary]);

    const report = createRefreshReport();
    await runRefresh({ docsDir: root, reportPath: null }, report);

    assert.strictEqual(fs.readFileSync(path.join(root, 'creation', filename), 'utf8'), routedContent);
    assert.ok(report.removedSnapshots.every((entry) => entry.filename !== filename));
    assert.ok(report.consistencyIssues.some((entry) => /same snapshot filename/.test(entry.issue) && /ownership is ambiguous/.test(entry.issue)));
    assert.strictEqual(hasCriticalFailures(report), true);
    assert.match(renderRefreshReport(report), /\*\*Result:\*\* FAILED/);
    restoreDocsDirectory();
  });

  await test('cleanupStaleTempFiles removes dangling temporary symlinks', () => {
    const root = makeTempDocsRoot();
    configureDocsDirectory(root);
    fs.mkdirSync(path.join(root, 'creation'));
    const danglingLink = path.join(root, 'creation', '_doc.md.tmp.symlink.1');
    const tempCopy = path.join(root, 'creation', '_doc.md.tmp.copy.1');
    fs.symlinkSync('missing-target.md', danglingLink);
    fs.writeFileSync(tempCopy, 'temp');

    cleanupStaleTempFiles(root);

    assert.throws(() => fs.lstatSync(danglingLink), (error) => error.code === 'ENOENT');
    assert.strictEqual(fs.existsSync(tempCopy), false);
    restoreDocsDirectory();
  });

  await test('consistency-only failures make the updater exit non-zero without download failures', () => {
    const root = makeTempDocsRoot();
    fs.mkdirSync(path.join(root, 'creation'));
    fs.writeFileSync(
      path.join(root, 'creation', '_no_source_doc.md'),
      'Valid documentation content with enough readable words for validation.\n'
    );
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({
      lastUpdated: '2026-11-07T00:00:00-04:00',
      groups: { creation: ['/no_source/doc'] },
      sources: {},
      inventory: ['/no_source/doc'],
      githubShas: {}
    }, null, 2));
    const reportPath = path.join(root, 'refresh-report.md');

    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, 'refresh-docs.js'), '--docs-dir', root, '--report', reportPath],
      { cwd: repoRoot, encoding: 'utf8', timeout: 30000 }
    );

    assert.strictEqual(result.status, 1, result.stderr || result.stdout);
    const markdown = fs.readFileSync(reportPath, 'utf8');
    assert.match(markdown, /\*\*Result:\*\* FAILED/);
    assert.match(markdown, /0 download failure\(s\)/);
    assert.match(markdown, /no source configuration/);
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
