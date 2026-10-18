# Research — CI Stability Repair

**Date:** 2026-10-18

Groq's official [deprecation page](https://console.groq.com/docs/deprecations) marks `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` deprecated for developer-tier use and recommends `openai/gpt-oss-20b` for the original 8B model.

CI reached that model with the configured Groq endpoint but returned HTTP 413: **8,657 requested tokens vs. 8,000 TPM**. The 384-token output cap did not suffice; this commit caps output at 128 and reduces nonessential task-artifact text. A real fallback attempt after the change is still needed.

The Crystal Ball component clears the question after success and keeps the input disabled during the animation. The test now waits for the input to enable, then fills the next question before asserting the submit button enables.

The last completed build on `1502487` measured `325,473,493 bytes (310.40 MiB)` and passed the 495 MiB gate. No local checkout is available; all current-head verification must come from CI.
