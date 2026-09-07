### Session Resource

Source: https://developers.google.com/jules/api/reference/rest/v1alpha/sessions

Represents a session, which is a contiguous amount of work within the same context. It includes details about the prompt, source context, automation mode, state, and outputs.

```APIDOC
## Resource: Session
A session is a contiguous amount of work within the same context.

### JSON representation
```json
{
  "name": string,
  "id": string,
  "prompt": string,
  "sourceContext": {
    "object": "SourceContext"
  },
  "title": string,
  "requirePlanApproval": boolean,
  "automationMode": enum("AutomationMode"),
  "createTime": string,
  "updateTime": string,
  "state": enum("State"),
  "url": string,
  "outputs": [
    {
      "object": "SessionOutput"
    }
  ]
}
```

### Fields
*   `name` (string, Output only): Identifier. The full resource name (e.g., "sessions/{session}").
*   `id` (string, Output only): The id of the session. This is the same as the "{session}" part of the resource name (e.g., "sessions/{session}").
*   `prompt` (string, Required): The prompt to start the session with.
*   `sourceContext` (object (SourceContext), Required): The source to use in this session, with additional context.
*   `title` (string, Optional): If not provided, the system will generate one.
*   `requirePlanApproval` (boolean, Optional, Input only): If true, plans the agent generates will require explicit plan approval before the agent starts working. If not set, plans will be auto-approved.
*   `automationMode` (enum (AutomationMode), Optional, Input only): The automation mode of the session. If not set, the default automation mode will be used.
*   `createTime` (string (Timestamp format), Output only): The time the session was created. Uses RFC 3339, where generated output will always be Z-normalized and use 0, 3, 6 or 9 fractional digits. Offsets other than "Z" are also accepted. Examples: "2014-10-02T15:01:23Z", "2014-10-02T15:01:23.045123456Z" or "2014-10-02T15:01:23+05:30".
*   `updateTime` (string (Timestamp format), Output only): The time the session was last updated. Uses RFC 3339, where generated output will always be Z-normalized and use 0, 3, 6 or 9 fractional digits. Offsets other than "Z" are also accepted. Examples: "2014-10-02T15:01:23Z", "2014-10-02T15:01:23.045123456Z" or "2014-10-02T15:01:23+05:30".
*   `state` (enum (State), Output only): The state of the session.
*   `url` (string, Output only): The URL of the session to view the session in the Jules web app.
*   `outputs` (array of objects (SessionOutput), Output only): The outputs of the session, if any.
```

--------------------------------

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

### sessions.get

Source: https://developers.google.com/jules/api/reference/rest/v1alpha/sessions/get

Gets a single session. Stay organized with collections. Save and categorize content based on your preferences.

```APIDOC
## GET /v1alpha/{name=sessions/*}

### Description
Gets a single session. Stay organized with collections. Save and categorize content based on your preferences.

### Method
GET

### Endpoint
`https://jules.googleapis.com/v1alpha/{name=sessions/*}`

### Path Parameters
* **name** (string) - Required. The resource name of the session to retrieve. Format: sessions/{session}. It takes the form sessions/{session}.

### Request Body
The request body must be empty.

### Response Body
If successful, the response body contains an instance of `Session`.
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
