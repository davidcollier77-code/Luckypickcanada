const fs = require('fs');
const https = require('https');
const path = require('path');

const MAX_DOCS_SIZE_BYTES = 495 * 1024 * 1024;
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;
const DEFAULT_RETRY_DELAY_MS = 180 * 1000;
const MIN_DOCUMENT_CHARACTERS = 24;
const MIN_READABLE_WORDS = 5;
const MIN_WORD_CHARACTER_RATIO = 0.5;

let DOCS_DIR = path.join(process.cwd(), '.docs');
let DOCS_BASE_DIR = path.resolve(DOCS_DIR);

function configureDocsDirectory(directory) {
  DOCS_DIR = path.resolve(directory);
  DOCS_BASE_DIR = path.resolve(DOCS_DIR);
}

// Responses that are technically HTTP 200 but are actually an error, challenge
// or API failure page rather than documentation.
const ERROR_PAGE_PATTERNS = [
  { pattern: /^\s*404:?\s+not\s+found\.?\s*$/im, reason: 'download is an HTTP not-found page' },
  { pattern: /<title>\s*(?:40[0-9]|50[0-9])\b[^<]*<\/title>/i, reason: 'download is an HTTP error page' },
  {
    pattern: /<title>[^<]*(?:page not found|access denied|bad gateway|service unavailable|internal server error)[^<]*<\/title>/i,
    reason: 'download is an HTTP error page'
  },
  {
    pattern: /<h1[^>]*>\s*(?:404|403|500|502|503|504)\b[^<]*<\/h1>/i,
    reason: 'download is an HTTP error page'
  },
  { pattern: /\bjust a moment\.\.\./i, reason: 'download is a bot-challenge page, not documentation' },
  { pattern: /\battention required!?\s*\|\s*cloudflare\b/i, reason: 'download is a Cloudflare challenge page' },
  { pattern: /\benable javascript and cookies to continue\b/i, reason: 'download is a bot-challenge page, not documentation' },
  { pattern: /\bverify (?:that )?you are (?:a )?human\b/i, reason: 'download is a bot-challenge page, not documentation' },
  { pattern: /the requested url was not found on this server/i, reason: 'download is an HTTP not-found page' },
  { pattern: /^\s*\{\s*"(?:message|error)"\s*:/i, reason: 'download is a JSON error response' }
];

function safeJoinDocs(...segments) {
  const resolved = path.resolve(DOCS_BASE_DIR, ...segments);
  if (resolved !== DOCS_BASE_DIR && !resolved.startsWith(DOCS_BASE_DIR + path.sep)) {
    throw new Error('Resolved documentation path escapes the .docs directory.');
  }
  return resolved;
}

function resolveDocsPath(...segments) {
  if (fs.lstatSync(DOCS_BASE_DIR).isSymbolicLink()) {
    throw new Error('The .docs directory must not be a symbolic link.');
  }

  const resolved = safeJoinDocs(...segments);
  if (resolved === DOCS_BASE_DIR) return resolved;

  let currentPath = DOCS_BASE_DIR;
  const relativePath = path.relative(DOCS_BASE_DIR, resolved);
  for (const segment of relativePath.split(path.sep).filter(Boolean)) {
    currentPath = path.resolve(currentPath, segment);
    let currentStat;
    try {
      currentStat = fs.lstatSync(currentPath);
    } catch (e) {
      if (e.code === 'ENOENT') {
        continue;
      }
      throw e;
    }

    if (currentStat.isSymbolicLink()) {
      // Symlinked documentation files are intentional deduplication links created by this updater.
      // Permit only a final-path symlink whose fully-resolved target remains inside .docs.
      if (currentPath !== resolved) {
        throw new Error('Documentation paths must not traverse symbolic links.');
      }

      let realTarget;
      try {
        realTarget = fs.realpathSync(currentPath);
      } catch (e) {
        throw new Error('Documentation symlink target could not be resolved safely.');
      }

      if (
        realTarget !== DOCS_BASE_DIR &&
        !realTarget.startsWith(DOCS_BASE_DIR + path.sep)
      ) {
        throw new Error('Documentation symlink target must remain inside the .docs directory.');
      }
    }
  }

  return resolved;
}

function validateGroupName(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value) || path.isAbsolute(value)) {
    throw new Error('Invalid group: unsafe path value.');
  }
  return value;
}

function validateLibraryIdentifier(value) {
  if (
    typeof value !== 'string' ||
    !/^\/?[A-Za-z0-9._/-]+$/.test(value) ||
    value.split(/[\\/]+/).includes('..')
  ) {
    throw new Error('Invalid library: unsafe identifier.');
  }
  return value;
}

function getLibraryFilename(library) {
  return library.replace(/[^A-Za-z0-9_-]/g, '_') + '.md';
}

