// Test-only HTTPS transport used by the isolated refresh-docs end-to-end test.
// It is loaded with NODE_OPTIONS=--require so the updater runs unmodified.

const fs = require('fs');
const EventEmitter = require('events');
const https = require('https');

const configPath = process.env.DOCS_REFRESH_MOCK_CONFIG;
if (!configPath) {
  throw new Error('DOCS_REFRESH_MOCK_CONFIG is required by the documentation refresh mock transport.');
}

const routes = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const requestLog = process.env.DOCS_REFRESH_MOCK_REQUESTS;

function resolveUrl(urlOrOptions) {
  if (typeof urlOrOptions === 'string') return urlOrOptions;
  if (urlOrOptions && urlOrOptions.hostname && urlOrOptions.path) {
    return `https://${urlOrOptions.hostname}${urlOrOptions.path}`;
  }
  return '';
}

https.get = function (urlOrOptions, optionsOrCallback, callback) {
  const url = resolveUrl(urlOrOptions);
  const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;

  if (requestLog) {
    fs.appendFileSync(requestLog, url + '\n');
  }

  const req = new EventEmitter();
  const res = new EventEmitter();
  req.destroy = (error) => { if (error) req.emit('error', error); };
  res.resume = () => {};
  res.destroy = (error) => { if (error) req.emit('error', error); };

  const route = routes[url] || { status: 404, statusMessage: 'Not Found' };

  setTimeout(() => {
    if (route.error) {
      req.emit('error', new Error(route.error));
      return;
    }
    if (route.timeout) {
      req.emit('timeout');
      return;
    }

    res.statusCode = route.status || 200;
    res.statusMessage = route.statusMessage || 'OK';
    res.headers = route.headers || {};

    if (cb) cb(res);
    if (route.body) res.emit('data', route.body);
    res.emit('end');
  }, 0);

  return req;
};

module.exports = {};
