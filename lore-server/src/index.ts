import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import * as db from "./db.js";

const server = new Server(
  { name: "whisker-lore-server", version: "0.1.0" },
  { capabilities: { tools: { listChanged: true } } }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_lore",
        description:
          "Semantic search across all lore entries. Returns the most relevant entries for a given query.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query (natural language)",
            },
            category: {
              type: "string",
              description: "Optional category filter",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 10)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_entry",
        description: "Get a single lore entry by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The entry ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "list_entries",
        description:
          "List all lore entries, optionally filtered by category. Returns summaries (id, title, category).",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Optional category filter",
            },
          },
        },
      },
      {
        name: "list_categories",
        description: "List all available categories in the lore database.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_entry",
        description: "Create a new lore entry.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Entry title",
            },
            content: {
              type: "string",
              description: "Entry content (markdown)",
            },
            category: {
              type: "string",
              description: "Entry category",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags",
            },
            parentId: {
              type: "string",
              description: "Optional parent entry ID for hierarchy",
            },
            metadata: {
              type: "object",
              description: "Optional flexible metadata",
            },
          },
          required: ["title", "content", "category"],
        },
      },
      {
        name: "update_entry",
        description: "Update an existing lore entry.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Entry ID to update",
            },
            title: { type: "string" },
            content: { type: "string" },
            category: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            parentId: { type: "string" },
            metadata: { type: "object" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_entry",
        description: "Delete a lore entry by ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Entry ID to delete",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "export_markdown",
        description:
          "Export lore entries to markdown format for sharing. Returns the markdown content.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Optional category to export (exports all if omitted)",
            },
          },
        },
      },
    ],
  };
});

// Tool implementations
server.setRequestHandler(
  CallToolRequestSchema,
  async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "search_lore": {
          const { query, category, limit } = args as {
            query: string;
            category?: string;
            limit?: number;
          };
          const results = await db.searchLore(query, category, limit);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        case "get_entry": {
          const { id } = args as { id: string };
          const entry = await db.getEntry(id);
          if (!entry) {
            return {
              content: [{ type: "text", text: `Entry not found: ${id}` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify(entry, null, 2) }],
          };
        }

        case "list_entries": {
          const { category } = args as { category?: string };
          const entries = await db.listEntries(category);
          const summaries = entries.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            tags: e.tags,
          }));
          return {
            content: [
              { type: "text", text: JSON.stringify(summaries, null, 2) },
            ],
          };
        }

        case "list_categories": {
          const categories = await db.getCategories();
          return {
            content: [
              { type: "text", text: JSON.stringify(categories, null, 2) },
            ],
          };
        }

        case "create_entry": {
          const input = args as {
            title: string;
            content: string;
            category: string;
            tags?: string[];
            parentId?: string;
            metadata?: Record<string, unknown>;
          };
          const entry = await db.createEntry(input);
          return {
            content: [
              {
                type: "text",
                text: `Created entry: ${entry.id}\n${JSON.stringify(entry, null, 2)}`,
              },
            ],
          };
        }

        case "update_entry": {
          const { id, ...updates } = args as {
            id: string;
            title?: string;
            content?: string;
            category?: string;
            tags?: string[];
            parentId?: string;
            metadata?: Record<string, unknown>;
          };
          const entry = await db.updateEntry(id, updates);
          if (!entry) {
            return {
              content: [{ type: "text", text: `Entry not found: ${id}` }],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: "text",
                text: `Updated entry: ${id}\n${JSON.stringify(entry, null, 2)}`,
              },
            ],
          };
        }

        case "delete_entry": {
          const { id } = args as { id: string };
          const deleted = await db.deleteEntry(id);
          if (!deleted) {
            return {
              content: [{ type: "text", text: `Entry not found: ${id}` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text", text: `Deleted entry: ${id}` }],
          };
        }

        case "export_markdown": {
          const { category } = args as { category?: string };
          const entries = await db.listEntries(category);

          // Group by category
          const byCategory = new Map<string, typeof entries>();
          for (const entry of entries) {
            const cat = entry.category;
            if (!byCategory.has(cat)) {
              byCategory.set(cat, []);
            }
            byCategory.get(cat)!.push(entry);
          }

          // Generate markdown
          let markdown = "# The Whisker Shogunate - Lore Export\n\n";
          markdown += `*Exported: ${new Date().toISOString()}*\n\n`;

          for (const [cat, catEntries] of byCategory) {
            markdown += `## ${cat}\n\n`;
            for (const entry of catEntries) {
              markdown += `### ${entry.title}\n\n`;
              if (entry.tags.length > 0) {
                markdown += `*Tags: ${entry.tags.join(", ")}*\n\n`;
              }
              markdown += `${entry.content}\n\n`;
              markdown += "---\n\n";
            }
          }

          return {
            content: [{ type: "text", text: markdown }],
          };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Initialize and start
async function main() {
  await db.connect();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Whisker Lore Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
