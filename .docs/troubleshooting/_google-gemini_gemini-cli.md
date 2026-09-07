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

### View Active Context

Source: https://geminicli.com/docs/cli/tutorials/memory-management

Use the `/memory show` command to inspect the full, concatenated set of instructions currently loaded by the Gemini CLI, useful for debugging.

```bash
/memory show
```

### Documentation contribution process > Documentation structure

Source: https://geminicli.com/docs/contributing

Documentation structure is managed via a sidebar.json file. New markdown files must be placed in the appropriate directory under /docs, registered in the sidebar, and use relative paths for all internal links.

--------------------------------

### Documentation contribution process

Source: https://geminicli.com/docs/contributing

Documentation contributions should prioritize clarity, accuracy, and completeness. Contributors are encouraged to use simple language, avoid unnecessary jargon, and provide practical examples to assist users.

--------------------------------

### Agent Skill best practices > Progressive disclosure

Source: https://geminicli.com/docs/cli/skills-best-practices

Implement progressive disclosure to manage the context window efficiently. This involves a three-level loading system: 1. Metadata (name + description) always in context (~100 words). 2. `SKILL.md` body loaded after the skill triggers (<5k words). 3. Bundled resources loaded only as needed. Keep the `SKILL.md` body focused on core instructions and move detailed reference material to a `references/` directory.
