### GET /api/article

Source: https://github.com/github/docs/blob/main/data/llms-txt/docs.md

Retrieves the full rendered content and context of a specific documentation page as JSON.

```APIDOC
## GET /api/article

### Description
Returns the full rendered content and context of any docs page as JSON.

### Method
GET

### Endpoint
/api/article

### Parameters
#### Query Parameters
- **pathname** (string) - Required - The path of the documentation page to retrieve.
```

--------------------------------

### GET /api/article/body

Source: https://github.com/github/docs/blob/main/content/get-started/using-github-docs/github-docs-api.md

Retrieves the full Markdown content of a documentation article.

```APIDOC
## GET /api/article/body

### Description
Returns the full article content as Markdown.

### Method
GET

### Endpoint
https://docs.github.com/api/article/body

### Parameters
#### Query Parameters
- **pathname** (string) - Required - The article path, including a language prefix (e.g., /en/get-started/start-your-journey/what-is-github).
- **apiVersion** (string) - Optional - For REST API reference pages, specifies which API version to use.
```

### About GitHub Agentic Workflows

Source: https://github.com/github/docs/blob/main/content/copilot/concepts/agents/about-github-agentic-workflows.md

To get started with your first agentic workflow, follow the quickstart guide. For detailed instructions on creating and using agentic workflows, refer to the dedicated documentation. The full reference documentation, including advanced patterns and examples, is available on the GitHub Agentic Workflows documentation site.

--------------------------------

### Finding information in a repository > Internal documentation

Source: https://github.com/github/docs/blob/main/content/get-started/learning-to-code/finding-and-understanding-example-code.md

You can also look for internal documentation in the repository's contents. This could be a single Markdown file or a directory full of Markdown files. Common names to look for include "docs", "documentation", "wiki", "resources", "help", and "manual".

--------------------------------

### About GitHub's documentation fundamentals > Accessible and inclusive

Source: https://github.com/github/docs/blob/main/content/contributing/writing-for-github-docs/about-githubs-documentation-fundamentals.md

Documentation must be up to date with the latest accessibility standards to ensure it is usable by everyone. Furthermore, content should be written to be inclusive and translation-friendly, which involves adhering to specific screenshot guidelines and following best practices for content that will be localized into other languages.
