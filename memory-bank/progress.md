# Progress

## Completed Work

### 2026-09-23 — Homepage Visual Quality and Scroll Performance Investigation
- Investigated homepage visual quality and scrolling performance.
- Identified four key areas contributing to performance and visual degradation:
  1. Missing `devicePixelRatio` scaling on the background canvas in `HomePage.js`.
  2. Extreme CSS `filter: blur(60px)` on `.aurora-container`.
  3. Expensive `backdrop-filter: blur(16px)` on homepage cards.
  4. Redundant animated overlays in `.homepage-experience::after`.
- No code changes were implemented as per task boundaries. The findings will inform a future implementation task.

## Historical Record

### Completed Features

- **Lucky Card Reveal System**: Full cinematic reveal with tier-based visuals (Standard, Premium, Flagship)
- **Tier-Based Hit System**: Reduced regular hits across all tiers (Standard: 3, Premium: 4, Flagship: 5)
- **3D Volumetric VFX**: Replaced flat arc-based plasma with 3D volumetric bezier streams
- **Progressive Rim Flow**: Each rim flow progressively reveals only the traversed portion of card edge
- **Post-Flip VFX Sequence**: Three-stage sequence - electric edge-wrap, molten snap/pop bursts, lower-edge drips
- **Lucky Card Collection**: Full binder system with unlocked cards persistence
- **Gift Delivery System**: Email delivery with Resend integration
- **Stripe Payment Integration**: Checkout modal and webhook handling
- **Lucky Map of Canada**: Interactive province visualization
- **Suggestion Box**: User feedback system with Cloudflare Turnstile protection
- **Crystal Ball Oracle**: AI-powered fortune predictions
- **Audio System**: Howler.js-based audio management with caching

### Historical Milestones

- **2026-09-22**: Fixed Lucky Card reveal screen wording and improved text readability
- **2026-09-22**: Mobile polish - removed translucent UI overlay, hid custom scrollbar on mobile
- **2026-09-23**: Fixed drawRimFlow progressive reveal with tier colors and timing
- **2026-09-23**: Refined final post-flip VFX - electric edge-wrap, molten bursts, lower-edge drips
- **2026-09-23**: Polished Lucky Card Reveal cinematic - enhanced hero settle, tension grab, throw brightness pulse
- **2026-09-23**: Completed homepage performance investigation (current task)

## Remaining Technical Debt

### Critical Constraints

#### ⚠️ ZZFX Top-Level Import Constraint

**CRITICAL: ZZFX must NOT be imported at top-level in Next.js**

ZZFX sound effects library breaks Next.js server-side rendering builds when imported at module top-level. This occurs because ZZFX attempts to access browser-only globals (window, AudioContext) during module initialization.

**Why this matters:**
- Top-level ZZFX imports cause SSR build failures
- Next.js pre-renders components on the server during build
- Server environment has no browser globals
- Import at top = code executes during module load = server crashes

**If ZZFX is needed in future:**
```javascript
// ❌ WRONG - Top-level import breaks SSR
import { zzfx } from 'zzfx';

// ✅ CORRECT - Dynamic import in client-only code
useEffect(() => {
  if (typeof window !== 'undefined') {
    import('zzfx').then(({ zzfx }) => {
      // Use zzfx here safely
    });
  }
}, []);
```

**Current state:** ZZFX is NOT in the application. Howler.js is the audio library. This constraint is documented to prevent future reintroduction of the problematic pattern.

### Hydration Issues

- **Canvas timestamp rendering**: Ensure server-rendered timestamp matches client hydration
- **Dynamic content**: Any time-based or random content must use consistent seed between server/client
- **useEffect dependencies**: Review all useEffect hooks for missing dependencies that could cause hydration mismatches

### Cloudflare Turnstile

- **Form protection**: Turnstile is integrated for suggestion box and gift delivery
- **Testing mode**: Turnstile has test mode keys for development (always passes)
- **Production keys**: Ensure production Turnstile keys are configured in environment
- **Error handling**: Turnstile failure should gracefully degrade or show user-friendly error
- **Rate limiting**: Consider additional rate limiting beyond Turnstile for API routes

### Performance

- **Homepage visual quality**: Canvas DPR scaling needed (from 2026-09-23 investigation)
- **Scroll performance**: CSS filter optimization needed (from 2026-09-23 investigation)
