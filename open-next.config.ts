import { defineOpenNextConfig } from "@opennextjs/cloudflare";

export default defineOpenNextConfig({
  default: {
    override: {
      wrapper: "cloudflare",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
});
