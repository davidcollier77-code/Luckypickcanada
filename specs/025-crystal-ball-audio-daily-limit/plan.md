# Implementation Plan: Crystal Ball Audio and Daily Question Limit

**Branch**: feat/crystal-ball-audio-daily-limit  
**Date**: 2026-10-17  
**Spec**: specs/025-crystal-ball-audio-daily-limit/spec.md

## Summary

Add three restrained existing-asset sound cues to the Crystal Ball reveal and enforce a daily allowance of three successful AI-backed answers per client IP. Reuse the current Howler helper and Oracle route, reserve quota before provider calls, show remaining usage, and release reservations on provider failures.

## Technical Context

- Language: JavaScript and TypeScript on Node.js 22.x.
- Dependencies already installed: Howler.js ^2.2.4, @upstash/redis ^1.38.3, Next.js 16.3.8, React, Vitest ^5.0.0, Playwright ^1.63.0.
- Storage: Upstash Redis when configured; existing Cloudflare KV as durable fallback; process memory only for local development/tests.
- Tests: Vitest, Playwright, TypeScript check, repository governance verification, production build, and build-size measurement.
- Platform: Next.js App Router deployed on Cloudflare Workers/OpenNext.
- Constraints: Preserve original art, reveal order, repeat questions within quota, accessibility/reduced-motion, existing rate limiter, security filters, package set, and the hard 495 MB build cap.
- Scope: Crystal Ball audio helper/component, Oracle route/client, direct tests, Spec Kit artifacts, Memory Bank, and canonical PR summary.

## Constitution Check

- AGENTS.md remains the authority; one task group is selected: audio.
- Existing files, assets, dependencies, bindings, tests, and history were inspected before implementation.
- No payment, authentication, Neon schema, secret, or deployment-configuration change is planned.
- Context7 was not invoked because repository policy requires explicit permission for every call.
- Local shell verification is blocked because this runtime cannot resolve github.com. Remote PR checks are required before approval.
- Build size is not measured yet; do not merge unless the measured output remains strictly below 495 MB.

## Design

1. Preload existing same-origin sounds through Howler. Start the quiet energy sound from visitor activation; fade or stop it on success, failure, or unmount. Request reveal and leaf cues at their matching visual phases.
2. Store a UTC-day key and one-way hash of client IP, with completed and pending counts. Redis Lua operations reserve slots atomically, commit completed AI answers, and release unsuccessful attempts.
3. Provide uncached GET status and include quota state with successful answers and limit responses. Client state is only informative; POST enforcement remains server-side.
4. Use the existing Cloudflare KV binding as persistent fallback. KV does not offer cross-isolate compare-and-swap, so globally atomic concurrency requires the configured Redis path.
5. Do not introduce a database table, dependency, external audio host, or unrelated refactor.

## Verification Plan

- Run quota unit tests for three-slot admission, fourth-slot denial, rollback, different IPs, and UTC reset.
- Run both Crystal Ball Playwright specs on configured desktop/mobile projects.
- Run pnpm test, pnpm tsc --noEmit, pnpm build, and ./jules-verify.sh.
- Measure .next plus public against the 495 MB hard cap.
- Inspect final diff and workflow checks. Do not report a command as passed unless its output is available.
