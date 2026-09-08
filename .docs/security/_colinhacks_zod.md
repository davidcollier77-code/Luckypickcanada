### Full documentation generator (llms-full.txt)

Source: https://github.com/colinhacks/zod/blob/main/packages/docs/app/llms-full.txt/route.ts

This Next.js route handler generates the complete Zod documentation as a single text file by reading all MDX content pages, sorting them according to meta.json, and compiling each page into plain text using the getLLMText loader. It serves as the canonical 'full documentation' endpoint for AI consumption.

```typescript
import * as fs from "node:fs/promises";
import { join } from "node:path";
import { getLLMText } from "@/loaders/get-llm-text";
import { source } from "@/loaders/source";

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();

  // Read meta.json to get the page order
  const metaPath = join(process.cwd(), "content", "meta.json");
  const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));

  // Create a map of page URLs to their order in meta.json
  const pageOrder = new Map<string, number>();
  meta.pages.forEach((page: string, index: number) => {
    pageOrder.set(page, index);
  });

  // Sort pages according to meta.json order
  const sortedPages = pages.sort((a, b) => {
    const aOrder = pageOrder.get(a.url) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = pageOrder.get(b.url) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });

  // Generate content
  let txt = `# Zod

Zod is a TypeScript-first schema validation library with static type inference. This documentation provides comprehensive coverage of Zod 4's features, API, and usage patterns.

`;

  // Process each page
  for (const page of sortedPages) {
    txt += await getLLMText(page);
    txt += "\n\n";
  }

  return new Response(txt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

--------------------------------

### Complete API reference documentation

Source: https://github.com/colinhacks/zod/blob/main/packages/docs/content/api.mdx

The api.mdx frontmatter explicitly declares this file as the complete API reference for all Zod schema types, methods, and validation features, directly answering where to find full documentation.

```typescript
---
title: "Defining schemas"
description: "Complete API reference for all Zod schema types, methods, and validation features"
---
```

--------------------------------

### Documentation structure (meta.json)

Source: https://github.com/colinhacks/zod/blob/main/packages/docs/content/meta.json

This file defines the complete documentation structure for Zod, listing all documentation pages in order. It includes sections for core documentation (basics, API reference, error handling, JSON schema, codecs, compilation, ecosystem, library authors) and package documentation (zod, mini, core).

```json
{
  "root": true,
  "pages": [
    "---Documentation---",
    "index",
    "basics",
    "api",
    "error-customization",
    "error-formatting",
    "metadata",
    "json-schema",
    "codecs",
    "compile",
    "ecosystem",
    "library-authors",
    "---Packages---",
    "packages/zod",
    "packages/mini",
    "packages/core"
  ]
}
```

--------------------------------

### Documentation index (llms.txt)

Source: https://github.com/colinhacks/zod/blob/main/packages/docs/app/llms.txt/route.ts

Generates the llms.txt file providing a structured index of all documentation pages with descriptions and section links, following the llms.txt standard

```typescript
export async function GET() {
  const pages = source.getPages();

  let txt = `# Zod

> Zod is a TypeScript-first schema validation library with static type inference. This documentation provides comprehensive coverage of Zod 4's features, API, and usage patterns.

`;

  for (const page of pages) {
    const title = stringifyTitle(page.data.title);
    if (title.startsWith("---")) {
      continue;
    }

    txt += `## ${title || "Untitled"}\n\n`;

    const pageUrl = `https://zod.dev${page.url}`;
    const description = page.data.description || "Documentation page";
    txt += `- [${title || "Untitled"}](${pageUrl}): ${description}\n`;

    if (page.data.toc && page.data.toc.length > 0) {
      const sections = page.data.toc.filter((item: any) => item.depth >= 2 && item.depth <= 4);

      if (sections.length > 0) {
        txt += "\n";

        for (const section of sections) {
          const sectionTitle = stringifyTitle(section.title);
          if (!sectionTitle) continue;

          const anchor = section.url.replace("#", "");
          const fullUrl = `https://zod.dev${page.url}?id=${anchor}`;

          txt += `- [${sectionTitle}](${fullUrl})\n`;
        }
      }
    }

    txt += "\n";
  }

  txt += `---\n\nThis documentation covers Zod v4, a TypeScript-first schema validation library. Use the URLs above to access specific pages and sections for detailed information about schema definition, validation, error handling, and advanced patterns.\n`;

  return new Response(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
```

### Contributing > Development > Documentation

Source: https://github.com/colinhacks/zod/blob/main/CONTRIBUTING.md

The documentation site lives in `packages/docs` with content located at `packages/docs/content`. Be sure to document any API changes you implement.
