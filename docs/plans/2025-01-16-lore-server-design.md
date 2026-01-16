# LanceDB Lore Server Design

**Date**: 2025-01-16
**Status**: Approved

## Overview

A local MCP server that provides semantic search and CRUD operations for The Whisker Shogunate world-building lore. The database is the source of truth; markdown is used for initial import and exports for sharing.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                          │
│                         │                               │
│                    MCP Protocol                         │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              @whisker/lore-server               │   │
│  │                                                  │   │
│  │  Tools:                                          │   │
│  │  • search_lore(query, category?, limit?)        │   │
│  │  • get_entry(id)                                │   │
│  │  • list_entries(category?)                      │   │
│  │  • create_entry(title, content, category, tags?)│   │
│  │  • update_entry(id, fields)                     │   │
│  │  • delete_entry(id)                             │   │
│  │  • import_markdown(file)                        │   │
│  │  • export_markdown(category?)                   │   │
│  │                                                  │   │
│  │  ┌──────────────┐     ┌──────────────────┐     │   │
│  │  │   LanceDB    │     │     Ollama       │     │   │
│  │  │  (embedded)  │◄────│  nomic-embed-text│     │   │
│  │  │  lore.lance/ │     │  (local)         │     │   │
│  │  └──────────────┘     └──────────────────┘     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Data Model

```typescript
interface LoreEntry {
  // Identity
  id: string;              // uuid or slug

  // Content
  title: string;           // "Hinoki Cypress"
  content: string;         // Full text (markdown format)

  // Organization
  category: string;        // "materials", "characters", "locations", etc.
  tags: string[];          // ["wood", "architecture", "premium"]
  parentId?: string;       // For hierarchical entries

  // Flexible extension
  metadata: Record<string, any>;  // For experimental fields

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Vector (computed on save)
  vector: number[];
}
```

## Key Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Storage | LanceDB (embedded) | No separate DB process, versioning support |
| Source of truth | Database | Markdown is import/export only |
| Embeddings | Ollama (nomic-embed-text) | Fully local, no API costs |
| Chunking | By heading (initial import) | Natural semantic boundaries |
| Access | MCP server | Native Claude Code integration |
| Language | TypeScript/Node | Good LanceDB support, familiar ecosystem |

## Schema Evolution

The schema will evolve as the world-building evolves:

- **Tags over rigid categories**: Organic organization that emerges from content
- **Metadata bag**: `metadata: Record<string, any>` for experimenting with new attributes
- **Promote patterns**: Frequently-used metadata fields become proper fields
- **Tools evolve**: Add new tools (e.g., `link_entries`, `find_related`) as workflow develops

## Project Structure

```
the-whisker-shogunate/
├── originals/                  # Legacy markdown (archived after import)
├── lore-server/                # The MCP server package
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts            # MCP server entry point
│   │   ├── db.ts               # LanceDB connection & operations
│   │   ├── embeddings.ts       # Ollama embedding client
│   │   ├── tools/              # MCP tool implementations
│   │   │   ├── search.ts
│   │   │   ├── crud.ts
│   │   │   └── import-export.ts
│   │   └── types.ts            # LoreEntry interface
│   └── data/
│       └── lore.lance/         # LanceDB storage (gitignored)
├── exports/                    # Generated markdown exports (for sharing)
├── .claude/mcp.json            # MCP server config
├── CLAUDE.md
└── README.md
```

## MCP Tools

| Tool | Parameters | Returns |
|------|------------|---------|
| `search_lore` | query, category?, limit? | Matching entries with similarity scores |
| `get_entry` | id | Single entry |
| `list_entries` | category? | Entry summaries (id, title, category) |
| `create_entry` | title, content, category, tags?, metadata? | Created entry |
| `update_entry` | id, fields (partial) | Updated entry |
| `delete_entry` | id | Success confirmation |
| `import_markdown` | file | Import stats |
| `export_markdown` | category? | Path to exported file |

## Implementation Notes

1. **Ollama dependency**: Requires Ollama running locally with `nomic-embed-text` model pulled
2. **Initial import**: One-time parsing of `originals/*.md`, splitting on `##`+ headings
3. **Exports**: Periodic snapshots to `exports/` for backup and sharing
4. **Git**: `lore.lance/` is gitignored; exports are the portable format
