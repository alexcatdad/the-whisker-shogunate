import * as lancedb from "@lancedb/lancedb";
import { v4 as uuidv4 } from "uuid";
import { embed } from "./embeddings.js";
import type {
  LoreEntry,
  LoreEntryWithVector,
  CreateEntryInput,
  UpdateEntryInput,
  SearchResult,
} from "./types.js";

const DB_PATH = process.env.LORE_DB_PATH || "./data/lore.lance";

let db: lancedb.Connection | null = null;
let table: lancedb.Table | null = null;

export async function connect(): Promise<void> {
  db = await lancedb.connect(DB_PATH);

  // Check if table exists
  const tables = await db.tableNames();
  if (tables.includes("lore")) {
    table = await db.openTable("lore");
  }
}

export async function ensureTable(): Promise<lancedb.Table> {
  if (!db) {
    await connect();
  }

  if (!table) {
    // Create empty table with schema
    const now = new Date().toISOString();
    const emptyVector = await embed("initialization");

    table = await db!.createTable(
      "lore",
      [
        {
          id: "_init_",
          title: "_init_",
          content: "_init_",
          category: "_init_",
          tags: ["_init_"], // Non-empty for type inference
          parentId: "",
          metadata: JSON.stringify({}), // Stringify for Arrow compatibility
          createdAt: now,
          updatedAt: now,
          vector: emptyVector,
        },
      ],
      { mode: "overwrite" }
    );

    // Delete the init row
    await table.delete('id = "_init_"');
  }

  return table;
}

export async function searchLore(
  query: string,
  category?: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const tbl = await ensureTable();
  const queryVector = await embed(query);

  let search = tbl.search(queryVector).limit(limit);

  if (category) {
    search = search.where(`category = '${category}'`);
  }

  const results = await search.toArray();

  return results.map((row) => ({
    entry: rowToEntry(row),
    score: row._distance ?? 0,
  }));
}

export async function getEntry(id: string): Promise<LoreEntry | null> {
  const tbl = await ensureTable();
  const results = await tbl.query().where(`id = '${id}'`).limit(1).toArray();

  if (results.length === 0) {
    return null;
  }

  return rowToEntry(results[0]);
}

export async function listEntries(category?: string): Promise<LoreEntry[]> {
  const tbl = await ensureTable();

  let query = tbl.query();
  if (category) {
    query = query.where(`category = '${category}'`);
  }

  const results = await query.toArray();
  return results.map(rowToEntry);
}

export async function createEntry(input: CreateEntryInput): Promise<LoreEntry> {
  const tbl = await ensureTable();

  const now = new Date().toISOString();
  const id = uuidv4();

  // Embed title + content together for better semantic matching
  const textToEmbed = `${input.title}\n\n${input.content}`;
  const vector = await embed(textToEmbed);

  const entry = {
    id,
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags?.length ? input.tags : ["untagged"],
    parentId: input.parentId || "",
    metadata: JSON.stringify(input.metadata || {}),
    createdAt: now,
    updatedAt: now,
    vector,
  };

  await tbl.add([entry as unknown as Record<string, unknown>]);

  return rowToEntry(entry as unknown as Record<string, unknown>);
}

export async function updateEntry(
  id: string,
  input: UpdateEntryInput
): Promise<LoreEntry | null> {
  const existing = await getEntry(id);
  if (!existing) {
    return null;
  }

  const tbl = await ensureTable();
  const now = new Date().toISOString();

  const updated: LoreEntry = {
    ...existing,
    ...input,
    updatedAt: now,
  };

  // Re-embed if title or content changed
  let vector: number[];
  if (input.title || input.content) {
    const textToEmbed = `${updated.title}\n\n${updated.content}`;
    vector = await embed(textToEmbed);
  } else {
    // Fetch existing vector
    const rows = await tbl.query().where(`id = '${id}'`).limit(1).toArray();
    vector = rows[0].vector as number[];
  }

  // Delete old, insert new (LanceDB update pattern)
  await tbl.delete(`id = '${id}'`);

  const row = {
    ...updated,
    tags: updated.tags?.length ? updated.tags : ["untagged"],
    metadata: JSON.stringify(updated.metadata || {}),
    vector,
  };
  await tbl.add([row as unknown as Record<string, unknown>]);

  return updated;
}

export async function deleteEntry(id: string): Promise<boolean> {
  const tbl = await ensureTable();
  const existing = await getEntry(id);

  if (!existing) {
    return false;
  }

  await tbl.delete(`id = '${id}'`);
  return true;
}

export async function bulkInsert(entries: CreateEntryInput[]): Promise<number> {
  const tbl = await ensureTable();
  const now = new Date().toISOString();

  // Batch embed all entries
  const textsToEmbed = entries.map((e) => `${e.title}\n\n${e.content}`);
  const vectors = await Promise.all(textsToEmbed.map((t) => embed(t)));

  const rows = entries.map((input, i) => ({
    id: uuidv4(),
    title: input.title,
    content: input.content,
    category: input.category,
    tags: input.tags?.length ? input.tags : ["untagged"],
    parentId: input.parentId || "",
    metadata: JSON.stringify(input.metadata || {}),
    createdAt: now,
    updatedAt: now,
    vector: vectors[i],
  }));

  await tbl.add(rows as unknown as Record<string, unknown>[]);
  return rows.length;
}

export async function getCategories(): Promise<string[]> {
  const tbl = await ensureTable();
  const results = await tbl.query().select(["category"]).toArray();

  const categories = new Set<string>();
  for (const row of results) {
    if (row.category) {
      categories.add(row.category as string);
    }
  }

  return Array.from(categories).sort();
}

function rowToEntry(row: Record<string, unknown>): LoreEntry {
  let metadata: Record<string, unknown> = {};
  if (typeof row.metadata === "string") {
    try {
      metadata = JSON.parse(row.metadata);
    } catch {
      metadata = {};
    }
  } else if (row.metadata && typeof row.metadata === "object") {
    metadata = row.metadata as Record<string, unknown>;
  }

  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    category: row.category as string,
    tags: (row.tags as string[]) || [],
    parentId: (row.parentId as string) || undefined,
    metadata,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}
