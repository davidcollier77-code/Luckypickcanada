#!/usr/bin/env node
// Read-only Cloudflare credential and access diagnostic.
//
// Context: the account-level Cloudflare connection used by the coding agent
// returns `6003 Invalid request headers` with `error_chain[6111] Invalid format
// for Authorization header` on /zones, and `9106 Authentication failed` at HTTP
// 400 on /zones/:id/dns_records. Cloudflare validates the *shape* of the
// Authorization header before it evaluates the credential's identity, and the
// signature did not change when a format-valid token was saved in the
// connection, so the connector is not transmitting the credential it stores.
// A control call with an all-zero zone id returns the same `9106`, which places
// the rejection above the zone, account and permission layers.
//
// This script answers that question without ever revealing the value:
//   * it classifies the credential shape from length and character class only;
//   * with a credential it performs the two read-only calls the connector needs,
//     so the owner can verify the repair themselves;
//   * `--probe` replays the synthetic shape matrix that established the
//     boundary, so the evidence in the PR report is reproducible.
//
// It is read-only. It never creates, overwrites or deletes a DNS record, never
// touches a Worker or an account setting, and never logs a credential or a
// request header. Node built-ins only: no dependency, no build step.
//
// Usage:
//   node scripts/cloudflare-auth-diagnose.mjs --probe
//   CLOUDFLARE_API_TOKEN=<token> node scripts/cloudflare-auth-diagnose.mjs \
//     --zone 0af2a3985db329cdb671829cb59a41f1 --account-name luckypickcanada.ca
//
// Exit codes: 0 = read-only access verified, 2 = not verified, 3 = usage error.

const API = "https://api.cloudflare.com/client/v4";
const TIMEOUT_MS = 20_000;
const TOKEN_CHARSET = /^[A-Za-z0-9_-]+$/;
const GLOBAL_KEY_SHAPE = /^[0-9a-f]{37}$/i;

function parseArgs(argv) {
  const options = { probe: false, zone: "", accountName: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--probe") options.probe = true;
    else if (arg === "--zone") options.zone = argv[(i += 1)] ?? "";
    else if (arg === "--account-name") options.accountName = argv[(i += 1)] ?? "";
    else if (arg === "--help" || arg === "-h") options.help = true;
    else return { error: `unknown argument: ${arg}` };
  }
  return { options };
}

/**
 * Classify a credential by shape only. The returned object never contains the
 * credential value, and callers must not log one.
 */
export function classifyCredential(value) {
  if (typeof value !== "string" || value.length === 0) {
    return {
      shape: "absent",
      bearerCompatible: false,
      detail: "no credential supplied (CLOUDFLARE_API_TOKEN is unset or empty)",
    };
  }
  const length = value.length;
  const charsetOk = TOKEN_CHARSET.test(value);
  if (length === 40 && charsetOk) {
    return {
      shape: "api-token",
      bearerCompatible: true,
      detail: "40 characters from the API Token charset: a valid bearer credential",
    };
  }
  if (GLOBAL_KEY_SHAPE.test(value)) {
    return {
      shape: "global-api-key",
      bearerCompatible: false,
      detail:
        "37 hexadecimal characters: a Global API Key, which Cloudflare only accepts " +
        "in X-Auth-Key together with X-Auth-Email, never as a bearer token",
    };
  }
  return {
    shape: "unsupported",
    bearerCompatible: false,
    detail:
      `length ${length}, ` +
      (charsetOk ? "token charset" : "contains characters outside the API Token charset") +
      ": Cloudflare rejects the Authorization header before evaluating identity",
  };
}

function summarize(payload) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  if (errors.length === 0) return "(no errors)";
  return errors
    .map((error) => {
      const chain = Array.isArray(error?.error_chain)
        ? error.error_chain.map((link) => `${link.code}:${link.message}`).join(" | ")
        : "";
      return `${error.code}:${error.message}${chain ? ` [${chain}]` : ""}`;
    })
    .join(" ; ");
}

async function call(path, credential) {
  const headers = { Accept: "application/json" };
  if (credential) headers.Authorization = `Bearer ${credential}`;
  const response = await fetch(`${API}${path}`, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }
  return { status: response.status, payload };
}

function describe(credential) {
  const result = classifyCredential(credential);
  console.log(`Credential shape: ${result.shape} (bearer-compatible: ${result.bearerCompatible ? "yes" : "no"})`);
  console.log(`  ${result.detail}`);
  return result;
}

