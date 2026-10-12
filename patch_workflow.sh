#!/bin/bash
sed -i 's/llm_model: google\/gemini-2.0-flash-lite-preview-02-05:free/llm_model: meta-llama\/llama-3.3-70b-instruct:free/' .github/workflows/inori-review.yml
