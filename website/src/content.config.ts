import { defineCollection, z } from "astro:content";
import { convexLoader } from "./loaders/convex-loader";

// Use Convex for both dev and production - fetches from cloud at build time
const lore = defineCollection({
  loader: convexLoader(),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    parentId: z.string().optional(),
    metadata: z.record(z.unknown()).default({}),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const collections = { lore };