function lexistsSync(filePath) {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function listDocumentationDirectories(groupsConfig) {
  const directories = new Set(Object.keys(groupsConfig || {}));
  if (fs.existsSync(DOCS_BASE_DIR)) {
    for (const entry of fs.readdirSync(DOCS_BASE_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        directories.add(validateGroupName(entry.name));
      } catch (error) {
        // Ignore directories that are not valid documentation groups.
      }
    }
  }
  return [...directories];
}

/**
 * Basic document-integrity check applied to every downloaded document before
 * it can replace an existing snapshot. It rejects empty, binary, garbled,
 * error-page and bot-challenge responses. It is not a relevance or quality
 * review of documentation content.
 */
function validateDocumentContent(content) {
  if (typeof content !== 'string') {
    return { ok: false, reason: 'download is not text' };
  }
  if (content.trim().length === 0) {
    return { ok: false, reason: 'download is empty' };
  }
  if (content.includes('\u0000')) {
    return { ok: false, reason: 'download contains binary data (NUL bytes)' };
  }
  const undecodable = (content.match(/\uFFFD/g) || []).length;
  if (undecodable > 0) {
    return { ok: false, reason: `download contains ${undecodable} undecodable character(s)` };
  }

  const sample = content.slice(0, 200000);
  const controlCharacters = (sample.match(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g) || []).length;
  if (controlCharacters > Math.max(2, Math.floor(sample.length * 0.001))) {
    return { ok: false, reason: 'download contains excessive control characters' };
  }

  for (const rule of ERROR_PAGE_PATTERNS) {
    if (rule.pattern.test(sample)) {
      return { ok: false, reason: rule.reason };
    }
  }

  const compact = sample.replace(/\s+/g, '');
  if (compact.length < MIN_DOCUMENT_CHARACTERS) {
    return { ok: false, reason: 'download is too short to be usable documentation' };
  }

  const readableWords = sample.match(/\p{L}{3,}/gu) || [];
  if (readableWords.length < MIN_READABLE_WORDS) {
    return { ok: false, reason: 'download does not contain readable text (random characters)' };
  }

  const wordCharacters = (compact.match(/[\p{L}\p{N}]/gu) || []).length;
  if (wordCharacters / compact.length < MIN_WORD_CHARACTER_RATIO) {
    return { ok: false, reason: 'download is mostly symbols or random characters' };
  }

  return { ok: true, reason: null };
}

/**
 * The library manifest is the single allowlist for the updater: only libraries
 * routed in manifest.groups are ever downloaded. Anything else in the manifest
 * indexes is a leftover from a deliberately removed document and is pruned.
 */
function collectRoutedLibraries(groupsConfig) {
  const libraryToGroups = new Map();
  for (const [group, libraries] of Object.entries(groupsConfig || {})) {
    if (!Array.isArray(libraries)) continue;
    const safeGroup = validateGroupName(group);
    for (const library of libraries) {
      const safeLibrary = validateLibraryIdentifier(library);
      if (!libraryToGroups.has(safeLibrary)) {
        libraryToGroups.set(safeLibrary, []);
      }
      const groups = libraryToGroups.get(safeLibrary);
      if (!groups.includes(safeGroup)) groups.push(safeGroup);
    }
  }
  return libraryToGroups;
}

function reconcileManifestIndexes(manifest, routedLibraries) {
  const removed = [];

  if (Array.isArray(manifest.inventory)) {
    const seen = new Set();
    const next = [];
    for (const library of manifest.inventory) {
      if (!routedLibraries.has(library)) {
        removed.push({ library, section: 'inventory', reason: 'document is no longer routed to a group' });
        continue;
      }
      if (seen.has(library)) {
        removed.push({ library, section: 'inventory', reason: 'duplicate inventory entry' });
        continue;
      }
      seen.add(library);
      next.push(library);
    }
    manifest.inventory = next;
  }

  for (const section of ['sources', 'githubShas']) {
    const values = manifest[section];
    if (!values || typeof values !== 'object' || Array.isArray(values)) continue;
    for (const library of Object.keys(values)) {
      if (!routedLibraries.has(library)) {
        delete values[library];
        removed.push({ library, section, reason: 'document is no longer routed to a group' });
      }
    }
  }

  return removed;
}

/**
 * Deletes updater-managed snapshots and symlinks for documents that are no
 * longer routed. This is the permanent-removal guarantee: removing a document
 * from the manifest also removes its updater-managed files on the next run.
 */
function removeStaleSnapshots(groupsConfig, removedLibraries) {
  const removedFilenames = new Map(
    [...removedLibraries].map((library) => [getLibraryFilename(library), library])
  );
  const removed = [];

  for (const group of listDocumentationDirectories(groupsConfig)) {
    const libraries = Array.isArray((groupsConfig || {})[group]) ? groupsConfig[group] : [];
    const safeGroup = validateGroupName(group);
    const groupDir = safeJoinDocs(safeGroup);
    if (!fs.existsSync(groupDir)) continue;
    const expected = new Set(libraries.map(getLibraryFilename));

    for (const entry of fs.readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.name.endsWith('.md') || entry.name.includes('.tmp.')) continue;
      const filePath = safeJoinDocs(safeGroup, entry.name);

      if (entry.isSymbolicLink() && !expected.has(entry.name)) {
        fs.unlinkSync(filePath);
        removed.push({
          group,
          filename: entry.name,
          library: removedFilenames.get(entry.name) || null,
          reason: 'symlink for a document no longer routed in this group'
        });
      } else if (!entry.isSymbolicLink() && removedFilenames.has(entry.name)) {
        fs.unlinkSync(filePath);
        removed.push({
          group,
          filename: entry.name,
          library: removedFilenames.get(entry.name),
          reason: 'document removed from the library manifest'
        });
      }
    }
  }

  return removed;
}

function writeDocumentationLink(linkPath, relativeTarget, fallbackContent) {
  const tempLinkPath = linkPath + '.tmp.symlink.' + Date.now();
  try {
    fs.symlinkSync(relativeTarget, tempLinkPath);
    fs.renameSync(tempLinkPath, linkPath);
    return 'symlink';
  } catch (error) {
    if (fs.existsSync(tempLinkPath)) fs.unlinkSync(tempLinkPath);
    const tempDocPath = linkPath + '.tmp.copy.' + Date.now();
    try {
      fs.writeFileSync(tempDocPath, fallbackContent);
      fs.renameSync(tempDocPath, linkPath);
    } catch (writeError) {
      if (fs.existsSync(tempDocPath)) fs.unlinkSync(tempDocPath);
      throw writeError;
    }
    return 'copy';
  }
}

/**
 * Repairs broken or incorrect internal documentation links and removes stale
 * links for documents assigned to another group. A differing regular file is
 * reported and left untouched rather than overwritten.
 */
