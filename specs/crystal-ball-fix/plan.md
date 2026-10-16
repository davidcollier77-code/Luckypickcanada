1. **Fix Disabled Button Logic**: Update `CrystalBall.tsx` to use `question.trim().length === 0` instead of `!question.trim()` for the button's `disabled` and `aria-disabled` props.
2. **Review Existing Effects**: Confirm the existing loading, reveal, and pulse effects in `CrystalBall.tsx` meet the requirements.
3. **Verify Functionality**: Run `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts` to ensure the flow is functioning.
4. **Final PR**: Update PR_SUMMARY.md following `AGENTS.md` and complete the pre-commit checks.
