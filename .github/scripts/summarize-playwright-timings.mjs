#!/usr/bin/env node
/**
 * Summarize a Playwright JSON reporter file into a job table and a compact
 * timing artifact. Reporting never changes the run result: a missing or
 * corrupt file is a warning, not a pass and not a failure.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

export function readResults(path) {
  if (!existsSync(path)) return { results: null, problem: `no results file at ${path}` };
  try {
    return { results: JSON.parse(readFileSync(path, 'utf8')), problem: null };
  } catch (error) {
    return { results: null, problem: `results file is not valid JSON: ${error.message}` };
  }
}

function collectSpecs(suites, output) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const results = test.results || [];
        const last = results[results.length - 1] || {};
        output.push({
          file: spec.file || suite.file || 'unknown',
          title: spec.title || test.title || 'untitled',
          project: test.projectName || test.projectId || 'unknown',
          status: last.status || 'unknown',
          duration_ms: Number(last.duration) || 0,
          retries: Math.max(0, results.length - 1),
          passed_on_retry: results.length > 1 && last.status === 'passed',
        });
      }
    }
    if (suite.suites) collectSpecs(suite.suites, output);
  }
}

export function summarize(results) {
  const entries = [];
  collectSpecs(results?.suites, entries);
  const byFile = new Map();
  for (const entry of entries) {
    const key = `${entry.file}\u0000${entry.project}`;
    const current = byFile.get(key) || {
      file: entry.file,
      project: entry.project,
      duration_ms: 0,
      tests: 0,
      failed: 0,
      retried: 0,
      passed_on_retry: 0,
    };
    current.duration_ms += entry.duration_ms;
    current.tests += 1;
    if (entry.status !== 'passed' && entry.status !== 'skipped') current.failed += 1;
    if (entry.retries > 0) current.retried += 1;
    if (entry.passed_on_retry) current.passed_on_retry += 1;
    byFile.set(key, current);
  }
  const rows = [...byFile.values()].sort((left, right) => right.duration_ms - left.duration_ms);
  const projects = {};
  for (const row of rows) {
    projects[row.project] = (projects[row.project] || 0) + row.duration_ms;
  }
  return { rows, projects, total_ms: rows.reduce((sum, row) => sum + row.duration_ms, 0) };
}

function render(summary, shardLabel) {
  const lines = [
    `Playwright timing summary${shardLabel ? ` (shard ${shardLabel})` : ''}`,
    '',
    '| Spec file | Project | Duration | Tests | Retried | Passed on retry |',
    '| --- | --- | --- | --- | --- | --- |',
    ...summary.rows
      .slice(0, 30)
      .map(
        (row) =>
          `| ${row.file} | ${row.project} | ${(row.duration_ms / 1000).toFixed(1)}s | ${row.tests} | ${row.retried} | ${row.passed_on_retry} |`,
      ),
  ];
  const flaky = summary.rows.filter((row) => row.passed_on_retry > 0);
  if (flaky.length) {
    lines.push(
      '',
      `::warning::Passed only on retry: ${flaky.map((row) => `${row.file} (${row.project})`).join(', ')}.`,
    );
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const pathIndex = args.indexOf('--results');
  const labelIndex = args.indexOf('--shard');
  const outputIndex = args.indexOf('--json');
  const path = pathIndex >= 0 ? args[pathIndex + 1] : 'test-results/results.json';
  const label = labelIndex >= 0 ? args[labelIndex + 1] : '';
  const output = outputIndex >= 0 ? args[outputIndex + 1] : 'test-results/timings.json';

  const { results, problem } = readResults(path);
  if (problem) {
    console.warn(`::warning::Playwright timing summary: ${problem}. The test run result is unchanged.`);
    return;
  }
  const summary = summarize(results);
  const markdown = render(summary, label);
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
  try {
    writeFileSync(
      output,
      JSON.stringify({ shard: label || null, total_ms: summary.total_ms, projects: summary.projects, rows: summary.rows }, null, 2) + '\n',
    );
  } catch (error) {
    console.warn(`::warning::Playwright timing artifact could not be written: ${error.message}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
