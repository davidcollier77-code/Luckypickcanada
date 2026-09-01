import re

with open('components/DailyResonance.tsx', 'r') as f:
    content = f.read()

# Fix the merge conflict
pattern = r"<<<<<<< HEAD\n  // Removed timeRemaining state to stop interval re-renders\n=======\n  const \[timeRemaining, setTimeRemaining\] = useState\(''\);\n  const \[shareStatus, setShareStatus\] = useState<'idle' \| 'copied'>\('idle'\);\n>>>>>>> origin/main"
replacement = "  // Removed timeRemaining state to stop interval re-renders\n  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');"

content = re.sub(pattern, replacement, content)

with open('components/DailyResonance.tsx', 'w') as f:
    f.write(content)
