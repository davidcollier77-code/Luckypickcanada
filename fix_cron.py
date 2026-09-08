import re

with open("AGENTS.md", "r") as f:
    content = f.read()

# Replace the specific obsolete cron wording
target = "- The existing GitHub Actions workflow (`.github/workflows/refresh-docs.yml`) must run every Tuesday and Friday at 2:21 AM local time using `America/Halifax` (`cron: '21 2 * * 2,5'`, `timezone: 'America/Halifax'`). Do not replace this with UTC.\n"

if target in content:
    new_content = content.replace(target, "")
    with open("AGENTS.md", "w") as f:
        f.write(new_content)
    print("Obsolete cron wording removed.")
else:
    print("Error: Target wording not found.")
