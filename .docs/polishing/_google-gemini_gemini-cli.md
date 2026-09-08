### Inline tip directing users to `/docs`

Source: https://github.com/google-gemini/gemini-cli/blob/main/packages/cli/src/ui/constants/tips.ts

One of 164 inline documentation tips displayed during CLI loading. This tip directly tells users how to access the full documentation via the `/docs` command.

```typescript
'Open the full documentation in your browser with /docs',
```

--------------------------------

### Bulk documentation generator script using Gemini CLI

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/tutorials/automation.md

Automate the generation of Markdown documentation for multiple Python files. This script iterates through `.py` files, uses Gemini CLI to generate documentation for each, and saves the output to corresponding `.md` files.

```bash
#!/bin/bash

# Loop through all Python files
for file in *.py; do
  echo "Generating docs for $file..."

  # Ask Gemini CLI to generate the documentation and print it to stdout
  gemini -p "Generate a Markdown documentation summary for @$file. Print the
  result to standard output." > "${file%.py}.md"
done
```

```powershell
# Loop through all Python files
Get-ChildItem -Filter *.py | ForEach-Object {
  Write-Host "Generating docs for $($_.Name)..."

  $newName = $_.Name -replace '\.py$', '.md'
  # Ask Gemini CLI to generate the documentation and print it to stdout
  gemini -p "Generate a Markdown documentation summary for @$($_.Name). Print the result to standard output." | Out-File -FilePath $newName -Encoding utf8
}
```

### Gemini CLI documentation > Reference

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/index.md

Deep technical documentation and API specifications.

--------------------------------

### Gemini CLI Project Context > Documentation

Source: https://github.com/google-gemini/gemini-cli/blob/main/GEMINI.md

Documentation is housed in the `docs/` directory. The `docs-writer` skill should always be used for writing, editing, or reviewing documentation. Updates to documentation should be suggested when code changes make existing documentation obsolete or incomplete.

--------------------------------

### Documentation contribution process > Documentation structure

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/CONTRIBUTING.md

Documentation is organized using `sidebar.json` as the table of contents. When adding new documentation, create a markdown file in the appropriate directory under `/docs`, add an entry to `sidebar.json`, and ensure all internal links use relative paths.
