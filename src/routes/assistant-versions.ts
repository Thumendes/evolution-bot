import { Elysia, t } from "elysia";
import { eq, and, count } from "drizzle-orm";
import { organizations, assistantVersions } from "../db/schema";
import { paginationQuery, paginationMeta } from "../lib/pagination";
import { db } from "../db";

export const assistantVersionRoutes = new Elysia({
  prefix: "/organizations/:orgId/assistant-versions",
})
  // ── Resolve: validate org exists ──────────────────────────────────────
  .resolve(async ({ params, status }) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, (params as { orgId: string }).orgId),
    });
    if (!org) return status(404, { message: "Organization not found" });
    return { org };
  })

  // ── List ──────────────────────────────────────────────────────────────
  .get(
    "/",
    async ({ params, query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;
      const where = eq(assistantVersions.organizationId, params.orgId);

      const [totalResult] = await db.select({ count: count() }).from(assistantVersions).where(where);

      const data = await db
        .select()
        .from(assistantVersions)
        .where(where)
        .orderBy(assistantVersions.createdAt)
        .limit(limit)
        .offset(offset);

      return { data, meta: paginationMeta(Number(totalResult.count), page, limit) };
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      query: t.Object(paginationQuery),
      detail: { tags: ["Assistant Versions"], summary: "List assistant versions" },
    },
  )

  // ── Create ────────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ params, body }) => {
      const [created] = await db
        .insert(assistantVersions)
        .values({
          organizationId: params.orgId,
          model: body.model,
          instructions: body.instructions,
          functions: body.functions ?? null,
          temperature: body.temperature ?? 1.0,
          version: body.version ?? 1,
          published: body.published ?? false,
        })
        .returning();

      return created;
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      body: t.Object({
        model: t.String({ minLength: 1, maxLength: 255 }),
        instructions: t.String({ minLength: 1 }),
        functions: t.Optional(t.Any()),
        temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
        version: t.Optional(t.Integer({ minimum: 1 })),
        published: t.Optional(t.Boolean()),
      }),
      detail: { tags: ["Assistant Versions"], summary: "Create assistant version" },
    },
  )

  // ── Get by ID ─────────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params, status }) => {
      const record = await db.query.assistantVersions.findFirst({
        where: and(eq(assistantVersions.id, params.id), eq(assistantVersions.organizationId, params.orgId)),
      });

      if (!record) return status(404, { message: "Assistant version not found" });

      return record;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Assistant Versions"], summary: "Get assistant version by ID" },
    },
  )

  // ── Update ────────────────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(assistantVersions)
        .set({
          ...(body.model !== undefined && { model: body.model }),
          ...(body.instructions !== undefined && { instructions: body.instructions }),
          ...(body.functions !== undefined && { functions: body.functions }),
          ...(body.temperature !== undefined && { temperature: body.temperature }),
          ...(body.version !== undefined && { version: body.version }),
          ...(body.published !== undefined && { published: body.published }),
        })
        .where(and(eq(assistantVersions.id, params.id), eq(assistantVersions.organizationId, params.orgId)))
        .returning();

      if (!updated) return status(404, { message: "Assistant version not found" });

      return updated;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        model: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        instructions: t.Optional(t.String({ minLength: 1 })),
        functions: t.Optional(t.Nullable(t.Any())),
        temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
        version: t.Optional(t.Integer({ minimum: 1 })),
        published: t.Optional(t.Boolean()),
      }),
      detail: { tags: ["Assistant Versions"], summary: "Update assistant version" },
    },
  )

  // ── Delete ────────────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params, status }) => {
      const [deleted] = await db
        .delete(assistantVersions)
        .where(and(eq(assistantVersions.id, params.id), eq(assistantVersions.organizationId, params.orgId)))
        .returning();

      if (!deleted) return status(404, { message: "Assistant version not found" });

      return deleted;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Assistant Versions"], summary: "Delete assistant version" },
    },
  );
