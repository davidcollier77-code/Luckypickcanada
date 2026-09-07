### GET get_internal_docs

Source: https://geminicli.com/docs/tools/internal-docs

Retrieves internal documentation files for Gemini CLI to verify features, commands, or configuration settings.

```APIDOC
## GET get_internal_docs

### Description
Retrieves the content of specific documentation files or a list of all available documentation paths within the Gemini CLI project.

### Method
GET

### Endpoint
get_internal_docs

### Parameters
#### Query Parameters
- **path** (string) - Optional - The relative path to a specific documentation file (e.g., 'reference/commands.md'). If omitted, returns a list of all available documentation paths.

### Response
#### Success Response (200)
- **content** (string) - The text content of the requested documentation file or a list of available file paths.
```

--------------------------------

### Run the bulk documentation generator script

Source: https://geminicli.com/docs/cli/tutorials/automation

Execute the `generate_docs.sh` script to create Markdown documentation for all Python files in the current directory.

```bash
./generate_docs.sh
```

```powershell
.\generate_docs.ps1
```

--------------------------------

### Generate Markdown documentation for Python files

Source: https://geminicli.com/docs/cli/tutorials/automation

This bash script iterates through all `.py` files in a directory, uses Gemini CLI to generate a Markdown documentation summary for each, and saves the output to a corresponding `.md` file. Ensure Gemini CLI is authenticated and installed.

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

### Documentation contribution process > Documentation structure

Source: https://geminicli.com/docs/contributing

Documentation structure is managed via a sidebar.json file. New markdown files must be placed in the appropriate directory under /docs, registered in the sidebar, and use relative paths for all internal links.

--------------------------------

### Documentation contribution process

Source: https://geminicli.com/docs/contributing

Documentation contributions should prioritize clarity, accuracy, and completeness. Contributors are encouraged to use simple language, avoid unnecessary jargon, and provide practical examples to assist users.
