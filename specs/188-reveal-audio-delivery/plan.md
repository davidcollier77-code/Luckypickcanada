# Implementation Plan: Single-Download Reveal Audio Delivery

**Feature**: `specs/188-reveal-audio-delivery`

**Branch**: `perf/reveal-audio`

**Base**: `main` at `782ac553`

## Summary

The reveal prepared its standard-tier sounds twice: a `fetch()` loop filled `rawAudioDataRef` for the Web Audio
scheduler, and eight Howl instances preloaded the same URLs through Howler. The eight-request overlap is the
audit's 8 duplicates. The fetch stays as the single network source; its `ArrayBuffer`s are also exposed to Howler
through object URLs, so Howler decodes the same bytes without a second request. A failed fetch still builds the
Howl set from the authored URLs.

## Technical Context

- **Runtime**: Next.js App Router 16.4.5, React 19.3.1, Howler 2.2.4.
- **Audio paths**: native Web Audio (`decodeAudioData` from the fetched buffers) with a Howler fallback that
  plays the same cue set.
- **Testing**: Vitest source guard (`app/lucky-card-reveal.js` is JSX-in-`.js`, which the Vitest pipeline cannot
  render); existing reveal, celebration and audio-release suites as regression checks.
- **Constraints**: no dependency, CSP, cache-header, API or playback-order change; production build below
  495 MiB.

## Constitution Check

- **Preserve sound**: every cue file, volume, seek, fade, schedule and preload flag is untouched. Only the
  source of Howler's bytes changes.
- **Smallest correct change**: one mount effect gains object-URL creation and cleanup; the eight Howl
  declarations move into one stable factory used by both the success and failure paths.
- **Preserve failure behaviour**: a blocked fetch builds the Howl set from the authored URLs exactly as the old
  component did.
- **Protected areas**: no payment, database, authentication, security, hosting, deployment, environment or
  secret file is touched.
- **Evidence first**: the duplicate cause was confirmed from the source (one `fetch` per URL plus one Howl
  preload per URL, eight URLs) before any change, and matches the audit's 8 duplicates.

## Phase 0: Research (repository evidence)

1. **Howler already caches decoded buffers by URL** (`var cache = {}` in `node_modules/howler/dist/howler.js`),
   so duplicate Howls with one URL do not duplicate requests. The duplicates therefore come from the separate
   `fetch()` layer.
2. **The Web Audio path needs the raw buffers** (`rawAudioDataRef` → `decodeAudioData`), so the fetch cannot
   simply be deleted.
3. **The standard set totals 707,635 bytes**, which is the duplicate transfer removed when all eight cues are
   prepared.
4. **The premium set is independent** and is used by the premium/flagship choreography; it is not part of the
   duplicate pair and is left alone.

## Phase 1: Design

### Files

```
app/lucky-card-reveal.js                  # object-URL delivery for the standard cue set
__tests__/reveal-audio-delivery.test.js   # single-request and preserved-mix guard
specs/188-reveal-audio-delivery/*
```

### Delivery contract

| Step | Before | After |
| --- | --- | --- |
| Network | `fetch(url)` ×8 + Howler XHR ×8 | `fetch(url)` ×8 |
| Web Audio | decode `rawAudioDataRef` | unchanged |
| Howler | preload authored URLs | preload object URLs built from the same buffers |
| Failure | Howler URLs still preload | Howler URLs still preload (existing fallback path) |
| Cleanup | unload Howls | unload Howls and revoke object URLs |

### Lifecycle

- `createStandardHowls(sources)` is a stable factory; the success path passes blob URLs, the failure path
  passes the authored URLs.
- A `disposed` flag prevents a late fetch from creating Howls after unmount, and revokes any object URLs the
  effect created.
- The existing `standardAudioPreloadRef` still resolves to `true`/`false`, so the reveal's readiness gate and
  the Web Audio scheduler behave exactly as before.

## Re-evaluated Constitution Check

No asset, cue, timing, volume or fallback changes. The only behavioural difference is that Howler's source is
memory-backed. No violation.
