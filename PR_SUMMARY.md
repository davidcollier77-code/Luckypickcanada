# PR Summary — Newly sourced Crystal Ball sound effects

## A — Analyze

- **SELECTED TASK GROUP:** audio
- **GROUP REASON:** Replace three borrowed Crystal Ball sound cues with newly sourced, license-reviewed audio while preserving the reveal timeline, Howler integration, accessibility, and local hosting.
- **User authorization:** The user explicitly authorized sourcing and adding the new sounds.
- **Verified source metadata:** The three selected Pixabay listing pages display “Free for use under the Pixabay Content License.” The official summary allows free use and adaptations, with prohibited uses; it states attribution is not required. Artist, listing, direct source URL, and license are recorded in public/sounds/crystal-ball-audio-sources.md.
- **Sources selected:** Coghezzi’s “Holy Aura Resonance – Magical Energy Loop” (16 s), RescopicSound’s “Elemental Magic Spell Impact Outgoing” (3 s), and ShidenBeatsMusic’s “Sound Effect: Twinkle/Sparkle” (2 s).
- **Repository constraints:** AGENTS.md requires the audio task route, Howler as primary, no prohibited public MP3 assets, and the 495 MiB hard build cap. Keep MP3 source downloads temporary and commit only validated same-origin WAV files.

## B — Boundaries + plan

- Replace only the sound-source paths used by the Crystal Ball energy / reveal / leaf cues. Keep the existing cue order, configured Howler volumes, component visuals, timing, daily quota, API behavior, and reduced-motion behavior unchanged.
- Download direct media URLs with curl -L --fail in the GitHub runner; no API key or paid CLI. Convert to mono, 22,050 Hz, 16-bit PCM WAV with FFmpeg.
- Validate RIFF/WAVE headers, expected durations, non-silent audio, PCM parameters, and each file under 2 MiB before the workflow commits it.
- No runtime dependency, API route, database, deployment configuration, environment variable, or external runtime audio domain is added.
- Source files are recorded at public/sounds/crystal-ball-audio-sources.md. Original downloaded MP3s must never be committed under public/.

## C — Spec Kit stages and governance record

- **/speckit.specify** — definition: .jules/cmds/speckit.specify.md; method: FILE-DRIVEN DOCUMENT UPDATE THROUGH REPOSITORY API; result: PARTIAL. Updated specs/025-crystal-ball-audio-daily-limit/spec.md to require new licensed same-origin WAV files. Native dispatch and local hook/setup steps were not run.
- **/speckit.plan** — definition: .jules/cmds/speckit.plan.md; method: FILE-DRIVEN DOCUMENT UPDATE THROUGH REPOSITORY API; result: PARTIAL. Updated specs/025-crystal-ball-audio-daily-limit/plan.md with source metadata, conversion, and validation approach. Native dispatch and local setup were not run.
- **/speckit.tasks** — definition: .jules/cmds/speckit.tasks.md; method: FILE-DRIVEN DOCUMENT UPDATE THROUGH REPOSITORY API; result: PARTIAL. Added tasks T027–T031 to specs/025-crystal-ball-audio-daily-limit/tasks.md. Native dispatch and local setup were not run.
- **/speckit.implement** — definition: .jules/cmds/speckit.implement.md; method: REPOSITORY API SOURCE/TEST/WORKFLOW EDITS; result: CANDIDATE IN PROGRESS. A local checkout is unavailable in this runtime because github.com cannot resolve. The acquisition workflow is designed to run in GitHub Actions; its actual execution and validation must be confirmed before marking implementation complete.
- **Active feature pointer:** .specify/feature.json remains specs/025-crystal-ball-audio-daily-limit.
- **Governance status:** not yet governance-complete. The final candidate still needs actual Actions evidence, ./jules-verify.sh, the test/type/build checks, measured build size, and final diff reconciliation.

## Required resources consulted

