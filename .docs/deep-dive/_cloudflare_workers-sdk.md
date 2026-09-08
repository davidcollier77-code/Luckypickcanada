### Wrangler --help output structure

Source: https://github.com/cloudflare/workers-sdk/blob/main/STYLEGUIDE.md

Defines the standard format for the `wrangler --help` output, including descriptions, commands, options, and documentation links.

```sh
🧮 *Brief description of the product, the value it offers and how Wrangler can interact with it*

🔧 *Command is currently in open beta / command is experimental (if relevant)*

Commands:
  wrangler <command> <subcommand> <arg> *Description of command*

Options:
  -<o (option shorthand)>, --<option (option name)>  *Option description* [*data_type*] [default: *true/false*]


--------------------
📣 *Announcement*
📃 To learn more, visit our documentation on *Product name*: https://developers.cloudflare.com/*productname*
--------------------
```

--------------------------------

### General error message format

Source: https://github.com/cloudflare/workers-sdk/blob/main/STYLEGUIDE.md

Describes the standard format for general error messages, including error details, resolution, documentation links, and an option to report the error.

```sh
✘  ERROR  *Error code if applicable*: *Concise description of what the error is*

Error details:
*description of what caused the error*

How to solve this error:
*direction on how to resolve the error*

--------------------
To learn more about ___, read our documentation at https://developers.cloudflare.com/*productname*

If you think this is a bug then please create an issue at https://github.com/cloudflare/workers-sdk/issues/new/choose
--------------------

√ Would you like to report this error to Cloudflare? <y/n>

#User inputs y or n#

🪵  Logs were written to <filepath>
```

--------------------------------

### Create success state with binding

Source: https://github.com/cloudflare/workers-sdk/blob/main/STYLEGUIDE.md

Shows the output for a successful creation operation that includes a binding configuration for a Worker.

```sh
🌀 Creating ___ with title "___"
✨ Success. *Add details of success and what the user can now do*
📣 *Optional announcement*

To start interacting with this ___ from a Worker, *If additional steps required, such as obtaining account ID from dash, add them here* \(then\) open your Worker’s config file and add the following binding configuration:

[[array]]
binding = "<VARIABLE_NAME>"
name = "___"
id = "___"
```

### Documentation

Source: https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/CONTRIBUTING.md

All new commands and features require corresponding documentation to be added to the cloudflare-docs repository.

--------------------------------

### Pull Request Guidelines

Source: https://github.com/cloudflare/workers-sdk/blob/main/AGENTS.md

All pull requests must utilize the standard template provided in the repository. Contributors are required to fill in the issue link, provide a description, and ensure all checkboxes remain in the template. PR titles must follow the format of [package name] description. CI validation requires a checked test status, a checked documentation status with appropriate links or justifications, and either a changeset file or the no-changeset-required label.
