import re

def update_context():
    try:
        with open('memory-bank/activeContext.md', 'r') as f:
            content = f.read()

        new_entry = """
## Image Delivery Optimization - 2026-10-23
- **Goal:** Improve image delivery for the homepage hero emblem and Facebook community cover.
- **Change:** Implemented responsive `<picture>` structures and preloads using dynamically generated `669w`, `551w`, and `800w` AVIF and WebP variants using sharp.
- **Verification:** Verified via Playwright visual checks, build passing within limits, and manual check of layout and formats.
"""

        if "## Image Delivery Optimization" not in content:
             updated_content = content + "\n" + new_entry
             with open('memory-bank/activeContext.md', 'w') as f:
                 f.write(updated_content)
             print("Updated activeContext.md")
    except Exception as e:
        print("Could not update activeContext.md", e)

update_context()
