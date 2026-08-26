import re

with open('components/LuckyGenerator.tsx', 'r') as f:
    content = f.read()

# I need to add timeoutIds array to useResonanceCanvas state or pass it from LuckyGenerator.
# Wait, `stateRef.current` inside `useResonanceCanvas` can easily track timeouts.
# The prompt says: "by pushing their IDs into the centralized `timeoutIds` ref array. Ensure they are fully cleared on reset or component unmount."
# The main component already has `const timeoutIds = useRef<number[]>([]);` and `const trackTimeout = useCallback(...)` and it unmounts them.

# First, modify useResonanceCanvas signature to accept trackTimeout:
old_sig = """  pendingResultRef: React.MutableRefObject<{ score: number; quoteIndex: number; tier: Tier } | null>
) {"""

new_sig = """  pendingResultRef: React.MutableRefObject<{ score: number; quoteIndex: number; tier: Tier } | null>,
  trackTimeout: (handler: TimerHandler, timeout?: number) => number
) {"""

content = content.replace(old_sig, new_sig)

# Second, modify the call site:
old_call = """  useResonanceCanvas(
      canvasRef, phaseRef, pendingTierRef, revealStartTimeRef,
      audioRefs, setDisplayScore, setImpactFired, pendingResultRef
  );"""

new_call = """  useResonanceCanvas(
      canvasRef, phaseRef, pendingTierRef, revealStartTimeRef,
      audioRefs, setDisplayScore, setImpactFired, pendingResultRef,
      trackTimeout
  );"""

content = content.replace(old_call, new_call)

# Third, replace `setTimeout` with `trackTimeout` in the useResonanceCanvas lines 548-574:
# We can just replace `setTimeout(` with `trackTimeout(` in the impactTriggered block.

content = content.replace("setTimeout(() => spawnMeteor(true)", "trackTimeout(() => spawnMeteor(true)")
content = content.replace("setTimeout(() => spawnBolt(true)", "trackTimeout(() => spawnBolt(true)")
content = content.replace("setTimeout(() => spawnRocket(true", "trackTimeout(() => spawnRocket(true")

with open('components/LuckyGenerator.tsx', 'w') as f:
    f.write(content)
