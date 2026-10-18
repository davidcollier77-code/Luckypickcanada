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

Preserve input-validation rules, rate limiter, CORS, secrets, timeout, provider endpoint/model, temperature, token limit, fallback responses, response aliases/source marker, daily quota, UI, artwork, animations, audio, dependencies, and deployment configuration. The explicitly authorized corrective repair restores valid sanitizer chaining and makes prompt-injection detection check both the raw and sanitized forms without changing the existing pattern list or rejection response.


## Corrective build repair (2026-10-18)

1. Restore the complete sanitization chain in `app/api/oracle/route.js` and remove the misplaced/duplicate detection fragment that caused the `Expression expected` build failure.
2. Check the existing prompt-injection patterns against the unmodified string and the sanitized string, rejecting if either matches. This preserves pre-sanitization checking while preventing a phrase split by removable characters from surviving normalization.
3. Add regression rows for quote- and angle-bracket-split phrases; retain the existing valid-question provider-path test.
4. Restore the existing `const apiKey = getApiKey();` call before its missing-key fallback; the first targeted CI run proved that it had been lost in the malformed prior edit and caused valid questions to return a fallback.
4. Verify with the targeted Oracle test, full unit suite, TypeScript, `./jules-verify.sh`, production/OpenNext build, under-495-MB size gate, and current-head GitHub checks. Do not claim verification until the actual results are available.
