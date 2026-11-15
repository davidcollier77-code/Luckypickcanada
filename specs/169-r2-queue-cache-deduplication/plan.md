# Implementation Plan: R2 Revalidation Queue Deduplication

**Branch**: fix/r2-revalidation-queue-deduplication | **Date**: 2026-11-15 | **Spec**: spec.md

## Summary

Wrap the existing OpenNext Cloudflare Durable Object queue in the adapter's supported queueCache wrapper. Use the five-second regional cache TTL and wait for the underlying queue acknowledgement before recording a deduplication entry. Preserve the R2 incremental cache, Durable Object queue, D1 tag cache, and all existing Cloudflare bindings.

## Technical Context

- **Language/Version**: TypeScript; repository Node.js 26.x.
- **Primary Dependencies**: Existing @opennextjs/cloudflare 1.20.15; no dependency additions.
- **Storage**: Existing R2 incremental cache, Durable Object revalidation queue, D1 tag cache, and Cloudflare Cache API regional cache used by queueCache.
- **Testing**: Existing Visual QA classifier regression test, full Vitest suite, TypeScript check, OpenNext Cloudflare build, Wrangler build validation, and 495 MiB production build-size gate.
- **Target Platform**: Cloudflare Pages / Workers using OpenNext.
- **Project Type**: Next.js App Router application.
- **Performance Goals**: Suppress repeat dispatches for an already-acknowledged page/content-version request during the five-second regional cache window without suppressing distinct content versions or unacknowledged attempts.
- **Constraints**: No new package, service, binding, schema, deployment change, or visitor-facing behavior change. Production build must remain strictly below 495 MiB.

## Constitution Check

- **Single source of truth**: PASS. Repository governance and the existing OpenNext configuration remain authoritative.
- **Verify before acting**: PASS. The installed adapter version, upstream implementation, underlying queue behavior, and applicable QA workflows/checkers were inspected.
- **Implementation sequence**: PASS. Specify, plan, tasks, implementation, review, and PR preparation are recorded in this feature.
- **Protected systems**: PASS. No payment, authentication, database, secrets, hosting, deployment, or protected governance configuration is changed.
- **Resource conservation**: PASS. Existing dependencies and services only; no added infrastructure or package.
- **Production size**: Expected impact is negligible because only the existing configuration and documentation/test files change. Actual build-size measurement remains a required CI check.

## Phase 0: Research

The adapter API and exact queue-cache source were checked against the installed 1.20.15 release. See research.md for source references, queue-message identity, acknowledgement semantics, and limitations.

## Phase 1: Design

1. Import the adapter's default queueCache export and wrap the existing doQueue implementation.
2. Set regionalCacheTtlSec to 5 and waitForQueueAck to true.
3. Retain the existing incrementalCache, queue binding, tagCache, and build command.
4. Classify only open-next.config.ts as a known non-rendering runtime configuration path, and add a classifier regression assertion. Keep unknown paths fail-closed.
5. No data model, external contract, or end-to-end quickstart artifact is needed; this task changes no persisted application schema or public interface.

## Project Structure

- open-next.config.ts — queue wrapper configuration.
- .github/scripts/classify-visual-changes.sh — exact non-rendering path classification.
- __tests__/visual-qa-chromium-cache.test.js — classifier regression coverage.
- .specify/feature.json — active feature pointer.
- specs/169-r2-queue-cache-deduplication/ — specification, checklist, research, plan, and tasks.
- memory-bank/activeContext.md — current task context.
- memory-bank/techContext.md — verified queue configuration fact.

## Post-Design Constitution Check

PASS. The design uses the existing adapter and queue stack, preserves fail-closed visual classification for all other unknown paths, and requires the full application/build gates to run in CI. No protected file or new service is required.
