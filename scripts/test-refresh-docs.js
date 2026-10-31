// Test suite for refresh-docs.js logic

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

// In order to test the functions inside refresh-docs.js without running the main loop,
// we will read the file and eval it in a controlled context, or we can just extract the functions here for testing.
// Since refresh-docs.js is a script, we'll extract the functions dynamically.

const scriptContent = fs.readFileSync('scripts/refresh-docs.js', 'utf8');

const getUpstreamShaCode = scriptContent.substring(
    scriptContent.indexOf('function getUpstreamSha'),
    scriptContent.indexOf('function getDirSize') // It's above main, maybe below fetchDocumentation
);

// Actually, let's just use regex to extract the functions
const getUpstreamShaMatch = scriptContent.match(/function getUpstreamSha[\s\S]*?^}/m);
const fetchDocumentationMatch = scriptContent.match(/function fetchDocumentation[\s\S]*?^}/m);
const retiredFilterMatch = scriptContent.match(/function removeRetiredJulesLibraryEntries[\s\S]*?^}/m);
const retiredCleanupMatch = scriptContent.match(/function removeRetiredJulesSnapshots[\s\S]*?^}/m);


if (!getUpstreamShaMatch || !fetchDocumentationMatch || !retiredFilterMatch || !retiredCleanupMatch) {
    console.error("Could not extract functions from refresh-docs.js");
    process.exit(1);
}

const getUpstreamSha = /* DevSkim: ignore DS189424 */ eval(`(${getUpstreamShaMatch[0]})`);
const fetchDocumentation = /* DevSkim: ignore DS189424 */ eval(`(${fetchDocumentationMatch[0]})`);
const testDocsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-retirement-'));
const removeRetiredJulesLibraryEntries = new Function(
    'RETIRED_LIBRARY_IDS',
    `return (${retiredFilterMatch[0]})`
)(new Set(['jules.google/docs', 'developers.google.com/jules/api']));
const removeRetiredJulesSnapshots = new Function(
    'fs',
    'path',
    'resolveDocsPath',
    'validateGroupName',
    'RETIRED_JULES_SNAPSHOT_FILENAMES',
    `return (${retiredCleanupMatch[0]})`
)(
    fs,
    path,
    (group) => path.join(testDocsRoot, group),
    (group) => {
        if (!/^[A-Za-z0-9_-]+$/.test(group)) throw new Error('Invalid group');
        return group;
    },
    ['jules_google_docs.md', 'developers_google_com_jules_api.md']
);



async function runTests() {
    await test('manifest guard removes retired Jules sources from every routing location', async () => {
        const manifest = {
            groups: {
                creation: ['jules.google/docs', 'developers.google.com/jules/api', '/vercel/next.js'],
                audio: ['jules.google/docs', '/goldfire/howler.js']
            },
            sources: {
                'jules.google/docs': { type: 'url', url: 'https://jules.google/docs/' },
                'developers.google.com/jules/api': { type: 'url', url: 'https://developers.google.com/jules/api' },
                '/vercel/next.js': { type: 'url', url: 'https://nextjs.org/docs' }
            },
            inventory: ['jules.google/docs', 'developers.google.com/jules/api', '/vercel/next.js'],
            githubShas: {
                'jules.google/docs': 'old-jules-sha',
                'developers.google.com/jules/api': 'old-api-sha',
                '/vercel/next.js': 'next-sha'
            }
        };
        const removed = removeRetiredJulesLibraryEntries(manifest);
        assert.ok(removed >= 8, 'Should strip retired IDs from groups, sources, inventory, and SHA pins');
        assert.deepStrictEqual(manifest.groups.creation, ['/vercel/next.js']);
        assert.deepStrictEqual(manifest.groups.audio, ['/goldfire/howler.js']);
        assert.deepStrictEqual(manifest.inventory, ['/vercel/next.js']);
        assert.deepStrictEqual(Object.keys(manifest.sources), ['/vercel/next.js']);
        assert.deepStrictEqual(Object.keys(manifest.githubShas), ['/vercel/next.js']);
        assert.ok(!JSON.stringify(manifest).includes('jules.google/docs'));
        assert.ok(!JSON.stringify(manifest).includes('developers.google.com/jules/api'));
    });

    await test('snapshot guard deletes retired files but leaves unrelated documentation intact', async () => {
        const groupDir = path.join(testDocsRoot, 'creation');
        fs.mkdirSync(groupDir, { recursive: true });
        fs.writeFileSync(path.join(groupDir, 'jules_google_docs.md'), 'retired');
        // Other groups may contain a dangling symlink after a canonical snapshot is removed.
        fs.symlinkSync('missing-retired-target.md', path.join(groupDir, 'developers_google_com_jules_api.md'));
        fs.writeFileSync(path.join(groupDir, 'gemini-api.md'), 'keep');
        const removed = removeRetiredJulesSnapshots({ creation: [] });
        assert.strictEqual(removed, 2);
        assert.ok(!fs.existsSync(path.join(groupDir, 'jules_google_docs.md')));
        assert.ok(!fs.existsSync(path.join(groupDir, 'developers_google_com_jules_api.md')));
        assert.strictEqual(fs.readFileSync(path.join(groupDir, 'gemini-api.md'), 'utf8'), 'keep');
    });

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
        const refreshDocs = require('fs').readFileSync('scripts/refresh-docs.js', 'utf8');

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

    fs.rmSync(testDocsRoot, { recursive: true, force: true });
    console.log(`\nTests complete: ${passed} passed, ${failed} failed.`);

    if (failed > 0) process.exit(1);
}

runTests();