// Synthetic values only. Never add a real credential to this table.
const PROBE_VALUES = [
  { label: "bearer length 9 (placeholder)", value: "undefined" },
  { label: "bearer length 31", value: "A".repeat(31) },
  { label: "bearer length 37 (global-key shape)", value: "0123456789abcdef0123456789abcdef01234" },
  { label: "bearer length 39", value: "A".repeat(39) },
  { label: "bearer length 40 (token charset)", value: "A".repeat(40) },
  { label: "bearer length 41", value: "A".repeat(41) },
  { label: "bearer length 40 with '!'", value: `${"A".repeat(39)}!` },
];

async function probe(zoneId) {
  const endpoints = [
    { label: "zones", path: "/zones?per_page=5", auth: true },
    { label: "dns", path: zoneId ? `/zones/${zoneId}/dns_records?per_page=5` : "", auth: true },
  ].filter((endpoint) => endpoint.path);

  console.log("Synthetic credential-shape matrix (no real credential is used):");
  for (const endpoint of endpoints) {
    console.log(`\n${endpoint.label} -> ${API}${endpoint.path}`);
    const anonymous = await call(endpoint.path, "");
    console.log(`  ${"no Authorization header".padEnd(40)} HTTP ${anonymous.status} ${summarize(anonymous.payload)}`);
    for (const probeValue of PROBE_VALUES) {
      const result = await call(endpoint.path, probeValue.value);
      console.log(`  ${probeValue.label.padEnd(40)} HTTP ${result.status} ${summarize(result.payload)}`);
    }
  }
  console.log(
    "\nReading: every value Cloudflare rejects on format returns HTTP 400 / 6003 + 6111. " +
      "Only a 40-or-more character token-charset value reaches identity validation " +
      "(403/9109 on zones, 401/10000 on dns). This signature therefore means the " +
      "transmitted value is not a 40-character token — absent, stale, truncated or " +
      "re-encoded — not a token with wrong permissions or scope.",
  );
  return 2;
}

async function verify(credential, options) {
  const shape = describe(credential);
  if (!shape.bearerCompatible) {
    console.log(
      "\nNot calling Cloudflare: this credential cannot authenticate through an Authorization " +
        "bearer header, so the request would fail on header format before any permission is read.",
    );
    return 2;
  }

  const results = [];
  const identity = await call("/user/tokens/verify", credential);
  results.push({ label: "GET /user/tokens/verify", ...identity });

  const query = options.accountName ? `?name=${encodeURIComponent(options.accountName)}&per_page=50` : "?per_page=50";
  const zones = await call(`/zones${query}`, credential);
  results.push({ label: `GET /zones${options.accountName ? " (name filter)" : ""}`, ...zones });

  if (options.zone) {
    const dns = await call(`/zones/${options.zone}/dns_records?per_page=5`, credential);
    results.push({ label: `GET /zones/${options.zone}/dns_records`, ...dns });
  }

  console.log("\nRead-only calls:");
  for (const result of results) {
    console.log(`  ${result.label.padEnd(40)} HTTP ${result.status} success=${result.payload?.success} ${summarize(result.payload)}`);
  }

  const zoneRows = Array.isArray(zones.payload?.result) ? zones.payload.result : [];
  if (zones.payload?.success) {
    console.log(`\nZones visible: ${zoneRows.length}`);
    for (const zone of zoneRows) console.log(`  - ${zone.name} (${zone.status}) id=${zone.id}`);
  }

  const verified = results.every((result) => result.payload?.success === true && result.status < 400);
  console.log(
    verified
      ? "\nREAD-ONLY CLOUDFLARE ACCESS VERIFIED for this credential."
      : "\nNOT VERIFIED: at least one read-only call did not return provider data.",
  );
  return verified ? 0 : 2;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.error) {
    console.error(parsed.error);
    return 3;
  }
  const { options } = parsed;
  if (options.help) {
    console.log("Usage: node scripts/cloudflare-auth-diagnose.mjs [--probe] [--zone <id>] [--account-name <domain>]");
    console.log("Environment: CLOUDFLARE_API_TOKEN (optional; never printed)");
    return 0;
  }
  if (options.probe) return probe(options.zone);

  const credential = process.env.CLOUDFLARE_API_TOKEN ?? "";
  if (!credential) {
    describe(credential);
    console.log(
      "\nSupply a credential to verify read-only access:\n" +
        "  CLOUDFLARE_API_TOKEN=<token> node scripts/cloudflare-auth-diagnose.mjs --zone <zone_id>\n" +
        "Or replay the shape matrix with: node scripts/cloudflare-auth-diagnose.mjs --probe",
    );
    return 2;
  }
  return verify(credential, options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error(`diagnostic failed: ${error?.name ?? "Error"} ${error?.message ?? ""}`.trim());
      process.exit(2);
    },
  );
}
