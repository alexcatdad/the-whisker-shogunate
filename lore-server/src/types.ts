export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  parentId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LoreEntryWithVector extends LoreEntry {
  vector: number[];
}

export interface CreateEntryInput {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  entry: LoreEntry;
  score: number;
}
