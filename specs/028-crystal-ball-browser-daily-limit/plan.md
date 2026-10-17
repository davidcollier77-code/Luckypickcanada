# Implementation Plan: Crystal Ball Browser-Local Daily Allowance

**Branch**: \`028-crystal-ball-browser-daily-limit\` | **Date**: 2026-10-17 | **Spec**: \`specs/028-crystal-ball-browser-daily-limit/spec.md\`

## Summary

Replace the persistent IP-keyed daily Oracle quota with a visitor-local browser counter capped at three successful AI-backed answers per local calendar day. Show the remaining allowance plus a one-second countdown to the next local midnight. Preserve server-side short-window rate limiting, validation, prompt filtering, AI integration, response shape, and generic fallback fortunes.

## Technical Context

- **Language/Version**: JavaScript, TypeScript, Node.js 22.x.
- **Dependencies**: Existing Next.js, React, Vitest, Playwright, and pnpm; no new runtime dependency.
- **Storage**: Browser localStorage with in-memory fallback for the page lifetime if storage is unavailable.
- **Testing**: Targeted Vitest tests, Crystal Ball Playwright tests, \`pnpm run test\`, \`pnpm tsc --noEmit\`, \`./jules-verify.sh\`, production build and OpenNext/Cloudflare validation.
- **Target Platform**: Next.js App Router deployed with OpenNext on Cloudflare Workers.
- **Constraints**: Preserve visuals, art, reveal order, audio, reduced-motion behavior, CORS, request rate limiting, input filtering, and response aliases. Keep \`.next + public\` strictly below 495 MiB.
- **Accepted limitation**: Client-side storage is editable/clearable; this is intentionally not a tamper-proof cost-control boundary.

## Design

1. Create a small client-only daily-usage helper that stores \`{ date: YYYY-MM-DD, used: 0..3 }\` under a versioned localStorage key.
2. Use the visitor's local date key, and compute next local midnight with the local \`Date(year, month, day + 1)\` constructor so DST boundaries remain correct.
3. Render allowance count and an HH:MM:SS countdown in Crystal Ball's existing allowance area; refresh countdown each second, and reset usage when local date changes.
4. Remove GET status requests and all persistent server-side daily-quota reservation/key code. Keep the Oracle POST route's 10-per-minute request limiter.
5. Ensure POST validates a non-empty sanitized string, length, and prompt-injection filters before reading the API key or calling Groq. Keep the existing fallback response for unavailable credentials/upstream errors.
6. Test date rollover, storage persistence, malformed/out-of-range stored values, inaccessible storage fallback, timer rendering, three-answer UI lockout, and preserved reveal flow.

## Project Structure

- \`app/crystal-ball-client/daily-usage.js\`: local date, storage and in-memory helper functions.
- \`app/crystal-ball-client/CrystalBallClient.js\`: initialize/read/write local allowance, sync storage events, roll over at local midnight, pass quota to the component.
- \`app/components/CrystalBall/CrystalBall.tsx\` and \`CrystalBall.module.css\`: visible countdown.
- \`app/api/oracle/route.js\`: remove daily quota endpoint/state; retain short-window rate limit, valid-question-only AI requests, and fallback.
- \`__tests__/crystal-ball-daily-usage.test.js\`, Crystal Ball Playwright specs and Visual QA workflow: regression tests.
- \`specs/028-crystal-ball-browser-daily-limit/\`: feature artifacts.

## Verification Plan

- Targeted daily-usage Vitest test and full unit suite.
- Crystal Ball daily-limit and interaction Playwright tests.
- Standalone TypeScript and \`./jules-verify.sh\`.
- Next.js production build and OpenNext/Cloudflare/Wrangler checks on the PR candidate.
- Measure combined \`.next + public\` output and keep it below 495 MiB.
- Inspect the final diff and CI logs. No command should be marked passing without actual output/evidence.

## Implementation Status

Code has been committed to the working branch via the GitHub repository API. This environment has no local working checkout; local command execution has not been performed. Current-head GitHub Actions must verify the candidate before merge.
