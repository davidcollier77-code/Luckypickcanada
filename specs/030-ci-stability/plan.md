# Implementation Plan: CI Stability Repair

**Date:** 2026-10-18 | **Branch:** `fix/ci-stability-1518` | **Spec:** [spec.md](spec.md)

## Root Causes

- Groq returned 404 for `llama-3.1-8b-instant`; the interim `llama-3.3-70b-versatile` is also deprecated for developer-tier use. Groq recommends `openai/gpt-oss-20b` for the old 8B model: https://console.groq.com/docs/deprecations
- A real fallback attempt reached Groq but was rejected at 8,657 requested tokens against the 8,000 TPM limit. The previous 384-token output cap was insufficient. This change lowers it to 256 tokens and reduces redundant task-artifact diff size; CI must verify the next fallback request fits.
- After a successful Crystal Ball answer, the question field is cleared and remains disabled during the animated reveal. The submit button is therefore correctly disabled until new text is entered. Playwright must wait for the input to re-enable, not expect an empty-input button to enable.

## Scope

Only Robin workflow/test settings, the daily-limit Playwright test, Spec Kit artifacts, Memory Bank tracking, and PR Summary change. No app runtime source, dependencies, lockfile, API, secrets, payment/authentication behavior, or deployment architecture changes. Preserve fail-closed review validation and the 495 MiB build-size hard limit.

## Verification

Run on the final head: targeted Vitest and Playwright, full unit tests, TypeScript, `./jules-verify.sh`, production build and size gate, OpenNext Cloudflare build, and configured Wrangler validation. No local execution is claimed; current-head GitHub Actions is the evidence source.
