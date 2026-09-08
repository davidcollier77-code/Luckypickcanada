### Basic OpenNext Configuration File

Source: https://github.com/opennextjs/docs/blob/main/pages/aws/config.mdx

This is the minimum required content for an `open-next.config.ts` file. The default configuration will be applied if this file is absent.

```typescript
export default {
  default: {},
};
```

--------------------------------

### Enable OpenNext Debug Mode

Source: https://github.com/opennextjs/docs/blob/main/pages/aws/common_issues.mdx

Set the OPEN_NEXT_DEBUG environment variable to true to enable verbose logging, disable esbuild minifying, and add source maps. Do not use in production as it significantly increases bundle size.

```sh
OPEN_NEXT_DEBUG=true npx open-next@latest build
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
