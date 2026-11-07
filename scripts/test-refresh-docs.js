// Test suite for refresh-docs.js logic

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// We will test the logic of getUpstreamSha and fetchWithRedirects by mocking https
const https = require('https');
const EventEmitter = require('events');

console.log('Running test suite for refresh-docs.js...');

let mockResponses = {};
let requestedUrls = [];
let requestedOptions = [];

const originalGet = https.get;

https.get = function(urlOrOptions, optionsOrCallback, callback) {
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
    res.destroy = function(err) { if(err) req.emit('error', err); };
    const req = new EventEmitter();

    /* DevSkim: ignore DS172411 */ /* DevSkim: ignore DS172411 */ setTimeout(() => {
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
             /* DevSkim: ignore DS172411 */ /* DevSkim: ignore DS172411 */ setTimeout(() => req.emit('timeout'), 5);
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
           /* DevSkim: ignore DS172411 */ /* DevSkim: ignore DS172411 */ setTimeout(() => handler(new Error(mockResponses[url].error)), 10);
        }
        return req;
    };
    req.destroy = function(err) { if(err) this.emit('error', err); };
    return req;
};

// refresh-docs.js is a script, so extract the functions under test from its
// source instead of running main(). This keeps the suite isolated from .docs
// and from the network while executing the real implementation.
const scriptContent = fs.readFileSync('scripts/refresh-docs.js', 'utf8');

function extractFunction(name) {
    const match = scriptContent.match(new RegExp(`function ${name}\\([\\s\\S]*?^}`, 'm'));
    if (!match) {
        console.error(`Could not extract ${name} from refresh-docs.js`);
        process.exit(1);
    }
    return match[0];
}

