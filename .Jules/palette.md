## 2025-08-16 - Add Escape key support for modals
**Learning:** Keyboard navigation and specifically Escape key dismissal is a fundamental part of modal accessibility. Some custom dialog implementations (like the ones built over divs) miss out on this native `<dialog>` behavior, restricting users who rely on keyboards.
**Action:** Always ensure that manually constructed modal dialogs include an Escape key listener to close them, replicating standard dialog UX and improving accessibility.
## 2026-08-25 - [Crystal Ball Route Missing]
**Learning:** We added an accessible label to the `<textarea>` in the Crystal Ball component, but when verifying the frontend, we discovered the homepage linked to `/crystal-ball` despite the page not existing.
**Action:** When adding accessibility fixes to isolated components, always check if the component is actually reachable in the live application, and restore missing routes if they leave users with 404 dead ends.
## 2026-08-26 - Custom Button Focus Outline
**Learning:** Custom buttons and links using `cursor-default` without any keyboard focus state are inaccessible to keyboard and screen reader users.
**Action:** Always provide a clear visual indicator for keyboard focus on interactive elements using tailwind's `focus-visible:` variants (e.g. `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80`), especially when creating custom stylized buttons that may have removed default browser outlines.
