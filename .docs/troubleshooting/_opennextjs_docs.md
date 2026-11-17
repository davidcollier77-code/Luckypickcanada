Cloudflare

Get Started

### Get Started

#### New apps

To create a new Next.js app, pre-configured to run on Cloudflare using `@opennextjs/cloudflare`, run:

```
npm create cloudflare@latest -- my-next-app --framework=next --platform=workers
```

#### Existing Next.js apps

The easiest way to convert an existing Next.js app is to use the `migrate` command:

```
npx @opennextjs/cloudflare migrate
```

This command automates all the setup steps below. If R2 is enabled on your account, it also creates an R2 bucket for caching. See the [CLI documentation](https://opennext.js.org/cloudflare/cli#migrate-command) for more details.

Alternatively, you can follow the manual steps below.

##### 1. Install @opennextjs/cloudflare

First, install [@opennextjs/cloudflare (opens in a new tab)](https://www.npmjs.com/package/@opennextjs/cloudflare):

```
npm install @opennextjs/cloudflare@latest
```

##### 2. Install Wrangler

Install the [Wrangler CLI (opens in a new tab)](https://developers.cloudflare.com/workers/wrangler/) as a devDependency:

```
npm install --save-dev wrangler@latest
```

💡

You must use Wrangler version `3.99.0` or later to deploy Next.js apps using `@opennextjs/cloudflare`.

##### 3. Create a wrangler configuration file

This step is optional since `@opennextjs/cloudflare` creates this file for you during the build process (if not already present).

A [wrangler configuration file (opens in a new tab)](https://developers.cloudflare.com/workers/wrangler/configuration/) is needed for your application to be previewed and deployed, it is also where you configure your Worker and define what resources it can access via [bindings (opens in a new tab)](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings).

You can create one yourself in the root directory of your Next.js app with the name `wrangler.jsonc` and the following content:

wrangler.jsonc

```
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "my-app",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": [
    // Enable Node.js API
    // see https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag
    "nodejs_compat",
    // Allow to fetch URLs in your app
    // see https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public
    "global_fetch_strictly_public",
  ],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS",
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      // The service should match the "name" of your worker
      "service": "my-app",
    },
  ],
  "r2_buckets": [
    // Create a R2 binding with the binding name "NEXT_INC_CACHE_R2_BUCKET"
    // {
    //   "binding": "NEXT_INC_CACHE_R2_BUCKET",
    //   "bucket_name": "<BUCKET_NAME>",
    // },
  ],
  "images": {
    // Enable image optimization
    // see https://opennext.js.org/cloudflare/howtos/image
    "binding": "IMAGES",
  },
}
```

💡

As shown above: - You must enable the [`nodejs_compat` compatibility flag (opens in a new tab)](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) *and* set your [compatibility date (opens in a new tab)](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) to `2024-09-23` or later, in order for your Next.js app to work with @opennextjs/cloudflare - The `main` and `assets` values should also not be changed unless you modify the build output result in some way - You can add a binding named `NEXT_INC_CACHE_R2_BUCKET` to make use of Next.js' caching as described in the [Caching docs](https://opennext.js.org/cloudflare/caching)

##### 4. Add an `open-next.config.ts` file

This step is optional since `@opennextjs/cloudflare` creates this file for you during the build process (if not already present).

Add a [`open-next.config.ts` (opens in a new tab)](https://opennext.js.org/aws/config) file to the root directory of your Next.js app:

open-next.config.ts

```
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
```

💡

To use the `OpenNextConfig` type as illustrated above (which is not necessary), you need to install the `@opennextjs/aws` NPM package as a dev dependency.

##### 5. Add a `.dev.vars` file

Then, add a [`.dev.vars` (opens in a new tab)](https://developers.cloudflare.com/workers/testing/local-development/#local-only-environment-variables) file to the root directory of your Next.js app:

.dev.vars

```
NEXTJS_ENV=development
```

The `NEXTJS_ENV` variable defines the environment to use when loading Next.js `.env` files. It defaults to "production" when not defined.

##### 6. Update the `package.json` file

Add the following to the scripts field of your `package.json` file:

package.json

```
{
  "build": "next build",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
  "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
  "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
}
```

- The `build` script must invoke the Next.js build command, it will be invoked by [`opennextjs-cloudflare build`](https://opennext.js.org/cloudflare/cli#build-command).
- `npm run preview`: Builds your app and serves it locally, allowing you to quickly preview your app running locally in the Workers runtime, via a single command.
- `npm run deploy`: Builds your app, and then immediately deploys it to Cloudflare.
- `npm run upload`: Builds your app, and then uploads a new [version (opens in a new tab)](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/#versions) of it to Cloudflare.
- `cf-typegen`: Generates a `cloudflare-env.d.ts` file at the root of your project containing [the types for the `env` (opens in a new tab)](https://developers.cloudflare.com/workers/wrangler/commands/#types).

##### 7. Add Static Asset Caching

Add a `public/_headers` file, with at least the following headers:

public/_headers

```
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

See the [Static Assets Caching docs](https://opennext.js.org/cloudflare/caching#static-assets-caching) for more information.

##### 8. Add caching with Cloudflare R2

See the [Caching docs](https://opennext.js.org/cloudflare/caching) for information on enabling Next.js caching in your OpenNext project.

##### 9. Remove any `export const runtime = "edge";` if present

Before deploying your app, remove the `export const runtime = "edge";` line from any of your source files.

The edge runtime is not supported yet with `@opennextjs/cloudflare`.

##### 10. Add `.open-next` to `.gitignore`

You should add `.open-next` to your `.gitignore` file to prevent the build output from being committed to your repository.

##### 11. Remove `@cloudflare/next-on-pages` (if necessary)

If your Next.js app currently uses `@cloudflare/next-on-pages`, you'll want to remove it, and make a few changes.

Uninstalling the [`@cloudflare/next-on-pages` (opens in a new tab)](https://www.npmjs.com/package/@cloudflare/next-on-pages) package as well as the [`eslint-plugin-next-on-pages` (opens in a new tab)](https://www.npmjs.com/package/eslint-plugin-next-on-pages) package if present.

Remove any reference of these packages from your source and configuration files. This includes:

- `setupDevPlatform()` calls in your Next.js config file
- `getRequestContext` imports from `@cloudflare/next-on-pages` from your source files (those can be replaced with `getCloudflareContext` calls from `@opennextjs/cloudflare`)
- next-on-pages eslint rules set in your Eslint config file

##### 12. Develop locally

You can continue to run `next dev` when developing locally.

Modify your Next.js configuration file to import and call the `initOpenNextCloudflareForDev` utility from the `@opennextjs/cloudflare` package. This makes sure that the Next.js dev server can optimally integrate with the open-next cloudflare adapter and it is necessary for using bindings during local development.

This is an example of a Next.js configuration file calling the utility:

next.config.ts

```
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

After having added the `initOpenNextCloudflareForDev()` call in your Next.js configuration file, you will be able, during local development, to access in any of your server code, local versions of Cloudflare bindings as indicated in the [bindings documentation](https://opennext.js.org/cloudflare/bindings).

In step 3, we also added the `npm run preview`, which allows you to quickly preview your app running locally in the Workers runtime, rather than in Node.js. This allows you to test changes in the same runtime as your app will run in when deployed to Cloudflare.

##### 13. Deploy to Cloudflare Workers

Either deploy via the command line:

```
npm run deploy
```

Or [connect a GitHub or GitLab repository (opens in a new tab)](https://developers.cloudflare.com/workers/ci-cd/), and Cloudflare will automatically build and deploy each pull request you merge to your production branch.
