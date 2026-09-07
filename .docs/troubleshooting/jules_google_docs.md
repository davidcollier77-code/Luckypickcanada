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

### Completion Command

Source: https://jules.google/docs/cli/reference

Generates an autocompletion script for your shell to enable tab completion for jules commands.

```APIDOC
## Completion

Generates an autocompletion script for your shell (e.g., bash, zsh) to enable tab completion for jules commands.

### Command

```
jules completion [shell_type]
```

_Example:_

```
# Generate completion script for bash
jules completion bash
```
```

--------------------------------

### Authentication

Source: https://jules.google/docs/cli/reference

Commands for logging in and out of your Google account to authenticate with Jules Tools.

```APIDOC
## Login

Logs you into your Google account to authenticate with Jules Tools. This command will open a browser window for the authentication process.

### Command

```
jules login
```
```

```APIDOC
## Logout

Logs you out of your Google account, revoking access for Jules Tools.

### Command

```
jules logout
```
```
