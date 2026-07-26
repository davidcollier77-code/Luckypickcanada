# LuckyMeter Component Documentation

## Overview
The `LuckyMeter` is the primary interactive component for *LUCKY PICK CANADA.CA*. It delivers a daily luck reading through a polished, two-layer asset interaction. The experience is designed to be a one-time "vibe check"—it avoids gambling loops, retries, or forced refreshes to keep the experience positive and non-compulsive.

## Technical Specifications
* **Framework**: React (Client Component)
* **Styling**: Tailwind CSS
* **Assets**: 
    * `/public/meter-base.png` (Static background/gauge dial)
    * `/public/meter-hand.png` (Rotating needle asset)
* **Interaction**: Single-trigger generation with a 2.2-second momentum-based spin animation.

## Key Features
* **CSS Compositing**: Uses absolute positioning to layer the needle over the base. Needle rotation is handled via React state and CSS transforms.
* **Momentum Spin**: The animation calculates a target angle based on a percentage (0-100%) and adds 1080° (3 full rotations) to create a premium, mechanical "spinning" feel.
* **Aurora Visuals**: High-luck results (>= 50%) trigger a dynamic CSS `drop-shadow` and `hue-rotate` aurora glow effect.
* **Accessibility**: Implements a `prefers-reduced-motion` media query to disable animations for users who need it.
* **Sharing Integration**: Native support for the Web Share API on mobile, with a clipboard fallback for desktop environments.

## Logic Flow
1. **Trigger**: User clicks "Generate My Daily Vibe."
2. **Execution**: The component generates a random integer (0–100), sets the target rotation angle, and triggers the 2.2-second CSS transition.
3. **Reveal**: After the animation completes, the trigger button is unmounted and the result card fades in.
4. **Conclusion**: The user sees their percentage and a contextual message. No retries are permitted until the user returns for their next daily reading.

## Implementation Notes
* **Directive**: Must include `'use client';` at the top of the file to function as a Client Component in the Next.js App Router.
* **Transition**: Uses `cubic-bezier(0.22, 1, 0.36, 1)` to mimic natural mechanical friction and settling.
* **Accessibility**: The component includes aria-live regions to communicate results to screen readers immediately upon spin completion.
