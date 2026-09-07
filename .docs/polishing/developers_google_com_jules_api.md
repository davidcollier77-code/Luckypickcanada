### List Sources

Source: https://developers.google.com/jules/api

Retrieves a list of all sources connected to Jules. This is useful for identifying the name of a source you want to work with.

```APIDOC
## List Sources

### Description
Retrieves a list of all sources connected to Jules.

### Method
GET

### Endpoint
/v1alpha/sources

### Request Example
```bash
curl 'https://jules.googleapis.com/v1alpha/sources' \
    -H 'X-Goog-Api-Key: YOUR_API_KEY'
```

### Response Example
```json
{
  "sources": [
    {
      "name": "sources/github/bobalover/boba",
      "id": "github/bobalover/boba",
      "githubRepo": {
        "owner": "bobalover",
        "repo": "boba"
      }
    }
  ],
  "nextPageToken": "github/bobalover/boba-web"
}
```
```

--------------------------------

### Create Session

Source: https://developers.google.com/jules/api

Creates a new session with the Jules API. You need to provide a prompt and the source name.

```APIDOC
## Create Session

### Description
Creates a new session within a specified source. Optionally configures automation and titles the session.

### Method
POST

### Endpoint
/v1alpha/sessions

### Parameters
#### Request Body
- **prompt** (string) - Required - The initial prompt for the session.
- **sourceContext** (object) - Required - Context about the source.
  - **source** (string) - Required - The name of the source (e.g., "sources/github/bobalover/boba").
  - **githubRepoContext** (object) - Optional - Context specific to GitHub repositories.
    - **startingBranch** (string) - Optional - The branch to start from.
- **automationMode** (string) - Optional - Specifies the automation mode (e.g., "AUTO_CREATE_PR"). Defaults to no automatic PR creation.
- **title** (string) - Optional - A title for the session.
- **requirePlanApproval** (boolean) - Optional - If true, requires explicit plan approval. Defaults to false.

### Request Example
```bash
curl 'https://jules.googleapis.com/v1alpha/sessions' \
    -X POST \
    -H "Content-Type: application/json" \
    -H 'X-Goog-Api-Key: YOUR_API_KEY' \
    -d '{
      "prompt": "Create a boba app!",
      "sourceContext": {
        "source": "sources/github/bobalover/boba",
        "githubRepoContext": {
          "startingBranch": "main"
        }
      },
      "automationMode": "AUTO_CREATE_PR",
      "title": "Boba App"
    }'
```

### Response Example
```json
{
  "name": "sessions/31415926535897932384",
  "id": "31415926535897932384",
  "title": "Boba App",
  "sourceContext": {
    "source": "sources/github/bobalover/boba",
    "githubRepoContext": {
      "startingBranch": "main"
    }
  },
  "prompt": "Create a boba app!"
}
```
```

--------------------------------

### get

Source: https://developers.google.com/jules/api/reference/rest/v1alpha/sessions

Retrieves a single session by its ID.

```APIDOC
## get

### Description
Gets a single session.

### Method
GET

### Endpoint
/v1alpha/sessions/{sessionId}

### Parameters
#### Path Parameters
- **sessionId** (string) - Required - The ID of the session to retrieve.

### Response
#### Success Response (200)
- **session** (Session) - The requested session.
```

--------------------------------

### v1alpha.sources.get

Source: https://developers.google.com/jules/api/reference/rest

Gets a single source.

```APIDOC
## GET /v1alpha/{name=sources/**}

### Description
Gets a single source.

### Method
GET

### Endpoint
/v1alpha/{name=sources/**}
```

--------------------------------

### Approve Plan

Source: https://developers.google.com/jules/api

Approves the latest plan for a session. This is required if `requirePlanApproval` was set to true during session creation.

```APIDOC
## Approve Plan

### Description
Approves the latest plan for a given session. This action is typically required when a session is configured to need explicit plan approval.

### Method
POST

### Endpoint
/v1alpha/sessions/{SESSION_ID}:approvePlan

### Parameters
#### Path Parameters
- **SESSION_ID** (string) - Required - The ID of the session whose plan needs approval.

### Request Example
```bash
curl 'https://jules.googleapis.com/v1alpha/sessions/SESSION_ID:approvePlan' \
    -X POST \
    -H "Content-Type: application/json" \
    -H 'X-Goog-Api-Key: YOUR_API_KEY'
```
```
