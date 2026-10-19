# Plan
1. Research Gemini 3.8 Flash API pricing, quotas, and no-credit-card availability.
2. Confirm PR-Agent GitHub Action configuration for Gemini.
3. Write `.github/workflows/pr-agent.yml` using least-privilege permissions and the `GEMINI_API_KEY` secret.
4. Verify build size stays under 495 MB and governance checks pass.
