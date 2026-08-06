import { defineConfig } from "@opennextjs/cloudflare";

export default defineConfig({
  output: ".open-next",
  assets: {
    directory: ".open-next/assets",
    binding: "ASSETS",
    run_worker_first: true,
  },
  compatibilityDate: "2026-08-06",
});
