---
title: "Next.js"
description: "Learn how to set up Sentry in your Next.js application using the Sentry CLI and capture your first events."
url: https://docs.sentry.io/platforms/javascript/guides/nextjs/
---

# Sentry for Next.js

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

The AI-powered `sentry init` flow is currently experimental. To use the existing framework-specific setup instead, see the option below, or check out the [Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup.md) guide.

Run the Sentry init command in your project directory to automatically configure Sentry in your Next.js application.

The command guides you through setup and asks which optional Sentry features you want to enable beyond error monitoring.

```bash
npx sentry@latest init
```

Want to learn more about these features?

* [**Issues**](https://docs.sentry.io/product/issues.md) (always enabled): Sentry's core error monitoring product that automatically reports errors, uncaught exceptions, and crashes. If you have something that looks like an exception, Sentry can capture it.
* [**Tracing**](https://docs.sentry.io/product/tracing.md): Track software performance while seeing the impact of errors across multiple systems. For example, distributed tracing allows you to follow a request from the frontend to the backend and back. On the server, this includes [Agent Tracing](https://docs.sentry.io/product/agents.md): supported AI libraries are instrumented automatically, so you can see model calls, tool executions, and token usage.
* [**Session Replay**](https://docs.sentry.io/product/session-replay.md): Get to the root cause of an issue faster by viewing a video-like reproduction of what users saw in your app before, during, and after the problem.
* [**Logs**](https://docs.sentry.io/product/logs.md): Centralize and analyze your application logs to correlate them with errors and performance issues. Search, filter, and visualize log data to understand what's happening in your applications.
* [**Application Metrics**](https://docs.sentry.io/product/metrics.md) (always enabled): Track and analyze custom application metrics, such as response times and database query durations, to understand trends and patterns in your application's performance and behavior over time.
* [**User Feedback**](https://docs.sentry.io/product/user-feedback.md): Collect feedback directly from users when they encounter errors, allowing them to describe what happened and provide context that helps you understand and resolve issues faster.

How does sentry init work?

The `sentry init` command is AI-powered. It analyzes your project and generates a tailored integration, rather than applying a fixed template. Here's what it does:

* **Analyzes your project** — reads project files and manifests to understand your Next.js app structure, including monorepos. It also respects AI instruction files such as `CLAUDE.md`, `AGENTS.md`, and `.cursorrules`.
* **Detects your framework** — identifies Next.js and selects the `@sentry/nextjs` SDK.
* **Fetches official Sentry docs** — uses the current Sentry documentation as the source of truth when generating integration code.
* **Installs dependencies** — adds `@sentry/nextjs` using your project's package manager.
* **Creates and modifies files** — sets up client-side, server-side, and edge initialization, the Next.js instrumentation file, `withSentryConfig` in your Next.js config, and other selected features based on your Next.js version and project structure.
* **Verifies the integration** — re-reads modified files after writing to confirm Sentry was integrated.

For full details on what each file does, see the [Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup.md) guide.

Prefer the existing Next.js wizard?

If you don't want to use the experimental AI-powered flow, run the framework-specific installation wizard instead:

```bash
npx @sentry/wizard@latest -i nextjs
```

To configure Sentry manually, follow the [Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup.md) guide.

## [Control the Data You Send to Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs.md#control-the-data-you-send-to-sentry)

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

The `sentry init` command checks the integration files it creates or modifies before it finishes. To confirm runtime events are reaching Sentry, add a test button to one of your pages. Clicking it will trigger an error for Sentry to capture.

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

If you used the Next.js wizard instead, it created an example page that sends a test error from both your frontend and your backend:

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open [localhost:3000/sentry-example-page](http://localhost:3000/sentry-example-page) in your browser.

3. Click **Throw Sample Error**.

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
* [Set up tunneling](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/tunneling.md) to avoid ad blockers blocking Sentry events

Are you having problems setting up the SDK?

* If you encountered issues with `sentry init` or the installation wizard, try [setting up Sentry manually](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup.md)
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
