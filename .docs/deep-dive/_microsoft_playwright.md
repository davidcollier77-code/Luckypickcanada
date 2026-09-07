### Test Plan Markdown Template

Source: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/tools/skills/playwright-cli/references/test-generation.md

The standard structure for documenting test scenarios in a markdown plan file.

```markdown
# <Feature> Test Plan

## Application Overview

<One paragraph describing what the feature does and why it matters.>

## Test Scenarios

### 1. <Group Name>

**Seed:** `tests/seed.spec.ts`

#### 1.1. <kebab-case-scenario-name>

**File:** `tests/<group>/<kebab-case-scenario-name>.spec.ts`

**Steps:**
  1. <Concrete user step>
    - expect: <observable outcome>
    - expect: <another observable outcome>
  2. <Next step>
    - expect: <outcome>

#### 1.2. <next-scenario>
...

### 2. <Next Group>

**Seed:** `tests/seed.spec.ts`
...
```

--------------------------------

### Configure full page screenshots on test failure in playwright.config.ts

Source: https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md

Configures Playwright Test to automatically capture a full page screenshot only when a test fails.

```javascript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  use: {
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    }
  }
});
```

--------------------------------

### Create Agentic Video Receipts

Source: https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-python.md

Combine recording, annotations, and chapters to generate a documented walkthrough of automated tasks.

```python
page.screencast.start(path="receipt.webm")
page.screencast.show_actions(position="top-right")

page.screencast.show_chapter("Verifying checkout flow",
    description="Added coupon code support per ticket #1234",
)

# Agent performs the verification steps...
page.locator("#coupon").fill("SAVE20")
page.locator("#apply-coupon").click()
expect(page.locator(".discount")).to_contain_text("20%")

page.screencast.show_chapter("Done",
    description="Coupon applied, discount reflected in total",
)

page.screencast.stop()
```

### Documentation

Source: https://github.com/microsoft/playwright/blob/main/docs/src/canary-releases-js.md

Both stable and `next` documentation for Playwright are available on playwright.dev. To access the `next` documentation, users need to press the Shift key five times.

--------------------------------

### Playwright Test > Key capabilities

Source: https://github.com/microsoft/playwright/blob/main/README.md

**Parallelism.** Tests run in parallel by default across all configured browsers.

[Full testing documentation](https://playwright.dev/docs/intro)
