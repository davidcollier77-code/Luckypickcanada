docs: establish authoritative library inventory and context7 workflow

**What:**
Created `.docs/manifest.json` outlining the 31 exact approved documentation dependencies for LuckyPickCanada. Updated `AGENTS.md` to reference this manifest. Implemented `.github/workflows/refresh-docs.yml` to routinely evaluate drift and create Github Issues requiring contextual updates. Cleaned up typo'd `.jules/sentinel.md.` by merging its historical logs.

**Why:**
To ensure agents strictly consult verified, approved libraries through Context7 instead of hallucinating packages or versions, and to establish a robust framework for managing documentation drift.

**Impact:**
Increases repository contextual safety and automation. No core applications, files, logic, database, or CSS have been altered.
