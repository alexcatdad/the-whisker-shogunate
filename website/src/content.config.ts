import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const lore = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lore" }),
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
