# Research: Three.js short documentation source

- Live upstream source inspected: https://threejs.org/docs/llms.txt (144 lines).
- Existing full source verified in current main manifest: `/websites/threejs` -> `https://threejs.org/docs/llms-full.txt`.
- Existing canonical Creation snapshot is `.docs/creation/_websites_threejs.md`; Polishing uses a symlink to the Creation snapshot.
- `scripts/refresh-docs.js` derives filenames with `library.replace(/[^A-Za-z0-9_-]/g, '_') + '.md'`.
- The updater's source schema is `{ "type": "url", "url": "..." }`; external URL sources do not require a GitHub SHA.
- QA checker suite identifies documentation paths and `.md/.mdx/.txt/.rst` suffixes separately from code; no source-code test/performance heuristics apply to these files.
- No Scap Kit-specific repository path or document exists in the current tracked tree; Spec Kit artifacts are maintained under `specs/`.
