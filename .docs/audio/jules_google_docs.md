### Display Jules CLI Help

Source: https://jules.google/docs/changelog/2025-10-02

View all available commands and options for the Jules CLI.

```bash
jules help
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

--------------------------------

### Version Command

Source: https://jules.google/docs/cli/reference

Displays the currently installed version of the Jules Tools CLI.

```APIDOC
## Version

Shows the currently installed version of the Jules Tools CLI.

### Command

```
jules version
```
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
