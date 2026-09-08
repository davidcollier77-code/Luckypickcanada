### Project Directory Structure

Source: https://github.com/opennextjs/opennextjs-cloudflare/blob/main/AGENTS.md

Visual representation of the repository layout for the Cloudflare adapter package.

```text
packages/cloudflare/        # the adapter
  src/api/                  # runtime surface users import (small)
  src/cli/                  # the `opennextjs-cloudflare` build CLI
    commands/               # build, deploy, preview, etc. commands live here
    build/patches/          # esbuild plugins + ast-grep patches applied to Next's output
  templates/                # starter configs copied by `migrate` command
examples/                   # sample Next apps used for manual + e2e testing
create-cloudflare/          # templates for the `create-cloudflare` CLI
benchmarking/               # perf harness
```

--------------------------------

### wrangler.jsonc template - worker configuration

Source: https://github.com/opennextjs/opennextjs-cloudflare/blob/main/packages/cloudflare/templates/wrangler.jsonc

Default wrangler configuration template showing required compatibility flags (nodejs_compat, global_fetch_strictly_public), asset binding, self-reference service binding, R2 bucket binding for incremental cache, and images binding for image optimization.

```json
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"main": ".open-next/worker.js",
	"name": "<WORKER_NAME>",
	"compatibility_date": "<COMPATIBILITY_DATE>",
	"compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
	"assets": {
		"directory": ".open-next/assets",
		"binding": "ASSETS"
	},
	"services": [
		{
			"binding": "WORKER_SELF_REFERENCE",
			"service": "<WORKER_NAME>"
		}
	],
	"r2_buckets": [
		{
			"binding": "NEXT_INC_CACHE_R2_BUCKET",
			"bucket_name": "<WORKER_NAME>-opennext-cache"
		}
	],
	"images": {
		"binding": "IMAGES"
	}
}
```

### Document Index

Source: https://github.com/opennextjs/opennextjs-cloudflare/blob/main/_autodocs/0-index.md

The documentation covers various aspects of the integration, including Cloudflare context, build and runtime configuration, page caching, revalidation tag implementations, ISR queues, stateful worker implementations using Durable Objects, and static asset utilities.

--------------------------------

### Document Access

Source: https://github.com/opennextjs/opennextjs-cloudflare/blob/main/_autodocs/MANIFEST.md

The documentation is organized to support different user needs: new users should begin with the README and index, API lookups are handled via the index, implementation details are found in specific deep-dive sections, and configuration and type references are provided in dedicated files.

--------------------------------

### Coverage

Source: https://github.com/opennextjs/opennextjs-cloudflare/blob/main/_autodocs/README.md

The documentation provides comprehensive coverage of exported functions, classes, and types, alongside detailed configuration options and environment variables. It also includes practical usage examples, internal implementation details for caches and queues, error handling strategies, and performance optimization advice.
