# Implementation Plan: Crystal Ball Oracle Personality

**Branch**: `polish/crystal-ball-oracle-personality` | **Date**: 2026-10-18  
**Spec**: [spec.md](spec.md)

## Summary

Replace the active Oracle route's vague one-sentence persona prompt with a focused system prompt that requires concrete answers to fortune questions, symbolic interpretation, varied non-clichéd writing, a stronger in-character greeting, and honest handling of lottery questions.

## Technical Context

- **Runtime**: Next.js App Router on Cloudflare Workers via OpenNext.
- **Provider/model**: Keep the existing Groq-compatible endpoint and `openai/gpt-oss-20b` model unchanged.
- **Tests**: Vitest; extend `__tests__/oracle-route-validation.test.js` to inspect the system prompt in the mocked outbound request.
- **Dependencies**: No additions, removals, or upgrades.
- **Verification**: Targeted Vitest, full unit suite, TypeScript/build/governance checks and current-head GitHub Actions where available. Real-provider response quality remains a separate manual check because credentials and live-provider calls are not part of the unit test.

## Scope and Design

1. Define a constant system prompt in `app/api/oracle/route.js` and use it for the existing system message.
2. Direct the model to answer the precise fortune question first; choose one concrete option when one is requested; explain the choice in a vivid, concise interpretation; vary openings and imagery; and avoid generic chatbot behaviour.
3. Preserve factual accuracy and explicitly avoid promised lottery wins, invented winning-number knowledge, fabricated visitor facts, or encouraging chasing losses.
4. Add a regression test proving the active route sends these contract requirements.
5. Update this feature's Spec Kit artifacts, active feature pointer, Memory Bank, and PR Summary as required by repository governance.

## Safety and Non-Goals

Do not change input handling, prompt-injection filters, rate limiter, CORS, secrets, timeout, provider endpoint/model, temperature, token limit, fallback responses, response aliases/source marker, daily quota, UI, artwork, animations, audio, dependencies, or deployment configuration. The API route change is limited to the system-prompt content and its constant.
