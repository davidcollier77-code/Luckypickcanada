import re

with open("components/DailyResonance.tsx", "r") as f:
    content = f.read()

# Find the preRollInterval setup and insert setDisplayPercentage(0) before it
target = r"""    // Instant pre-roll visual feedback
    const preRollInterval = setInterval\(\(\) => \{"""

replacement = r"""    // Instant pre-roll visual feedback
    setDisplayPercentage(0);
    const preRollInterval = setInterval(() => {"""

content = re.sub(target, replacement, content)

with open("components/DailyResonance.tsx", "w") as f:
    f.write(content)
