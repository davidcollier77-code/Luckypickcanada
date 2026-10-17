# Research Notes: Robin OpenRouter Fallback Recovery

## Repository Evidence

1. Current baseline: `.github/workflows/robin.yml` included a step named “Request and verify Amazon Q fallback review,” posted `/q review`, and allowed a qualifying Q review to satisfy Robin's final outcome. This made the two independent reviewers incorrectly coupled.
2. Commit [e459b24309a8b5382ea803313d2474547b713898](https://github.com/davidcollier77-code/Luckypickcanada/commit/e459b24309a8b5382ea803313d2474547b713898) introduced the Amazon Q fallback.
3. Earlier workflow revisions, including [671883855acba83422d4c5c4a15e36d424a57093](https://github.com/davidcollier77-code/Luckypickcanada/commit/671883855acba83422d4c5c4a15e36d424a57093), used a second pinned Robin action with `ROBIN_LLM_FALLBACK_MODEL` and the same OpenRouter secret. This is the intended pattern being restored.
4. The current workflow already references `secrets.OPENROUTER_API_KEY`. This repair does not create, expose, rename, or rotate that secret.
5. Prior run diagnostics recorded the key as accepted by OpenRouter but free quota at 0/50. Credential availability and free inference quota are separate states. With a confirmed zero, no code can make a free request succeed before reset, so the correct behavior is a failed Robin check rather than a false pass.

## OpenRouter Model Choice

- [NVIDIA Nemotron 3 Super (free)](https://openrouter.ai/nvidia/nemotron-3-super-120b-a12b:free) is listed by OpenRouter at $0 prompt/output pricing and supports structured outputs through JSON schema. This is the concrete default fallback.
- [NVIDIA Nemotron 3 Ultra (free)](https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b:free) is also listed as a free model and is used only as an alternate if the primary was explicitly set to the default fallback model. OpenRouter notes that this model does not support `response_format`, so Robin's existing compatibility fallback to a plain/markdown response remains important.
- Free endpoints are rate-limited. The workflow checks the account quota and does not attempt inference when remaining is exactly zero. An unknown quota value does not prove exhaustion, so bounded fallback remains eligible after the primary path is not verified.

## Required Safety Decision

Amazon Q's standalone workflow and reviews are not a fallback for this job. A qualifying Robin review must match the exact current PR head commit and be submitted since the run start. If no such review exists after the fallback, the Robin check fails.
