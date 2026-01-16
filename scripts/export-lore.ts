/**
 * Export lore entries from LanceDB to Markdown files for Astro
 *
 * Usage: bun run scripts/export-lore.ts
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LoreEntry } from "../lore-server/src/types";

// Set the database path before importing db module
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
process.env.LORE_DB_PATH = join(projectRoot, "lore-server", "data", "lore_db");

// Dynamic import after env var is set
const { getCategories, listEntries } = await import("../lore-server/src/db");

const OUTPUT_DIR = "website/src/content/lore";

/**
 * Convert a title to a URL-friendly slug
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate YAML frontmatter from a lore entry
 */
function generateFrontmatter(entry: LoreEntry): string {
  const lines = [
    "---",
    `id: "${entry.id}"`,
    `title: "${entry.title.replace(/"/g, '\\"')}"`,
    `category: "${entry.category}"`,
  ];

  // Tags - handle cases where tags might be undefined or a string
  const tags = Array.isArray(entry.tags) ? entry.tags : [];
  if (tags.length > 0) {
    lines.push(`tags: [${tags.map((t) => `"${t}"`).join(", ")}]`);
  } else {
    lines.push("tags: []");
  }

  // Optional parentId
  if (entry.parentId) {
    lines.push(`parentId: "${entry.parentId}"`);
  }

  // Metadata as JSON
  lines.push(`metadata: ${JSON.stringify(entry.metadata)}`);

  // Timestamps
  lines.push(`createdAt: "${entry.createdAt}"`);
  lines.push(`updatedAt: "${entry.updatedAt}"`);

  lines.push("---");

  return lines.join("\n");
}

/**
 * Export a single entry to a markdown file
 */
async function exportEntry(entry: LoreEntry): Promise<string> {
  const slug = slugify(entry.title);
  const categoryDir = join(OUTPUT_DIR, entry.category);
  const filePath = join(categoryDir, `${slug}.md`);

  // Ensure category directory exists
  await mkdir(categoryDir, { recursive: true });

  // Generate file content
  const frontmatter = generateFrontmatter(entry);
  const content = `${frontmatter}\n\n${entry.content}`;

  await writeFile(filePath, content, "utf-8");

  return filePath;
}

/**
 * Main export function
 */
async function main() {
  console.log("🐱 Exporting lore from The Whisker Shogunate...\n");

  // Clean output directory
  console.log("📁 Cleaning output directory...");
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Get all categories
  const categories = await getCategories();
  console.log(`📂 Found ${categories.length} categories: ${categories.join(", ")}\n`);

  // Export stats
  const stats: Record<string, number> = {};
  let totalExported = 0;

  // Export entries by category
  for (const category of categories) {
    const entries = await listEntries(category);
    stats[category] = entries.length;

    console.log(`  ${category}: ${entries.length} entries`);

    for (const entry of entries) {
      await exportEntry(entry);
      totalExported++;
    }
  }

  // Summary
  console.log(`\n✨ Exported ${totalExported} entries to ${OUTPUT_DIR}/`);
  console.log("\nBreakdown by category:");
  for (const [category, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category.padEnd(15)} ${count}`);
  }
}

// Run
main().catch((error) => {
  console.error("❌ Export failed:", error);
  process.exit(1);
});
