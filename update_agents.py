import sys

with open("AGENTS.md", "r") as f:
    content = f.read()

content = content.replace(
    "pnpm install\npnpm dev",
    "pnpm install --frozen-lockfile\npnpm dev"
)

content = content.replace(
    "When deployment work is explicitly authorized, use the repository's existing OpenNext/Cloudflare deployment configuration rather than creating a new deployment path.",
    "When deployment work is explicitly authorized, use the repository's existing OpenNext/Cloudflare deployment configuration rather than creating a new deployment path. Use the existing \"pnpm deploy\" command. Deployment requires explicit authorization."
)

with open("AGENTS.md", "w") as f:
    f.write(content)
