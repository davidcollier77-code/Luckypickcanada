### Display Jules CLI Help

Source: https://jules.google/docs/changelog/2025-10-02

View all available commands and options for the Jules CLI.

```bash
jules help
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
