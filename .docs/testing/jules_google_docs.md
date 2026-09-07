### Get Entire File Outputs from a Session

Source: https://jules.google/docs/changelog

Retrieve the complete change set of files modified during a session in git patch format. This allows for parsing additions, modifications, and deletions.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  FILES CHANGED                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  [M]  bun.lock                                            +567    -163       │
│  [A]  bunfig.toml                                           +2      -0       │
│  [M]  examples/simple/main.ts                               +2      -1       │
│  [M]  packages/core/src/client.ts                          +21      -6       │
│  [M]  packages/core/src/network/adapter.ts                 +46     -13       │
│  [A]  packages/core/src/retry-utils.ts                     +89      -0       │
│  [M]  packages/core/src/sources.ts                          +2      -0       │
│  [M]  packages/core/src/streaming.ts                       +15     -51       │
│  [M]  packages/core/src/types.ts                           +12      -0       │
│  [M]  packages/core/tests/automated_session.test.ts       +125      -0       │
│  [M]  packages/core/tests/network/adapter.test.ts         +109      -0       │
│  [A]  packages/core/tests/retry-utils.test.ts             +140      -0       │
│  [M]  packages/core/tests/sources.test.ts                  +21      -0       │
├──────────────────────────────────────────────────────────────────────────────┤
│  Summary: 13 files changed                        +1,151 insertions, -234    │
└──────────────────────────────────────────────────────────────────────────────┘
  Session finished: completed
```

--------------------------------

### Get a Session

Source: https://jules.google/docs/api/reference/sessions

Retrieve a single session by its ID. The response includes the full session object, including outputs if the session has completed.

```bash
curl -H "x-goog-api-key: $JULES_API_KEY" \
  https://jules.googleapis.com/v1alpha/sessions/1234567
```

```json
{
  "name": "sessions/1234567",
  "id": "abc123",
  "prompt": "Add comprehensive unit tests for the authentication module",
  "title": "Add auth tests",
  "state": "COMPLETED",
  "url": "https://jules.google.com/session/abc123",
  "createTime": "2024-01-15T10:30:00Z",
  "updateTime": "2024-01-15T11:45:00Z",
  "outputs": [
    {
      "pullRequest": {
        "url": "https://github.com/myorg/myrepo/pull/42",
        "title": "Add auth tests",
        "description": "Added unit tests for authentication module"
      }
    }
  ]
}
```

--------------------------------

### Using Your API Key

Source: https://jules.google/docs/api/reference/authentication

Include the API key in the `x-goog-api-key` header with every request.

```APIDOC
## Using Your API Key

Include the API key in the `x-goog-api-key` header with every request:

```bash
curl -H "x-goog-api-key: YOUR_API_KEY" \
  https://jules.googleapis.com/v1alpha/sessions
```

### Environment Variable (Recommended)

Store your API key in an environment variable:

```bash
export JULES_API_KEY="your-api-key-here"
```

Then use it in requests:

```bash
curl -H "x-goog-api-key: $JULES_API_KEY" \
  https://jules.googleapis.com/v1alpha/sessions
```
```

--------------------------------

### Get a Source

Source: https://jules.google/docs/api/reference/sources

Retrieves a single source by its ID.

```APIDOC
## Get a Source

### Description
Retrieves a single source by ID.

### Method
GET

### Endpoint
/v1alpha/sources/{sourceId}

### Path Parameters
- **sourceId** (string) - Required - The ID of the source to retrieve.

### Request Example
```bash
curl -H "x-goog-api-key: $JULES_API_KEY" \
  https://jules.googleapis.com/v1alpha/sources/github-myorg-myrepo
```

### Response
#### Success Response (200)
Returns the full Source object:
- **name** (string) - The resource name of the source.
- **id** (string) - The unique identifier of the source.
- **githubRepo** (object) - Details about the GitHub repository.
  - **owner** (string) - The owner of the GitHub repository.
  - **repo** (string) - The name of the GitHub repository.
  - **isPrivate** (boolean) - Indicates if the repository is private.
  - **defaultBranch** (object) - Information about the default branch.
    - **displayName** (string) - The name of the default branch.
  - **branches** (array) - A list of branches in the repository.
    - **displayName** (string) - The name of the branch.
```

--------------------------------

### Help Commands

Source: https://jules.google/docs/cli/reference

How to get help for the Jules CLI, including general help and command-specific help.

```APIDOC
## General Help

Displays general help information for the Jules CLI.

### Command

```
jules help
```
```

```APIDOC
## Command-Specific Help

Displays help information for a specific command (e.g., `remote`).

### Command

```
jules [command] --help
```

_Example:_

```
jules remote --help
```
```