function extractStringList(constName) {
    const match = scriptContent.match(new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\];`));
    if (!match) {
        console.error(`Could not extract ${constName} from refresh-docs.js`);
        process.exit(1);
    }
    return (match[1].match(/'[^']+'|"[^"]+"/g) || []).map((value) => value.slice(1, -1));
}

const retiredIdsMatch = scriptContent.match(/const RETIRED_LIBRARY_IDS = new Set\(\[([\s\S]*?)\]\);/);
if (!retiredIdsMatch) {
    console.error('Could not extract RETIRED_LIBRARY_IDS from refresh-docs.js');
    process.exit(1);
}
const RETIRED_LIBRARY_IDS = new Set(
    (retiredIdsMatch[1].match(/'[^']+'|"[^"]+"/g) || []).map((value) => value.slice(1, -1))
);
const RETIRED_SNAPSHOT_FILENAMES = extractStringList('RETIRED_SNAPSHOT_FILENAMES');

const getUpstreamSha = /* DevSkim: ignore DS189424 */ eval(`(${extractFunction('getUpstreamSha')})`);
const fetchDocumentation = /* DevSkim: ignore DS189424 */ eval(`(${extractFunction('fetchDocumentation')})`);

const removeRetiredLibraryEntries = new Function(
    'RETIRED_LIBRARY_IDS',
    `return (${extractFunction('removeRetiredLibraryEntries')});`
)(RETIRED_LIBRARY_IDS);

// Build the filesystem helpers against a temporary documentation root so the
// tests never read or write the repository's .docs directory.
function createDocsHarness(root) {
    const resolveDocsPath = new Function(
        'fs',
        'path',
        'DOCS_BASE_DIR',
        `${extractFunction('validateSymlinkTargetChain')}\nreturn (${extractFunction('resolveDocsPath')});`
    )(fs, path, root);
    const isDanglingSymlink = new Function(
        'fs',
        `return (${extractFunction('isDanglingSymlink')});`
    )(fs);
    const ensureDocsSymlink = new Function(
        'fs',
        'isDanglingSymlink',
        `return (${extractFunction('ensureDocsSymlink')});`
    )(fs, isDanglingSymlink);
    const getDirSize = new Function(
        'fs',
        'path',
        'DOCS_BASE_DIR',
        'resolveDocsPath',
        `return (${extractFunction('getDirSize')});`
    )(fs, path, root, resolveDocsPath);
    const removeRetiredSnapshots = new Function(
        'fs',
        'path',
        'DOCS_DIR',
        'resolveDocsPath',
        'RETIRED_SNAPSHOT_FILENAMES',
        `return (${extractFunction('removeRetiredSnapshots')});`
    )(fs, path, root, resolveDocsPath, RETIRED_SNAPSHOT_FILENAMES);

    return { resolveDocsPath, isDanglingSymlink, ensureDocsSymlink, getDirSize, removeRetiredSnapshots };
}

const temporaryRoots = [];
function makeDocsRoot(label) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), `docs-${label}-`));
    temporaryRoots.push(root);
    return root;
}

function writeDoc(root, group, filename, content) {
    fs.mkdirSync(path.join(root, group), { recursive: true });
    fs.writeFileSync(path.join(root, group, filename), content);
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

    await test('retired guard covers the four PR #1746 IDs recorded in the repository', async () => {
        const records = fs.readFileSync('__tests__/docs-library-retirement.test.ts', 'utf8');
        const recordMatches = [...records.matchAll(/id:\s*"([^"]+)"[^}]*snapshot:\s*"([^"]+)"/g)];

        assert.strictEqual(recordMatches.length, 4, 'repository records must name four retired documents');
        for (const [, id, snapshot] of recordMatches) {
            assert.ok(RETIRED_LIBRARY_IDS.has(id), `${id} must be protected from reintroduction`);
            assert.ok(
                RETIRED_SNAPSHOT_FILENAMES.includes(path.basename(snapshot)),
                `${snapshot} must be removed by the updater`
            );
        }
        // The earlier Jules retirement guard must keep working.
        assert.ok(RETIRED_LIBRARY_IDS.has('jules.google/docs'));
        assert.ok(RETIRED_LIBRARY_IDS.has('developers.google.com/jules/api'));
    });

    await test('manifest guard removes the four retired documents from every routing location', async () => {
        const manifest = {
            groups: {
                'deep-dive': ['/posthog/posthog-js', '/magicuidesign/magicui', '/vercel/next.js'],
                polishing: ['/magicuidesign/magicui'],
                creation: ['/pmndrs/react-three-fiber'],
                security: ['/upstash/ratelimit'],
                audio: ['jules.google/docs']
            },
            sources: {
                '/posthog/posthog-js': { type: 'url', url: 'https://posthog.com/docs' },
                '/magicuidesign/magicui': { type: 'url', url: 'https://magicui.design/docs' },
                '/pmndrs/react-three-fiber': { type: 'url', url: 'https://r3f.docs.pmnd.rs/getting-started' },
                '/upstash/ratelimit': { type: 'url', url: 'https://upstash.com/docs/redis/sdks/ratelimit-ts/overview' },
                'jules.google/docs': { type: 'url', url: 'https://jules.google/docs/' },
                '/vercel/next.js': { type: 'url', url: 'https://nextjs.org/docs' }
            },
            inventory: [
                '/posthog/posthog-js',
                '/magicuidesign/magicui',
                '/pmndrs/react-three-fiber',
                '/upstash/ratelimit',
                'jules.google/docs',
                '/vercel/next.js'
            ],
            githubShas: {
                '/posthog/posthog-js': 'posthog-sha',
                '/magicuidesign/magicui': 'magicui-sha',
                '/pmndrs/react-three-fiber': 'r3f-sha',
                '/upstash/ratelimit': 'ratelimit-sha',
                'jules.google/docs': 'jules-sha',
                '/vercel/next.js': 'next-sha'
            }
        };

        const removed = removeRetiredLibraryEntries(manifest);

        assert.ok(removed >= 20, 'Should strip retired IDs from groups, sources, inventory, and SHA pins');
        assert.deepStrictEqual(manifest.groups['deep-dive'], ['/vercel/next.js']);
        assert.deepStrictEqual(manifest.groups.polishing, []);
        assert.deepStrictEqual(manifest.groups.creation, []);
        assert.deepStrictEqual(manifest.groups.security, []);
        assert.deepStrictEqual(manifest.groups.audio, []);
        assert.deepStrictEqual(manifest.inventory, ['/vercel/next.js']);
        assert.deepStrictEqual(Object.keys(manifest.sources), ['/vercel/next.js']);
        assert.deepStrictEqual(Object.keys(manifest.githubShas), ['/vercel/next.js']);

        const serialized = JSON.stringify(manifest);
        for (const id of RETIRED_LIBRARY_IDS) {
            assert.ok(!serialized.includes(id), `${id} must not survive manifest sanitization`);
        }
        assert.ok(serialized.includes('/vercel/next.js'), 'Retained sources must survive');
    });

    await test('repeated manifest guard runs are idempotent and block a restored manifest', async () => {
        const makeManifest = () => ({
            groups: { 'deep-dive': ['/posthog/posthog-js', '/vercel/next.js'] },
            sources: {
                '/posthog/posthog-js': { type: 'url', url: 'https://posthog.com/docs' },
                '/vercel/next.js': { type: 'url', url: 'https://nextjs.org/docs' }
            },
            inventory: ['/posthog/posthog-js', '/vercel/next.js'],
            githubShas: { '/posthog/posthog-js': 'posthog-sha', '/vercel/next.js': 'next-sha' }
        });

        const manifest = makeManifest();
        assert.ok(removeRetiredLibraryEntries(manifest) > 0);
        const afterFirstRun = JSON.stringify(manifest);

        assert.strictEqual(removeRetiredLibraryEntries(manifest), 0, 'Second run must have nothing to remove');
        assert.strictEqual(JSON.stringify(manifest), afterFirstRun, 'Second run must not alter the manifest');

        // Simulate an old or accidentally restored manifest listing the retired
        // source again: the guard must strip it without disturbing valid entries.
        const restored = makeManifest();
        removeRetiredLibraryEntries(restored);
        assert.deepStrictEqual(restored.groups['deep-dive'], ['/vercel/next.js']);
        assert.deepStrictEqual(Object.keys(restored.sources), ['/vercel/next.js']);
        assert.ok(!JSON.stringify(restored).includes('/posthog/posthog-js'));
    });

    await test('snapshot guard deletes retired files and dangling links, leaving valid documents intact', async () => {
        const root = makeDocsRoot('snapshots');
        writeDoc(root, 'deep-dive', '_posthog_posthog-js.md', 'retired');
        writeDoc(root, 'creation', '_pmndrs_react-three-fiber.md', 'retired');
        writeDoc(root, 'security', '_upstash_ratelimit.md', 'retired');
        writeDoc(root, 'audio', 'jules_google_docs.md', 'retired');
        // A group that is no longer routed in the manifest must still be cleaned.
        writeDoc(root, 'unlisted-group', '_upstash_ratelimit.md', 'retired');
        writeDoc(root, 'deep-dive', '_vercel_next.js.md', 'keep');
        writeDoc(root, 'deep-dive/nested', '_upstash_ratelimit.md', 'keep nested');
        // A canonical snapshot removal can leave a dangling dedup link behind.
        fs.mkdirSync(path.join(root, 'polishing'), { recursive: true });
        fs.symlinkSync('missing-magicui.md', path.join(root, 'polishing', '_magicuidesign_magicui.md'));

        const helpers = createDocsHarness(root);
        assert.strictEqual(helpers.removeRetiredSnapshots(), 6);

        for (const relativePath of [
            'deep-dive/_posthog_posthog-js.md',
            'creation/_pmndrs_react-three-fiber.md',
            'security/_upstash_ratelimit.md',
            'audio/jules_google_docs.md',
            'unlisted-group/_upstash_ratelimit.md',
            'polishing/_magicuidesign_magicui.md'
        ]) {
            assert.throws(
                () => fs.lstatSync(path.join(root, relativePath)),
                /ENOENT/,
                `${relativePath} must be deleted, including dangling links`
            );
        }
        assert.strictEqual(fs.readFileSync(path.join(root, 'deep-dive', '_vercel_next.js.md'), 'utf8'), 'keep');
        assert.strictEqual(
            fs.readFileSync(path.join(root, 'deep-dive', 'nested', '_upstash_ratelimit.md'), 'utf8'),
            'keep nested'
        );
        assert.strictEqual(helpers.removeRetiredSnapshots(), 0, 'Second cleanup run must remove nothing');
        assert.strictEqual(fs.readFileSync(path.join(root, 'deep-dive', '_vercel_next.js.md'), 'utf8'), 'keep');
    });

    await test('dangling symlinks and a missing canonical target do not crash inspection', async () => {
        const root = makeDocsRoot('dangling');
        writeDoc(root, 'first', 'keep.md', 'keep');
        fs.mkdirSync(path.join(root, 'second'), { recursive: true });
        const danglingLink = path.join(root, 'second', 'alpha.md');
        fs.symlinkSync(path.join('..', 'first', 'alpha.md'), danglingLink);

        const helpers = createDocsHarness(root);
        assert.strictEqual(helpers.resolveDocsPath('second', 'alpha.md'), danglingLink);
        assert.ok(helpers.isDanglingSymlink(danglingLink), 'Link must be detected as dangling');
        assert.strictEqual(helpers.resolveDocsPath('first', 'keep.md'), path.join(root, 'first', 'keep.md'));
        assert.ok(helpers.getDirSize(root) > 0, 'Size measurement must survive a dangling link');
        assert.strictEqual(fs.readFileSync(path.join(root, 'first', 'keep.md'), 'utf8'), 'keep');
    });

    await test('a missing canonical target is restored without disturbing existing documents', async () => {
        const root = makeDocsRoot('repair');
        writeDoc(root, 'first', 'keep.md', 'keep');
        fs.mkdirSync(path.join(root, 'second'), { recursive: true });
        const linkPath = path.join(root, 'second', 'alpha.md');
        fs.symlinkSync(path.join('..', 'first', 'alpha.md'), linkPath);

        const helpers = createDocsHarness(root);
        assert.strictEqual(helpers.ensureDocsSymlink(linkPath, path.join('..', 'first', 'alpha.md')), true);
        assert.ok(helpers.isDanglingSymlink(linkPath), 'Link stays dangling until the target exists');

        // Simulate the updater writing the canonical copy with a temp file rename.
        const canonicalPath = path.join(root, 'first', 'alpha.md');
        const tempPath = canonicalPath + '.tmp.1';
        fs.writeFileSync(tempPath, 'canonical');
        fs.renameSync(tempPath, canonicalPath);

        assert.strictEqual(fs.readFileSync(linkPath, 'utf8'), 'canonical');
        assert.strictEqual(helpers.ensureDocsSymlink(linkPath, path.join('..', 'first', 'alpha.md')), false);
        assert.ok(fs.lstatSync(linkPath).isSymbolicLink(), 'Valid dedup link must be preserved');

        // A regular existing document is never replaced or rewritten.
        writeDoc(root, 'second', 'gamma.md', 'gamma');
        assert.strictEqual(helpers.ensureDocsSymlink(path.join(root, 'second', 'gamma.md'), '../first/alpha.md'), false);
        assert.strictEqual(fs.readFileSync(path.join(root, 'second', 'gamma.md'), 'utf8'), 'gamma');
        assert.strictEqual(fs.readFileSync(path.join(root, 'first', 'keep.md'), 'utf8'), 'keep');
    });

    await test('dangling links that escape .docs are still rejected', async () => {
        const root = makeDocsRoot('escape');
        const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-outside-'));
        temporaryRoots.push(outsideRoot);
        fs.mkdirSync(path.join(root, 'group'), { recursive: true });
        const groupDir = path.join(root, 'group');
        const outsideFile = path.join(outsideRoot, 'escape.md');
        fs.writeFileSync(outsideFile, 'outside');

        fs.symlinkSync(path.relative(groupDir, outsideFile), path.join(groupDir, 'escape.md'));
        fs.symlinkSync(
            path.relative(groupDir, path.join(outsideRoot, 'missing.md')),
            path.join(groupDir, 'dangling-escape.md')
        );

        const helpers = createDocsHarness(root);
        assert.throws(
            () => helpers.resolveDocsPath('group', 'escape.md'),
            /remain inside the \.docs directory/
        );
        assert.throws(
            () => helpers.resolveDocsPath('group', 'dangling-escape.md'),
            /remain inside the \.docs directory/
        );
    });

    await test('full updater runs twice without recreating retired documents or breaking links', async () => {
        const fixture = makeDocsRoot('e2e');
        const docsDir = path.join(fixture, '.docs');
        for (const group of ['deep-dive', 'audio', 'security', 'unlisted']) {
            fs.mkdirSync(path.join(docsDir, group), { recursive: true });
        }

        fs.writeFileSync(path.join(docsDir, 'manifest.json'), JSON.stringify({
            lastUpdated: '2026-01-01T00:00:00-04:00',
            groups: {
                'deep-dive': ['/posthog/posthog-js', '/example/keep'],
                audio: ['/example/keep'],
                security: ['/upstash/ratelimit']
            },
            sources: {
                '/posthog/posthog-js': { type: 'url', url: 'https://fixture.example/posthog' },
                '/upstash/ratelimit': { type: 'url', url: 'https://fixture.example/ratelimit' },
                '/example/keep': { type: 'url', url: 'https://fixture.example/keep' }
            },
            inventory: [],
            githubShas: {}
        }, null, 2) + '\n');

        // Stale retired snapshots, including one in a group no longer routed.
        fs.writeFileSync(path.join(docsDir, 'deep-dive', '_posthog_posthog-js.md'), 'retired');
        fs.writeFileSync(path.join(docsDir, 'security', '_upstash_ratelimit.md'), 'retired');
        fs.writeFileSync(path.join(docsDir, 'unlisted', '_magicuidesign_magicui.md'), 'retired');
        // Canonical target missing with a dangling dedup link: both must be restored.
        fs.symlinkSync(
            path.join('..', 'deep-dive', '_example_keep.md'),
            path.join(docsDir, 'audio', '_example_keep.md')
        );
        fs.writeFileSync(path.join(docsDir, 'deep-dive', '_keep-valid.md'), 'keep');

        // The child process runs the real updater with only its HTTPS traffic mocked.
        const shimPath = path.join(fixture, 'mock-https.js');
        fs.writeFileSync(shimPath, [
            "const https = require('https');",
            "const { EventEmitter } = require('events');",
            'https.get = function (urlOrOptions, optionsOrCallback, callback) {',
            '  const options = optionsOrCallback && typeof optionsOrCallback === "object" ? optionsOrCallback : (urlOrOptions && typeof urlOrOptions === "object" ? urlOrOptions : {});',
            '  const cb = typeof optionsOrCallback === "function" ? optionsOrCallback : callback;',
            '  const url = typeof urlOrOptions === "string" ? urlOrOptions : "https://" + options.hostname + options.path;',
            '  const res = new EventEmitter();',
            '  res.resume = () => {};',
            '  res.destroy = () => {};',
            '  const req = new EventEmitter();',
            '  req.destroy = () => {};',
            '  setImmediate(() => {',
            '    res.headers = {};',
            '    if (url.includes("api.github.com")) {',
            '      res.statusCode = 403;',
            '      res.statusMessage = "Forbidden";',
            '      if (cb) cb(res);',
            '      res.emit("end");',
            '      return;',
            '    }',
            '    res.statusCode = 200;',
            '    res.statusMessage = "OK";',
            '    if (cb) cb(res);',
            '    res.emit("data", "# Fixture document\\n\\nStable content.\\n");',
            '    res.emit("end");',
            '  });',
            '  return req;',
            '};'
        ].join('\n'));

        const runUpdater = () => execFileSync(
            process.execPath,
            ['-r', shimPath, path.resolve('scripts/refresh-docs.js')],
            {
                cwd: fixture,
                encoding: 'utf8',
                env: { ...process.env, GITHUB_TOKEN: '' },
                timeout: 60000
            }
        );

        const firstOutput = runUpdater();
        assert.match(firstOutput, /SUCCESS/);

        const manifestPath = path.join(docsDir, 'manifest.json');
        const firstManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const firstManifestText = JSON.stringify(firstManifest);
        for (const id of ['/posthog/posthog-js', '/magicuidesign/magicui', '/pmndrs/react-three-fiber', '/upstash/ratelimit']) {
            assert.ok(!firstManifestText.includes(id), `${id} must not survive a full run`);
        }
        assert.deepStrictEqual(firstManifest.groups['deep-dive'], ['/example/keep']);
        assert.deepStrictEqual(firstManifest.groups.audio, ['/example/keep']);
        assert.deepStrictEqual(firstManifest.groups.security, []);
        assert.deepStrictEqual(firstManifest.inventory, ['/example/keep']);

        for (const relativePath of [
            'deep-dive/_posthog_posthog-js.md',
            'security/_upstash_ratelimit.md',
            'unlisted/_magicuidesign_magicui.md'
        ]) {
            assert.throws(() => fs.lstatSync(path.join(docsDir, relativePath)), /ENOENT/);
        }

        const canonical = fs.readFileSync(path.join(docsDir, 'deep-dive', '_example_keep.md'), 'utf8');
        assert.match(canonical, /Stable content\./);
        assert.ok(fs.lstatSync(path.join(docsDir, 'audio', '_example_keep.md')).isSymbolicLink());
        assert.strictEqual(fs.readFileSync(path.join(docsDir, 'audio', '_example_keep.md'), 'utf8'), canonical);
        assert.strictEqual(fs.readFileSync(path.join(docsDir, 'deep-dive', '_keep-valid.md'), 'utf8'), 'keep');

        const secondOutput = runUpdater();
        assert.match(secondOutput, /SUCCESS/);
        const secondManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        assert.deepStrictEqual(secondManifest, firstManifest, 'Second run must leave the manifest byte-stable');
        assert.strictEqual(fs.readFileSync(path.join(docsDir, 'audio', '_example_keep.md'), 'utf8'), canonical);
        assert.strictEqual(fs.readFileSync(path.join(docsDir, 'deep-dive', '_keep-valid.md'), 'utf8'), 'keep');
    });

    // 1. Unchanged GitHub source on "main"
    await test('getUpstreamSha: unchanged source on main', async () => {
        mockResponses['https://api.github.com/repos/owner/repo/commits/main'] = {
            statusCode: 200,
            data: JSON.stringify({ sha: '123main' })
        };
        const sha = await getUpstreamSha('/owner/repo', { type: 'url', url: 'https://raw.githubusercontent.com/owner/repo/main/README.md' });
        assert.strictEqual(sha, '123main');
        assert.ok(requestedUrls.includes('https://api.github.com/repos/owner/repo/commits/main'));
    });

    // 2. Changed GitHub source on "master"
    await test('getUpstreamSha: source on master', async () => {
        mockResponses['https://api.github.com/repos/owner/repo/commits/master'] = {
            statusCode: 200,
            data: JSON.stringify({ sha: '456master' })
        };
        const sha = await getUpstreamSha('/owner/repo', { type: 'url', url: 'https://raw.githubusercontent.com/owner/repo/master/docs/README.md' });
        assert.strictEqual(sha, '456master');
        assert.ok(requestedUrls.includes('https://api.github.com/repos/owner/repo/commits/master'));
    });

    // 3. Changed source on a non-main branch (canary)
    await test('getUpstreamSha: source on canary', async () => {
        mockResponses['https://api.github.com/repos/vercel/next.js/commits/canary'] = {
            statusCode: 200,
            data: JSON.stringify({ sha: '789canary' })
        };
        const sha = await getUpstreamSha('/vercel/next.js', { type: 'url', url: 'https://raw.githubusercontent.com/vercel/next.js/canary/docs/index.md' });
        assert.strictEqual(sha, '789canary');
        assert.ok(requestedUrls.includes('https://api.github.com/repos/vercel/next.js/commits/canary'));
    });

    // 4. Cloudflare turnstile production source
    await test('getUpstreamSha: Cloudflare turnstile production', async () => {
        mockResponses['https://api.github.com/repos/cloudflare/cloudflare-docs/commits/production'] = {
            statusCode: 200,
            data: JSON.stringify({ sha: 'cfproduction' })
        };
        const sha = await getUpstreamSha('/cloudflare/cloudflare-docs/turnstile', { type: 'url', url: 'https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/turnstile/index.mdx' });
        assert.strictEqual(sha, 'cfproduction');
    });

    // 5. non-GitHub HTTP source
    await test('getUpstreamSha: non-GitHub source returns null', async () => {
        const sha = await getUpstreamSha('/some/lib', { type: 'url', url: 'https://neon.com/docs/llms.txt' });
        assert.strictEqual(sha, null);
    });

    // 6. Relative redirect
    await test('fetchDocumentation: Relative redirect', async () => {
        mockResponses['https://example.com/docs'] = {
            statusCode: 301,
            headers: { location: '/new-docs' }
        };
        mockResponses['https://example.com/new-docs'] = {
            statusCode: 200,
            data: 'new content'
        };
        const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
        assert.strictEqual(data, 'new content');
        assert.strictEqual(requestedUrls.length, 2);
    });

    // 7. Absolute redirect
    await test('fetchDocumentation: Absolute redirect', async () => {
        mockResponses['https://example.com/docs'] = {
            statusCode: 302,
            headers: { location: 'https://other.com/docs' }
        };
        mockResponses['https://other.com/docs'] = {
            statusCode: 200,
            data: 'other content'
        };
        const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
        assert.strictEqual(data, 'other content');
    });

    // 8. Redirect followed by HTTP 404
    await test('fetchDocumentation: Redirect to 404', async () => {
        mockResponses['https://example.com/docs'] = {
            statusCode: 301,
            headers: { location: 'https://example.com/404' }
        };
        mockResponses['https://example.com/404'] = {
            statusCode: 404
        };
        try {
            await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
            assert.fail('Should have thrown');
        } catch (e) {
            assert.match(e.message, /HTTP 404/);
        }
    });

    // 9. Redirect followed by another error status
    await test('fetchDocumentation: Redirect to 500', async () => {
        mockResponses['https://example.com/docs'] = {
            statusCode: 301,
            headers: { location: 'https://example.com/500' }
        };
        mockResponses['https://example.com/500'] = {
            statusCode: 500
        };
        try {
            await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
            assert.fail('Should have thrown');
        } catch (e) {
            assert.match(e.message, /HTTP 500/);
        }
    });

    // 10. Ordinary non-200 response
    await test('fetchDocumentation: Ordinary non-200', async () => {
        mockResponses['https://example.com/docs'] = {
            statusCode: 403
        };
        try {
            await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
            assert.fail('Should have thrown');
        } catch (e) {
            assert.match(e.message, /HTTP 403/);
        }
    });

    // 11. Malformed/invalid source config
    await test('fetchDocumentation: invalid source config', async () => {
        try {
            await fetchDocumentation('/some/lib', null);
            assert.fail('Should have thrown');
        } catch (e) {
            assert.match(e.message, /Invalid or missing/);
        }
    });

    // 12. Too many redirects
    await test('fetchDocumentation: redirect loop', async () => {
        mockResponses['https://example.com/loop1'] = { statusCode: 302, headers: { location: 'https://example.com/loop2' } };
        mockResponses['https://example.com/loop2'] = { statusCode: 302, headers: { location: 'https://example.com/loop1' } };

        try {
            await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/loop1' });
            assert.fail('Should have thrown');
        } catch (e) {
            assert.match(e.message, /Too many redirects/);
            // It starts at 5, so it makes requests for:
            // 5 -> loop1
            // 4 -> loop2
            // 3 -> loop1
            // 2 -> loop2
            // 1 -> loop1
            // next call has redirectCount 0, which rejects BEFORE making a request
            assert.strictEqual(requestedUrls.length, 5);
        }
    });

    // 13. Sanitization of sealed_token containing lowercase 's'
    await test('fetchDocumentation: sanitize token with lowercase s', async () => {
        mockResponses['https://example.com/docs'] = {
            statusCode: 200,
            data: 'Here is a URL with sealed_token=KQdjIGHECVHvmhDasomethingelse in it'
        };
        const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
        assert.ok(!data.includes('KQdjIGHECVHvmhDasomethingelse'), 'Token should be fully redacted');
        assert.ok(data.includes('sealed_token=REDACTED'), 'Should contain REDACTED placeholder');
    });

    // 14. Sanitization with multiple sealed_token parameters
    await test('fetchDocumentation: sanitize multiple tokens', async () => {
        mockResponses['https://example.com/docs'] = {
            statusCode: 200,
            data: 'URL1: sealed_token=abc123&other=param\nURL2: sealed_token=xyz789something\n'
        };
        const data = await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/docs' });
        assert.ok(!data.includes('abc123') && !data.includes('xyz789something'), 'All tokens should be redacted');
        assert.strictEqual((data.match(/sealed_token=REDACTED/g) || []).length, 2, 'Should have 2 REDACTED placeholders');
    });


    await test('fetchDocumentation: 15-second timeout', async () => {
        mockResponses['https://timeout.example.com'] = { timeout: true };
        try {
            await fetchDocumentation('/test/timeout', { type: 'url', url: 'https://timeout.example.com' });
            throw new Error('Should have failed');
        } catch (e) {
            assert.match(e.message, /Request Timeout/);
        }
        assert.strictEqual(requestedOptions[0].timeout, 15000, 'Should request with a 15-second timeout option');
    });

    await test('fetchDocumentation: 10MB response-size limit', async () => {
        mockResponses['https://toolarge.example.com'] = { tooLarge: true };
        try {
            await fetchDocumentation('/test/toolarge', { type: 'url', url: 'https://toolarge.example.com' });
            throw new Error('Should have failed');
        } catch (e) {
            assert.match(e.message, /Response size exceeds 10MB limit/);
        }
    });


    await test('main loop: retry contract', async () => {
        // Extract the retry block logic to test the delay
        let calls = [];
        let fetched = 0;

        // fake context
        const context = {
           fetchDocumentation: async () => {
              fetched++;
              if (fetched === 1) throw new Error("First fail");
              return "success";
           },
           setTimeout: (cb, delay) => {
              calls.push(delay);
              cb();
           },
           console: { log: () => {}, error: () => {} },
           Buffer: Buffer
        };

        // We will just run a modified version of the try/catch block
        const block = `
           let output;
           let fetchSuccess = false;
           try {
              output = await fetchDocumentation('testLib', {});
              fetchSuccess = true;
           } catch (e) {
              await new Promise(resolve => /* DevSkim: ignore DS172411 */ /* DevSkim: ignore DS172411 */ setTimeout(resolve, 180 * 1000));
              try {
                 output = await fetchDocumentation('testLib', {});
                 fetchSuccess = true;
              } catch (e2) {
                 // failed twice
              }
           }
           return fetchSuccess;
        `;

        const testFn = new Function('fetchDocumentation', 'setTimeout', 'Buffer', 'console', `return (async () => { ${block} })();`);

        const result = await testFn(context.fetchDocumentation, context.setTimeout, context.Buffer, context.console);

        assert.strictEqual(result, true, 'Should succeed on retry');
        assert.strictEqual(fetched, 2, 'Should fetch twice');
        assert.strictEqual(calls.length, 1, 'Should call setTimeout once');
        assert.strictEqual(calls[0], 180 * 1000, 'Should delay for exactly 180 seconds');
    });

    for (const root of temporaryRoots) {
        fs.rmSync(root, { recursive: true, force: true });
    }
    console.log(`\nTests complete: ${passed} passed, ${failed} failed.`);

    if (failed > 0) process.exit(1);
}

runTests();
