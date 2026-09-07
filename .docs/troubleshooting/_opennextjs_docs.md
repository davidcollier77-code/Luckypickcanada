### @opennextjs/aws to Next.js version compatibility table

Source: https://github.com/opennextjs/docs/blob/main/pages/aws/compatibility.mdx

Compatibility table mapping each @opennextjs/aws release to the Next.js version it was tested against, directly answering which Next.js versions the AWS adapter supports.

```mdx
#### `@opennextjs/aws` Compatibility

| OpenNext Version | Next.js Version |
| ---------------- | --------------- |
| 3.6.1 to 3.6.2   | 15.3.2          |
| 3.5.8 to 3.6.0   | 15.3.1          |
| 3.5.7            | 15.3.0          |
| 3.5.6            | 15.2.5          |
| 3.5.3 to 3.5.5   | 15.2.4          |
| 3.5.2            | 15.2.2          |
| 3.5.0 to 3.5.1   | 15.2.0          |
| 3.4.1 to 3.4.2   | 15.1.6          |
| 3.4.0            | 15.1.5          |
| 3.3.1            | 15.1.3          |
| 3.3.0            | 15.1.0          |
| 3.2.2            | 15.0.3          |
| 3.2.1            | 15.0.2          |
| 3.2.0            | 15.0.1          |
| 3.1.4 to 3.1.6   | 14.2.15         |
```

--------------------------------

### Next.js version support policy for the AWS adapter

Source: https://github.com/opennextjs/docs/blob/main/pages/aws/compatibility.mdx

Callout block in the AWS compatibility page that defines which Next.js versions are supported by @opennextjs/aws, including the key limitation that only the latest minor/patch of a major version is aimed for and that versions behind Next 12.3.4 are not supported.

```mdx
<Callout variant="info">
  - Earlier versions of Next.js on the same major version should work just fine, if not, please open an [issue
  with a reproduction](https://github.com/opennextjs/opennextjs-aws/issues/new). - Later versions of Next.js
  on the same major version **usually** work, but there is no guarantee. - If you run versions of OpenNext on
  previous major versions of Next.js, we only aim to provide compatibility with the latest minor (and ideally
  patch) version of that major version. - No versions behind Next 12.3.4 is supported. - The main branch of
  `@opennextjs/aws` is always tested against the latest version of Next.js.
</Callout>
```

### OpenNext Components Overview

Source: https://github.com/opennextjs/docs/blob/main/pages/aws/inner_workings/components/overview.mdx

This documentation is primarily for advanced use cases such as overriding defaults, supporting alternative cloud providers, or creating custom IAC components. Most users will not need to interact with these advanced features.

--------------------------------

### OpenNext Documentation

Source: https://github.com/opennextjs/docs/blob/main/shared/WindowsSupport.mdx

OpenNext can be used on Windows systems, but full support is not guaranteed due to Next.js tooling issues on Windows and limited testing capacity for Windows support by the OpenNext team. Development on Windows is at your own risk.

--------------------------------

### Troubleshooting

Source: https://github.com/opennextjs/docs/blob/main/pages/netlify/index.mdx

The OpenNext documentation focuses on Netlify's Next.js adapter v5 and later. For older versions, consult the Netlify documentation. For assistance with any adapter version, visit the Netlify support page.
