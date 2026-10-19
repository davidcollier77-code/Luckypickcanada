# Quickstart: Restore Shared Sky Backgrounds

## Targeted Browser Check

Run the following command after checking out the repair branch:

~~~~bash
pnpm exec playwright test tests/visual/homepage.spec.ts -g "shared sky backdrop remains styled"
~~~~

## Required Repository Checks

~~~~bash
pnpm run test
pnpm tsc --noEmit
./jules-verify.sh
pnpm exec playwright test
pnpm run build
du -sh .next public
~~~~

The actual .next + public output must remain strictly below 495 MiB. The commands above describe the verification gate; no local results are claimed from this connected session because the shell cannot resolve GitHub. Use current-head CI as the evidence source.
