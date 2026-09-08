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

--------------------------------

### GET /api/search/v1

Source: https://github.com/github/docs/blob/main/data/llms-txt/docs.md

Performs a search across all documentation content.

```APIDOC
## GET /api/search/v1

### Description
Search across all docs content.

### Method
GET

### Endpoint
/api/search/v1

### Parameters
#### Query Parameters
- **query** (string) - Required - The search term.
- **language** (string) - Optional - The language code.
- **version** (string) - Optional - The documentation version.
```

--------------------------------

### GET https://docs.github.com/api/pagelist/versions

Source: https://github.com/github/docs/blob/main/content/get-started/using-github-docs/github-docs-api.md

Returns all available documentation versions as JSON.

```APIDOC
## GET https://docs.github.com/api/pagelist/versions

### Description
Returns all available documentation versions as JSON, including GitHub Enterprise Server version numbers. Use this to find valid values for the :version parameter.

### Method
GET

### Endpoint
https://docs.github.com/api/pagelist/versions
```

--------------------------------

### Render a markdown document

Source: https://github.com/github/docs/blob/main/content/rest/markdown/markdown.md

This endpoint renders a markdown document as an HTML page or as raw text.

```APIDOC
## POST /markdown

### Description

This endpoint renders a markdown document as an HTML page or as raw text.

### Method

POST

### Endpoint

/markdown

### Request Body

- **text** (string) - Required - The markdown text to render.
- **mode** (string) - Optional - The rendering mode. Can be `gfm` for GitHub Flavored Markdown or `markdown` for the original Markdown format. Defaults to `markdown`.
- **context** (string) - Optional - The repository context, used to render GFM references. For example, `octo-org/octo-repo`.

### Request Example

```json
{
  "text": "# Hello World\n\nThis is **bold** text.",
  "mode": "gfm",
  "context": "octo-org/octo-repo"
}
```

### Response

#### Success Response (200)

- **rendered_output** (string) - The rendered markdown as HTML or raw text.

#### Response Example

```json
{
  "rendered_output": "<h1>Hello World</h1>\n<p>This is <strong>bold</strong> text.</p>"
}
```
```
