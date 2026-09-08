### List Sources

Source: https://developers.google.com/jules/api/reference/rest/v1alpha/sources

Retrieves a list of all configured sources.

```APIDOC
## GET /v1alpha/sources

### Description
Lists sources.

### Method
GET

### Endpoint
/v1alpha/sources
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

### list

Source: https://developers.google.com/jules/api/reference/rest/v1alpha/sessions

Lists all available sessions.

```APIDOC
## list

### Description
Lists all sessions.

### Method
GET

### Endpoint
/v1alpha/sessions

### Response
#### Success Response (200)
- **sessions** (array[Session]) - A list of sessions.
```

--------------------------------

### create

Source: https://developers.google.com/jules/api/reference/rest/v1alpha/sessions

Creates a new session.

```APIDOC
## create

### Description
Creates a new session.

### Method
POST

### Endpoint
/v1alpha/sessions:create

### Request Body
```json
{
  "name": "string",
  "description": "string"
}
```

### Response
#### Success Response (200)
- **session** (Session) - The created session.
```

--------------------------------

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
