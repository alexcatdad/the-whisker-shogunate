import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import type { Id } from "../../convex/_generated/dataModel.js";
import { embed } from "./embeddings.js";
import { log } from "./logger.js";
import type { CreateEntryInput, LoreEntry, SearchResult, UpdateEntryInput } from "./types.js";

// Load CONVEX_URL from environment or .env.local
function getConvexUrl(): string {
  if (process.env.CONVEX_URL) {
    return process.env.CONVEX_URL;
  }

  // Try to load from .env.local
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const envPath = path.resolve(__dirname, "../../.env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const [key, ...vals] = line.split("=");
        if (key?.trim() === "CONVEX_URL" && vals.length > 0) {
          return vals.join("=").trim();
        }
      }
    }
  } catch {
    // Ignore errors
  }

  throw new Error("CONVEX_URL not found in environment or .env.local");
}

let client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient {
  if (!client) {
    client = new ConvexHttpClient(getConvexUrl());
  }
  return client;
}

// For backward compatibility
export const DB_PATH = "convex";

export async function connect(): Promise<void> {
  // Verify Convex connection by making a simple query
  try {
    await getClient().query(api.lore.listCategories, {});
    log.connect("Convex");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to connect to Convex: ${message}`);
  }
}

export async function searchLore(
  query: string,
  category?: string,
  limit = 10
): Promise<SearchResult[]> {
  const queryVector = await embed(query);

  const results = await getClient().query(api.lore.searchLore, {
    embedding: queryVector,
    category,
    limit,
  });

  log.search(query, category, limit, results.length);

  return results.map((r) => ({
    entry: convexToEntry(r.entry),
    score: r.score,
  }));
}

export async function getEntry(id: string): Promise<LoreEntry | null> {
  // Try to find by searching for title match (Convex uses its own IDs)
  // For now, list all and find by old ID in metadata or match by title
  const entries = await getClient().query(api.lore.listLore, { limit: 10000 });

  // First try to find by Convex ID (if id looks like a Convex ID)
  if (id.includes(":")) {
    try {
      const entry = await getClient().query(api.lore.getLore, {
        id: id as Id<"lore">,
      });
      if (entry) {
        log.getEntry(id, true);
        return convexToEntry(entry);
      }
    } catch {
      // Not a valid Convex ID, continue
    }
  }

  // Search by title or old UUID in metadata
  for (const entry of entries) {
    const metadata = entry.metadata as Record<string, unknown> | undefined;
    if (metadata?.oldId === id || entry.title === id) {
      log.getEntry(id, true);
      return convexToEntry(entry);
    }
  }

  log.getEntry(id, false);
  return null;
}

export async function listEntries(category?: string): Promise<LoreEntry[]> {
  const results = await getClient().query(api.lore.listLore, {
    category,
    limit: 10000,
  });

  log.listEntries(category, results.length);
  return results.map(convexToEntry);
}

export async function createEntry(input: CreateEntryInput): Promise<LoreEntry> {
  // Generate embedding
  const textToEmbed = `${input.title}\n\n${input.content}`;
  const embedding = await embed(textToEmbed);

  const id = await getClient().mutation(api.lore.createLore, {
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags?.length ? input.tags : undefined,
    parentId: input.parentId,
    metadata: input.metadata,
    embedding,
  });

  log.createEntry(id, input.title, input.category);

  // Fetch and return the created entry
  const entry = await getClient().query(api.lore.getLore, { id });
  if (!entry) {
    throw new Error("Failed to fetch created entry");
  }

  return convexToEntry(entry);
}

export async function updateEntry(
  id: string,
  input: UpdateEntryInput
): Promise<LoreEntry | null> {
  // Find the entry first
  const existing = await getEntry(id);
  if (!existing) {
    return null;
  }

  // Find the Convex ID
  const entries = await getClient().query(api.lore.listLore, { limit: 10000 });
  let convexId: Id<"lore"> | null = null;

  for (const entry of entries) {
    if (entry.title === existing.title) {
      convexId = entry._id;
      break;
    }
  }

  if (!convexId) {
    return null;
  }

  // Generate new embedding if content changed
  let embedding: number[] | undefined;
  if (input.title || input.content) {
    const newTitle = input.title ?? existing.title;
    const newContent = input.content ?? existing.content;
    const textToEmbed = `${newTitle}\n\n${newContent}`;
    embedding = await embed(textToEmbed);
  }

  await getClient().mutation(api.lore.updateLore, {
    id: convexId,
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags,
    parentId: input.parentId,
    metadata: input.metadata,
    embedding,
  });

  const fieldsUpdated = Object.keys(input).filter(
    (k) => input[k as keyof UpdateEntryInput] !== undefined
  );
  log.updateEntry(id, existing.title, fieldsUpdated);

  // Return updated entry
  const updated = await getClient().query(api.lore.getLore, { id: convexId });
  return updated ? convexToEntry(updated) : null;
}

export async function deleteEntry(id: string): Promise<boolean> {
  const existing = await getEntry(id);
  if (!existing) {
    return false;
  }

  // Find the Convex ID
  const entries = await getClient().query(api.lore.listLore, { limit: 10000 });
  let convexId: Id<"lore"> | null = null;

  for (const entry of entries) {
    if (entry.title === existing.title) {
      convexId = entry._id;
      break;
    }
  }

  if (!convexId) {
    return false;
  }

  const result = await getClient().mutation(api.lore.deleteLore, {
    id: convexId,
  });

  if (result) {
    log.deleteEntry(id, existing.title);
  }

  return result;
}

export async function bulkInsert(entries: CreateEntryInput[]): Promise<number> {
  // Generate embeddings for all entries
  const textsToEmbed = entries.map((e) => `${e.title}\n\n${e.content}`);
  const embeddings = await Promise.all(textsToEmbed.map((t) => embed(t)));

  // Insert one at a time (Convex doesn't have bulk insert via HTTP client)
  let inserted = 0;
  for (let i = 0; i < entries.length; i++) {
    const input = entries[i];
    try {
      await getClient().mutation(api.lore.createLore, {
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags?.length ? input.tags : undefined,
        parentId: input.parentId,
        metadata: input.metadata,
        embedding: embeddings[i],
      });
      inserted++;
    } catch (error) {
      console.error(`Failed to insert "${input.title}":`, error);
    }
  }

  const categories = [...new Set(entries.map((e) => e.category))];
  log.bulkInsert(inserted, categories);

  return inserted;
}

export async function getCategories(): Promise<string[]> {
  const categories = await getClient().query(api.lore.listCategories, {});
  log.getCategories(categories);
  return categories;
}

export async function healthCheck(): Promise<{
  ok: boolean;
  entryCount?: number;
  error?: string;
}> {
  try {
    const entries = await getClient().query(api.lore.listLore, { limit: 10000 });
    return {
      ok: true,
      entryCount: entries.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `Convex error: ${message}`,
    };
  }
}

// Helper function to convert Convex entry to LoreEntry
function convexToEntry(entry: {
  _id: Id<"lore">;
  title: string;
  content: string;
  category: string;
  tags: string[];
  parentId?: string;
  metadata?: unknown;
  createdAt: number;
  updatedAt: number;
}): LoreEntry {
  return {
    id: entry._id,
    title: entry.title,
    content: entry.content,
    category: entry.category,
    tags: entry.tags,
    parentId: entry.parentId,
    metadata: (entry.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(entry.createdAt).toISOString(),
    updatedAt: new Date(entry.updatedAt).toISOString(),
  };
}

// Legacy exports for compatibility
export async function ensureTable(): Promise<void> {
  await connect();
}
