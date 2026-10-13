# Implementation Plan

## Technical Context
- **Tech Stack**: GitHub Actions, Robin
- **Target Files**: `.github/workflows/robin.yml`, `.github/robin.yml` (optional config), remove `.github/workflows/inori-review.yml`

## Phases
1. **Setup**: Create configuration for Robin, remove Inori.
2. **Review Workflow**: Implement Robin workflow with Groq primary and OpenRouter fallback.
