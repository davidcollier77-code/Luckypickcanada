# Research: Crystal Ball Oracle Personality

## Verified current behavior

- The active client path invokes the Next.js App Router Oracle endpoint at `app/api/oracle/route.js`; the older `functions/api/oracle.js` is a legacy implementation and is not the route used by the current Crystal Ball client.
- The active system prompt specifies a “lighthearted, witty Canadian-themed oracle” for playful questions but does not require specific predictions, varied readings, in-character greetings, or avoiding generic lucky-day clichés.
- The API uses Groq's OpenAI-compatible chat-completions endpoint with model `openai/gpt-oss-20b`; preserve the provider call, model, temperature, token limit, validation and injection checks, CORS headers, short-window rate limit, fallback behavior, and response aliases.
- Existing `__tests__/oracle-route-validation.test.js` mocks the provider and validates that valid requests reach the AI route. Extending this test is the narrowest regression path.

## Design decision

Keep the behavior contract in the active server-side system prompt, not the UI. Require the model to answer the exact fortune question immediately, choose one concrete option when asked for one, add a tailored symbolic interpretation, vary openings and imagery, and keep brief greetings in character. Retain accurate factual answers and avoid claims of supernatural certainty or guaranteed lottery wins.

## Scope boundaries

No visual-component, artwork, animation, audio, daily allowance, provider/model, dependency, API security, rate-limit, or deployment changes.

## Verification limitations

This connected editing session can read and write repository files through GitHub APIs but cannot run shell scripts locally. Unit tests, full suite, TypeScript, `./jules-verify.sh`, build-size measurement, OpenNext/Cloudflare validation, and live-provider response behavior must be confirmed using actual current-head CI/runtime results. No results are assumed.
