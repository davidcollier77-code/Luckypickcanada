import re

pictogram = """
                         ┌──────────────────────┐
                         │         START        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 1. IDENTIFY TASK     │
                         │        GROUP         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 2. READ REPOSITORY   │
                         │    INSTRUCTIONS +    │
                         │    LOCAL RESOURCES   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 3. READ `.docs`      │
                         │    LOCAL LIBRARY     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 4. CHECK EXISTING    │
                         │ CAPABILITIES /       │
                         │ LIBRARIES / SCRIPTS /│
                         │ TOOLS / WORKFLOWS    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 5. JULES + GEMINI    │
                         │    MANDATORY         │
                         │    COLLABORATION     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 6. AUTHORITATIVE /   │
                         │    CURRENT DOCS      │
                         │    WHEN REQUIRED     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 7. CONTEXT7          │
                         │    LAST RESORT ONLY  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ 8. NEW DEPENDENCY /  │
                         │    EXTERNAL          │
                         │    CAPABILITY        │
                         │    TRUE LAST RESORT  │
                         │    + AUTHORIZATION   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      IMPLEMENT       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │        TEST          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    DOUBLE-CHECK      │
                         │  ACTUAL REPO STATE   │
                         └──────────┬───────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────┐
              │       DOCUMENTATION ACCOUNTABILITY      │
              │                                         │
              │ REPORT ONLY RESOURCES ACTUALLY USED:   │
              │ `.docs` • repo instructions • Jules    │
              │ docs • Gemini docs • authoritative docs │
              │ • Context7 • MCP                        │
              │                                         │
              │ State WHAT was consulted and WHAT EACH  │
              │ resource actually contributed.          │
              └─────────────────────────────────────────┘
"""

with open("AGENTS.md", "r") as f:
    content = f.read()

# Find the spot before ## 1. Mandatory AI Collaboration
split_point = "## 1. Mandatory AI Collaboration"
parts = content.split(split_point)

if len(parts) >= 2:
    new_content = parts[0] + "```text\n" + pictogram.strip('\n') + "\n```\n\n" + split_point + parts[1]
    with open("AGENTS.md", "w") as f:
        f.write(new_content)
    print("Pictogram inserted.")
else:
    print("Error: Could not find split point.")