function repairDocumentationLinks(groupsConfig) {
  const repaired = [];
  const problems = [];
  const libraryToGroups = collectRoutedLibraries(groupsConfig);
  const primaryGroupByLibrary = new Map();
  for (const [library, groups] of libraryToGroups) {
    primaryGroupByLibrary.set(library, groups[0]);
  }

  for (const [library, groups] of libraryToGroups) {
    const primaryGroup = groups[0];
    const filename = getLibraryFilename(library);
    const primaryPath = safeJoinDocs(primaryGroup, filename);
    let primaryContent;
    try {
      primaryContent = fs.readFileSync(primaryPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        problems.push({
          library,
          issue: `primary snapshot is missing at .docs/${primaryGroup}/${filename}`
        });
        continue;
      }
      throw error;
    }
    const realPrimary = fs.realpathSync(primaryPath);

    for (const group of groups.slice(1)) {
      const groupDir = safeJoinDocs(group);
      const linkPath = safeJoinDocs(group, filename);
      const relativeTarget = path.relative(groupDir, primaryPath);

      let stat = null;
      try {
        stat = fs.lstatSync(linkPath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      if (!stat) {
        const mode = writeDocumentationLink(linkPath, relativeTarget, primaryContent);
        repaired.push({
          path: `.docs/${group}/${filename}`,
          action: 'created missing documentation link',
          detail: mode === 'symlink'
            ? `links to .docs/${primaryGroup}/${filename}`
            : 'symlinks are unavailable on this filesystem; wrote an identical copy'
        });
        continue;
      }

      if (stat.isSymbolicLink()) {
        let resolved = null;
        try {
          resolved = fs.realpathSync(linkPath);
        } catch (error) {
          resolved = null;
        }
        if (resolved !== realPrimary) {
          writeDocumentationLink(linkPath, relativeTarget, primaryContent);
          repaired.push({
            path: `.docs/${group}/${filename}`,
            action: resolved
              ? 'repaired incorrect documentation symlink'
              : 'repaired broken documentation symlink',
            detail: `links to .docs/${primaryGroup}/${filename}`
          });
        }
        continue;
      }

      if (stat.isFile()) {
        const existing = fs.readFileSync(linkPath);
        if (existing.equals(primaryContent)) {
          writeDocumentationLink(linkPath, relativeTarget, primaryContent);
          repaired.push({
            path: `.docs/${group}/${filename}`,
            action: 'replaced duplicate documentation copy with a symlink',
            detail: `links to .docs/${primaryGroup}/${filename}`
          });
        } else {
          problems.push({
            library,
            issue: `duplicate copy at .docs/${group}/${filename} differs from the primary snapshot; left unchanged for review`
          });
        }
        continue;
      }

      problems.push({
        library,
        issue: `unexpected filesystem entry at .docs/${group}/${filename}; left unchanged`
      });
    }
  }

  // Leftover snapshots for a routed library that is no longer assigned to a group.
  const routedByFilename = new Map(
    [...libraryToGroups.keys()].map((library) => [getLibraryFilename(library), library])
  );
  for (const group of listDocumentationDirectories(groupsConfig)) {
    const libraries = Array.isArray((groupsConfig || {})[group]) ? groupsConfig[group] : [];
    const expected = new Set(libraries.map(getLibraryFilename));
    const groupDir = safeJoinDocs(validateGroupName(group));
    if (!fs.existsSync(groupDir)) continue;

    for (const entry of fs.readdirSync(groupDir, { withFileTypes: true })) {
      if (expected.has(entry.name) || !entry.name.endsWith('.md') || entry.name.includes('.tmp.')) continue;
      const library = routedByFilename.get(entry.name);
      if (!library) continue;
      const filePath = safeJoinDocs(group, entry.name);

      if (entry.isSymbolicLink()) {
        fs.unlinkSync(filePath);
        repaired.push({
          path: `.docs/${group}/${entry.name}`,
          action: 'removed stale documentation symlink',
          detail: `library is routed only to ${libraryToGroups.get(library).join(', ')}`
        });
        continue;
      }

      if (!entry.isFile()) continue;
      const primaryPath = safeJoinDocs(primaryGroupByLibrary.get(library), entry.name);
      try {
        if (fs.readFileSync(primaryPath).equals(fs.readFileSync(filePath))) {
          fs.unlinkSync(filePath);
          repaired.push({
            path: `.docs/${group}/${entry.name}`,
            action: 'removed duplicate documentation snapshot from an unassigned group',
            detail: 'identical to the primary snapshot'
          });
        } else {
          problems.push({
            library,
            issue: `snapshot at .docs/${group}/${entry.name} is not assigned to this group and differs from the primary snapshot; left unchanged for review`
          });
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        problems.push({
          library,
          issue: `snapshot at .docs/${group}/${entry.name} is not assigned to this group and its primary copy is missing; left unchanged`
        });
      }
    }
  }

  return { repaired, problems };
}

/**
 * Reports routing, snapshot and link inconsistencies without guessing content
 * or changing source URLs.
 */
function auditLibraryConsistency(groupsConfig, sourcesConfig) {
  const issues = [];
  const libraryToGroups = collectRoutedLibraries(groupsConfig);
  const routedByFilename = new Map(
    [...libraryToGroups.keys()].map((library) => [getLibraryFilename(library), library])
  );

  for (const [library, groups] of libraryToGroups) {
    const filename = getLibraryFilename(library);
    if (!sourcesConfig[library]) {
      issues.push({
        library,
        issue: 'routed document has no source configuration; it cannot be refreshed'
      });
    }
    for (const group of groups) {
      const docPath = safeJoinDocs(group, filename);
      if (!fs.existsSync(docPath)) {
        issues.push({
          library,
          issue: `missing snapshot at .docs/${group}/${filename}`
        });
        continue;
      }
      if (group === groups[0]) {
        const validation = validateDocumentContent(fs.readFileSync(docPath, 'utf8'));
        if (!validation.ok) {
          issues.push({
            library,
            issue: `existing snapshot is not valid documentation: ${validation.reason}`
          });
        }
      }
    }
  }

  for (const group of listDocumentationDirectories(groupsConfig)) {
    const libraries = Array.isArray((groupsConfig || {})[group]) ? groupsConfig[group] : [];
    const expected = new Set(libraries.map(getLibraryFilename));
    const groupDir = safeJoinDocs(validateGroupName(group));
    if (!fs.existsSync(groupDir)) continue;

    for (const entry of fs.readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.name.endsWith('.md') || entry.name.includes('.tmp.') || expected.has(entry.name)) continue;
      issues.push({
        library: routedByFilename.get(entry.name) || null,
        issue: `unmanaged snapshot at .docs/${group}/${entry.name} is not assigned to this group; review or remove it`
      });
    }
  }

  return issues;
}

const getHalifaxTimestamp = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Halifax',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const d = {};
  parts.forEach(({ type, value }) => { d[type] = value; });
  const dateInHalifax = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Halifax' }));
  const dateInUTC = new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' }));
  const diffHours = Math.round((dateInHalifax - dateInUTC) / 3600000);
  const offsetStr = (diffHours >= 0 ? '+' : '-') + Math.abs(diffHours).toString().padStart(2, '0') + ':00';
  return `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}:${d.second}${offsetStr}`;
};

function getDirSize(dirPath) {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const filePath = safeJoinDocs(path.relative(DOCS_BASE_DIR, dirPath), files[i]);
    const stats = fs.lstatSync(filePath);
    if (stats.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stats.size;
    }
  }
  return size;
}

