### Install Project Dependencies

Source: https://github.com/bvaughn/react-error-boundary/blob/main/CONTRIBUTING.md

Run this command to install all necessary project dependencies before starting local development.

```sh
pnpm install
```

--------------------------------

### Run Documentation Site Locally

Source: https://github.com/bvaughn/react-error-boundary/blob/main/CONTRIBUTING.md

Start the local documentation site to test changes. It runs on localhost port 3000.

```sh
pnpm dev
```

--------------------------------

### Update Generated Assets

Source: https://github.com/bvaughn/react-error-boundary/blob/main/CONTRIBUTING.md

Before submitting changes, run these commands to update generated documentation and format code.

```sh
pnpm compile
pnpm prettier
pnpm lint
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
