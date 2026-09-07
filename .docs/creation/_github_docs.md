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

### Search documentation content

Source: https://github.com/github/docs/blob/main/content/get-started/using-github-docs/github-docs-api.md

Performs a search across documentation content using query parameters for terms, version, language, and pagination.

```shell
curl "https://docs.github.com/api/search/v1?query=actions&client_name=docs-api-example&version=free-pro-team&language=en"
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

### Get Product Versions

Source: https://github.com/github/docs/blob/main/src/article-api/README.md

Fetch a list of all available product versions for the documentation site. The response includes versions and enterprise server versions.

```bash
curl -s https://docs.github.com/api/pagelist/versions | jq
```
