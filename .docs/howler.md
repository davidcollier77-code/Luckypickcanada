# Howler.js Reference

**Version:** 2.2.x

## Purpose
Sole audio playback library for the project. Replaces ZzFX for a more cinematic, high-quality audio experience utilizing real `.mp3` assets from the `public/` folder.

## Core Usage

```javascript
import { Howl, Howler } from 'howler';

// Initialization (ideally cached in a ref to avoid recreation)
const sound = new Howl({
  src: ['/sound-file.mp3'],
  volume: 0.5,
  loop: false
});

// Play
sound.play();

// Adjust volume dynamically
sound.volume(0.8);

// Global control
Howler.volume(0.5); // Set global volume
Howler.stop(); // Stop all playing sounds
```

## Considerations
- **React strict mode:** In `useEffect`, caching Howl instances in a `useRef` prevents duplicate instantiation.
- **Cleanup:** Ensure `Howler.stop()` or individual `sound.stop()` is called appropriately during unmounts or state resets to avoid audio overlap/memory leaks.
