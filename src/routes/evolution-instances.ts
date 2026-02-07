import { Elysia, t } from "elysia";
import { eq, and, count } from "drizzle-orm";
import { organizations, evolutionInstances } from "../db/schema";
import { paginationQuery, paginationMeta } from "../lib/pagination";
import { db } from "../db";

export const evolutionInstanceRoutes = new Elysia({
  prefix: "/organizations/:orgId/evolution-instances",
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
      const where = eq(evolutionInstances.organizationId, params.orgId);

      const [totalResult] = await db.select({ count: count() }).from(evolutionInstances).where(where);

      const data = await db
        .select()
        .from(evolutionInstances)
        .where(where)
        .orderBy(evolutionInstances.createdAt)
        .limit(limit)
        .offset(offset);

      return { data, meta: paginationMeta(Number(totalResult.count), page, limit) };
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      query: t.Object(paginationQuery),
      detail: { tags: ["Evolution Instances"], summary: "List evolution instances" },
    },
  )

  // ── Create ────────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ params, body }) => {
      const [created] = await db
        .insert(evolutionInstances)
        .values({
          organizationId: params.orgId,
          instance: body.instance,
          url: body.url,
          hash: body.hash,
        })
        .returning();

      return created;
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      body: t.Object({
        instance: t.String({ minLength: 1, maxLength: 255 }),
        url: t.String({ minLength: 1, maxLength: 2048 }),
        hash: t.String({ minLength: 1, maxLength: 512 }),
      }),
      detail: { tags: ["Evolution Instances"], summary: "Create evolution instance" },
    },
  )

  // ── Get by ID ─────────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params, status }) => {
      const record = await db.query.evolutionInstances.findFirst({
        where: and(eq(evolutionInstances.id, params.id), eq(evolutionInstances.organizationId, params.orgId)),
      });

      if (!record) return status(404, { message: "Evolution instance not found" });

      return record;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Evolution Instances"], summary: "Get evolution instance by ID" },
    },
  )

  // ── Update ────────────────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(evolutionInstances)
        .set({
          ...(body.instance !== undefined && { instance: body.instance }),
          ...(body.url !== undefined && { url: body.url }),
          ...(body.hash !== undefined && { hash: body.hash }),
        })
        .where(and(eq(evolutionInstances.id, params.id), eq(evolutionInstances.organizationId, params.orgId)))
        .returning();

      if (!updated) return status(404, { message: "Evolution instance not found" });

      return updated;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        instance: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        url: t.Optional(t.String({ minLength: 1, maxLength: 2048 })),
        hash: t.Optional(t.String({ minLength: 1, maxLength: 512 })),
      }),
      detail: { tags: ["Evolution Instances"], summary: "Update evolution instance" },
    },
  )

  // ── Delete ────────────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params, status }) => {
      const [deleted] = await db
        .delete(evolutionInstances)
        .where(and(eq(evolutionInstances.id, params.id), eq(evolutionInstances.organizationId, params.orgId)))
        .returning();

      if (!deleted) return status(404, { message: "Evolution instance not found" });

      return deleted;
    },
    {
      params: t.Object({
        orgId: t.String({ format: "uuid" }),
        id: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Evolution Instances"], summary: "Delete evolution instance" },
    },
  );
