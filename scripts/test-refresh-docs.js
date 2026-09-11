// Test suite for refresh-docs.js logic

const assert = require('assert');
const fs = require('fs');

// We will test the logic of getUpstreamSha and fetchWithRedirects by mocking https
const https = require('https');
const EventEmitter = require('events');

console.log('Running test suite for refresh-docs.js...');

let mockResponses = {};
let requestedUrls = [];

const originalGet = https.get;

https.get = function(urlOrOptions, optionsOrCallback, callback) {
let activeTimeouts = [];

    let url = typeof urlOrOptions === 'string' ? urlOrOptions : null;
    let options = typeof optionsOrCallback === 'object' ? optionsOrCallback : (typeof urlOrOptions === 'object' ? urlOrOptions : {});
    let cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;

    if (!url && options.hostname && options.path) {
        url = `https://${options.hostname}${options.path}`;
    }

    requestedUrls.push(url);

    const res = new EventEmitter();
    res.resume = () => {};
    const req = new EventEmitter();
    let timeoutHandle = null;
    let destroyed = false;

    setTimeout(() => {
        const mockRes = mockResponses[url];
        if (!mockRes) {
            res.statusCode = 404;
            cb(res);
            res.emit('end');
            return req;
        }

        if (destroyed) {
            // If request was already destroyed, don't emit anything
            return;
        }

        res.statusCode = mockRes.statusCode || 200;
        res.headers = mockRes.headers || {};

        if (cb) cb(res);

        if (mockRes.data) {
            // Support chunked data for testing size limits
            if (mockRes.chunks) {
                let totalEmitted = 0;
                for (const chunk of mockRes.chunks) {
                    if (destroyed) break;
                    res.emit('data', chunk);
                    totalEmitted += chunk.length;
                }
            } else {
                res.emit('data', mockRes.data);
            }
        }

        if (!destroyed) {
            res.emit('end');
        }
    }, 10);

    req.on = (event, handler) => {
        if (event === 'error' && mockResponses[url] && mockResponses[url].error) {
           setTimeout(() => handler(new Error(mockResponses[url].error)), 10);
        } else if (event === 'timeout') {
            if (options.timeout) {
                timeoutHandle = setTimeout(() => {
                    if (!destroyed) {
                        req.emit('timeout');
                    }
                }, options.timeout);
                activeTimeouts.push(timeoutHandle);
            }
        }
        return req;
    };
    
    req.destroy = (error) => {
        destroyed = true;
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
        if (error) {
            setTimeout(() => req.emit('error', error), 0);
        }
    };
    
    res.destroy = (error) => {
        destroyed = true;
        if (error) {
            setTimeout(() => res.emit('error', error), 0);
        }
    };
    
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

if (!getUpstreamShaMatch || !fetchDocumentationMatch) {
    console.error("Could not extract functions from refresh-docs.js");
    process.exit(1);
}

const getUpstreamSha = eval(`(${getUpstreamShaMatch[0]})`);
const fetchDocumentation = eval(`(${fetchDocumentationMatch[0]})`);


async function runTests() {
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        requestedUrls = [];
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
    // 15. Timeout test
    await test('fetchDocumentation: Request timeout', async () => {
        mockResponses['https://example.com/slow'] = {
            statusCode: 200,
            data: 'Should not complete',
            // Simulate a slow response by not immediately responding
            delay: 20000
        };
        
        // Override the mock to simulate timeout behavior
        const oldGet = https.get;
        https.get = function(urlOrOptions, optionsOrCallback, callback) {
            let url = typeof urlOrOptions === 'string' ? urlOrOptions : null;
            let options = typeof optionsOrCallback === 'object' ? optionsOrCallback : (typeof urlOrOptions === 'object' ? urlOrOptions : {});
            let cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
            
            if (!url && options.hostname && options.path) {
                url = `https://${options.hostname}${options.path}`;
            }
            
            const req = new EventEmitter();
            
            if (options.timeout) {
                setTimeout(() => {
                    req.emit('timeout');
                }, options.timeout);
            }
            
            req.on = (event, handler) => {
                EventEmitter.prototype.on.call(req, event, handler);
                return req;
            };
            
            req.destroy = (error) => {
                if (error) {
                    setTimeout(() => req.emit('error', error), 0);
                }
            };
            
            return req;
        };
        
        try {
            await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/slow' });
            assert.fail('Should have thrown timeout error');
        } catch (e) {
            assert.match(e.message, /Request Timeout/i);
        } finally {
            https.get = oldGet;
        }
    });

    // 16. Response size limit test
    await test('fetchDocumentation: Response size exceeds 10MB', async () => {
        // Create chunks that exceed 10MB
        const largeChunk = Buffer.alloc(6 * 1024 * 1024); // 6MB chunk
        mockResponses['https://example.com/huge'] = {
            statusCode: 200,
            chunks: [largeChunk, largeChunk] // 12MB total
        };
        try {
            await fetchDocumentation('/some/lib', { type: 'url', url: 'https://example.com/huge' });
            assert.fail('Should have thrown size limit error');
        } catch (e) {
            assert.match(e.message, /exceeds 10MB/i);
        }
    });


    console.log(`\nTests complete: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