### Repository authority and task route
- **AGENTS.md** — USED=YES, USEFUL=YES. Establishes the audio route, Howler preference, no-public-MP3 rule, scope boundaries, and 495 MiB hard cap.
- **.jules/audio.md** — USED=YES, USEFUL=YES. Routes audio work through the specialist and lists mandatory resources.
- **.jules/jules.md** — USED=YES, USEFUL=YES. Enforces initialization, Memory Bank, Spec Kit sequence, and evidence-based reporting.
- **.docs/manifest.json** — USED=YES, USEFUL=YES. Confirms the audio resource routing.
- **.docs/audio/jules_google_docs.md** — USED=YES (retrieved), USEFUL=NO. The snapshot is an official Jules CLI changelog page and contributed no sound sourcing, format, or implementation requirement.
- **.docs/audio/_google-gemini_gemini-cli.md** — USED=YES (retrieved), USEFUL=NO. The snapshot is a list of Gemini CLI tips and did not inform this change.
- **.docs/audio/_websites_ai_google_dev_gemini-api.md** — USED=YES (retrieved), USEFUL=NO. General Gemini API snapshot; no API is used to acquire these licensed assets.
- **.docs/polishing/_goldfire_howler_js.md** — USED=YES, USEFUL=YES. Confirms standard Howler src-array audio configuration and lifecycle usage.
- **Pixabay Content License summary** — USED=YES, USEFUL=YES. Verifies free use, adaptations, attribution terms, and prohibited-use caveat: https://pixabay.com/service/license-summary/
- **Context7** — NOT USED. No invocation was made; repository-owner permission is required for every call.
- **Local .docs/** are read-only. No documentation refresh was performed.

### Source, tests, and configuration
- **app/lib/audio.js** — USED=YES, USEFUL=YES. Existing Howler configuration targeted by the replacement.
- **app/components/CrystalBall/CrystalBall.tsx** — USED=YES, USEFUL=YES. Verified cue call sites and reveal order; unchanged.
- **__tests__/audio-exports.test.js** — USED=YES, USEFUL=YES. Confirms the existing audio module import/export smoke test.
- **package.json** — USED=YES, USEFUL=YES. Confirms existing Howler dependency and pnpm run test; no dependency added.
- **specs/025-crystal-ball-audio-daily-limit/** — USED=YES, USEFUL=YES. Active Spec Kit artifacts updated.
- **Memory Bank** — USED=YES, USEFUL=YES. Active context and progress records updated.
- **Sound listing pages** — USED=YES, USEFUL=YES. Live listing metadata (titles, creators, durations, direct URLs, license declaration) was inspected.
- **Remaining mandatory repository inventory** — NOT FULLY DEMONSTRATED. All .jules/*.md, .jules/cmds/*.md, all global guides and every setup/hook procedure have not been exhaustively read or executed in this API-only session. Do not claim full governance compliance until the actual repository governance verifier succeeds.

## Changed files

1. .github/workflows/prepare-crystal-ball-audio-assets.yml
2. app/lib/audio.js
3. __tests__/crystal-ball-audio-assets.test.js
4. memory-bank/activeContext.md
5. memory-bank/progress.md
6. public/sounds/crystal-ball-audio-sources.md
7. specs/025-crystal-ball-audio-daily-limit/plan.md
8. specs/025-crystal-ball-audio-daily-limit/spec.md
9. specs/025-crystal-ball-audio-daily-limit/tasks.md
10. PR_SUMMARY.md

The three generated WAV assets should be added by the asset-preparation workflow only after download and validation succeed. Reconcile this list against the final PR diff before completion.

## Verification record — results must be updated from evidence

- **COMMAND:** local curl -L --fail <Pixabay CDN URL> -o <temporary MP3>
  - **RESULT:** BLOCKED in this runtime.
  - **EVIDENCE:** local environment DNS could not resolve the CDN host. The candidate workflow performs the command in the GitHub runner instead; remote execution is not yet verified.
- **COMMAND:** workflow CLI download via curl, conversion via ffmpeg, Python WAV integrity/duration/sample validation
  - **RESULT:** PENDING.
  - **EVIDENCE:** .github/workflows/prepare-crystal-ball-audio-assets.yml contains the reproducible commands; no completed Actions run has been observed yet.
- **COMMAND:** pnpm run test
  - **RESULT:** PENDING CI.
  - **EVIDENCE:** Local checkout / execution unavailable in this runtime.
- **COMMAND:** pnpm tsc --noEmit
  - **RESULT:** NOT RUN LOCALLY; pending final-candidate CI evidence.
- **COMMAND:** ./jules-verify.sh
  - **RESULT:** NOT RUN LOCALLY; governance gate remains outstanding.
- **COMMAND:** pnpm run build, OpenNext Cloudflare build, and no-deploy Wrangler validation
  - **RESULT:** PENDING final-candidate CI.
- **COMMAND:** Build-size check (.next + public), hard maximum 495 MiB
  - **RESULT:** PENDING final-candidate CI.
- **COMMAND:** Real-device mobile playback
  - **RESULT:** NOT RUN. CI cannot establish actual listener experience.
- **Pre-submission double-check:** PARTIAL. Source URLs, source metadata, target helper, active Spec Kit paths, and the intended WAV-only output policy were inspected. Final asset headers/hashes, final diff, remote checks, and actual playback still require evidence.

**USEFUL RESULT:** NO, until new WAV assets are actually downloaded, validated, committed, and the final PR’s checks pass.
