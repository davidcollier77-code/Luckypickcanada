## 2026-08-17 - Add Escape key support for modals
**Learning:** Keyboard navigation and specifically Escape key dismissal is a fundamental part of modal accessibility. Some custom dialog implementations (like the ones built over divs) miss out on this native `<dialog>` behavior, restricting users who rely on keyboards.
**Action:** Always ensure that manually constructed modal dialogs include an Escape key listener to close them, replicating standard dialog UX and improving accessibility.

## 2026-08-18 - Remove rigid card framing for transparent organic feel
**Learning:** For premium, cinematic visual aesthetics, rigid, dark rectangular framing (like solid black backgrounds or borders) around transparent graphics disrupts the visual flow against organic starry backgrounds.
**Action:** Use transparent backgrounds and remove borders on inner card wrappers to allow the card graphic to sit seamlessly and naturally over the main atmospheric background.

## 2026-08-19 - Enhance Modal Focus Management
**Learning:** For manually constructed React modal dialogs, immediately trapping or directing focus into the modal upon opening is critical for keyboard and screen reader accessibility. If a modal opens but focus remains on the triggering element or is lost, keyboard users may struggle to interact with the modal content.
**Action:** When implementing or modifying custom modal dialogs, always include the `autoFocus` attribute on a primary interactive element within the modal, such as the close button, to ensure focus is properly managed.

## 2026-08-20 - Ensure icon-only buttons have accessible names
**Learning:** Buttons that rely purely on visual indicators (like SVG icons) for their meaning are inaccessible to screen reader users if they lack an explicit accessible name. For example, a share button featuring only an icon must define what action it performs.
**Action:** Always verify that icon-only buttons include an `aria-label` attribute (e.g., `aria-label="Share your result"`) to clearly communicate their purpose.
