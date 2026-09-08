import re

with open('scripts/refresh-docs.js', 'r') as f:
    content = f.read()

# Make the outer loop break on error resilient:
old_break = """    if (stats.errors.length > 0) {
        break; // Halt entire run if there was an error
    }"""
content = content.replace(old_break, "")

# The script exits with 1 if there were errors:
old_exit = """  if (stats.errors.length > 0) {
    const failMsg = `FAILED — [${timestamp}] — VERIFICATION FAILED`;"""

new_exit = """  // If there are errors, we log them, but don't fail the whole action
  // unless we want to fail the CI step.
  // Let's check instructions: "Make the refresh resilient: one unavailable library must not unnecessarily prevent all other valid libraries from being refreshed, while still clearly reporting failures."
  // It already reports failures in stats.errors, but maybe we shouldn't exit 1?
  // Wait, if it fails, the previous instruction was:
  // "A successful refresh must report SUCCESS... A failed refresh must report FAILED..."
  if (stats.errors.length > 0 && stats.failed === stats.failed + stats.updated + stats.unchanged) {
    const failMsg = `FAILED — [${timestamp}] — VERIFICATION FAILED`;"""

# Let's just make it not break out of the loop and maybe exit 0 or 1 at the end.
# Actually, the instructions say "one unavailable library must not unnecessarily prevent all other valid libraries from being refreshed, while still clearly reporting failures."
# Which is what we did by removing the `break;` in the catch block and removing the `break;` after the while loop.
# Let's ensure the `break;` is completely removed.
with open('scripts/refresh-docs.js', 'w') as f:
    f.write(content)
