# Implementation Plan

1. Edit `.github/workflows/robin.yml` to remove the Cloudflare-specific preflight and fallback steps.
2. Introduce a Groq preflight and fallback step utilizing the `GROQ_API_KEY` repository secret.
3. Configure the fallback step to use `https://api.groq.com/openai/v1` as the base URL and a suitable Groq model.
4. Update the final review outcome logic to reference Groq instead of Cloudflare.
