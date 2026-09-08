import os

directive = """# MANDATORY INITIALIZATION DIRECTIVE
**STOP. READ THIS FIRST.**

Before you analyze, plan, or execute ANY task in this repository, you MUST read the `AGENTS.md` file located in the root directory.

`AGENTS.md` is the absolute, authoritative governance and routing file for this repository. It dictates the task groups, approved resources, documentation rules, and boundaries you are strictly required to follow.

You cannot rely on memory, assumptions, or secondary files to bypass `AGENTS.md`.

Once you have read `AGENTS.md`, you must use it to identify the correct task group and read the corresponding specialist file in the `.jules/` directory (e.g., `.jules/troubleshooting.md`, `.jules/creation.md`).

Do not proceed with any task until you have completed this mandatory initialization step.

---

"""

file_path = ".jules/jules.md"

if os.path.exists(file_path):
    with open(file_path, "r") as f:
        original_content = f.read()

    with open(file_path, "w") as f:
        f.write(directive + original_content)
    print("Successfully prepended directive to .jules/jules.md")
else:
    print(f"Error: {file_path} does not exist.")
