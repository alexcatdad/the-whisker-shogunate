import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ===== QUERIES =====

export const getLore = query({
  args: { id: v.id("lore") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listLore = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;

    if (args.category) {
      const cat = args.category;
      return await ctx.db
        .query("lore")
        .withIndex("by_category", (q) => q.eq("category", cat))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("lore").order("desc").take(limit);
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("lore").collect();
    const categories = [...new Set(entries.map((e) => e.category))].sort();
    return categories;
  },
});

export const searchLore = query({
  args: {
    embedding: v.array(v.float64()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    let results: Array<Doc<"loreEmbeddings"> & { _score: number }>;

    if (args.category) {
      const cat = args.category;
      // @ts-expect-error - withVectorIndex types not generated correctly
      results = await ctx.db
        .query("loreEmbeddings")
        .withVectorIndex("by_embedding", {
          vector: args.embedding,
          limit,
          filter: (q: { eq: (field: string, value: string) => unknown }) =>
            q.eq("category", cat),
        })
        .collect();
    } else {
      // @ts-expect-error - withVectorIndex types not generated correctly
      results = await ctx.db
        .query("loreEmbeddings")
        .withVectorIndex("by_embedding", {
          vector: args.embedding,
          limit,
        })
        .collect();
    }

    // Fetch full lore entries
    const entries = await Promise.all(
      results.map(async (r: Doc<"loreEmbeddings"> & { _score: number }) => {
        const lore = await ctx.db.get(r.loreId);
        return { entry: lore, score: r._score };
      })
    );

    return entries.filter(
      (e): e is { entry: Doc<"lore">; score: number } => e.entry !== null
    );
  },
});

// ===== MUTATIONS =====

export const createLore = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    parentId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const loreId = await ctx.db.insert("lore", {
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags ?? [],
      parentId: args.parentId,
      metadata: args.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });

    // Store embedding if provided
    if (args.embedding && args.embedding.length > 0) {
      await ctx.db.insert("loreEmbeddings", {
        loreId,
        embedding: args.embedding,
        category: args.category,
      });
    }

    return loreId;
  },
});

export const updateLore = mutation({
  args: {
    id: v.id("lore"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    parentId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Entry not found");

    const updates: Partial<Doc<"lore">> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.parentId !== undefined) updates.parentId = args.parentId;
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    await ctx.db.patch(args.id, updates);

    // Update embedding if provided
    if (args.embedding && args.embedding.length > 0) {
      // Find and delete old embedding
      const oldEmbedding = await ctx.db
        .query("loreEmbeddings")
        .withIndex("by_lore", (q) => q.eq("loreId", args.id))
        .first();

      if (oldEmbedding) {
        await ctx.db.delete(oldEmbedding._id);
      }

      // Insert new embedding
      const newCategory = args.category ?? existing.category;
      await ctx.db.insert("loreEmbeddings", {
        loreId: args.id,
        embedding: args.embedding,
        category: newCategory,
      });
    }

    return args.id;
  },
});

export const deleteLore = mutation({
  args: { id: v.id("lore") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return false;

    // Delete embedding first
    const embedding = await ctx.db
      .query("loreEmbeddings")
      .withIndex("by_lore", (q) => q.eq("loreId", args.id))
      .first();

    if (embedding) {
      await ctx.db.delete(embedding._id);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

// ===== INTERNAL MUTATIONS (for bulk import) =====

export const bulkCreateLore = internalMutation({
  args: {
    entries: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        category: v.string(),
        tags: v.array(v.string()),
        parentId: v.optional(v.string()),
        metadata: v.optional(v.any()),
        createdAt: v.number(),
        updatedAt: v.number(),
        embedding: v.optional(v.array(v.float64())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids: Id<"lore">[] = [];

    for (const entry of args.entries) {
      const loreId = await ctx.db.insert("lore", {
        title: entry.title,
        content: entry.content,
        category: entry.category,
        tags: entry.tags,
        parentId: entry.parentId,
        metadata: entry.metadata ?? {},
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });

      if (entry.embedding && entry.embedding.length > 0) {
        await ctx.db.insert("loreEmbeddings", {
          loreId,
          embedding: entry.embedding,
          category: entry.category,
        });
      }

      ids.push(loreId);
    }

    return ids;
  },
});
