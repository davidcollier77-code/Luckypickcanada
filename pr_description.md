**Task group**
- SELECTED TASK GROUP: seo
- GROUP REASON: The task requires correcting metadata (canonical URLs and meta descriptions) for the Privacy Policy and Terms of Service pages, which falls under Search Engine Optimization (SEO).

**Every required library**
- LIBRARY: Next.js
- VERSION: 16.3.8
- USED: YES
- USEFUL: YES
- REASON: Used Next.js `metadata` object conventions to configure canonical URLs and descriptions.

**Every required routed Jules/Gemini document**
- DOCUMENT: .docs/seo/jules_google_docs.md
- USED: YES
- USEFUL: YES
- REASON: Consulted as a required resource for SEO tasks.
- DOCUMENT: .docs/seo/_google-gemini_gemini-cli.md
- USED: YES
- USEFUL: NO
- REASON: Task didn't require using Gemini CLI.
- DOCUMENT: .docs/seo/_websites_ai_google_dev_gemini-api.md
- USED: YES
- USEFUL: NO
- REASON: Task didn't require using Gemini API.
- DOCUMENT: .jules/seo.md
- USED: YES
- USEFUL: YES
- REASON: Guided the SEO considerations.

**Every required or task-relevant repository component**
- COMPONENT: AGENTS.md
- USED: YES
- USEFUL: YES
- REASON: Read and followed the mandatory governance procedures, including pre-commit checks and PR Summary structure.
- COMPONENT: jules-verify.sh
- USED: YES
- USEFUL: YES
- REASON: Run to verify the spec kit configuration, type checking, build, and documentation refresh tests.

**Implementation Summary**
- Verified the missing canonical URLs and descriptions for `/privacy` and `/terms`.
- Updated `app/privacy/page.js` to include specific `description` and `alternates.canonical` properties in the exported `metadata` object. Kept `robots` directives unchanged.
- Updated `app/terms/page.js` to include specific `description` and `alternates.canonical` properties in the exported `metadata` object. Kept `robots` directives unchanged.
- Verified build size (.docs) is 3.3MB (well under the 495MB limit).
- No protected systems were modified (no changes to database, payments, or security configurations).

**Changed Files**
- `app/privacy/page.js`
- `app/terms/page.js`
- `.specify/features/metadata-fix/spec.md`
- `.specify/features/metadata-fix/plan.md`
- `.specify/features/metadata-fix/tasks.md`

**Verification Commands**
- COMMAND: `pnpm test`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: 67 tests passed in 6.20s.
- COMMAND: `pnpm run build`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Build completed successfully in 4.9s.
- COMMAND: `./jules-verify.sh`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Spec Kit task artifacts verified and current. Build and tests passed. All verification steps passed.

**Remaining Issues:** None.

**Pre-submission Double-check:** Completed.

**USEFUL RESULT:** YES
