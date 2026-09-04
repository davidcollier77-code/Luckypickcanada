This pull request introduces procedural UI sound effects using the ZzFX library.

- Added `zzfx` as a dependency in `package.json`.
- Created a new React hook `useSoundEffects` in `hooks/useSoundEffects.js`.
- Implemented three distinct sound effect functions: `playTick`, `playCardFlip`, and `playWin` using ZzFX parameter arrays.
- Ensured the hook is marked with `'use client';` for compatibility with Next.js App Router client components.
