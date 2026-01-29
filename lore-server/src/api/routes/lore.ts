import { Elysia, t } from "elysia";
import * as loreService from "../../services/lore";
import { apiKeyGuard } from "../guards/api-key";
import {
  CreateLoreSchema,
  ErrorSchema,
  ListQuerySchema,
  LoreEntrySchema,
  LoreSummarySchema,
  SearchQuerySchema,
  SearchResultSchema,
  UpdateLoreSchema,
} from "../schemas/lore";

export const loreRoutes = new Elysia({ prefix: "/lore" })
  .use(apiKeyGuard)

  // GET /lore/search - Semantic search
  .get(
    "/search",
    async ({ query }) => {
      const results = await loreService.searchLore(
        query.q,
        query.category,
        query.limit ? Number(query.limit) : undefined,
      );
      return results;
    },
    {
      query: SearchQuerySchema,
      response: {
        200: t.Array(SearchResultSchema),
      },
    },
  )

  // GET /lore - List entries
  .get(
    "/",
    async ({ query }) => {
      const entries = await loreService.listEntries(query.category);

      if (query.full) {
        return entries;
      }

      return entries.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        tags: e.tags,
      }));
    },
    {
      query: ListQuerySchema,
      response: {
        200: t.Union([t.Array(LoreEntrySchema), t.Array(LoreSummarySchema)]),
      },
    },
  )

  // GET /lore/:id - Get single entry
  .get(
    "/:id",
    async ({ params, set }) => {
      const entry = await loreService.getEntry(params.id);
      if (!entry) {
        set.status = 404;
        return { error: "Entry not found" };
      }
      return entry;
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: LoreEntrySchema,
        404: ErrorSchema,
      },
    },
  )

  // POST /lore - Create entry (protected)
  .post(
    "/",
    async ({ body }) => {
      const entry = await loreService.createEntry(body);
      return entry;
    },
    {
      requireApiKey: true,
      body: CreateLoreSchema,
      response: {
        200: LoreEntrySchema,
      },
    },
  )

  // PATCH /lore/:id - Update entry (protected)
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const entry = await loreService.updateEntry(params.id, body);
      if (!entry) {
        set.status = 404;
        return { error: "Entry not found" };
      }
      return entry;
    },
    {
      requireApiKey: true,
      params: t.Object({ id: t.String() }),
      body: UpdateLoreSchema,
      response: {
        200: LoreEntrySchema,
        404: ErrorSchema,
      },
    },
  )

  // DELETE /lore/:id - Delete entry (protected)
  .delete(
    "/:id",
    async ({ params, set }) => {
      const deleted = await loreService.deleteEntry(params.id);
      if (!deleted) {
        set.status = 404;
        return { error: "Entry not found" };
      }
      return { deleted: true };
    },
    {
      requireApiKey: true,
      params: t.Object({ id: t.String() }),
      response: {
        200: t.Object({ deleted: t.Boolean() }),
        404: ErrorSchema,
      },
    },
  );
