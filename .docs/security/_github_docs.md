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

--------------------------------

### Get all contributor commit activity - endpoint definition

Source: https://github.com/github/docs/blob/main/src/rest/data/fpt-2026-03-10/metrics.json

Full endpoint definition including the response schema (author, total, weeks with w/a/d/c), status codes (200, 202, 204), authentication via Metadata:read permissions, and public read access. No pagination parameters are defined.

```json
{
      "serverUrl": "https://api.github.com",
      "verb": "get",
      "requestPath": "/repos/{owner}/{repo}/stats/contributors",
      "title": "Get all contributor commit activity",
      "category": "metrics",
      "subcategory": "statistics",
      "parameters": [
        {
          "name": "owner",
          "description": "<p>The account owner of the repository. The name is not case sensitive.</p>",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          }
        },
        {
          "name": "repo",
          "description": "<p>The name of the repository without the <code>.git</code> extension. The name is not case sensitive.</p>",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ],
      "bodyParameters": [],
      "descriptionHTML": "<p>Returns the <code>total</code> number of commits authored by the contributor. In addition, the response includes a Weekly Hash (<code>weeks</code> array) with the following information:</p>\n<ul>\n<li><code>w</code> - Start of the week, given as a <a href=\"https://en.wikipedia.org/wiki/Unix_time\">Unix timestamp</a>.</li>\n<li><code>a</code> - Number of additions</li>\n<li><code>d</code> - Number of deletions</li>\n<li><code>c</code> - Number of commits</li>\n</ul>\n<div class=\"ghd-alert ghd-alert-accent\" data-container=\"alert\"><p class=\"ghd-alert-title\"><svg version=\"1.1\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" class=\"octicon mr-2\" aria-hidden><path d=\"M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z\"></path></svg>Note</p>\n<p>\nThis endpoint will return <code>0</code> values for all addition and deletion counts in repositories with 10,000 or more commits.</p>\n</div>",
      "codeExamples": [
        {
          "request": {
            "description": "Example",
            "acceptHeader": "application/vnd.github.v3+json",
            "parameters": {
              "owner": "OWNER",
              "repo": "REPO"
            }
          },
          "response": {
            "statusCode": "200",
            "contentType": "application/json",
            "description": "<p>Response</p>",
            "example": [
              {
                "author": {
                  "login": "octocat",
                  "id": 1,
                  "node_id": "MDQ6VXNlcjE=",
                  "avatar_url": "https://github.com/images/error/octocat_happy.gif",
                  "gravatar_id": "",
                  "url": "https://api.github.com/users/octocat",
                  "html_url": "https://github.com/octocat",
                  "followers_url": "https://api.github.com/users/octocat/followers",
                  "following_url": "https://api.github.com/users/octocat/following{/other_user}",
                  "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
                  "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
                  "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
                  "organizations_url": "https://api.github.com/users/octocat/orgs",
                  "repos_url": "https://api.github.com/users/octocat/repos",
                  "events_url": "https://api.github.com/users/octocat/events{/privacy}",
                  "received_events_url": "https://api.github.com/users/octocat/received_events",
                  "type": "User",
                  "site_admin": false
                },
                "total": 135,
                "weeks": [
                  {
                    "w": 1367712000,
                    "a": 6898,
                    "d": 77,
                    "c": 10
                  }
                ]
              }
            ],
            "schema": {
              "type": "array",
              "items": {
                "title": "Contributor Activity",
                "description": "Contributor Activity",
                "type": "object",
                "properties": {
                  "author": {
                    "anyOf": [
                      {
                        "type": "null"
                      },
                      {
                        "title": "Simple User",
                        "description": "A GitHub user.",
                        "type": "object",
                        "properties": {
                          "name": { "type": ["string","null"] },
                          "email": { "type": ["string","null"] },
                          "login": { "type": "string" },
                          "id": { "type": "integer", "format": "int64" },
                          "node_id": { "type": "string" },
                          "avatar_url": { "type": "string", "format": "uri" },
                          "gravatar_id": { "type": ["string","null"] },
                          "url": { "type": "string", "format": "uri" },
                          "html_url": { "type": "string", "format": "uri" },
                          "followers_url": { "type": "string", "format": "uri" },
                          "following_url": { "type": "string" },
                          "gists_url": { "type": "string" },
                          "starred_url": { "type": "string" },
                          "subscriptions_url": { "type": "string", "format": "uri" },
                          "organizations_url": { "type": "string", "format": "uri" },
                          "repos_url": { "type": "string", "format": "uri" },
                          "events_url": { "type": "string" },
                          "received_events_url": { "type": "string", "format": "uri" },
                          "type": { "type": "string" },
                          "site_admin": { "type": "boolean" },
                          "starred_at": { "type": "string" },
                          "user_view_type": { "type": "string" }
                        },
                        "required": ["avatar_url","events_url","followers_url","following_url","gists_url","gravatar_id","html_url","id","node_id","login","organizations_url","received_events_url","repos_url","site_admin","starred_url","subscriptions_url","type","url"]
                      }
                    ]
                  },
                  "total": { "type": "integer" },
                  "weeks": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "w": { "type": "integer" },
                        "a": { "type": "integer" },
                        "d": { "type": "integer" },
                        "c": { "type": "integer" }
                      }
                    }
                  }
                },
                "required": ["author","total","weeks"]
              }
            }
          }
        }
      ],
      "statusCodes": [
        { "httpStatusCode": "200", "description": "<p>OK</p>" },
        { "httpStatusCode": "202", "description": "<p>Accepted</p>" },
        { "httpStatusCode": "204", "description": "<p>A header with no content is returned.</p>" }
      ],
      "previews": [],
      "progAccess": {
        "userToServerRest": true,
        "serverToServer": true,
        "fineGrainedPat": true,
        "permissions": [
          { "\"Metadata\" repository permissions": "read" }
        ],
        "allowsPublicRead": true
      }
    }
```
