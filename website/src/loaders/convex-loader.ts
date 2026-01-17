// Custom Astro loader that reads from Convex at build time
import type { Loader } from "astro/loaders";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

function getConvexUrl(): string {
  const url = process.env.CONVEX_URL;
  if (!url) {
    throw new Error("CONVEX_URL environment variable is required for build");
  }
  return url;
}

export function convexLoader(): Loader {
  return {
    name: "convex-loader",
    load: async ({ store, logger }) => {
      logger.info("Connecting to Convex...");

      const client = new ConvexHttpClient(getConvexUrl());
      const entries = await client.query(api.lore.listLore, { limit: 10000 });

      logger.info(`Loaded ${entries.length} entries from Convex`);

      store.clear();

      for (const entry of entries) {
        // Create a slug from the title
        const title = entry.title || "untitled";
        const category = entry.category || "general";
        const slug = `${category}/${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}`;

        // Parse metadata
        const metadata =
          typeof entry.metadata === "object" && entry.metadata !== null
            ? (entry.metadata as Record<string, unknown>)
            : {};

        store.set({
          id: slug,
          data: {
            id: entry._id,
            title: title,
            category: category,
            tags: entry.tags || [],
            parentId: entry.parentId,
            metadata: metadata,
            createdAt: new Date(entry.createdAt).toISOString(),
            updatedAt: new Date(entry.updatedAt).toISOString(),
          },
          body: entry.content || "",
        });
      }

      logger.info(`Stored ${entries.length} entries`);
    },
  };
}
