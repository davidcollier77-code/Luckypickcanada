# Next.js Reference

**Version:** 14.x / App Router

## Key Concepts
- **App Router:** Routing is defined by the file system inside the `app/` directory.
- **Server Components:** Default component type. Good for data fetching. Cannot use hooks (`useState`, `useEffect`) or browser APIs.
- **Client Components:** Opt-in with `'use client'` at the top of the file. Required for interactivity and hooks.

## Data Fetching & Caching
- **Serverless/Edge:** When using `@neondatabase/serverless` with HTTP POSTs, Next.js cache might aggressively cache writes. Do NOT apply global `fetchOptions: { next: { revalidate: X } }` to the Neon client.
- **ISR (Incremental Static Regeneration):** Use `export const revalidate = 3600;` at the top of page files to statically render and revalidate in the background.
- **On-Demand Revalidation:** For user-submitted content on ISR pages, use `revalidatePath('/map')` in the Server Action or API Route handling the submission.

## Static Assests
- Placed in `/public`. Referenced via `/filename.ext` in code. (e.g., `/sounds/fireworks.mp3`).
