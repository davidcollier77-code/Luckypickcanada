## 2025-08-16 - Add Escape key support for modals
**Learning:** Keyboard navigation and specifically Escape key dismissal is a fundamental part of modal accessibility. Some custom dialog implementations (like the ones built over divs) miss out on this native `<dialog>` behavior, restricting users who rely on keyboards.
**Action:** Always ensure that manually constructed modal dialogs include an Escape key listener to close them, replicating standard dialog UX and improving accessibility.
## 2026-08-25 - [Crystal Ball Route Missing]
**Learning:** We added an accessible label to the `<textarea>` in the Crystal Ball component, but when verifying the frontend, we discovered the homepage linked to `/crystal-ball` despite the page not existing.
**Action:** When adding accessibility fixes to isolated components, always check if the component is actually reachable in the live application, and restore missing routes if they leave users with 404 dead ends.
## 2026-08-26 - Custom Button Focus Outline
**Learning:** Custom buttons and links using `cursor-default` without any keyboard focus state are inaccessible to keyboard and screen reader users.
**Action:** Always provide a clear visual indicator for keyboard focus on interactive elements using tailwind's `focus-visible:` variants (e.g. `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80`), especially when creating custom stylized buttons that may have removed default browser outlines.
## 2026-08-27 - Custom Button ARIA states
**Learning:** Custom interactive elements using `role="button"` need keyboard interactivity (`tabIndex`, `onKeyDown`) and `focus-visible` styles. Also, native disabled buttons improve with `aria-disabled`.
**Action:** Ensure custom buttons implement full keyboard a11y.
## 2025-08-30 - Redundant but helpful aria-disabled
**Learning:** Adding `aria-disabled` alongside the native `disabled` attribute can sometimes provide better cross-browser/screen-reader support for disabled states when native attributes are stripped by CSS or ignored in complex custom elements, though it is technically redundant on simple native `<button>` tags.
**Action:** When working on accessibility for disabled buttons, consider adding `aria-disabled` as an extra layer of clarification for AT if requested, but ensure the native `disabled` attribute remains for robust keyboard restriction.
## 2026-08-31 - Focus Visible on Modal Close Buttons
**Learning:** Modal dialogs constructed with custom `<button>` elements (such as `checkout-modal-close`) often miss default browser focus outlines due to custom CSS resets. This creates a critical accessibility issue for keyboard users who cannot see which element has focus when tabbing within a modal.
**Action:** When inspecting modal dialogs or popups, explicitly verify that the "close" or "X" button has clear, high-contrast `focus-visible:` classes applied (e.g., `focus-visible:outline-amber-400`) to guarantee keyboard navigability.
## 2024-05-19 - Share Button Clipboard Fallback
**Learning:** In desktop environments without `navigator.share` (like standard Chrome/Firefox), silent fallback to clipboard copy leaves the user stranded without confirmation.
**Action:** Always provide explicit, temporary visual confirmation (e.g., changing button text to "Copied ✓" for a few seconds) when falling back to a clipboard action to ensure a closed feedback loop.
## 2026-09-02 - Ensure focus-visible outline for checkout modal submit button
**Learning:** By default, buttons missing explicit focus-visible utility classes can fallback to ambiguous custom outlines or drop-shadows that may not meet contrast ratios for keyboard accessibility, particularly on dark modal backgrounds.
**Action:** When evaluating forms (like the checkout modal), explicitly add `focus-visible:outline` utility classes (e.g. `focus-visible:outline-2 focus-visible:outline-amber-400`) to the submit `<button>` element rather than relying on global CSS or implicit browser defaults, ensuring a distinct, high-contrast focus indicator.