/**
 * Detects the primary line-ending style used in a file.
 * Returns '\r\n' when CRLF is dominant, otherwise '\n'.
 */
function detectLineEnding(content) {
  if (!content || content.length === 0) {
    return '\n';
  }

  const crlfCount = (content.match(/\r\n/g) || []).length;
  const lfCount = (content.match(/(?<!\r)\n/g) || []).length;

  // If CRLF appears more frequently, use CRLF; otherwise use LF
  return crlfCount > lfCount ? '\r\n' : '\n';
}

/**
 * Normalizes volatile Devsite metadata to prevent false documentation differences.
 */
function normalizeDevsiteMetadata(content) {
  if (!content) return content;
  // Normalize nonce attributes
  let normalized = content.replace(/nonce="[^"]+"/g, 'nonce="[NONCE]"');

  // Normalize volatile JSON payload arrays that Devsite injects in inline scripts
  // Specifically the one matching GoogleDevelopersObject
  normalized = normalized.replace(/(<script nonce="\[NONCE\]">\s*\(function\(d,e,v,s,i,t,E\)\{d\['GoogleDevelopersObject'\]=i;[\s\S]*?)(,\s*'\s*\[[\s\S]*?\]')(.*<\/script>)/g, '$1, \'[NORMALIZED_DEVSITE_METADATA]\'$3');

  return normalized;
}

/**
 * Normalizes line endings in content to LF for comparison purposes.
 * It also trims trailing whitespace/newlines for consistency.
 */
function normalizeLineEndings(content) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}$/, '\n')
    .trimEnd() + '\n';
}

/**
 * Converts content to use the specified line-ending style.
 */
function convertLineEndings(content, lineEnding) {
  // First normalize ONLY line endings to LF for standard processing
  const normalized = content.replace(/\r\n/g, '\n');
  if (lineEnding === '\r\n') {
    return normalized.replace(/\n/g, '\r\n');
  }
  return normalized;
}

