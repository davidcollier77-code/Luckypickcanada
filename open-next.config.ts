import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import queueCache from "@opennextjs/cloudflare/overrides/queue/queue-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default {
  ...defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
    queue: queueCache(doQueue, {
      regionalCacheTtlSec: 5,
      waitForQueueAck: true,
    }),
    tagCache: d1NextTagCache,
  }),
  buildCommand: "npx next build --webpack",
};
