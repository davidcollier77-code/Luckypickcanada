### Full public API exports

Source: https://github.com/bvaughn/react-error-boundary/blob/main/lib/index.ts

All exported members from the library, showing every component, hook, utility, and type available to consumers.

```typescript
"use client";

export { ErrorBoundary } from "./components/ErrorBoundary";
export { ErrorBoundaryContext } from "./context/ErrorBoundaryContext";
export { useErrorBoundary } from "./hooks/useErrorBoundary";
export { getErrorMessage } from "./utils/getErrorMessage";
export { withErrorBoundary } from "./utils/withErrorBoundary";

export type { ErrorBoundaryContextType } from "./context/ErrorBoundaryContext";
export type { UseErrorBoundaryApi } from "./hooks/useErrorBoundary";
export type {
  ErrorBoundaryProps,
  ErrorBoundaryPropsWithComponent,
  ErrorBoundaryPropsWithFallback,
  ErrorBoundaryPropsWithRender,
  FallbackProps,
  OnErrorCallback,
} from "./types";
```

--------------------------------

### View project module structure

Source: https://github.com/bvaughn/react-error-boundary/blob/main/_autodocs/API-SUMMARY.md

Displays the file organization and exported components, hooks, and utilities of the library.

```text
react-error-boundary
├── components/
│   └── ErrorBoundary (class component)
├── hooks/
│   └── useErrorBoundary (hook)
├── context/
│   └── ErrorBoundaryContext (React context)
├── utils/
│   ├── getErrorMessage (function)
│   ├── withErrorBoundary (HOC)
│   ├── assertErrorBoundaryContext (internal)
│   ├── isErrorBoundaryContext (internal)
│   └── assert (internal)
├── types.ts (all type definitions)
└── index.ts (main export point)
```

--------------------------------

### getErrorMessage(thrown: unknown): string | undefined

Source: https://github.com/bvaughn/react-error-boundary/blob/main/_autodocs/utils-get-error-message.md

Extracts a human-readable error message from a thrown value.

```APIDOC
## getErrorMessage(thrown: unknown)

### Description
Safely extracts a human-readable error message from any thrown value. It handles standard Error instances, custom error classes, objects with a message property, and strings.

### Signature
`function getErrorMessage(thrown: unknown): string | undefined`

### Parameters
- **thrown** (unknown) - Required - The value that was thrown (e.g., Error, string, or object).

### Return Value
- **string** - The extracted error message.
- **undefined** - Returned if the thrown value does not contain a message or is not a recognizable error type.
```

--------------------------------

### resetBoundary()

Source: https://github.com/bvaughn/react-error-boundary/blob/main/_autodocs/hooks-use-error-boundary.md

Resets the nearest error boundary and clears the currently displayed error.

```APIDOC
## resetBoundary()

### Description
Resets the nearest error boundary and clears the currently displayed error, allowing the component to attempt to render normally again.

### Signature
`resetBoundary(): void`
```

### Completeness Checklist

Source: https://github.com/bvaughn/react-error-boundary/blob/main/_autodocs/DOCUMENTATION-INDEX.md

The documentation for react-error-boundary is comprehensive, covering all exported functions, types, props, methods, and lifecycle hooks. It includes advanced patterns, testing guidance, TypeScript support, integration patterns, and a troubleshooting guide to ensure developers have full context for implementation.
