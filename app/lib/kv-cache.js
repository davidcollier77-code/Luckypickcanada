// ─────────────────────────────────────────────────────────────────────
// kv-cache.js  —  Cache-aside + stale-while-revalidate for Neon Postgres
// ─────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  ttl: 60,
  swr: 300,
  kvCacheTtl: 60,
};

/**
 * Read-through cache-aside with stale-while-revalidate.
 *
 * @param env      Cloudflare env (must contain LUCKYPICK_KV binding)
 * @param ctx      ExecutionContext (for ctx.waitUntil background refresh)
 * @param key      Stable cache key, e.g. `lottery:results:on:2026-08-16`
 * @param fetcher  Async function that queries Neon and returns JSON-serializable data
 * @param opts     { ttl, swr, kvCacheTtl } in seconds
 */
export async function cached(env, ctx, key, fetcher, opts = {}) {
  const { ttl, swr, kvCacheTtl } = { ...DEFAULTS, ...opts };
  const now = Date.now();

  // 1) Try KV (edge-cached read). cacheTtl keeps hot reads local to the colo.
  let raw;
  try {
    raw = await env.LUCKYPICK_KV.get(key, { type: "json", cacheTtl: kvCacheTtl });
  } catch (error) {
    console.error('Failed to read from KV cache:', error);
    raw = null;
  }

  if (raw) {
    const entry = raw;

    // Fresh → return immediately.
    if (now < entry.e) {
      return entry.v;
    }

    // Stale but within SWR window → return stale, refresh in background.
    if (now < entry.s) {
      ctx.waitUntil(refresh(env, key, fetcher, ttl, swr));
      return entry.v;
    }
  }

  // Miss / fully expired → fetch synchronously (this is the one slow call).
  return refresh(env, key, fetcher, ttl, swr);
}

/** Fetch from Neon and write the new entry to KV. Returns the fresh value. */
async function refresh(env, key, fetcher, ttl, swr) {
  let value;
  try {
    value = await fetcher();
  } catch (error) {
    console.error('Fetcher failed in refresh:', error);
    throw error;
  }
  const now = Date.now();
  const entry = {
    v: value,
    e: now + ttl * 1000,
    s: now + (ttl + swr) * 1000,
  };
  // Write to KV. TTL in KV is the absolute stale deadline (ttl + swr).
  try {
    await env.LUCKYPICK_KV.put(key, JSON.stringify(entry), {
      expirationTtl: ttl + swr,
    });
  } catch (error) {
    console.error('Failed to write to KV cache:', error);
    // Continue to return the value even if cache write fails
  }
  return value;
}

/**
 * Invalidate a cache key (call after a DB write that changes the data).
 * KV is eventually consistent globally; other regions may see the old
 * value for up to ~60s. For immediate invalidation across regions, also
 * consider a short ttl or a versioned key.
 */
export async function invalidate(env, key) {
  await env.LUCKYPICK_KV.delete(key);
}

/**
 * Build a stable, collision-free cache key from a namespace + params.
 * Example: cacheKey("lottery:results", { draw: "2026-08-16", region: "on" })
 *   → "lottery:results:draw=2026-08-16;region=on"
 */
export function cacheKey(namespace, params = {}) {
  const suffix = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join(";");
  return suffix ? `${namespace}:${suffix}` : namespace;
}
