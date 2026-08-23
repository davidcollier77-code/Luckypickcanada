## 2025-08-16 - Add Escape key support for modals
**Learning:** Keyboard navigation and specifically Escape key dismissal is a fundamental part of modal accessibility. Some custom dialog implementations (like the ones built over divs) miss out on this native `<dialog>` behavior, restricting users who rely on keyboards.
**Action:** Always ensure that manually constructed modal dialogs include an Escape key listener to close them, replicating standard dialog UX and improving accessibility.

## 2026-08-23 - Focus-visible and required indicators
**Learning:** For users relying on keyboard navigation, custom forms often lack clear focus indicators if relying on default browser styling or omitting `:focus-visible` entirely. Additionally, forms in complex UI setups often miss visual indicators for required fields, reducing clarity.
**Action:** When working on custom forms and modals, ensure focus styles are explicitly added using `:focus-visible` (with outline offsets) and required fields have visual indicators like `*` appended properly.
