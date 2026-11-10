#!/usr/bin/env node
/**
 * cloudflare-issue-references.mjs
 *
 * Collects the Cloudflare Workers Observability issues a production deployment
 * is meant to resolve.
 *
 * A fix references the issue it closes with an explicit trailer in the commit
 * message or the pull request body:
 *
 *     Cloudflare-Issue: a94d47c2-d9e8-468d-ae61-c966c9ab7199
 *
 * The post-deploy job feeds the deployed commits and the bodies of the pull
 * requests they came from into this module. Only explicitly referenced
 * identifiers are returned: an unrelated commit or pull request can never cause
 * an issue to be resolved by accident. Missing or malformed input returns an
 * empty list instead of an error, so a deployment without a reference simply
 * resolves nothing.
 *
 * Usage (stdin JSON -> stdout JSON):
 *
 *   echo '{"commitMessages":["Fix\n\nCloudflare-Issue: <id>"]}' \
 *     | node .github/scripts/cloudflare-issue-references.mjs
 *
 *   -> {"issueIds":["<id>"],"pullRequestNumbers":[]}
 */

import { pathToFileURL } from 'node:url';

/** Maximum number of issues the Worker resolver accepts in one request. */
export const MAX_ISSUE_REFERENCES = 10;

const ISSUE_REFERENCE_PATTERN =
  /cloudflare[\s_-]*issue(?:[\s_-]*id)?\s*[:=]\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
const MERGE_PULL_REQUEST_PATTERN = /Merge pull request #(\d+)/g;
const SQUASH_PULL_REQUEST_PATTERN = /\(#(\d+)\)\s*$/;

/** Explicit `Cloudflare-Issue:` references in one piece of text, in order. */
export function extractCloudflareIssueIds(text) {
  if (typeof text !== 'string' || text === '') return [];
  const issueIds = [];
  for (const match of text.matchAll(ISSUE_REFERENCE_PATTERN)) {
    const issueId = match[1].toLowerCase();
    if (!issueIds.includes(issueId)) issueIds.push(issueId);
  }
  return issueIds;
}

/**
 * Pull request numbers a commit message points at.
 *
 * Merge commits name the pull request directly. Squash commits end with
 * `(#123)`. Neither pattern can match a bare `#123` mention mid-sentence, so
 * incidental references are not treated as the deployed pull request.
 */
export function extractPullRequestNumbers(text) {
  if (typeof text !== 'string' || text === '') return [];

  const numbers = [];
  const add = (value) => {
    const number = Number(value);
    if (Number.isSafeInteger(number) && number > 0 && !numbers.includes(number)) {
      numbers.push(number);
    }
  };

  // Document order keeps the reported references predictable for the caller.
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    for (const match of trimmed.matchAll(MERGE_PULL_REQUEST_PATTERN)) add(match[1]);
    const squashMatch = SQUASH_PULL_REQUEST_PATTERN.exec(trimmed);
    if (squashMatch) add(squashMatch[1]);
  }
  return numbers;
}

/**
 * Combine deployed commit messages and pull request bodies.
 *
 * Returns de-duplicated issue ids (capped at the Worker's limit) and the pull
 * request numbers still worth inspecting when a second pass is needed.
 */
export function collectReferences({ commitMessages = [], pullRequestBodies = [] } = {}) {
  const commits = Array.isArray(commitMessages) ? commitMessages : [];
  const bodies = Array.isArray(pullRequestBodies) ? pullRequestBodies : [];

  const issueIds = [];
  for (const text of [...commits, ...bodies]) {
    for (const issueId of extractCloudflareIssueIds(text)) {
      if (!issueIds.includes(issueId)) issueIds.push(issueId);
    }
  }

  const pullRequestNumbers = [];
  for (const text of commits) {
    for (const number of extractPullRequestNumbers(text)) {
      if (!pullRequestNumbers.includes(number)) pullRequestNumbers.push(number);
    }
  }

  return {
    issueIds: issueIds.slice(0, MAX_ISSUE_REFERENCES),
    pullRequestNumbers,
  };
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  let input;
  try {
    const raw = await readStdin();
    input = raw.trim() === '' ? {} : JSON.parse(raw);
  } catch (error) {
    console.error(
      `cloudflare-issue-references: could not read JSON input (${error instanceof Error ? error.message : String(error)})`,
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${JSON.stringify(collectReferences(input ?? {}))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
