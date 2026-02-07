import { Elysia, t } from "elysia";
import { eq, count, ilike } from "drizzle-orm";
import { organizations } from "../db/schema";
import { generateSlug } from "../lib/slug";
import { paginationQuery, paginationMeta } from "../lib/pagination";
import { db } from "../db";

export const organizationRoutes = new Elysia({ prefix: "/organizations" })
  // ── List ──────────────────────────────────────────────────────────────
  .get(
    "/",
    async ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;

      const where = query.search ? ilike(organizations.name, `%${query.search}%`) : undefined;

      const [totalResult] = await db.select({ count: count() }).from(organizations).where(where);

      const data = await db
        .select()
        .from(organizations)
        .where(where)
        .orderBy(organizations.createdAt)
        .limit(limit)
        .offset(offset);

      return { data, meta: paginationMeta(Number(totalResult.count), page, limit) };
    },
    {
      query: t.Object({
        ...paginationQuery,
        search: t.Optional(t.String()),
      }),
      detail: { tags: ["Organizations"], summary: "List organizations" },
    },
  )

  // ── Create ────────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, status }) => {
      const slug = body.slug ?? generateSlug(body.name);

      const existing = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (existing.length > 0) {
        return status(409, { message: `Slug "${slug}" already exists` });
      }

      const [created] = await db.insert(organizations).values({ name: body.name, slug }).returning();

      return created;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        slug: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      }),
      detail: { tags: ["Organizations"], summary: "Create organization" },
    },
  )

  // ── Get by ID ─────────────────────────────────────────────────────────
  .get(
    "/:orgId",
    async ({ params, status }) => {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, params.orgId),
      });

      if (!org) return status(404, { message: "Organization not found" });

      return org;
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      detail: { tags: ["Organizations"], summary: "Get organization by ID" },
    },
  )

  // ── Update ────────────────────────────────────────────────────────────
  .put(
    "/:orgId",
    async ({ params, body, status }) => {
      if (body.slug) {
        const existing = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.slug, body.slug))
          .limit(1);

        if (existing.length > 0 && existing[0].id !== params.orgId) {
          return status(409, { message: `Slug "${body.slug}" already exists` });
        }
      }

      const [updated] = await db
        .update(organizations)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.slug !== undefined && { slug: body.slug }),
        })
        .where(eq(organizations.id, params.orgId))
        .returning();

      if (!updated) return status(404, { message: "Organization not found" });

      return updated;
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        slug: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      }),
      detail: { tags: ["Organizations"], summary: "Update organization" },
    },
  )

  // ── Delete ────────────────────────────────────────────────────────────
  .delete(
    "/:orgId",
    async ({ params, status }) => {
      const [deleted] = await db.delete(organizations).where(eq(organizations.id, params.orgId)).returning();

      if (!deleted) return status(404, { message: "Organization not found" });

      return deleted;
    },
    {
      params: t.Object({ orgId: t.String({ format: "uuid" }) }),
      detail: { tags: ["Organizations"], summary: "Delete organization" },
    },
  );
