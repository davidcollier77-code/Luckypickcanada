# Quickstart — Spec 227

```bash
# install from the lockfile only
pnpm install --frozen-lockfile

# unit suites for the meter
pnpm vitest run __tests__/lucky-meter-number-transfer.test.js __tests__/lucky-meter-event-audio.test.js

# the Lucky Meter browser spec
pnpm playwright test tests/visual/lucky-meter-daily-resonance.spec.ts

# repository verification
./freebuff-verify.sh

# production build + measured size
pnpm build && du -sb .next
```

Evidence capture (opt-in, writes into `artifacts/`):

```bash
LUCKY_METER_CAPTURE=1 pnpm playwright test tests/visual/lucky-meter-daily-resonance.spec.ts
```

Manual checks:

1. `/lucky-meter` READY at 390×844: banner, twelve cups, spout, empty bowl, empty plaque, colour bar, Start pill; no intro, visits pill or event card.
2. Start: wheel spins and stops with the selected cup under the 7:30 spout; only that cup drains.
3. Bowl fills to 1.000 with the selected colour; the bar names it.
4. Number detaches from the cup after the drain, arcs clear of the bowl and seats in the plaque.
5. Dock: Home, Share and the "Next Reveal In" chip; Spark written above the instrument.
6. Reload: the finished reading is restored without replaying the flight.
