import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Use in-memory incremental cache; swap to KV/R2 when traffic warrants
  // (see docs/CLOUDFLARE_PAGES_MIGRATION.md for cache-binding recipe).
});
