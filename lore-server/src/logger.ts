import * as fs from "fs";
import * as path from "path";

const LOG_DIR = process.env.LOG_DIR || "./data/logs";
const LOG_FILE = path.join(LOG_DIR, "lore-db.log");

// Ensure log directory exists
function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatLogEntry(
  level: "INFO" | "WARN" | "ERROR",
  operation: string,
  details: Record<string, unknown>
): string {
  const timestamp = formatTimestamp();
  const detailsStr = JSON.stringify(details, null, 0);
  return `[${timestamp}] [${level}] [${operation}] ${detailsStr}\n`;
}

function writeLog(entry: string): void {
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, entry);
}

export function logInfo(operation: string, details: Record<string, unknown> = {}): void {
  const entry = formatLogEntry("INFO", operation, details);
  writeLog(entry);
}

export function logWarn(operation: string, details: Record<string, unknown> = {}): void {
  const entry = formatLogEntry("WARN", operation, details);
  writeLog(entry);
}

export function logError(operation: string, details: Record<string, unknown> = {}): void {
  const entry = formatLogEntry("ERROR", operation, details);
  writeLog(entry);
}

// Convenience functions for common operations
export const log = {
  connect: (dbPath: string) =>
    logInfo("CONNECT", { dbPath }),

  search: (query: string, category: string | undefined, limit: number, resultCount: number) =>
    logInfo("SEARCH", { query, category, limit, resultCount }),

  getEntry: (id: string, found: boolean) =>
    logInfo("GET_ENTRY", { id, found }),

  listEntries: (category: string | undefined, count: number) =>
    logInfo("LIST_ENTRIES", { category, count }),

  createEntry: (id: string, title: string, category: string) =>
    logInfo("CREATE_ENTRY", { id, title, category }),

  updateEntry: (id: string, title: string, fieldsUpdated: string[]) =>
    logInfo("UPDATE_ENTRY", { id, title, fieldsUpdated }),

  deleteEntry: (id: string, title: string) =>
    logInfo("DELETE_ENTRY", { id, title }),

  bulkInsert: (count: number, categories: string[]) =>
    logInfo("BULK_INSERT", { count, categories }),

  getCategories: (categories: string[]) =>
    logInfo("GET_CATEGORIES", { count: categories.length, categories }),

  error: (operation: string, error: unknown) =>
    logError(operation, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }),
};
