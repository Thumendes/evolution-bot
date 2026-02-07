import { Elysia, t } from "elysia";
import { eq, and, count } from "drizzle-orm";
import { organizations, storageFiles } from "../db/schema";
import { paginationQuery, paginationMeta } from "../lib/pagination";
import { db } from "../db";

export const storageFileRoutes = new Elysia({
  prefix: "/organizations/:orgId/storage-files",
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
      const where = eq(storageFiles.organizationId, params.orgId);

      const [totalResult] = await db.select({ count: count() }).from(storageFiles).where(where);

      const data = await db
        .select()
        .from(storageFiles)
        .where(where)
        .orderBy(storageFiles.createdAt)
        .limit(limit)
        .offset(offset);

      return { data, meta: paginationMeta(Number(totalResult.count), page, limit) };
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      query: t.Object(paginationQuery),
      detail: { tags: ["Storage Files"], summary: "List storage files" },
    },
  )

  // ── Create ────────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ params, body }) => {
      const [created] = await db
        .insert(storageFiles)
        .values({
          organizationId: params.orgId,
          filename: body.filename,
          description: body.description ?? null,
          url: body.url,
        })
        .returning();

      return created;
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      body: t.Object({
        filename: t.String({ minLength: 1, maxLength: 512 }),
        description: t.Optional(t.String()),
        url: t.String({ minLength: 1, maxLength: 2048 }),
      }),
      detail: { tags: ["Storage Files"], summary: "Create storage file" },
    },
  )

  // ── Get by ID ─────────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params, status }) => {
      const record = await db.query.storageFiles.findFirst({
        where: and(eq(storageFiles.id, params.id), eq(storageFiles.organizationId, params.orgId)),
      });

      if (!record) return status(404, { message: "Storage file not found" });

      return record;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Storage Files"], summary: "Get storage file by ID" },
    },
  )

  // ── Update ────────────────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(storageFiles)
        .set({
          ...(body.filename !== undefined && { filename: body.filename }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.url !== undefined && { url: body.url }),
        })
        .where(and(eq(storageFiles.id, params.id), eq(storageFiles.organizationId, params.orgId)))
        .returning();

      if (!updated) return status(404, { message: "Storage file not found" });

      return updated;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        filename: t.Optional(t.String({ minLength: 1, maxLength: 512 })),
        description: t.Optional(t.Nullable(t.String())),
        url: t.Optional(t.String({ minLength: 1, maxLength: 2048 })),
      }),
      detail: { tags: ["Storage Files"], summary: "Update storage file" },
    },
  )

  // ── Delete ────────────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params, status }) => {
      const [deleted] = await db
        .delete(storageFiles)
        .where(and(eq(storageFiles.id, params.id), eq(storageFiles.organizationId, params.orgId)))
        .returning();

      if (!deleted) return status(404, { message: "Storage file not found" });

      return deleted;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Storage Files"], summary: "Delete storage file" },
    },
  );
