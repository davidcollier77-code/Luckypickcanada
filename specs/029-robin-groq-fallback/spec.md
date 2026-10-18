# Robin Code Review: Groq Fallback

## Purpose
Replace the abandoned Cloudflare Workers AI fallback with a reliable Groq fallback for the Robin code review workflow. This ensures automated reviews can continue using a free-tier Groq model (e.g., `llama3-70b-8192` or similar) when the primary OpenRouter API is unavailable or quota-exhausted.

## Requirements
- Robin remains primary, using OpenRouter.
- Groq becomes the sole fallback, using a verified Groq model.
- The Cloudflare Workers AI configuration and fallback steps are completely removed from `.github/workflows/robin.yml`.
- The Groq fallback leverages the existing repository-wide Groq API Key (`GROQ_API_KEY`) and operates independently of OpenRouter quota or failures.
- Duplicate review prevention is preserved.
- The workflow correctly identifies success or failure for the exact current PR head.
