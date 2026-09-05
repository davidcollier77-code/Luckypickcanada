# Security Guidelines
For security-sensitive changes (auth, input validation, XSS, APIs, secrets).

- Do not use `Math.random()` for backend security or generation; use `crypto.getRandomValues()`.
- Use `zod` for validating all API inputs and form submissions.
- Ensure all content rendered dynamically is sanitized using `dompurify` if it contains HTML.
- Environment secrets must strictly use `process.env` and never be leaked to the client unles prefixed with `NEXT_PUBLIC_`.
