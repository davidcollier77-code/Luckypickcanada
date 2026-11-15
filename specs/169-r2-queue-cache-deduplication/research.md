# Research: R2 Revalidation Queue Deduplication

## Decision

Use the queueCache wrapper already included in the exact installed @opennextjs/cloudflare 1.20.15 release:

- Wrap the existing doQueue with queueCache.
- Set regionalCacheTtlSec to 5 seconds.
- Set waitForQueueAck to true so the deduplication entry is only recorded after the underlying queue request has been acknowledged.

No dependency, binding, storage migration, or new service is required.

## Version and API Verification

The project package manifest and pnpm lockfile pin @opennextjs/cloudflare 1.20.15. The upstream package metadata at release commit 0a615e7 also identifies that release as version 1.20.15 and depends on @opennextjs/aws 4.1.14.

The default export at packages/cloudflare/src/api/overrides/queue/queue-cache.ts in that release exposes QueueCachingOptions with regionalCacheTtlSec and waitForQueueAck. It uses the Cache API and defaults the regional cache TTL to five seconds. Its deduplication key is derived from the message group ID and message deduplication ID. The wrapper records the cache entry after the wrapped queue accepts the request when waitForQueueAck is true.

Source:
https://github.com/opennextjs/opennextjs-cloudflare/blob/0a615e7/packages/cloudflare/src/api/overrides/queue/queue-cache.ts

Package metadata:
https://github.com/opennextjs/opennextjs-cloudflare/blob/0a615e7/packages/cloudflare/package.json

## Queue Message Identity and Acknowledgement

The matching @opennextjs/aws 4.1.14 revalidation code derives the message deduplication ID from the raw path, last-modified value, and entity tag; the message group is derived from the raw path. Repeated stale requests for the same page and unchanged content version therefore share the deduplication identity. A changed content version or a different path remains distinct.

Source:
https://github.com/opennextjs/opennextjs-aws/blob/v4.1.14/packages/open-next/src/core/routing/util.ts

The Cloudflare doQueue implementation calls the bound Durable Object's revalidate method. DOQueueHandler records the in-flight revalidation and schedules its work with ctx.waitUntil before returning. Consequently, the queue acknowledgement confirms that the Durable Object accepted/scheduled the request; it does not mean the page revalidation itself has finished.

Sources:
https://github.com/opennextjs/opennextjs-cloudflare/blob/0a615e7/packages/cloudflare/src/api/overrides/queue/do-queue.ts
https://github.com/opennextjs/opennextjs-cloudflare/blob/0a615e7/packages/cloudflare/src/api/durable-objects/queue.ts

## Rationale and Limits

The queueCache layer reduces repeated stale-message dispatches for the same page/content-version identity over a short regional cache window. The existing Durable Object remains responsible for processing and deduplicating work in progress. The option does not add a globally coordinated queue, and five seconds is not a guarantee that all traffic from every Cloudflare location is serialized by one cache entry.

The previously observed R2 error 10058 is a per-object write-rate limit. The exact colliding object key was not present in the sampled issue traces, so duplicate stale revalidation dispatches have not been proven to be its sole cause. This change is a low-cost optimization that may reduce competing cache work; it is not a guaranteed resolution of every R2 rate-limit event.

## Alternatives Considered

- Increasing or reducing Durable Object revalidation concurrency: not selected because it changes processing throughput and queue back-pressure rather than avoiding duplicate dispatches.
- Adding a new queue, database, or external deduplication service: rejected because the installed adapter already provides queueCache and additional infrastructure would increase cost and operational complexity.
- Changing R2, D1, or Durable Object bindings: unnecessary for this configuration-level optimization.
