### View Documentation Structure

Source: https://github.com/react-hook-form/resolvers/blob/master/_autodocs/00-START-HERE.md

Displays the directory layout of the documentation repository.

```text
/output/
├── 00-START-HERE.md          ← You are here
├── INDEX.md                  ← File index and metrics
├── README.md                 ← Main overview (START HERE)
├── types.md                  ← Type definitions reference
├── configuration.md          ← Configuration options
├── errors.md                 ← Error handling guide
└── /api-reference/           ← Resolver-specific docs
    ├── core-utilities.md
    ├── zod-resolver.md
    ├── yup-resolver.md
    ├── joi-resolver.md
    ├── ajv-resolver.md
    ├── io-ts-resolver.md
    ├── valibot-resolver.md
    ├── superstruct-resolver.md
    ├── class-validator-resolver.md
    └── additional-resolvers.md
```

--------------------------------

### Shared resolver API contract

Source: https://github.com/react-hook-form/resolvers/blob/master/README.md

The README's API section documents the uniform signature shared by all resolvers: resolver(schema, schemaOptions, resolverOptions), including the Options type with mode and raw, and the required/optional table for each parameter.

```typescript
type Options = {
  mode: 'async' | 'sync',
  raw?: boolean
}

resolver(schema: object, schemaOptions?: object, resolverOptions: Options)
```

### Documentation Index > Main Documentation

Source: https://github.com/react-hook-form/resolvers/blob/master/_autodocs/INDEX.md

The documentation provides a comprehensive reference for @hookform/resolvers, including a project overview, architecture details, and a feature matrix for the supported resolver catalog.

--------------------------------

### How to Get the Most from This Documentation

Source: https://github.com/react-hook-form/resolvers/blob/master/_autodocs/00-START-HERE.md

To effectively use the documentation, users should treat the README as the primary entry point, reference the types documentation for type-related queries, and consult the errors documentation for troubleshooting validation issues. Examples provided in the documentation are intended to be adapted to specific project requirements.

--------------------------------

### Document Quality Metrics

Source: https://github.com/react-hook-form/resolvers/blob/master/_autodocs/INDEX.md

The documentation covers 20 different resolvers with approximately 4,900 lines of code across 14 files. It includes over 150 code examples, 40 parameter tables, and documentation for more than 60 error types and 30 type definitions.
