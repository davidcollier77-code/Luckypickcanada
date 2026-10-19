# Implementation Plan

1. In `CrystalBall.tsx`, process `answer.replace(/[*_]{1,2}/g, '')` before passing to `setCurrentFortune()`.
2. Wrap the `textarea` and `Seek Fortune` button logic inside an `{(!showResult || !currentFortune) && (...) }` block.
3. Inside that same logic, render the prompt and remaining questions.
4. Render an `Ask Another Question` block if `{showResult && currentFortune && status === 'idle'}`.
