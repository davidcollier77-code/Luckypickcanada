---
title: "Next.js"
description: "Learn how to set up Sentry in your Next.js application using the installation wizard and capture your first events."
url: https://docs.sentry.io/platforms/javascript/guides/nextjs/
---

# Sentry for Next.js

Runtime

* [Node.js (current page)](https://docs.sentry.io/platforms/javascript/guides/nextjs.md)
* [Cloudflare](https://docs.sentry.io/platforms/javascript/guides/nextjs/cloudflare.md)

## Set up with Sentry CLI

Set up the Sentry Next.js SDK with the Sentry CLI. Install the CLI with one of these commands, then follow the Sentry CLI docs to finish setup.

**cURL**

```bash
curl https://cli.sentry.dev/install -fsS | bash
```

**PowerShell**

```powershell
irm https://cli.sentry.dev/install.ps1 | iex
```

**Homebrew**

```bash
brew install getsentry/tools/sentry
```

**npx**

```bash
npx sentry@latest
```

[Learn more about the Sentry CLI](https://cli.sentry.dev/)

## [Prerequisites](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#prerequisites)

You need:

* A Next.js application on version 14 or higher
* Node.js 20.19.0 or higher
* A Sentry [account](https://sentry.io/signup/) and [project](https://docs.sentry.io/product/projects.md)

## [Install](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#install)

### [Run the Installation Wizard](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#run-the-installation-wizard)

Run the Sentry wizard to automatically install the SDK and configure Sentry in your Next.js application:

```bash
npx @sentry/wizard@latest -i nextjs
```

The wizard asks whether you want to enable **Tracing** and **Session Replay**, route browser requests through your server to avoid ad blockers, and create an example page. To match the configuration in this guide, answer **Yes** to each.

Prefer to set things up yourself? Check out the [Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup.md) guide.

## [Configure](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#configure)

**Error Monitoring** starts working as soon as you call `Sentry.init()`. **Logs** and **Application Metrics** need no extra configuration, and you'll learn how to send them in steps [#3](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#send-logs) and [#4](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#send-application-metrics-). This guide also enables **Tracing**, **Session Replay**, and **User Feedback**.

Want to learn more about these features?

* [**Issues**](https://docs.sentry.io/product/issues.md) (always enabled): Sentry's core error monitoring product that automatically reports errors, uncaught exceptions, and crashes. If you have something that looks like an exception, Sentry can capture it.
* [**Tracing**](https://docs.sentry.io/product/tracing.md): Track software performance while seeing the impact of errors across multiple systems. For example, distributed tracing allows you to follow a request from the frontend to the backend and back. On the server, this includes [Agent Tracing](https://docs.sentry.io/product/agents.md): supported AI libraries are instrumented automatically, so you can see model calls, tool executions, and token usage.
* [**Session Replay**](https://docs.sentry.io/product/session-replay.md): Get to the root cause of an issue faster by viewing a video-like reproduction of what users saw in your app before, during, and after the problem.
* [**Logs**](https://docs.sentry.io/product/logs.md): Centralize and analyze your application logs to correlate them with errors and performance issues. Search, filter, and visualize log data to understand what's happening in your applications.
* [**Application Metrics**](https://docs.sentry.io/product/metrics.md) (always enabled): Track and analyze custom application metrics, such as response times and database query durations, to understand trends and patterns in your application's performance and behavior over time.
* [**User Feedback**](https://docs.sentry.io/product/user-feedback.md): Collect feedback directly from users when they encounter errors, allowing them to describe what happened and provide context that helps you understand and resolve issues faster.

### [Initialize the SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#initialize-the-sdk)

Next.js runs code in different environments, so the wizard creates a separate initialization file for each in your project's root directory (or `src` folder):

* `instrumentation-client.ts`: runs in the browser
* `sentry.server.config.ts`: runs in the Node.js runtime
* `sentry.edge.config.ts`: runs in the Edge runtime

Use the tabs in the code box below to view each file.

The snippets also turn on:

* Tracing: via [`tracesSampleRate`](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options.md#tracesSampleRate) in all three files
* Session Replay: via `replayIntegration()`, sampled with [`replaysSessionSampleRate`](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options.md#replaysSessionSampleRate) and [`replaysOnErrorSampleRate`](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options.md#replaysOnErrorSampleRate)
* User Feedback: via [`feedbackIntegration()`](https://docs.sentry.io/platforms/javascript/guides/nextjs/user-feedback/configuration.md). The wizard doesn't add this integration, so add it to `instrumentation-client.ts` yourself.

Don't need a feature? Remove its integration and options from the snippets.

**\[Client] instrumentation-client.ts**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
  integrations: [
    // enables Session Replay
    Sentry.replayIntegration(),
    // enables User Feedback
    Sentry.feedbackIntegration({
      // Additional integration configuration goes in here
      colorScheme: "system",
    }),
  ],

  // Enables Tracing.
  // Set to 1.0 to capture 100% of spans for tracing.
  // We recommend reducing this value in production.
  tracesSampleRate: 1.0,

  // Capture replays for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Requires Sentry.replayIntegration()
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Instruments client-side navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

**\[Server] sentry.server.config.ts**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",

  // Enables Tracing.
  // Set to 1.0 to capture 100% of spans for tracing.
  // We recommend reducing this value in production.
  tracesSampleRate: 1.0,
});
```

**\[Edge] sentry.edge.config.ts**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",

  // Enables Tracing.
  // Set to 1.0 to capture 100% of spans for tracing.
  // We recommend reducing this value in production.
  tracesSampleRate: 1.0,
});
```

### [Register the Server-Side Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#register-the-server-side-configuration)

The wizard creates a [Next.js instrumentation file](https://nextjs.org/docs/app/guides/instrumentation) named `instrumentation.ts`. It loads your server and edge configurations, and exports `onRequestError` to capture errors from Server Components, route handlers, and middleware.

```typescript
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

### [Capture React Render Errors](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#capture-react-render-errors)

If you use the App Router, the wizard adds Sentry to `app/global-error.tsx` to capture React rendering errors. If you use the Pages Router, it adds Sentry to `pages/_error.tsx` instead.

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
```

*Other available variations of the above snippet: jsx*

### [Apply Instrumentation to Your App](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#apply-instrumentation-to-your-app)

The wizard wraps your Next.js configuration with `withSentryConfig`. This instruments your app at build time, uploads source maps, and, if you said yes in the wizard, routes browser requests to Sentry through your server to avoid ad blockers.

To forward only the request body to Sentry, add a tunnel route handler (SDK version `10.77.1` and later on v10, `11.9.0` and later on v11). Use the handler if Vercel Deployment Protection or another login protects your app. Learn more about the [`tunnelRoute` option](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build.md#tunnelRoute).

```typescript
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Your existing Next.js configuration
};

export default withSentryConfig(nextConfig, {
  org: "<your-org-slug>",
  project: "<your-project-slug>",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to avoid ad blockers.
  // This can increase your server load as well as your hosting bill.
  tunnelRoute: "/monitoring",
});
```

### [Add Readable Stack Traces With Source Maps](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#add-readable-stack-traces-with-source-maps)

The wizard stores your auth token in `.env.sentry-build-plugin` and adds the file to `.gitignore`. The Sentry build plugin uses this token to upload source maps when you build your app locally.

For CI/CD builds, set the `SENTRY_AUTH_TOKEN` environment variable in your build system instead.

```bash
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
```

### [Control the Data You Send to Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#control-the-data-you-send-to-sentry)

By default, the SDK sends user identity data (IP address, ID, and similar) and other data like HTTP bodies and URL query parameters. This will give you rich debugging context.

The SDK always filters sensitive values whose keys match a built-in denylist, such as `auth` or `password`, and sends `[Filtered]` instead.

To send less data, turn off the categories you don't need in the `dataCollection` option. For the full list of categories and their defaults, [see the `dataCollection` options](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options.md#dataCollection).

```javascript
Sentry.init({
  dsn: "https://<key>@o<orgId>.ingest.sentry.io/<projectId>",
  dataCollection: {
    userInfo: false,
    // other categories
  },
});
```

## [Send Logs](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#send-logs)

Use `Sentry.logger` to send logs at different levels, such as `info`, `warn`, or `error`. You can pass any attributes you want and search or filter by them later. See [Set Up Logs](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs.md) for all available logging methods and the syntax for formatting messages.

```javascript
Sentry.logger.info("User example action completed");

Sentry.logger.warn("Slow operation detected", {
  operation: "data_fetch",
  duration: 3500,
});

Sentry.logger.error("Validation failed", {
  form_field: "email",
  reason: "Invalid email",
});
```

If you're already logging with another library, use an integration to capture those logs as Sentry Logs automatically:

* [`consoleLoggingIntegration`](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs.md#console) for `console` calls
* [Consola](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs.md#consola)
* [Pino](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs.md#pino)
* [Winston](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs.md#winston)

## [Send Application Metrics NEW](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#send-application-metrics-)

Use `Sentry.metrics` to send counters, gauges, and distributions from your app to Sentry. You can pass any attributes you want and search or filter by them later. See [Set Up Metrics](https://docs.sentry.io/platforms/javascript/guides/nextjs/metrics.md) for all available metric types and configuration options.

```javascript
Sentry.metrics.count("checkout.failed", 1);

Sentry.metrics.gauge("time_since_refresh", 4, { unit: "hour" });

Sentry.metrics.distribution("api_latency", 187, {
  unit: "millisecond",
  attributes: { endpoint: "/api/orders" },
});
```

In the Node.js runtime, [`nodeRuntimeMetricsIntegration`](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/noderuntimemetrics.md) also collects runtime health metrics automatically.

## [Verify Your Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#verify-your-setup)

Let's test your setup and confirm that Sentry is working correctly and sending data to your Sentry project.

The wizard created an example page that sends a test error from both your frontend and your backend:

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open [localhost:3000/sentry-example-page](http://localhost:3000/sentry-example-page) in your browser.

3. Click **Throw Sample Error**.

If you skipped the example page, add a test button to one of your pages instead. Clicking it will trigger an error for Sentry to capture.

```tsx
"use client";

export default function Page() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error("Sentry Test Error");
      }}
    >
      Test Sentry Error
    </button>
  );
}
```

##### Important

Errors triggered from within your browser's developer tools (like the browser console) are sandboxed, so they will not trigger Sentry's error monitoring.

### [View Captured Data in Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#view-captured-data-in-sentry)

Now, head over to your project on [Sentry.io](https://sentry.io/) to view the collected data (it takes a couple of moments for the data to appear).

Need help locating captured data in your Sentry project?

* Open the [**Issues**](https://sentry.io/orgredirect/organizations/:orgslug/issues/) page and select an error from the issues list to view the full details and context of this error. For more details, see the [Issue Details documentation](https://docs.sentry.io/product/issues/issue-details.md).
* Open the [**Traces**](https://sentry.io/orgredirect/organizations/:orgslug/explore/traces/) page and select a trace to reveal more information about each span, its duration, and any errors. For an interactive UI walkthrough, click [here](https://docs.sentry.io/product/sentry-basics/getting-started-tutorial/generate-first-error.md#ui-walkthrough).
* Open the [**Replays**](https://sentry.io/orgredirect/organizations/:orgslug/replays/) page and select an entry from the list to get a detailed view where you can replay the interaction and get more information to help you troubleshoot.
* Open the [**Logs**](https://sentry.io/orgredirect/organizations/:orgslug/explore/logs/) page and filter by service, environment, or search keywords to view log entries from your application. For an interactive UI walkthrough, click [here](https://docs.sentry.io/product/logs.md#overview).
* Open the [**Application Metrics**](https://sentry.io/orgredirect/organizations/:orgslug/explore/metrics) page to view and analyze your metrics. For more details, see this [interactive walkthrough](https://docs.sentry.io/product/metrics.md#overview).
* Open the [**User Feedback**](https://sentry.io/orgredirect/organizations/:orgslug/feedback/) page and click on individual feedback to see more details all in one view. For more information, click [here](https://docs.sentry.io/product/user-feedback.md).

## [Next Steps](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#next-steps)

At this point, you should have integrated Sentry into your Next.js application. Here's what to explore next:

* Explore [practical guides](https://docs.sentry.io/get-started/guides.md) on what to monitor, log, track, and investigate after setup
* [Set up Agent Tracing](https://docs.sentry.io/platforms/javascript/guides/nextjs/agent-tracing.md) to monitor agents built with the Vercel AI SDK, LangChain, and more
* [Set up tunneling](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/tunneling.md) to avoid ad blockers blocking Sentry events, if you didn't enable it in the wizard

Are you having problems setting up the SDK?

* If you encountered issues with our installation wizard, try [setting up Sentry manually](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup.md)
* Find various topics in [Troubleshooting](https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting.md)
* [Get support](https://www.sentry.help/en/)

## Other JavaScript Frameworks

- [Angular](https://docs.sentry.io/platforms/javascript/guides/angular.md)
- [Astro](https://docs.sentry.io/platforms/javascript/guides/astro.md)
- [AWS Lambda](https://docs.sentry.io/platforms/javascript/guides/aws-lambda.md)
- [Azure Functions](https://docs.sentry.io/platforms/javascript/guides/azure-functions.md)
- [Bun](https://docs.sentry.io/platforms/javascript/guides/bun.md)
- [Capacitor](https://docs.sentry.io/platforms/javascript/guides/capacitor.md)
- [Cloud Functions for Firebase](https://docs.sentry.io/platforms/javascript/guides/firebase.md)
- [Cloudflare](https://docs.sentry.io/platforms/javascript/guides/cloudflare.md)
- [Cordova](https://docs.sentry.io/platforms/javascript/guides/cordova.md)
- [Deno](https://docs.sentry.io/platforms/javascript/guides/deno.md)
- [Effect](https://docs.sentry.io/platforms/javascript/guides/effect.md)
- [Electron](https://docs.sentry.io/platforms/javascript/guides/electron.md)
- [Elysia](https://docs.sentry.io/platforms/javascript/guides/elysia.md)
- [Ember](https://docs.sentry.io/platforms/javascript/guides/ember.md)
- [Eve](https://docs.sentry.io/platforms/javascript/guides/eve.md)
- [Express](https://docs.sentry.io/platforms/javascript/guides/express.md)
- [Fastify](https://docs.sentry.io/platforms/javascript/guides/fastify.md)
- [Flue](https://docs.sentry.io/platforms/javascript/guides/flue.md)
- [Gatsby](https://docs.sentry.io/platforms/javascript/guides/gatsby.md)
- [Google Cloud Functions](https://docs.sentry.io/platforms/javascript/guides/gcp-functions.md)
- [Hapi](https://docs.sentry.io/platforms/javascript/guides/hapi.md)
- [Hono](https://docs.sentry.io/platforms/javascript/guides/hono.md)
- [Koa](https://docs.sentry.io/platforms/javascript/guides/koa.md)
- [Mastra](https://docs.sentry.io/platforms/javascript/guides/mastra.md)
- [Nest.js](https://docs.sentry.io/platforms/javascript/guides/nestjs.md)
- [Nitro](https://docs.sentry.io/platforms/javascript/guides/nitro.md)
- [Node.js](https://docs.sentry.io/platforms/javascript/guides/node.md)
- [Nuxt](https://docs.sentry.io/platforms/javascript/guides/nuxt.md)
- [Pi Durable](https://docs.sentry.io/platforms/javascript/guides/pi-durable.md)
- [React](https://docs.sentry.io/platforms/javascript/guides/react.md)
- [React Router Framework](https://docs.sentry.io/platforms/javascript/guides/react-router.md)
- [Remix](https://docs.sentry.io/platforms/javascript/guides/remix.md)
- [Solid](https://docs.sentry.io/platforms/javascript/guides/solid.md)
- [SolidStart](https://docs.sentry.io/platforms/javascript/guides/solidstart.md)
- [Svelte](https://docs.sentry.io/platforms/javascript/guides/svelte.md)
- [SvelteKit](https://docs.sentry.io/platforms/javascript/guides/sveltekit.md)
- [TanStack Start React](https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react.md)
- [Vue](https://docs.sentry.io/platforms/javascript/guides/vue.md)
- [Wasm](https://docs.sentry.io/platforms/javascript/guides/wasm.md)

## Topics

- [Quick Start (Cloudflare)](https://docs.sentry.io/platforms/javascript/guides/nextjs/cloudflare.md)
- [Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup.md)
- [Capturing Errors](https://docs.sentry.io/platforms/javascript/guides/nextjs/capturing-errors.md)
- [Source Maps](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps.md)
- [Logs](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs.md)
- [Session Replay](https://docs.sentry.io/platforms/javascript/guides/nextjs/session-replay.md)
- [Tracing](https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing.md)
- [Agent Tracing](https://docs.sentry.io/platforms/javascript/guides/nextjs/agent-tracing.md)
- [Application Metrics](https://docs.sentry.io/platforms/javascript/guides/nextjs/metrics.md)
- [MCP Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/mcp-monitoring.md)
- [Profiling](https://docs.sentry.io/platforms/javascript/guides/nextjs/profiling.md)
- [Crons](https://docs.sentry.io/platforms/javascript/guides/nextjs/crons.md)
- [User Feedback](https://docs.sentry.io/platforms/javascript/guides/nextjs/user-feedback.md)
- [Sampling](https://docs.sentry.io/platforms/javascript/guides/nextjs/sampling.md)
- [Enriching Events](https://docs.sentry.io/platforms/javascript/guides/nextjs/enriching-events.md)
- [Extended Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration.md)
- [OpenTelemetry Support](https://docs.sentry.io/platforms/javascript/guides/nextjs/opentelemetry.md)
- [OpenTelemetry Support](https://docs.sentry.io/platforms/javascript/guides/nextjs/opentelemetry__v10.x.md)
- [Feature Flags](https://docs.sentry.io/platforms/javascript/guides/nextjs/feature-flags.md)
- [Data Management](https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management.md)
- [Security Policy Reporting](https://docs.sentry.io/platforms/javascript/guides/nextjs/security-policy-reporting.md)
- [Special Use Cases](https://docs.sentry.io/platforms/javascript/guides/nextjs/best-practices.md)
- [Migration Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration.md)
- [Troubleshooting](https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting.md)
