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

### Documentation contribution process > Documentation structure

Source: https://geminicli.com/docs/contributing

Documentation structure is managed via a sidebar.json file. New markdown files must be placed in the appropriate directory under /docs, registered in the sidebar, and use relative paths for all internal links.

--------------------------------

### Documentation contribution process

Source: https://geminicli.com/docs/contributing

Documentation contributions should prioritize clarity, accuracy, and completeness. Contributors are encouraged to use simple language, avoid unnecessary jargon, and provide practical examples to assist users.

--------------------------------

### Internal documentation tool (`get_internal_docs`) > Usage

Source: https://geminicli.com/docs/tools/internal-docs

The `get_internal_docs` tool is exclusively utilized by Gemini CLI and cannot be invoked manually. When Gemini CLI uses this tool, it retrieves and processes the content of the requested documentation file to formulate answers, grounding the AI's information in the most current project documentation.

--------------------------------

### Internal documentation tool (`get_internal_docs`) > Behavior

Source: https://geminicli.com/docs/tools/internal-docs

Gemini CLI employs the `get_internal_docs` tool to maintain technical accuracy. This includes discovering capabilities by looking up feature documentation when unsure, performing reference lookups for slash command sub-commands or specific settings, and enabling self-correction by verifying its understanding of the system logic against the documentation.