function fetchDocumentation(lib, sourceConfig) {
  return new Promise((resolve, reject) => {
    if (!sourceConfig || sourceConfig.type !== 'url' || !sourceConfig.url) {
      return reject(new Error('Invalid or missing source configuration.'));
    }

    const fetchWithRedirects = (currentUrl, redirectCount) => {
      if (redirectCount <= 0) {
        return reject(new Error('Too many redirects'));
      }

      https.get(currentUrl, {
        headers: {
          'User-Agent': 'LuckyPickCanada-DocsUpdater/1.0'
        },
        timeout: 15000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Drain the response so socket can be closed/reused
          res.resume();
          let redirectUrl = res.headers.location;
          try {
            redirectUrl = new URL(redirectUrl, currentUrl).href;
          } catch (e) {
            return reject(new Error('Invalid redirect URL'));
          }
          return fetchWithRedirects(redirectUrl, redirectCount - 1);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        let data = '';
        let totalSize = 0;
        res.on('data', chunk => {
          totalSize += chunk.length;
          if (totalSize > MAX_DOWNLOAD_BYTES) {
            res.destroy(new Error('Response size exceeds 10MB limit'));
            return;
          }
          data += chunk;
        });
        res.on('end', () => {
          // Basic sanitization: remove known sensitive token patterns that might leak in docs (e.g. Star History sealed_token)
          const sanitizedData = data.replace(/sealed_token=[^&"'\s]+/g, 'sealed_token=REDACTED');
          resolve(sanitizedData);
        });
      }).on('error', reject).on('timeout', function () { this.destroy(new Error('Request Timeout')); });
    };

    fetchWithRedirects(sourceConfig.url, 5);
  });
}

function getUpstreamSha(lib, sourceConfig) {
  return new Promise((resolve) => {
    if (!lib.startsWith('/')) {
      resolve(null);
      return;
    }
    if (!sourceConfig || sourceConfig.type !== 'url' || !sourceConfig.url) {
      resolve(null);
      return;
    }

    let branch = 'HEAD';
    if (sourceConfig.branch || sourceConfig.ref) {
      branch = sourceConfig.branch || sourceConfig.ref;
    } else {
      try {
        const urlObj = new URL(sourceConfig.url);
        if (urlObj.hostname === 'raw.githubusercontent.com') {
          // Path is usually /owner/repo/branch/path...
          // But branch names can contain slashes (e.g. feature/add-docs)
          // We should match known standard branches, or return null if it's too ambiguous
          const pathname = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
          const pathParts = pathname.split('/');

          if (pathParts.length >= 3) {
            const remainingPath = pathParts.slice(2).join('/');

            const knownBranches = ['main/', 'master/', 'canary/', 'develop/', 'production/'];
            let foundBranch = null;
            for (const kb of knownBranches) {
              if (remainingPath.startsWith(kb)) {
                foundBranch = kb.substring(0, kb.length - 1); // remove trailing slash
                break;
              }
            }

            if (foundBranch) {
              branch = foundBranch;
            } else {
              // Branch could have slashes, too ambiguous to guess safely without explicit metadata.
              resolve(null);
              return;
            }
          } else {
            resolve(null);
            return;
          }
        } else {
          resolve(null); // Not a github raw url, fall back to comparing bytes
          return;
        }
      } catch (e) {
        resolve(null);
        return;
      }
    }

    const parts = lib.split('/');
    if (parts.length >= 3) {
      const org = parts[1];
      const repo = parts[2];

      // Use encodeURIComponent for branch in case it contains slashes, but the known ones don't. Still good practice.
      const safeBranch = encodeURIComponent(branch);
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${org}/${repo}/commits/${safeBranch}`,
        headers: {
          'User-Agent': 'Node.js Context7 Refresher',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      if (process.env.GITHUB_TOKEN) {
        options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      https.get(options, (res) => {
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.sha);
            } catch (e) {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      }).on('error', () => resolve(null));
    } else {
      resolve(null);
    }
  });
}

function saveManifest(inventory, shas, sources, groups, updateTimestamp = true) {
  const timestamp = getHalifaxTimestamp();

  const manifestPath = resolveDocsPath('manifest.json');
  let currentManifest = {};
  if (fs.existsSync(manifestPath)) {
    currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  const manifestData = {
    lastUpdated: updateTimestamp ? timestamp : (currentManifest.lastUpdated || timestamp),
    groups: groups || currentManifest.groups || {},
    sources: sources || currentManifest.sources || {},
    inventory: Array.from(inventory),
    githubShas: shas
  };
  const tempFilename = 'manifest.json.tmp.' + Date.now();
  const tempManifestPath = resolveDocsPath(tempFilename);
  try {
    fs.writeFileSync(tempManifestPath, JSON.stringify(manifestData, null, 2) + '\n');
    fs.renameSync(tempManifestPath, manifestPath);
  } catch (e) {
    if (fs.existsSync(tempManifestPath)) fs.unlinkSync(tempManifestPath);
    throw e;
  }
}

function cleanupStaleTempFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = safeJoinDocs(path.relative(DOCS_BASE_DIR, dirPath), entry.name);
    if (entry.isDirectory()) {
      cleanupStaleTempFiles(entryPath);
    } else if (entry.isFile() && entry.name.includes('.tmp.')) {
      try {
        fs.unlinkSync(entryPath);
        console.log(`Removed stale temp file: ${entryPath}`);
      } catch (e) {
        console.warn(`Could not remove stale temp file ${entryPath}:`, e.message);
      }
    }
  }
}

function createRefreshReport() {
  return {
    timestamp: getHalifaxTimestamp(),
    updated: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
    rejected: 0,
    pending: 0,
    batches: 0,
    bytesAdded: 0,
    finalSize: 0,
    downloadFailures: [],
    validationRejections: [],
    removedLibraries: [],
    removedSnapshots: [],
    repairedLinks: [],
    linkProblems: [],
    consistencyIssues: [],
    errors: []
  };
}

function escapeTableCell(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function renderRefreshReport(report) {
  const failed = report.errors.length > 0;
  const lines = [];
  lines.push('## Documentation Refresh Report');
  lines.push('');
  lines.push(`- **Timestamp:** ${report.timestamp}`);
  lines.push(`- **Result:** ${failed ? 'FAILED' : 'SUCCESS'}`);
  lines.push(
    `- **Summary:** ${report.updated} updated · ${report.unchanged} unchanged · ${report.skipped} skipped · ` +
    `${report.failed} download failure(s) · ${report.rejected} rejected download(s)`
  );
  lines.push(`- **Library size:** ${report.finalSize} bytes (${(report.finalSize / 1024 / 1024).toFixed(2)} MB)`);
  lines.push('');

  lines.push('### Broken source URLs and download failures');
  lines.push('');
  if (report.downloadFailures.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| Document | Source URL | Error |');
    lines.push('| --- | --- | --- |');
    for (const failure of report.downloadFailures) {
      lines.push(
        `| \`${escapeTableCell(failure.library)}\` | ${escapeTableCell(failure.url)} | ` +
        `${escapeTableCell(failure.error)} (${failure.attempts} attempt(s)) |`
      );
    }
    lines.push('');
    lines.push('The existing good document was preserved where one existed. Source URLs were not changed automatically; review and correct them in a pull request.');
  }
  lines.push('');

  lines.push('### Rejected downloads (integrity validation)');
  lines.push('');
  if (report.validationRejections.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| Document | Source URL | Reason | Existing document |');
    lines.push('| --- | --- | --- | --- |');
    for (const rejection of report.validationRejections) {
      lines.push(
        `| \`${escapeTableCell(rejection.library)}\` | ${escapeTableCell(rejection.url)} | ` +
        `${escapeTableCell(rejection.reason)} | ${rejection.preserved ? 'Preserved' : 'None — download rejected'} |`
      );
    }
  }
  lines.push('');

  lines.push('### Deliberately removed documents reconciled');
  lines.push('');
  if (report.removedLibraries.length === 0 && report.removedSnapshots.length === 0) {
    lines.push('None.');
  } else {
    for (const entry of report.removedLibraries) {
      lines.push(`- \`${entry.library}\` — removed from \`${entry.section}\` (${entry.reason}); it will not be downloaded.`);
    }
    for (const entry of report.removedSnapshots) {
      lines.push(`- \`.docs/${entry.group}/${entry.filename}\` — deleted (${entry.reason}).`);
    }
  }
  lines.push('');

  lines.push('### Repaired documentation links');
  lines.push('');
  if (report.repairedLinks.length === 0) {
    lines.push('None.');
  } else {
    for (const repair of report.repairedLinks) {
      lines.push(`- \`${repair.path}\` — ${repair.action} (${repair.detail}).`);
    }
  }
  lines.push('');

  lines.push('### Library consistency review');
  lines.push('');
  const review = report.consistencyIssues.concat(report.linkProblems);
  if (review.length === 0) {
    lines.push('No inconsistencies detected.');
  } else {
    for (const issue of review) {
      const prefix = issue.library ? `\`${issue.library}\` — ` : '';
      lines.push(`- ${prefix}${issue.issue}`);
    }
  }
  lines.push('');

  lines.push('### Errors');
  lines.push('');
  if (report.errors.length === 0) {
    lines.push('None.');
  } else {
    for (const error of report.errors) {
      lines.push(`- ${error}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

function writeRefreshReport(reportPath, report) {
  const markdown = renderRefreshReport(report);
  if (reportPath) {
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(reportPath, markdown + '\n');
  }
  return markdown;
}

function parseArgs(argv) {
  const options = {
    docsDir: process.env.DOCS_REFRESH_DOCS_DIR || DOCS_DIR,
    reportPath: process.env.DOCS_REFRESH_REPORT_PATH || null
  };
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i];
    if (argument === '--docs-dir') {
      const value = argv[++i];
      if (!value) throw new Error('--docs-dir requires a directory path.');
      options.docsDir = value;
    } else if (argument === '--report') {
      const value = argv[++i];
      if (!value) throw new Error('--report requires a file path.');
      options.reportPath = value;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function getRetryDelayMs() {
  const configured = process.env.DOCS_REFRESH_RETRY_DELAY_MS;
  if (configured === undefined || configured === '') return DEFAULT_RETRY_DELAY_MS;
  const value = Number(configured);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_RETRY_DELAY_MS;
  return value;
}

async function runRefresh(options, report) {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  cleanupStaleTempFiles(DOCS_DIR);

  const manifestPath = resolveDocsPath('manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('CRITICAL: .docs/manifest.json not found.');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Invalid documentation manifest.');
  }
  if (!manifest.groups || typeof manifest.groups !== 'object' || Array.isArray(manifest.groups)) {
    throw new Error('Invalid documentation manifest: groups must be an object.');
  }

  const groupsConfig = manifest.groups;
  const libraryToGroups = collectRoutedLibraries(groupsConfig);
  const routedLibraries = new Set(libraryToGroups.keys());

  const originalInventory = Array.isArray(manifest.inventory) ? manifest.inventory.slice() : [];
  report.removedLibraries = reconcileManifestIndexes(manifest, routedLibraries);

  const sourcesConfig = manifest.sources && typeof manifest.sources === 'object' && !Array.isArray(manifest.sources)
    ? manifest.sources
    : {};
  const githubShas = manifest.githubShas && typeof manifest.githubShas === 'object' && !Array.isArray(manifest.githubShas)
    ? manifest.githubShas
    : {};

  const inventory = new Set();
  for (const library of originalInventory) {
    if (routedLibraries.has(library)) inventory.add(library);
  }
  for (const library of routedLibraries) inventory.add(library);

  for (const [group, libraries] of Object.entries(groupsConfig)) {
    if (!Array.isArray(libraries)) throw new Error(`Invalid documentation manifest: group ${group} must be an array.`);
    const groupDir = resolveDocsPath(validateGroupName(group));
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir, { recursive: true });
    }
  }

  const removedLibraryIds = new Set(report.removedLibraries.map((entry) => entry.library));
  report.removedSnapshots = removeStaleSnapshots(groupsConfig, removedLibraryIds);

  const inventoryNeedsSave =
    JSON.stringify(Array.from(inventory)) !== JSON.stringify(originalInventory);
  if (report.removedLibraries.length > 0 || report.removedSnapshots.length > 0 || inventoryNeedsSave) {
    saveManifest(inventory, githubShas, sourcesConfig, groupsConfig, false);
    if (report.removedLibraries.length > 0 || report.removedSnapshots.length > 0) {
      console.log(
        `Reconciled deliberately removed documents: ${report.removedLibraries.length} manifest entr${report.removedLibraries.length === 1 ? 'y' : 'ies'} pruned, ` +
        `${report.removedSnapshots.length} snapshot(s) deleted.`
      );
    }
  }

  const pendingUpdates = [];
  for (const [library, groups] of libraryToGroups) {
    pendingUpdates.push({ lib: library, groups });
  }

  let stats = {
    updated: 0,
    failed: 0,
    skipped: 0,
    unchanged: 0,
    rejected: 0,
    pending: pendingUpdates.length,
    bytesAdded: 0,
    batches: 0,
    errors: []
  };

  const retryDelayMs = getRetryDelayMs();
  const timestamp = getHalifaxTimestamp();
  report.timestamp = timestamp;

  while (pendingUpdates.length > 0) {
    stats.batches++;
    console.log(`Starting Batch ${stats.batches}...`);

    // Independently calculate current docs size
    let currentDocsSize = getDirSize(DOCS_DIR);
    console.log(`Current .docs size: ${(currentDocsSize / 1024 / 1024).toFixed(2)} MB`);

    let batchContinues = true;
    let deferredUpdates = [];
    // Only true when a write actually changes .docs / currentDocsSize, so the
    // hard-ceiling guard below isn't fooled by unrelated skips/failures into
    // retrying a capacity-deferred library for an extra batch before reporting deadlock.
    let capacityProgressMade = false;

    while (batchContinues && pendingUpdates.length > 0) {
      const nextUpdate = pendingUpdates.shift();
      const lib = nextUpdate.lib;
      const groups = nextUpdate.groups;

      const safeLib = validateLibraryIdentifier(lib);
      const safeName = getLibraryFilename(safeLib);
      // For size calculation, check the first group's file
      const firstGroup = validateGroupName(groups[0]);
      const firstDocPath = safeJoinDocs(firstGroup, safeName);

      let existingSize = 0;
      let contentBefore = null;
      let existingLineEnding = '\n';
      if (fs.existsSync(firstDocPath)) {
        // If we had a symlink, lstat or stat size? We use the actual content length if we read it
        contentBefore = fs.readFileSync(firstDocPath, 'utf8');
        existingSize = Buffer.byteLength(contentBefore, 'utf8');
        existingLineEnding = detectLineEnding(contentBefore);
      }

      // For genuinely new files, use LF (repository convention)
      if (!contentBefore) {
        existingLineEnding = '\n';
      }

      const sourceConfig = sourcesConfig[lib];

      if (!sourceConfig) {
        console.log(`UNRESOLVED SOURCE: No verified source configuration for ${lib}. Skipping.`);
        stats.skipped++;
        stats.pending--;
        report.consistencyIssues.push({
          library: lib,
          issue: 'routed document has no source configuration; it was skipped and cannot be refreshed'
        });
        continue;
      }

      // Check upstream SHA if possible
      let allDocsExist = true;
      for (const group of groups) {
        const safeGroup = validateGroupName(group);
        const docPath = safeJoinDocs(safeGroup, safeName);
        if (!lexistsSync(docPath)) {
          allDocsExist = false;
          break;
        }
      }

      const upstreamSha = await getUpstreamSha(lib, sourceConfig);
      if (upstreamSha && upstreamSha === githubShas[lib] && allDocsExist) {
        console.log(`SKIPPED: ${lib} (upstream SHA ${upstreamSha} has not changed)`);
        stats.skipped++;
        stats.pending--;
        continue;
      }

      let output;
      let fetchSuccess = false;

      try {
        console.log(`Fetching docs for ${lib} using configured source to determine exact size BEFORE downloading into .docs...`);
        output = await fetchDocumentation(lib, sourceConfig);
        fetchSuccess = true;
      } catch (e) {
        console.error(`Failed to fetch docs for ${lib} on first attempt:`, e.message);
        console.log(`Waiting ${Math.round(retryDelayMs / 1000)} seconds before retrying ${lib}...`);

        await new Promise(resolve => setTimeout(resolve, retryDelayMs));

        try {
          console.log(`Retrying fetch for ${lib}...`);
          output = await fetchDocumentation(lib, sourceConfig);
          fetchSuccess = true;
        } catch (retryError) {
          console.error(`Failed to fetch docs for ${lib} on retry:`, retryError.message);
          // Record as failed, not skipped. The existing good document is never touched.
          stats.failed++;
          stats.errors.push(`Failed to fetch ${lib} after 2 attempts from ${sourceConfig.url}: ${retryError.message}`);
          report.downloadFailures.push({
            library: lib,
            url: sourceConfig.url,
            attempts: 2,
            error: retryError.message
          });
          stats.pending--;
          continue;
        }
      }

      if (!fetchSuccess) {
        stats.pending--;
        continue;
      }

      // Every downloaded document must pass the integrity check before it can
      // replace an existing snapshot or create a new one.
      const validation = validateDocumentContent(output);
      if (!validation.ok) {
        const existingCopyPreserved = contentBefore !== null;
        stats.rejected++;
        stats.pending--;
        stats.errors.push(
          `Rejected download for ${lib} from ${sourceConfig.url}: ${validation.reason}` +
          (existingCopyPreserved ? ' (existing document preserved)' : ' (no existing copy; nothing written)')
        );
        report.validationRejections.push({
          library: lib,
          url: sourceConfig.url,
          reason: validation.reason,
          preserved: existingCopyPreserved
        });
        console.error(
          `REJECTED: ${lib} from ${sourceConfig.url}: ${validation.reason}` +
          (existingCopyPreserved ? ' — existing document preserved.' : ' — no existing copy was written.')
        );
        continue;
      }

      const exactSize = Buffer.byteLength(output, 'utf8');

      // Convert output to match existing file's line-ending style
      const outputWithCorrectLineEndings = convertLineEndings(output, existingLineEnding);
      const finalSize = Buffer.byteLength(outputWithCorrectLineEndings, 'utf8');
      const netSizeIncrease = finalSize - existingSize;

      if (currentDocsSize + netSizeIncrease > MAX_DOCS_SIZE_BYTES) {
        console.log(`Library ${lib} (exact size ${exactSize} bytes) would exceed 495 MB limit (current: ${currentDocsSize}, net increase: ${netSizeIncrease}).`);

        if (netSizeIncrease > MAX_DOCS_SIZE_BYTES) {
          console.log(`Library ${lib} itself exceeds the 495 MB limit. Marking as failed.`);
          stats.failed++;
          stats.errors.push(`Library ${lib} exceeds 495 MB limit individually.`);
          stats.pending--;
        } else {
          console.log('Deferring to next batch pass.');
          deferredUpdates.push(nextUpdate);
        }
        continue;
      }

      // It fits! We can now process it into .docs
      stats.pending--;

      let isNewOrUpdated = false;
      let isContentUpdated = false;

      // Compare normalized versions to ignore line-ending differences
      const normalizedBefore = contentBefore ? normalizeDevsiteMetadata(normalizeLineEndings(contentBefore)) : null;
      const normalizedOutput = normalizeDevsiteMetadata(normalizeLineEndings(output));
      if (normalizedBefore === normalizedOutput) {
        console.log(`CURRENT: ${lib} (no changes)`);
        stats.unchanged++;

        // Ensure symlinks/files exist for ALL groups just in case
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const safeGroup = validateGroupName(group);
          const groupDir = safeJoinDocs(safeGroup);
          const docPath = safeJoinDocs(safeGroup, safeName);

          if (i === 0) {
            if (!lexistsSync(docPath)) {
              const tempPath = docPath + '.tmp.' + Date.now();
              try {
                fs.writeFileSync(tempPath, outputWithCorrectLineEndings);
                fs.renameSync(tempPath, docPath);
              } catch (e) {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                throw e;
              }
            }
          } else {
            if (!lexistsSync(docPath)) {
              try {
                const safeFirstGroup = validateGroupName(groups[0]);
                const relativeTarget = path.relative(groupDir, safeJoinDocs(safeFirstGroup, safeName));
                fs.symlinkSync(relativeTarget, docPath);
              } catch (e) {
                // fallback
                const tempPath = docPath + '.tmp.' + Date.now();
                try {
                  fs.writeFileSync(tempPath, outputWithCorrectLineEndings);
                  fs.renameSync(tempPath, docPath);
                } catch (err) {
                  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                  throw err;
                }
              }
            }
          }
        }
      } else {
        console.log(`UPDATED: ${lib}`);
        // Capture size before write to check if it actually freed capacity
        const sizeBeforeWrite = currentDocsSize;
        stats.updated++;

        // Write primary copy to first group
        const safeFirstGroup = validateGroupName(groups[0]);
        const firstGroupPath = safeJoinDocs(safeFirstGroup, safeName);
        const tempPath1 = firstGroupPath + '.tmp.' + Date.now();
        try {
          fs.writeFileSync(tempPath1, outputWithCorrectLineEndings);
          fs.renameSync(tempPath1, firstGroupPath);
        } catch (e) {
          if (fs.existsSync(tempPath1)) fs.unlinkSync(tempPath1);
          throw e;
        }

        // Write symlinks for subsequent groups
        for (let i = 1; i < groups.length; i++) {
          const safeGroup = validateGroupName(groups[i]);
          const groupDir = safeJoinDocs(safeGroup);
          const docPath = safeJoinDocs(safeGroup, safeName);
          const tempSymlinkPath = docPath + '.tmp.symlink.' + Date.now();
          try {
            const relativeTarget = path.relative(groupDir, firstGroupPath);
            fs.symlinkSync(relativeTarget, tempSymlinkPath);
            fs.renameSync(tempSymlinkPath, docPath);
          } catch (e) {
            if (fs.existsSync(tempSymlinkPath)) fs.unlinkSync(tempSymlinkPath);
            console.warn(`Symlink failed for ${docPath}, falling back to writing file: `, e.message);
            const tempDocPath = docPath + '.tmp.copy.' + Date.now();
            try {
              fs.writeFileSync(tempDocPath, outputWithCorrectLineEndings);
              fs.renameSync(tempDocPath, docPath);
            } catch (err) {
              if (fs.existsSync(tempDocPath)) fs.unlinkSync(tempDocPath);
              throw err;
            }
          }
        }
        // only add netSizeIncrease once
        if (netSizeIncrease > 0) {
          stats.bytesAdded += netSizeIncrease;
        }
        isNewOrUpdated = true;
        isContentUpdated = true;

        // Update size after write to determine actual capacity impact
        const sizeAfterWrite = getDirSize(DOCS_DIR);
        // Only mark capacity progress if the write actually reduced .docs size
        if (sizeAfterWrite < sizeBeforeWrite) {
          capacityProgressMade = true;
        }
      }

      if (upstreamSha) {
        githubShas[lib] = upstreamSha;
        isNewOrUpdated = true;
      }

      if (isNewOrUpdated) {
        saveManifest(inventory, githubShas, sourcesConfig, groupsConfig, isContentUpdated);
      }

      // Update current docs size using strict filesystem measurement to be safe
      currentDocsSize = getDirSize(DOCS_DIR);
    }

    if (deferredUpdates.length > 0) {
      if (!capacityProgressMade) {
        console.error(`Hard ceiling deadlock: No space freed and no pending resources can fit.`);
        console.error(`Current size: ${currentDocsSize} bytes, Maximum: ${MAX_DOCS_SIZE_BYTES} bytes`);
        console.error(`No pending library can fit under the hard ceiling.`);
        stats.errors.push(`Hard ceiling deadlock: No progress possible after batch ${stats.batches}`);
        break;
      } else {
        console.log(`Batch finished. ${deferredUpdates.length} resources deferred to next pass.`);
        // Put deferred updates back into pending for the next batch iteration
        pendingUpdates.push(...deferredUpdates);
      }
    }
  }

  // Repair links after downloads so newly fetched snapshots can be linked.
  const linkResult = repairDocumentationLinks(groupsConfig);
  report.repairedLinks = linkResult.repaired;
  report.linkProblems = linkResult.problems;

  report.consistencyIssues.push(...auditLibraryConsistency(groupsConfig, sourcesConfig));

  report.updated = stats.updated;
  report.unchanged = stats.unchanged;
  report.skipped = stats.skipped;
  report.failed = stats.failed;
  report.rejected = stats.rejected;
  report.pending = stats.pending;
  report.batches = stats.batches;
  report.bytesAdded = stats.bytesAdded;
  report.finalSize = getDirSize(DOCS_DIR);
  report.errors.push(...stats.errors.map((error) => error));
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  configureDocsDirectory(options.docsDir);

  console.log('Starting continuous documentation refresh...');
  const report = createRefreshReport();

  try {
    await runRefresh(options, report);
  } catch (error) {
    report.errors.push(error && error.message ? error.message : String(error));
    console.error(error);
  }

  if (report.finalSize === 0 && fs.existsSync(DOCS_DIR)) {
    try {
      report.finalSize = getDirSize(DOCS_DIR);
    } catch (error) {
      // Size reporting is best-effort after a fatal failure.
    }
  }

  const failed = report.errors.length > 0;
  const failMsg = `FAILED — [${report.timestamp}] — VERIFICATION FAILED`;
  const successMsg = `SUCCESS — [${report.timestamp}] — VERIFIED`;

  console.log(`\n--- DOCUMENTATION REFRESH REPORT ---`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Successfully updated: ${report.updated}`);
  console.log(`Failed downloads: ${report.failed}`);
  console.log(`Rejected downloads: ${report.rejected}`);
  console.log(`Unchanged: ${report.unchanged}`);
  console.log(`Skipped (no upstream change): ${report.skipped}`);
  console.log(`Pending: ${report.pending}`);
  console.log(`Bytes added: ${report.bytesAdded}`);
  console.log(`Final .docs size: ${report.finalSize} bytes (${(report.finalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Batches used: ${report.batches}`);
  console.log(`Removed documents reconciled: ${report.removedLibraries.length} manifest entries, ${report.removedSnapshots.length} snapshots`);
  console.log(`Repaired documentation links: ${report.repairedLinks.length}`);
  if (report.downloadFailures.length > 0) {
    console.log(`Broken source URLs:`);
    for (const failure of report.downloadFailures) {
      console.log(`  - ${failure.library}: ${failure.url} — ${failure.error}`);
    }
  }
  if (report.validationRejections.length > 0) {
    console.log(`Rejected downloads:`);
    for (const rejection of report.validationRejections) {
      console.log(`  - ${rejection.library}: ${rejection.url} — ${rejection.reason} (${rejection.preserved ? 'existing document preserved' : 'no existing copy'})`);
    }
  }
  console.log(failed ? failMsg : successMsg);
  console.log(`------------------------------------\n`);

  writeRefreshReport(options.reportPath, report);

  process.exit(failed ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
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
};
